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
  useRef,
  ReactElement,
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
    // In-memory data storage (not in React state to avoid re-renders)
    const fullDataRef = useRef<any[]>(initialRows || []);
    const processedDataRef = useRef<any[]>(initialRows || []);
    
    // State - only for UI and current page
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [searchValue, setSearchValue] = useState('');
    const [_sortColumn, _setSortColumn] = useState<string | null>(null);
    const [_sortDirection, _setSortDirection] = useState<SortDirection>('asc');
    const [isLoading, setIsLoading] = useState(!!loadData);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectionVersion, setSelectionVersion] = useState(0);
    const [currentPageRows, setCurrentPageRows] = useState<any[]>([]);
    const [totalItems, setTotalItems] = useState(initialRows?.length || 0);

    // Managers - use lazy initialization with refs (only create when needed)
    const sortManagerRef = useRef<SortManager | null>(null);
    const filterManagerRef = useRef<FilterManager | null>(null);
    const selectionManagerRef = useRef<SelectionManager | null>(null);
    const workerManagerRef = useRef<WorkerManager | null>(null);
    const cacheRef = useRef<IndexedDBCache | null>(null);

    // Lazy getters - only create managers when first accessed
    const getSortManager = useCallback(() => {
      if (!sortManagerRef.current) {
        sortManagerRef.current = new SortManager();
      }
      return sortManagerRef.current;
    }, []);

    const getFilterManager = useCallback(() => {
      if (!filterManagerRef.current) {
        filterManagerRef.current = new FilterManager();
      }
      return filterManagerRef.current;
    }, []);

    const getSelectionManager = useCallback(() => {
      if (!selectionManagerRef.current) {
        selectionManagerRef.current = new SelectionManager();
      }
      return selectionManagerRef.current;
    }, []);

    const getWorkerManager = useCallback(() => {
      if (!workerManagerRef.current) {
        workerManagerRef.current = new WorkerManager();
      }
      return workerManagerRef.current;
    }, []);

    const getCache = useCallback(() => {
      if (cacheKey && !cacheRef.current) {
        cacheRef.current = new IndexedDBCache();
      }
      return cacheRef.current;
    }, [cacheKey]);

    // Helper to update current page from processed data
    const updateCurrentPage = useCallback(
      (newPage: number, newPageSize: number, data: any[]) => {
        const pagination = calculatePagination(newPage, newPageSize, data.length);
        const pageData = data.slice(pagination.startIndex, pagination.endIndex);
        setCurrentPageRows(pageData);
        setTotalItems(data.length);
      },
      []
    );

    // Load data if loadData prop is provided
    useEffect(() => {
      if (loadData) {
        const load = async () => {
          setIsLoading(true);
          try {
            const data = await loadData();
            // Store in ref, not state
            fullDataRef.current = data;
            processedDataRef.current = data;
            setTotalItems(data.length);
            // Update current page
            updateCurrentPage(1, pageSize, data);
          } catch (error) {
            console.error('Error loading data:', error);
            onLoadError?.(error as Error);
            fullDataRef.current = [];
            processedDataRef.current = [];
            setTotalItems(0);
            setCurrentPageRows([]);
          } finally {
            setIsLoading(false);
          }
        };
        load();
      }
    }, [loadData, onLoadError, pageSize, updateCurrentPage]);

    // Subscribe to selection changes
    useEffect(() => {
      const manager = getSelectionManager();
      const unsubscribe = manager.subscribe(() => {
        setSelectionVersion((v) => v + 1);
      });
      return unsubscribe;
    }, [getSelectionManager]);

    // Update initial rows in ref when they change
    useEffect(() => {
      if (!loadData && initialRows) {
        fullDataRef.current = initialRows;
        processedDataRef.current = initialRows;
        setTotalItems(initialRows.length);
        updateCurrentPage(page, pageSize, initialRows);
      }
    }, [initialRows, loadData, page, pageSize, updateCurrentPage]);

    // Determine if we should use Web Worker
    const shouldUseWorker = forceWorker || fullDataRef.current.length > 10000;


    // Process data (sort + filter) - operates on refs, only updates current page in state
    useEffect(() => {
      const processData = async () => {
        // Don't process if we don't have data yet
        if (fullDataRef.current.length === 0) {
          return;
        }

        // Skip processing if no search or sort - use full data
        if (!searchValue && !_sortColumn) {
          processedDataRef.current = fullDataRef.current;
          updateCurrentPage(page, pageSize, fullDataRef.current);
          return;
        }

        setIsProcessing(true);
        let result = fullDataRef.current;

        try {
          // Filter
          if (searchValue) {
            const columnIds = headers.map((h: any) => h.key);
            if (shouldUseWorker) {
              result = await getWorkerManager().search(result, searchValue, columnIds);
            } else {
              result = getFilterManager().filter(result, searchValue, columnIds);
            }
          }

          // Sort
          if (_sortColumn) {
            if (shouldUseWorker) {
              result = await getWorkerManager().sort(result, _sortColumn, _sortDirection);
            } else {
              result = getSortManager().sort(result, _sortColumn, _sortDirection);
            }
          }

          // Store processed data in ref
          processedDataRef.current = result;

          // Update current page in state
          updateCurrentPage(page, pageSize, result);

          // Cache result
          const cache = getCache();
          if (cache && cacheKey) {
            await cache.set(cacheKey, result);
          }
        } catch (error) {
          console.error('Error processing data:', error);
          processedDataRef.current = fullDataRef.current;
          updateCurrentPage(page, pageSize, fullDataRef.current);
        } finally {
          setIsProcessing(false);
        }
      };

      processData();
    }, [
      searchValue,
      _sortColumn,
      _sortDirection,
      page,
      pageSize,
      shouldUseWorker,
      updateCurrentPage,
      headers,
      cacheKey,
      getWorkerManager,
      getFilterManager,
      getSortManager,
      getCache,
    ]);

    // Get selected rows using SelectionManager (from processed data ref)
    const selectedRows = useMemo(
      () => getSelectionManager().getSelectedRows(processedDataRef.current),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [getSelectionManager, selectionVersion]
    );

    // Handle sort
    const handleSort = useCallback(
      (columnKey: string) => {
        let newDirection: SortDirection = 'asc';
        
        if (_sortColumn === columnKey) {
          // Toggle direction if same column
          newDirection = _sortDirection === 'asc' ? 'desc' : 'asc';
        }
        
        _setSortColumn(columnKey);
        _setSortDirection(newDirection);
        setPage(1); // Reset to first page
        _onSort?.(columnKey, newDirection);
      },
      [_sortColumn, _sortDirection, _onSort]
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
        page,
        pageSize,
        pageSizes,
        totalItems,
        onChange: handlePaginationChange,
      }),
      [page, pageSize, pageSizes, totalItems, handlePaginationChange]
    );

    // Cleanup
    useEffect(() => {
      return () => {
        workerManagerRef.current?.terminate();
        cacheRef.current?.close();
      };
    }, []);

    // Enhanced header props that intercept sort clicks
    const getEnhancedHeaderProps = useCallback(
      (carbonGetHeaderProps: any) => {
        return (args?: any) => {
          const baseProps = carbonGetHeaderProps?.(args) || {};
          const header = args?.header;
          
          if (header && carbonDataTableProps.isSortable) {
            return {
              ...baseProps,
              isSortable: true,
              sortDirection: _sortColumn === header.key ? _sortDirection : 'NONE',
              onClick: () => handleSort(header.key),
            };
          }
          
          return baseProps;
        };
      },
      [_sortColumn, _sortDirection, handleSort, carbonDataTableProps.isSortable]
    );

    // Enhanced selection props that use SelectionManager
    const getEnhancedSelectionProps = useCallback(
      (carbonGetSelectionProps: any) => {
        return (args?: any) => {
          const baseProps = carbonGetSelectionProps?.(args) || {};
          const manager = getSelectionManager();

          if (args?.row) {
            // Individual row selection
            return {
              ...baseProps,
              checked: manager.isSelected(args.row.id),
              onSelect: () => {
                manager.toggle(args.row.id);
              },
            };
          } else {
            // Select all on current page
            const allCurrentSelected = manager.areAllSelected(currentPageRows);

            return {
              ...baseProps,
              checked: allCurrentSelected && currentPageRows.length > 0,
              onSelect: () => {
                if (allCurrentSelected) {
                  manager.deselectAll(currentPageRows);
                } else {
                  manager.selectAll(currentPageRows);
                }
              },
            };
          }
        };
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [getSelectionManager, currentPageRows, selectionVersion]
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
          // Extend Carbon's render props with pagination, sort, and selection helpers
          const extendedProps: PaginatedDataTableRenderProps = {
            ...carbonRenderProps,
            getHeaderProps: getEnhancedHeaderProps(
              carbonRenderProps.getHeaderProps
            ),
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
