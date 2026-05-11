/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable react/prop-types */
import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  ReactElement,
  startTransition,
} from 'react';
import { DataTable, DataTableSkeleton } from '@carbon/react';
import type { DataTableProps, DataTableRenderProps } from '@carbon/react';
import {
  SortManager,
  FilterManager,
  SelectionManager,
  WorkerManager,
  IndexedDBCache,
  calculatePagination,
  type SortDirection,
} from '@carbon-labs/primitives';

// Re-export Carbon's DataTable types for convenience
export type { DataTableHeader, DataTableRow } from '@carbon/react';

/**
 * Extended render props that include pagination helpers
 */
export interface PaginatedDataTableRenderProps {
  rows: any[];
  headers: any[];
  getHeaderProps: (args?: any) => any;
  getRowProps: (args: any) => any;
  getSelectionProps: (args?: any) => any;
  getToolbarProps: () => any;
  getBatchActionProps: () => any;
  onInputChange: (e: any) => void;
  selectedRows: any[];
  getTableProps: () => any;
  getTableContainerProps: () => any;
  // Pagination-specific props
  getPaginationProps: () => {
    page: number;
    pageSize: number;
    pageSizes: number[];
    totalItems: number;
    onChange: (data: { page: number; pageSize: number }) => void;
  };
  // Processing state
  isProcessing: boolean;
  // Search helpers
  searchValue: string;
  onSearchChange: (
    event: '' | React.ChangeEvent<HTMLInputElement>,
    value?: string
  ) => void;
}

export interface PaginatedDataTableProps
  extends Omit<DataTableProps<any, any>, 'rows' | 'headers' | 'children'> {
  /** Array of row data (Carbon DataTable format). Optional if loadData is provided. */
  rows?: any[];
  /** Column headers (Carbon DataTable format) */
  headers: any[];
  /** Render prop function - same as Carbon DataTable but with pagination helpers */
  children: (props: PaginatedDataTableRenderProps) => ReactElement;
  /** Async function to load data. Component handles loading state and skeleton automatically. */
  loadData?: () => Promise<any[]>;
  /** Number of skeleton rows to show while loading (default: 10) */
  skeletonRows?: number;
  /** Default page size */
  defaultPageSize?: number;
  /** Available page sizes */
  pageSizes?: number[];
  /** Use Web Worker for large datasets (auto-enabled for >10K rows) */
  useWorker?: boolean;
  /** IndexedDB cache key for persisting data */
  cacheKey?: string;
  /** Sort change callback */
  onSort?: (column: string, direction: SortDirection) => void;
  /** Filter change callback */
  onFilter?: (query: string) => void;
  /** Error callback when loadData fails */
  onLoadError?: (error: Error) => void;
}

/**
 * PaginatedDataTable - Drop-in replacement for Carbon's DataTable with pagination
 *
 * Uses the same render props pattern as DataTable, but adds:
 * - Automatic pagination for large datasets
 * - Web Workers for heavy operations (>10K rows)
 * - IndexedDB caching
 * - Built-in search/filter/sort management
 * - Async data loading with automatic skeleton state
 *
 * @example Basic usage with synchronous data
 * ```tsx
 * <PaginatedDataTable rows={rows} headers={headers}>
 *   {({ rows, headers, getHeaderProps, getRowProps, getPaginationProps }) => (
 *     <TableContainer>
 *       <Table>
 *         <TableHead>
 *           <TableRow>
 *             {headers.map(header => (
 *               <TableHeader {...getHeaderProps({ header })}>
 *                 {header.header}
 *               </TableHeader>
 *             ))}
 *           </TableRow>
 *         </TableHead>
 *         <TableBody>
 *           {rows.map(row => (
 *             <TableRow {...getRowProps({ row })}>
 *               {row.cells.map(cell => (
 *                 <TableCell>{cell.value}</TableCell>
 *               ))}
 *             </TableRow>
 *           ))}
 *         </TableBody>
 *       </Table>
 *       <Pagination {...getPaginationProps()} />
 *     </TableContainer>
 *   )}
 * </PaginatedDataTable>
 * ```
 *
 * @example Async data loading (recommended for large datasets)
 * ```tsx
 * async function loadData() {
 *   const response = await fetch('/api/data');
 *   return response.json();
 * }
 *
 * <PaginatedDataTable
 *   loadData={loadData}
 *   headers={headers}
 *   useWorker
 *   cacheKey="my-data"
 * >
 *   {({ rows, headers, getHeaderProps, getRowProps, getPaginationProps }) => (
 *     <TableContainer>
 *       <Table>
 *         <TableHead>
 *           <TableRow>
 *             {headers.map(header => (
 *               <TableHeader {...getHeaderProps({ header })}>
 *                 {header.header}
 *               </TableHeader>
 *             ))}
 *           </TableRow>
 *         </TableHead>
 *         <TableBody>
 *           {rows.map(row => (
 *             <TableRow {...getRowProps({ row })}>
 *               {row.cells.map(cell => (
 *                 <TableCell>{cell.value}</TableCell>
 *               ))}
 *             </TableRow>
 *           ))}
 *         </TableBody>
 *       </Table>
 *       <Pagination {...getPaginationProps()} />
 *     </TableContainer>
 *   )}
 * </PaginatedDataTable>
 * ```
 */
