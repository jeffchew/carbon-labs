# PaginatedDataTable API Guide

## Overview

`PaginatedDataTable` is a **drop-in replacement** for Carbon's `DataTable`
component that efficiently handles large datasets (10K+ rows) through automatic
pagination, Web Workers, and intelligent caching.

## Why Use PaginatedDataTable?

| Feature            | DataTable             | PaginatedDataTable                      |
| ------------------ | --------------------- | --------------------------------------- |
| **API Pattern**    | Render props          | ✅ Same render props                    |
| **Large Datasets** | ❌ Performance issues | ✅ Optimized for 10K+ rows              |
| **Async Loading**  | ❌ Not available      | ✅ Built-in hook with skeleton          |
| **Web Workers**    | ❌ Not available      | ✅ Auto-enabled for >10K rows           |
| **Pagination**     | Manual implementation | ✅ Built-in with `getPaginationProps()` |
| **Search/Filter**  | Manual implementation | ✅ Built-in with primitives             |
| **Caching**        | ❌ Not available      | ✅ Optional IndexedDB cache             |

## Quick Start

### Small Dataset (< 500 rows)

For small datasets, use synchronous loading:

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
];

const rows = [
  { id: '1', name: 'Item 1', status: 'Active' },
  { id: '2', name: 'Item 2', status: 'Disabled' },
  // ... up to 500 rows
];

function SmallTable() {
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
        <TableContainer title="Small Table">
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

### Large Dataset (≥ 500 rows)

For large datasets, use the `useAsyncDataGeneration` hook for non-blocking
loading with automatic skeleton state:

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
];

// Your data generation function
function generateData(count, startIndex = 0) {
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${startIndex + i}`,
    name: `Item ${startIndex + i + 1}`,
    status: i % 2 === 0 ? 'Active' : 'Disabled',
  }));
}

function LargeTable() {
  // Hook automatically handles async generation and skeleton state
  const { data: rows, skeleton } = useAsyncDataGeneration({
    totalRows: 10000,
    generateBatch: (count, startIndex) => generateData(count, startIndex),
    headers,
  });

  // Show skeleton while generating
  if (skeleton) return skeleton;

  return (
    <PaginatedDataTable
      rows={rows}
      headers={headers}
      useWorker // Enable Web Workers for heavy operations
      cacheKey="my-data-v1" // Enable IndexedDB caching
    >
      {({
        rows,
        headers,
        getHeaderProps,
        getRowProps,
        getTableProps,
        getPaginationProps,
      }) => (
        <TableContainer title="Large Table" description="10,000 rows">
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

## Migration from DataTable

### Before (DataTable)

```tsx
<DataTable rows={rows} headers={headers}>
  {({ rows, headers, getHeaderProps, getRowProps, getTableProps }) => (
    <TableContainer>
      <Table {...getTableProps()}>{/* ... table markup ... */}</Table>
      {/* Manual pagination implementation */}
    </TableContainer>
  )}
</DataTable>
```

### After (PaginatedDataTable)

```tsx
<PaginatedDataTable rows={rows} headers={headers}>
  {({
    rows,
    headers,
    getHeaderProps,
    getRowProps,
    getTableProps,
    getPaginationProps,
  }) => (
    <TableContainer>
      <Table {...getTableProps()}>{/* ... same table markup ... */}</Table>
      <Pagination {...getPaginationProps()} />
    </TableContainer>
  )}
</PaginatedDataTable>
```

**Changes:**

1. Import `PaginatedDataTable` instead of `DataTable`
2. Add `getPaginationProps` to destructured render props
3. Add `<Pagination {...getPaginationProps()} />` component

## API Reference

### PaginatedDataTable Props

All Carbon `DataTable` props are supported, plus:

| Prop              | Type                          | Default             | Description                                 |
| ----------------- | ----------------------------- | ------------------- | ------------------------------------------- |
| `rows`            | `any[]`                       | Required            | Array of row data (Carbon format)           |
| `headers`         | `any[]`                       | Required            | Column headers (Carbon format)              |
| `children`        | `(props) => ReactElement`     | Required            | Render prop function                        |
| `defaultPageSize` | `number`                      | `25`                | Initial page size                           |
| `pageSizes`       | `number[]`                    | `[10, 25, 50, 100]` | Available page sizes                        |
| `isSortable`      | `boolean`                     | `false`             | Enable column sorting                       |
| `useWorker`       | `boolean`                     | Auto                | Force Web Worker usage (auto for >10K rows) |
| `cacheKey`        | `string`                      | `undefined`         | IndexedDB cache key for persistence         |
| `onSort`          | `(column, direction) => void` | `undefined`         | Sort callback                               |
| `onFilter`        | `(query) => void`             | `undefined`         | Filter callback                             |

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

**Parameters:**

- `totalRows`: Total number of rows to generate
- `generateBatch`: Function that generates a batch of rows given count and start
  index
- `headers`: Table headers (used for skeleton display)
- `skeletonRows`: Number of skeleton rows to show (default: 10)
- `chunkSize`: Custom chunk size (auto-calculated based on row count)
- `chunkDelay`: Custom delay between chunks in ms (auto-calculated)

**Returns:**

- `data`: Generated data array (empty array while generating)
- `skeleton`: DataTableSkeleton component (null if not generating or sync)
- `isGenerating`: Boolean indicating generation status
- `progress`: Generation progress (0-100)

**Behavior:**

- For < 500 rows: Generates synchronously, returns data immediately, skeleton is
  null
- For ≥ 500 rows: Generates asynchronously in chunks, returns skeleton until
  complete

### Render Props

All Carbon `DataTable` render props, plus:

| Prop                 | Type                      | Description                      |
| -------------------- | ------------------------- | -------------------------------- |
| `getPaginationProps` | `() => object`            | Returns props for `<Pagination>` |
| `isProcessing`       | `boolean`                 | True when sorting/filtering      |
| `searchValue`        | `string`                  | Current search query             |
| `onSearchChange`     | `(event, value?) => void` | Search change handler            |

## Advanced Examples

### With Selection

```tsx
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
    <TableContainer title={`${selectedRows.length} selected`}>
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
```

### With Toolbar and Search

```tsx
<PaginatedDataTable rows={rows} headers={headers}>
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
    <TableContainer>
      <TableToolbar {...getToolbarProps()}>
        <TableToolbarContent>
          <TableToolbarSearch
            persistent
            value={searchValue}
            onChange={onSearchChange}
            disabled={isProcessing}
          />
        </TableToolbarContent>
      </TableToolbar>
      <Table {...getTableProps()}>{/* ... table markup ... */}</Table>
      <Pagination {...getPaginationProps()} />
    </TableContainer>
  )}
