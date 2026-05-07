# PaginatedDataTable

A drop-in replacement for Carbon's DataTable that handles large datasets
efficiently with automatic pagination, Web Workers, and IndexedDB caching.

## Features

- 🚀 **Automatic Performance Optimization**: Uses Web Workers for datasets >10K
  rows
- 💾 **Smart Caching**: Optional IndexedDB caching for faster subsequent loads
- 🎨 **100% Carbon Compatible**: Same API as Carbon's DataTable
- 📦 **Async Data Generation**: Built-in hook for non-blocking data loading with
  skeleton states
- 🔍 **Built-in Search/Filter**: Integrated search and filtering
- 📊 **Sortable Columns**: Click headers to sort
- ✅ **Row Selection**: Full selection support with batch actions

## Installation

```bash
npm install @carbon-labs/react
# or
yarn add @carbon-labs/react
```

## Quick Start

### Basic Table (Small Dataset)

For small datasets (<500 rows), use synchronous data loading:

```tsx
import { PaginatedDataTable } from '@carbon-labs/react';
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

const headers = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'region', header: 'Region' },
];

const rows = [
  { id: '1', name: 'Server 1', status: 'Active', region: 'US-East' },
  { id: '2', name: 'Server 2', status: 'Inactive', region: 'EU-West' },
  // ... more rows
];

function MyTable() {
  return (
    <PaginatedDataTable rows={rows} headers={headers}>
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getPaginationProps,
      }) => (
        <TableContainer title="Servers" description="100 servers">
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
  );
}
```

### Large Dataset with Async Generation

For large datasets (≥500 rows), use the `useAsyncDataGeneration` hook for
non-blocking loading with automatic skeleton state:

```tsx
import { PaginatedDataTable, useAsyncDataGeneration } from '@carbon-labs/react';
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

const headers = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'region', header: 'Region' },
];

// Your data generation function
function generateServerData(count, startIndex = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `server-${startIndex + i}`,
    name: `Server ${startIndex + i + 1}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
    region: ['US-East', 'US-West', 'EU-West', 'AP-South'][i % 4],
  }));
}