export const PaginatedDataTable: React.FC<PaginatedDataTableProps> = React.memo(
  ({
    rows: initialRows,
    headers,
    children,
    loadData,
    skeletonRows = 10,
    defaultPageSize = 25,
    pageSizes = [10, 25, 50, 100],
    useWorker: forceWorker = false,
    cacheKey,
    onSort: _onSort,
    onFilter,
    onLoadError,
    ...carbonDataTableProps
  }) => {
    // State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [searchValue, setSearchValue] = useState('');
    const [_sortColumn, _setSortColumn] = useState<string | null>(null);
    const [_sortDirection, _setSortDirection] = useState<SortDirection>('asc');
    const [loadedRows, setLoadedRows] = useState<any[]>(initialRows || []);
    const [isLoading, setIsLoading] = useState(!!loadData);
    const [processedRows, setProcessedRows] = useState<any[]>(initialRows || []);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectionVersion, setSelectionVersion] = useState(0); // Force re-render on selection changes

    // Managers (initialized once) - lazy initialization to avoid blocking
    const sortManager = useMemo(() => new SortManager(), []);
    const filterManager = useMemo(() => new FilterManager(), []);
    const selectionManager = useMemo(() => new SelectionManager(), []);
    const workerManager = useMemo(() => new WorkerManager(), []);
    const cache = useMemo(
      () => (cacheKey ? new IndexedDBCache() : null),
      [cacheKey]
    );

    // Load data if loadData prop is provided
    useEffect(() => {
      if (loadData) {
        const load = async () => {
          setIsLoading(true);
          try {
            const data = await loadData();
            setLoadedRows(data);
            setProcessedRows(data);
          } catch (error) {
            console.error('Error loading data:', error);
            onLoadError?.(error as Error);
            setLoadedRows([]);
            setProcessedRows([]);
          } finally {
            setIsLoading(false);
          }
        };
        load();
      }
    }, [loadData, onLoadError]);

    // Subscribe to selection changes
    useEffect(() => {
      const unsubscribe = selectionManager.subscribe(() => {
        setSelectionVersion((v) => v + 1);
      });
      return unsubscribe;
    }, [selectionManager]);

    // Use loaded rows or initial rows
    const sourceRows = loadData ? loadedRows : (initialRows || []);

    // Determine if we should use Web Worker
    const shouldUseWorker = forceWorker || sourceRows.length > 10000;

    // Load from cache on mount (non-blocking)
    useEffect(() => {
      if (cache && cacheKey) {
        cache.get(cacheKey).then((cachedData) => {
          if (cachedData) {
            startTransition(() => {
              setProcessedRows(cachedData);
            });
          }
        });
      }
    }, [cache, cacheKey]);

    // Process data (sort + filter) - only when search/sort changes
    useEffect(() => {
      const processData = async () => {
        // Skip processing if no search or sort
        if (!searchValue && !_sortColumn) {
          startTransition(() => {
            setProcessedRows(sourceRows);
          });
          return;
        }

        setIsProcessing(true);
        let result = sourceRows;

        try {
          // Filter
          if (searchValue) {
            const columnIds = headers.map((h: any) => h.key);
            if (shouldUseWorker) {
              // Use Web Worker for large datasets
              result = await workerManager.search(
                result,
                searchValue,
                columnIds
              );
            } else {
              result = filterManager.filter(result, searchValue, columnIds);
            }
          }

          // Sort
          if (_sortColumn) {
            if (shouldUseWorker) {
              // Use Web Worker for large datasets
              result = await workerManager.sort(
                result,
                _sortColumn,
                _sortDirection
              );
            } else {
              result = sortManager.sort(result, _sortColumn, _sortDirection);
            }
          }

          startTransition(() => {
            setProcessedRows(result);
          });

          // Cache result
          if (cache && cacheKey) {
            await cache.set(cacheKey, result);
          }
        } catch (error) {
          console.error('Error processing data:', error);
          setProcessedRows(sourceRows);
        } finally {
          setIsProcessing(false);
        }
      };

      processData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
      searchValue,
      _sortColumn,
      _sortDirection,
      initialRows,
      loadedRows,
      // Note: headers, managers intentionally not in deps to avoid re-processing on every render
    ]);

    // Calculate pagination
    const pagination = useMemo(
      () => calculatePagination(page, pageSize, processedRows.length),
      [page, pageSize, processedRows.length]
    );

    // Get current page data
    const currentPageRows = useMemo(() => {
      return processedRows.slice(pagination.startIndex, pagination.endIndex);
    }, [processedRows, pagination.startIndex, pagination.endIndex]);

    // Get selected rows using SelectionManager
    const selectedRows = useMemo(
      () => selectionManager.getSelectedRows(processedRows),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectionManager, processedRows, selectionVersion]
    );

    // Handle search
    const handleSearchChange = useCallback(
      (event: '' | React.ChangeEvent<HTMLInputElement>, value?: string) => {
        const searchVal =
          typeof event === 'string' ? event : value || event.target.value;
        setSearchValue(searchVal);
        setPage(1); // Reset to first page
        onFilter?.(searchVal);
      },
      [onFilter]
    );

    // Handle pagination change
    const handlePaginationChange = useCallback(
      ({
        page: newPage,
        pageSize: newPageSize,
      }: {
        page: number;
        pageSize: number;
      }) => {
        setPage(newPage);
        setPageSize(newPageSize);
      },
      []
    );

    // Get pagination props helper
    const getPaginationProps = useCallback(
      () => ({
        page: pagination.page,
        pageSize: pagination.pageSize,
        pageSizes,
        totalItems: pagination.totalItems,
        onChange: handlePaginationChange,
      }),
      [pagination, pageSizes, handlePaginationChange]
    );

    // Cleanup
    useEffect(() => {
      return () => {
        workerManager.terminate();
        cache?.close();
      };
    }, [workerManager, cache]);

    // Enhanced selection props that use SelectionManager
    const getEnhancedSelectionProps = useCallback(
      (carbonGetSelectionProps: any) => {
        return (args?: any) => {
          const baseProps = carbonGetSelectionProps?.(args) || {};

          if (args?.row) {
            // Individual row selection
            return {
              ...baseProps,
              checked: selectionManager.isSelected(args.row.id),
              onSelect: () => {
                selectionManager.toggle(args.row.id);
              },
            };
          } else {
            // Select all on current page
            const allCurrentSelected =
              selectionManager.areAllSelected(currentPageRows);

            return {
              ...baseProps,
              checked: allCurrentSelected && currentPageRows.length > 0,
              onSelect: () => {
                if (allCurrentSelected) {
                  selectionManager.deselectAll(currentPageRows);
                } else {
                  selectionManager.selectAll(currentPageRows);
                }
              },
            };
          }
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [selectionManager, currentPageRows, selectionVersion]
    );

    // Show skeleton while loading
    if (isLoading) {
      return (
        <div style={{ padding: '2rem' }}>
          <DataTableSkeleton
            columnCount={headers.length}
            rowCount={skeletonRows}
          />
        </div>
      );
    }

    return (
      <DataTable
        rows={currentPageRows}
        headers={headers}
        {...carbonDataTableProps}>
        {(carbonRenderProps: DataTableRenderProps<any, any>) => {
          // Extend Carbon's render props with pagination and selection helpers
          const extendedProps: PaginatedDataTableRenderProps = {
            ...carbonRenderProps,
            getSelectionProps: getEnhancedSelectionProps(
              carbonRenderProps.getSelectionProps
            ),
            selectedRows,
            getPaginationProps,
            isProcessing,
            searchValue,
            onSearchChange: handleSearchChange,
          };

          return children(extendedProps);
        }}
      </DataTable>
    );
  }
);

PaginatedDataTable.displayName = 'PaginatedDataTable';