</PaginatedDataTable>
```

### With Batch Actions

```tsx
<PaginatedDataTable rows={rows} headers={headers}>
  {({
    rows,
    headers,
    getHeaderProps,
    getRowProps,
    getSelectionProps,
    getTableProps,
    getToolbarProps,
    getBatchActionProps,
    getPaginationProps,
    selectedRows,
  }) => {
    const batchActionProps = getBatchActionProps();

    return (
      <TableContainer>
        <TableToolbar {...getToolbarProps()}>
          {batchActionProps.shouldShowBatchActions && (
            <div>
              <Button onClick={() => console.log('Delete', selectedRows)}>
                Delete
              </Button>
            </div>
          )}
          <TableToolbarContent
            aria-hidden={batchActionProps.shouldShowBatchActions}>
            <Button>Add new</Button>
          </TableToolbarContent>
        </TableToolbar>
        <Table {...getTableProps()}>{/* ... table markup ... */}</Table>
        <Pagination {...getPaginationProps()} />
      </TableContainer>
    );
  }}
</PaginatedDataTable>
```

### With Sorting

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
    <TableContainer>
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

## Performance Optimization

### Three-Tier Performance System

PaginatedDataTable automatically optimizes based on dataset size:

| Dataset Size | Strategy            | Features                                      |
| ------------ | ------------------- | --------------------------------------------- |
| < 500 rows   | Synchronous         | Direct rendering, no async needed             |
| 500-10K rows | Async Generation    | Non-blocking chunked generation with skeleton |
| 10K-50K rows | Web Workers         | Heavy operations offloaded to workers         |
| ≥ 50K rows   | Web Workers + Cache | IndexedDB caching for faster subsequent loads |

### Async Data Generation

The `useAsyncDataGeneration` hook automatically:

- Detects if async generation is needed (≥ 500 rows)
- Calculates optimal chunk size and delay
- Shows DataTableSkeleton during generation
- Generates data in non-blocking chunks
- Returns complete data when ready

```tsx
// Automatically handles sync vs async based on row count
const { data: rows, skeleton } = useAsyncDataGeneration({
  totalRows: 5000, // ≥ 500, so async generation
  generateBatch: generateData,
  headers,
});