function LargeTable() {
  // Hook automatically handles async generation and skeleton state
  const { data: rows, skeleton } = useAsyncDataGeneration({
    totalRows: 10000,
    generateBatch: (count, startIndex) => generateServerData(count, startIndex),
    headers,
  });

  // Show skeleton while generating
  if (skeleton) return skeleton;

  return (
    <PaginatedDataTable
      rows={rows}
      headers={headers}
      useWorker // Enable Web Workers for heavy operations
      cacheKey="servers-10k" // Enable IndexedDB caching
    >
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getPaginationProps,
      }) => (
        <TableContainer title="Servers" description="10,000 servers">
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
  );
}
```

### Sortable Table

Enable sorting by adding `isSortable` prop:

```tsx
<PaginatedDataTable rows={rows} headers={headers} isSortable>
  {({
    rows,
    headers,
    getHeaderProps,
    getRowProps,
    getTableProps,
    getPaginationProps,
  }) => (
    <TableContainer title="Sortable Table">
      <Table {...getTableProps()}>
        <TableHead>
          <TableRow>
            {headers.map((header) => (
              <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
```

### Table with Selection

Add row selection with batch actions:

```tsx
import {
  TableSelectAll,
  TableSelectRow,
  TableToolbar,
  TableToolbarContent,
  TableBatchActions,
  TableBatchAction,
} from '@carbon/react';
import { TrashCan } from '@carbon/icons-react';

function SelectableTable() {
  const { data: rows, skeleton } = useAsyncDataGeneration({
    totalRows: 1000,
    generateBatch: (count, startIndex) => generateServerData(count, startIndex),
    headers,
  });

  if (skeleton) return skeleton;

  return (
    <PaginatedDataTable rows={rows} headers={headers}>
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getSelectionProps,
        getTableProps,
        getPaginationProps,
        getBatchActionProps,
        selectedRows,
      }) => (
        <TableContainer title="Selectable Table">
          <TableToolbar>
            <TableBatchActions {...getBatchActionProps()}>
              <TableBatchAction
                renderIcon={TrashCan}
                onClick={() => console.log('Delete', selectedRows)}>
                Delete ({selectedRows.length})
              </TableBatchAction>
            </TableBatchActions>
            <TableToolbarContent />
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                <TableSelectAll {...getSelectionProps()} />
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
  );
}
```

### Table with Search

Add search functionality:

```tsx
import { TableToolbarSearch } from '@carbon/react';

function SearchableTable() {
  const { data: rows, skeleton } = useAsyncDataGeneration({
    totalRows: 1000,
    generateBatch: (count, startIndex) => generateServerData(count, startIndex),
    headers,
  });

  if (skeleton) return skeleton;

  return (
    <PaginatedDataTable rows={rows} headers={headers} isSortable>
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getToolbarProps,
        getPaginationProps,
        searchValue,
        onSearchChange,
        isProcessing,
      }) => (
        <TableContainer title="Searchable Table">
          <TableToolbar {...getToolbarProps()}>
            <TableToolbarContent>
              <TableToolbarSearch
                persistent
                value={searchValue}
                onChange={onSearchChange}
                placeholder="Search servers..."
                disabled={isProcessing}
              />
            </TableToolbarContent>
          </TableToolbar>
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
  );
}
```

## API Reference

### PaginatedDataTable Props

| Prop              | Type                          | Default             | Description                                  |
| ----------------- | ----------------------------- | ------------------- | -------------------------------------------- |
| `rows`            | `any[]`                       | required            | Array of row data (Carbon DataTable format)  |
| `headers`         | `any[]`                       | required            | Column headers (Carbon DataTable format)     |
| `children`        | `(props) => ReactElement`     | required            | Render prop function                         |
| `defaultPageSize` | `number`                      | `25`                | Default number of rows per page              |
| `pageSizes`       | `number[]`                    | `[10, 25, 50, 100]` | Available page size options                  |
| `isSortable`      | `boolean`                     | `false`             | Enable column sorting                        |
| `useWorker`       | `boolean`                     | auto                | Use Web Workers (auto-enabled for >10K rows) |
| `cacheKey`        | `string`                      | -                   | IndexedDB cache key for persistence          |
| `onSort`          | `(column, direction) => void` | -                   | Sort change callback                         |
| `onFilter`        | `(query) => void`             | -                   | Filter change callback                       |

### useAsyncDataGeneration Hook

```tsx
const { data, skeleton, isGenerating, progress } = useAsyncDataGeneration({
  totalRows: number;           // Total rows to generate
  generateBatch: (count, startIndex) => any[];  // Batch generation function
  headers: any[];              // Headers for skeleton display
  skeletonRows?: number;       // Skeleton row count (default: 10)
  chunkSize?: number;          // Custom chunk size (auto-calculated)
  chunkDelay?: number;         // Custom delay in ms (auto-calculated)
});
```

**Returns:**

- `data`: Generated data array
- `skeleton`: Skeleton component (null if not generating or sync)
- `isGenerating`: Boolean indicating generation status
- `progress`: Generation progress (0-100)

### Render Props

The render function receives these props:

| Prop                  | Type                  | Description                        |
| --------------------- | --------------------- | ---------------------------------- |
| `rows`                | `any[]`               | Current page rows                  |
| `headers`             | `any[]`               | Table headers                      |
| `getHeaderProps`      | `(args?) => object`   | Props for TableHeader              |
| `getRowProps`         | `(args) => object`    | Props for TableRow                 |
| `getSelectionProps`   | `(args?) => object`   | Props for selection components     |
| `getTableProps`       | `() => object`        | Props for Table                    |
| `getPaginationProps`  | `() => object`        | Props for Pagination               |
| `getToolbarProps`     | `() => object`        | Props for TableToolbar             |
| `getBatchActionProps` | `() => object`        | Props for TableBatchActions        |
| `selectedRows`        | `any[]`               | Currently selected rows            |
| `searchValue`         | `string`              | Current search query               |
| `onSearchChange`      | `(e, value?) => void` | Search change handler              |
| `isProcessing`        | `boolean`             | Whether operations are in progress |

## Performance Guidelines

### Dataset Size Recommendations

- **< 500 rows**: Synchronous loading, no special handling needed
- **500-10K rows**: Use `useAsyncDataGeneration` hook for non-blocking load
- **10K-50K rows**: Add `useWorker` prop for Web Worker processing
- **≥ 50K rows**: Add `cacheKey` prop for IndexedDB caching

### Best Practices

1. **Always use the async hook for ≥500 rows**:

   ```tsx
   const { data, skeleton } = useAsyncDataGeneration({
     totalRows: 5000,
     generateBatch: generateData,
     headers,
   });
   if (skeleton) return skeleton;
   ```

2. **Enable Web Workers for heavy operations**:

   ```tsx
   <PaginatedDataTable rows={rows} headers={headers} useWorker>
   ```

3. **Use caching for frequently accessed large datasets**:

   ```tsx
   <PaginatedDataTable rows={rows} headers={headers} cacheKey="my-data-v1">
   ```

4. **Provide unique row IDs**:
   ```tsx
   const rows = data.map((item, i) => ({ ...item, id: `row-${i}` }));
   ```

## Migration from Carbon DataTable

PaginatedDataTable is a drop-in replacement. Simply:

1. Change import:

   ```tsx
   // Before
   import { DataTable } from '@carbon/react';

   // After
   import { PaginatedDataTable } from '@carbon-labs/react';
   ```

2. Add pagination props to render function:

   ```tsx
   // Before
   <DataTable rows={rows} headers={headers}>
     {(props) => <YourTable {...props} />}
   </DataTable>

   // After
   <PaginatedDataTable rows={rows} headers={headers}>
     {({ getPaginationProps, ...props }) => (
       <>
         <YourTable {...props} />
         <Pagination {...getPaginationProps()} />
       </>
     )}
   </PaginatedDataTable>
   ```

3. For large datasets, wrap with async hook:
   ```tsx
   const { data: rows, skeleton } = useAsyncDataGeneration({
     totalRows: 10000,
     generateBatch: generateData,
     headers,
   });
   if (skeleton) return skeleton;
   ```

## Examples

See the [Storybook stories](https://carbon-labs.netlify.app) for live examples:

- Basic pagination
- Sortable columns
- Row selection with batch actions
- Search and filtering
- Large dataset handling
- Dynamic row operations

## License

Apache-2.0
