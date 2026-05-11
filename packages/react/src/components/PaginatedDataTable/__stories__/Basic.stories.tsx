/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { PaginatedDataTable } from '../';
import {
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableContainer,
  Pagination,
} from '@carbon/react';
import { generateRows } from './test-data';

export default {
  title: 'Components/PaginatedDataTable/Basic',
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
          getTableProps,
          getPaginationProps,
        }) => (
          <TableContainer title="DataTable" description="100 rows">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
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
  // Async data loading function
  const loadData = async () => {
    const chunkSize = 500;
    const totalRows = 1000;
    const allRows: any[] = [];

    // Generate data in chunks to avoid blocking the main thread
    for (let i = 0; i < totalRows; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      const chunk = generateRows(Math.min(chunkSize, totalRows - i));
      allRows.push(
        ...chunk.map((row, idx) => ({ ...row, id: `row-${i + idx}` }))
      );
    }

    return allRows;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable
        loadData={loadData}
        headers={headers}
        defaultPageSize={50}
        pageSizes={[25, 50, 100, 200]}>
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
          getPaginationProps,
        }) => (
          <TableContainer
            title="DataTable"
            description="1,000 rows - Async generation (chunked on main thread)">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
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
  // Async data loading function
  const loadData = async () => {
    const chunkSize = 1000;
    const totalRows = 10000;
    const allRows: any[] = [];

    // Generate data in chunks to avoid blocking the main thread
    for (let i = 0; i < totalRows; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const chunk = generateRows(Math.min(chunkSize, totalRows - i));
      allRows.push(
        ...chunk.map((row, idx) => ({ ...row, id: `row-${i + idx}` }))
      );
    }

    return allRows;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <PaginatedDataTable
        loadData={loadData}
        headers={headers}
        defaultPageSize={50}
        pageSizes={[25, 50, 100, 200]}
        useWorker
        cacheKey="basic-10k">
        {({
          rows,
          headers,
          getHeaderProps,
          getRowProps,
          getTableProps,
          getPaginationProps,
        }) => (
          <TableContainer
            title="DataTable"
            description="10,000 rows - Async generation + Web Worker operations + Cache">
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
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

