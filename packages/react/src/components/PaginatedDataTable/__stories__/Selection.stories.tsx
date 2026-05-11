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
  TableSelectAll,
  TableSelectRow,
  Pagination,
  DataTableSkeleton,
} from '@carbon/react';
import { generateRows } from './test-data';

export default {
  title: 'Components/PaginatedDataTable/Selection',
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
  const rows = generateRows(100);

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable rows={rows} headers={headers}>
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getPaginationProps,
          selectedRows,
        }) => (
          <TableContainer
            title="DataTable"
            description={`100 rows - Main thread (${selectedRows.length} selected)`}>
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
                {rows.map((row) => (
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
      <PaginatedDataTable rows={rows} headers={headers} useWorker>
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getPaginationProps,
          selectedRows,
        }) => (
          <TableContainer
            title="DataTable"
            description={`500 rows - Web Worker (${selectedRows.length} selected)`}>
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
                {rows.map((row) => (
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
        useWorker
        cacheKey="selection-10k">
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getSelectionProps,
          getTableProps,
          getPaginationProps,
          selectedRows,
        }) => (
          <TableContainer
            title="DataTable"
            description={`10,000 rows - Web Worker + Cache (${selectedRows.length} selected across all pages)`}>
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
                {rows.map((row) => (
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
