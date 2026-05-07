/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from 'react';
import { PaginatedDataTable } from '../';
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  TableSelectAll,
  TableSelectRow,
  Pagination,
  DataTableSkeleton,
} from '@carbon/react';
import { generateRows } from './test-data';

export default {
  title: 'Components/PaginatedDataTable/Performance',
  component: PaginatedDataTable,
};

const headers = [
  { key: 'name', header: 'Name' },
  { key: 'protocol', header: 'Protocol' },
  { key: 'port', header: 'Port' },
  { key: 'rule', header: 'Rule' },
  { key: 'attached_groups', header: 'Attached Groups' },
  { key: 'status', header: 'Status' },
  { key: 'region', header: 'Region' },
  { key: 'environment', header: 'Environment' },
];

/**
 * Small Dataset (< 10K rows)
 *
 * Performance Strategy:
 * - All operations on main thread
 * - Synchronous processing
 * - No Web Workers needed
 * - Expected: < 100ms for all operations
 */
export const SmallDataset = () => {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    setRows(generateRows(100));
  }, []);

  if (rows.length === 0) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable rows={rows} headers={headers} isSortable>
        {({
          rows: displayRows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getToolbarProps,
          getPaginationProps,
          searchValue,
          onSearchChange,
          isProcessing,
          selectedRows,
        }) => (
          <TableContainer
            title="Small Dataset Performance"
            description={`100 rows - Main thread processing (${selectedRows.length} selected)`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search 100 rows (main thread)..."
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <span style={{ marginLeft: '1rem' }}>Processing...</span>
                )}
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    <TableSelectRow {...getSelectionProps({ row })} />
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination {...getPaginationProps()} />
          </TableContainer>
        )}
      </PaginatedDataTable>
    </div>
  );
};

/**
 * Medium Dataset (10K-50K rows)
 *
 * Performance Strategy:
 * - Web Workers for search/sort
 * - Asynchronous processing
 * - Non-blocking UI
 * - Expected: 100-500ms for operations
 */
export const MediumDataset = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateAsync = async () => {
      setIsGenerating(true);
      const chunkSize = 500;
      const totalRows = 1000;
      const allRows: any[] = [];

      for (let i = 0; i < totalRows; i += chunkSize) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        const chunk = generateRows(chunkSize);
        allRows.push(
          ...chunk.map((row, idx) => ({ ...row, id: `row-${i + idx}` }))
        );
      }

      setRows(allRows);
      setIsGenerating(false);
    };
    generateAsync();
  }, []);

  if (isGenerating) {
    return (
      <div style={{ padding: '2rem' }}>
        <DataTableSkeleton columnCount={headers.length} rowCount={10} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable rows={rows} headers={headers} isSortable useWorker>
        {({
          rows: displayRows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getToolbarProps,
          getPaginationProps,
          searchValue,
          onSearchChange,
          isProcessing,
          selectedRows,
        }) => (
          <TableContainer
            title="Medium Dataset Performance"
            description={`500 rows - Web Worker processing (${selectedRows.length} selected)`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search 500 rows (Web Worker)..."
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <span style={{ marginLeft: '1rem', color: '#0f62fe' }}>
                    ⚙️ Processing in background...
                  </span>
                )}
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    <TableSelectRow {...getSelectionProps({ row })} />
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination {...getPaginationProps()} />
          </TableContainer>
        )}
      </PaginatedDataTable>
    </div>
  );
};

/**
 * Large Dataset (≥ 50K rows)
 *
 * Performance Strategy:
 * - Web Workers for search/sort
 * - IndexedDB caching (optional)
 * - Asynchronous processing
 * - Non-blocking UI
 * - Expected: 500ms-1s for operations
 */
export const LargeDataset = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateAsync = async () => {
      setIsGenerating(true);
      const chunkSize = 1000;
      const totalRows = 10000;
      const allRows: any[] = [];

      for (let i = 0; i < totalRows; i += chunkSize) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const chunk = generateRows(chunkSize);
        allRows.push(
          ...chunk.map((row, idx) => ({ ...row, id: `row-${i + idx}` }))
        );
      }

      setRows(allRows);
      setIsGenerating(false);
    };

    generateAsync();
  }, []);

  if (isGenerating) {
    return (
      <div style={{ padding: '2rem' }}>
        <DataTableSkeleton columnCount={headers.length} rowCount={10} />
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable
        rows={rows}
        headers={headers}
        isSortable
        useWorker
        cacheKey="performance-10k">
        {({
          rows: displayRows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getToolbarProps,
          getPaginationProps,
          searchValue,
          onSearchChange,
          isProcessing,
          selectedRows,
        }) => (
          <TableContainer
            title="Large Dataset Performance"
            description={`1,000 rows - Web Worker + IndexedDB caching (${selectedRows.length} selected)`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search 1K rows (Web Worker + Cache)..."
                  disabled={isProcessing}
                />
                {isProcessing && (
                  <span style={{ marginLeft: '1rem', color: '#0f62fe' }}>
                    ⚙️ Processing 1K rows in background...
                  </span>
                )}
              </TableToolbarContent>
            </TableToolbar>
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  <TableSelectAll {...getSelectionProps()} />
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={header.key}>
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayRows.map((row) => (
                  <TableRow {...getRowProps({ row })} key={row.id}>
                    <TableSelectRow {...getSelectionProps({ row })} />
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id}>{cell.value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination {...getPaginationProps()} />
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f4f4f4',
                borderRadius: '4px',
              }}>
              <strong>Performance Tip:</strong> This demonstrates the caching
              system. For real large datasets (50K+ rows), use server-side
              pagination instead of client-side processing.
            </div>
          </TableContainer>
        )}
      </PaginatedDataTable>
    </div>
  );
};
