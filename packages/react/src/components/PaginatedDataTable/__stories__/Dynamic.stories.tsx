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
  Button,
  DataTableSkeleton,
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/icons-react';
import { generateRows } from './test-data';

export default {
  title: 'Components/PaginatedDataTable/Dynamic',
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

export const SmallDataset = () => {
  const [rows, setRows] = useState(() => generateRows(100));
  const [nextId, setNextId] = useState(100);

  const handleAddRow = () => {
    const newRows = generateRows(nextId + 1);
    const newRow = newRows[newRows.length - 1];
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const handleDeleteSelected = (selectedIds: string[]) => {
    setRows(rows.filter((row) => !selectedIds.includes(row.id)));
  };

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
            title="DataTable"
            description={`100 rows - Main thread - ${rows.length} total, ${selectedRows.length} selected`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search table..."
                  disabled={isProcessing}
                />
                <Button kind="primary" renderIcon={Add} onClick={handleAddRow}>
                  Add row
                </Button>
                {selectedRows.length > 0 && (
                  <Button
                    kind="danger"
                    renderIcon={TrashCan}
                    onClick={() =>
                      handleDeleteSelected(selectedRows.map((r: any) => r.id))
                    }>
                    Delete selected ({selectedRows.length})
                  </Button>
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

export const MediumDataset = () => {
  const [rows, setRows] = useState(() => generateRows(500));
  const [nextId, setNextId] = useState(500);

  const handleAddRow = () => {
    const newRows = generateRows(nextId + 1);
    const newRow = newRows[newRows.length - 1];
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const handleDeleteSelected = (selectedIds: string[]) => {
    setRows(rows.filter((row) => !selectedIds.includes(row.id)));
  };

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
            title="DataTable"
            description={`500 rows - Web Worker - ${rows.length} total, ${selectedRows.length} selected`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search table..."
                  disabled={isProcessing}
                />
                <Button kind="primary" renderIcon={Add} onClick={handleAddRow}>
                  Add row
                </Button>
                {selectedRows.length > 0 && (
                  <Button
                    kind="danger"
                    renderIcon={TrashCan}
                    onClick={() =>
                      handleDeleteSelected(selectedRows.map((r: any) => r.id))
                    }>
                    Delete selected ({selectedRows.length})
                  </Button>
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

export const LargeDataset = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [nextId, setNextId] = useState(10000);

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

  const handleAddRow = () => {
    const newRows = generateRows(nextId + 1);
    const newRow = newRows[newRows.length - 1];
    setRows([...rows, newRow]);
    setNextId(nextId + 1);
  };

  const handleDeleteSelected = (selectedIds: string[]) => {
    setRows(rows.filter((row) => !selectedIds.includes(row.id)));
  };

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
        cacheKey="dynamic-10k">
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
            title="DataTable"
            description={`10,000 rows - Web Worker + Cache - ${rows.length} total, ${selectedRows.length} selected - Try adding/deleting rows!`}>
            <TableToolbar {...getToolbarProps()}>
              <TableToolbarContent>
                <TableToolbarSearch
                  persistent
                  value={searchValue}
                  onChange={onSearchChange}
                  placeholder="Search table..."
                  disabled={isProcessing}
                />
                <Button kind="primary" renderIcon={Add} onClick={handleAddRow}>
                  Add row
                </Button>
                {selectedRows.length > 0 && (
                  <Button
                    kind="danger"
                    renderIcon={TrashCan}
                    onClick={() =>
                      handleDeleteSelected(selectedRows.map((r: any) => r.id))
                    }>
                    Delete selected ({selectedRows.length})
                  </Button>
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