if (skeleton) return skeleton; // Show skeleton while generating
// Use rows when ready
```

### Web Workers

For datasets > 10,000 rows, Web Workers are automatically enabled for:

- Sorting operations
- Search/filter operations

This keeps the UI responsive during heavy operations.

```tsx
<PaginatedDataTable
  rows={rows}
  headers={headers}
  useWorker // Force enable (auto for >10K rows)
>
  {/* ... */}
</PaginatedDataTable>
```

### IndexedDB Caching

For very large datasets (≥ 50K rows), enable persistent caching:

```tsx
<PaginatedDataTable
  rows={rows}
  headers={headers}
  cacheKey="my-table-v1" // Version your cache key
>
  {/* ... */}
</PaginatedDataTable>
```

The processed data (sorted/filtered) will be cached in IndexedDB and restored on
page reload.

**Cache Key Best Practices:**

- Include version number: `"servers-v1"`
- Change key when data structure changes
- Use descriptive names: `"user-list-2024"`

### Custom Page Sizes

```tsx
<PaginatedDataTable
  rows={rows}
  headers={headers}
  defaultPageSize={50}
  pageSizes={[25, 50, 100, 200]}>
  {/* ... */}
</PaginatedDataTable>
```

## TypeScript Support

Full TypeScript support with exported types:

```tsx
import type {
  PaginatedDataTableProps,
  PaginatedDataTableRenderProps,
  DataTableHeader,
  DataTableRow,
} from '@carbon-labs/react-paginated-data-table';
```

## Best Practices

### When to Use Each Approach

1. **< 500 rows**: Use synchronous loading

   ```tsx
   <PaginatedDataTable rows={rows} headers={headers}>
   ```

2. **500-10K rows**: Use async hook

   ```tsx
   const { data: rows, skeleton } = useAsyncDataGeneration({...});
   if (skeleton) return skeleton;
   ```

3. **10K-50K rows**: Add Web Workers

   ```tsx
   <PaginatedDataTable rows={rows} headers={headers} useWorker>
   ```

4. **≥ 50K rows**: Add caching
   ```tsx
   <PaginatedDataTable rows={rows} headers={headers} useWorker cacheKey="data-v1">
   ```

### General Guidelines

1. **Always use async hook for ≥ 500 rows**: Prevents UI freezing during data
   generation
2. **Let Web Workers auto-enable**: Don't force `useWorker` unless needed
3. **Version your cache keys**: Change key when data structure changes
4. **Keep page sizes reasonable**: Default 25-100 rows per page
5. **Provide unique row IDs**: Ensures proper selection and rendering
6. **Use the same markup**: Keep your existing Carbon table structure

## Comparison with DataTable

### What's the Same

- ✅ Render props pattern
- ✅ All Carbon DataTable props
- ✅ Selection, sorting, filtering
- ✅ Batch actions, toolbar
- ✅ Accessibility features

### What's Different

- ✅ Built-in pagination (via `getPaginationProps()`)
- ✅ Automatic performance optimization
- ✅ Web Worker support
- ✅ IndexedDB caching
- ✅ Processing state (`isProcessing`)
- ✅ Search helpers (`searchValue`, `onSearchChange`)

## FAQ

**Q: Can I use this as a drop-in replacement?** A: Yes! Just add
`getPaginationProps` and `<Pagination>` component.

**Q: Will it work with my existing DataTable code?** A: Yes! The render props
are 100% compatible.

**Q: When should I use this over DataTable?** A: When you have 500+ rows and
need pagination or performance optimization.

**Q: Do I need to use the async hook?** A: Only for ≥ 500 rows. For smaller
datasets, use synchronous loading.

**Q: What's the difference between sync and async loading?** A: Sync loads data
immediately (< 500 rows). Async generates in chunks with skeleton (≥ 500 rows).

**Q: Does it support all DataTable features?** A: Yes! Selection, sorting,
filtering, batch actions, toolbar, etc.

**Q: How do I disable Web Workers?** A: They only auto-enable for >10K rows. For
smaller datasets, they're not used.

**Q: Can I customize pagination?** A: Yes! Use `defaultPageSize` and `pageSizes`
props.

**Q: How do I know if my data is generating?** A: The async hook returns
`isGenerating` and `progress` for tracking.

**Q: Can I customize the skeleton?** A: Yes! Pass `skeletonRows` to the async
hook to control skeleton row count.
