/\*\*

- Copyright IBM Corp. 2026
-
- This source code is licensed under the Apache-2.0 license found in the
- LICENSE file in the root directory of this source tree. \*/

# PaginatedDataTable Architecture

## Overview

This component handles large datasets (10K+ rows) efficiently using:

- **Pagination** for rendering (not virtual scrolling)
- **Shared primitives** for business logic (React + Web Components)
- **Async data generation** for non-blocking loads (≥500 rows)
- **Web Workers** for heavy operations (≥10K rows)
- **IndexedDB** for caching large datasets (≥50K rows)

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
│              (PaginatedDataTable.tsx)                   │
│  - Wraps Carbon DataTable + Pagination                  │
│  - Manages UI state (page, pageSize, search)           │
│  - Delegates logic to primitives                        │
│  - Uses render props pattern (Carbon-compatible)       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  React Hook Layer                        │
│            (useAsyncDataGeneration.tsx)                 │
│  - Wraps primitives with React-specific logic          │
│  - Manages skeleton state                               │
│  - Provides progress tracking                           │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Primitives Package                          │
│         (@carbon-labs/primitives)                       │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │ DataGenerator  │  │ SortManager    │               │
│  │ - Async gen    │  │ - Sort logic   │               │
│  └────────────────┘  └────────────────┘               │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │ FilterManager  │  │SelectionManager│               │
│  │ - Filter logic │  │ - Selection    │               │
│  └────────────────┘  └────────────────┘               │
│                                                          │
│  ┌────────────────┐  ┌────────────────┐               │
│  │ WorkerManager  │  │ IndexedDBCache │               │
│  │ - Web Workers  │  │ - Cache data   │               │
│  └────────────────┘  └────────────────┘               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Web Worker                             │
│              (data-worker.ts)                           │
│  - Sort large datasets                                   │
│  - Filter large datasets                                 │
│  - Runs in background thread                            │
└─────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initial Load (Small Dataset < 500 rows)

```
User provides data → Render immediately → Show first page
```

### 2. Initial Load (Large Dataset ≥ 500 rows)

```
User requests data → useAsyncDataGeneration hook
  → Show DataTableSkeleton
  → Generate data in chunks (non-blocking)
  → Hide skeleton, render first page
```

### 3. Sort/Filter (Small datasets < 10K rows)

```
User action → Primitives (main thread) → Update state → Render current page
```

### 4. Sort/Filter (Large datasets ≥ 10K rows)

```
User action → Web Worker → Primitives receive result → Update state → Render
```

### 5. Pagination

```
User changes page → Calculate slice → Render current page (no data processing)
```

## Key Decisions

### Why Pagination Instead of Virtual Scrolling?

1. **Simpler** - No complex scroll calculations
2. **Better UX** - Users can bookmark pages, navigate easily
3. **More Accessible** - Standard pagination patterns
4. **Carbon Native** - Uses Carbon Pagination component

### Why Async Data Generation?

- Prevents UI freezing during data generation (≥500 rows)
- Shows skeleton state for better UX
- Automatically determines optimal chunk size
- Keeps application responsive

### Why Web Workers?

- Sorting/filtering 10K+ rows blocks UI
- Web Workers run in background thread
- Keeps UI responsive during heavy operations

### Why IndexedDB?

- Cache large datasets in browser
- Faster than re-fetching from server
- Persists across page reloads
- Handles datasets too large for memory

## Component API

### PaginatedDataTable Props

```typescript
interface PaginatedDataTableProps {
  // Data
  rows: any[];
  headers: any[];

  // Render props (Carbon-compatible)
  children: (props: RenderProps) => ReactElement;

  // Pagination
  defaultPageSize?: number;
  pageSizes?: number[];

  // Features
  isSortable?: boolean;

  // Performance
  useWorker?: boolean; // Auto-enabled for >10K rows
  cacheKey?: string; // IndexedDB cache key

  // Callbacks
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onFilter?: (query: string) => void;
}
```

### useAsyncDataGeneration Hook

```typescript
interface UseAsyncDataGenerationOptions<T> {
  totalRows: number;
  generateBatch: (count: number, startIndex: number) => T[];
  headers: any[];
  skeletonRows?: number;
  chunkSize?: number;
  chunkDelay?: number;
}

interface UseAsyncDataGenerationResult<T> {
  data: T[];
  skeleton: ReactElement | null;
  isGenerating: boolean;
  progress: number;
}

const { data, skeleton, isGenerating, progress } = useAsyncDataGeneration({
  totalRows: 10000,
  generateBatch: (count, startIndex) => generateRows(count, startIndex),
  headers,
});
```

## Primitives Usage

### Data Generator

```typescript
import {
  shouldUseAsyncGeneration,
  getOptimalChunkConfig,
  generateDataAsync,
} from '@carbon-labs/primitives/data-generator';

if (shouldUseAsyncGeneration(totalRows)) {
  const config = getOptimalChunkConfig(totalRows);
  const data = await generateDataAsync({
    totalRows,
    generateBatch,
    onProgress: (progress) => setProgress(progress),
    ...config,
  });
}
```

### SortManager

```typescript
import { SortManager } from '@carbon-labs/primitives/paginated-table';

const sortManager = new SortManager();
const sorted = sortManager.sort(data, 'name', 'asc');
```

### FilterManager

```typescript
import { FilterManager } from '@carbon-labs/primitives/paginated-table';

const filterManager = new FilterManager();
const filtered = filterManager.filter(data, 'query', ['name', 'status']);
```

### SelectionManager

```typescript
import { SelectionManager } from '@carbon-labs/primitives/paginated-table';

const selectionManager = new SelectionManager();
selectionManager.toggle('row-1');
const selected = selectionManager.getSelectedRows(allRows);
```

### WorkerManager

```typescript
import { WorkerManager } from '@carbon-labs/primitives/paginated-table';

const workerManager = new WorkerManager();
const result = await workerManager.sort(data, 'name', 'asc');
```

## File Structure

```
packages/react/src/components/PaginatedDataTable/
├── index.ts                          # Public exports
├── package.json                      # Component package
├── README.md                         # Usage documentation
├── API_GUIDE.md                      # API reference
├── ARCHITECTURE.md                   # This file
├── components/
│   └── PaginatedDataTable.tsx       # Main component
├── hooks/
│   └── useAsyncDataGeneration.tsx   # Async data hook
└── __stories__/
    ├── Basic.stories.tsx            # Basic examples
    ├── Selection.stories.tsx        # Selection examples
    ├── Sorting.stories.tsx          # Sorting examples
    ├── Dynamic.stories.tsx          # Dynamic operations
    ├── Performance.stories.tsx      # Performance demos
    └── test-data.ts                 # Test data generator

packages/primitives/src/
├── data-generator/
│   └── index.ts                     # Async data generation
└── paginated-table/
    ├── index.ts                     # Public exports
    ├── types.ts                     # TypeScript types
    ├── sorting.ts                   # SortManager
    ├── filtering.ts                 # FilterManager
    ├── selection.ts                 # SelectionManager
    ├── worker-manager.ts            # WorkerManager
    ├── data-worker.ts               # Web Worker
    ├── indexeddb-cache.ts           # IndexedDB cache
    └── pagination.ts                # Pagination calculations
```

## Performance Optimization Strategy

### Three-Tier System

| Dataset Size | Strategy         | Features                         |
| ------------ | ---------------- | -------------------------------- |
| < 500 rows   | Synchronous      | Direct rendering, no async       |
| 500-10K rows | Async Generation | Chunked generation with skeleton |
| 10K-50K rows | + Web Workers    | Heavy operations offloaded       |
| ≥ 50K rows   | + IndexedDB      | Caching for faster loads         |

### Automatic Optimization

The component automatically:

1. Detects dataset size
2. Chooses optimal strategy
3. Calculates chunk size/delay
4. Shows appropriate loading states
5. Enables Web Workers when needed
6. Suggests caching for very large datasets

## Performance Targets

- **500 rows**: < 50ms async generation
- **1K rows**: < 100ms async generation
- **10K rows**: < 100ms sort/filter (main thread)
- **50K rows**: < 500ms sort/filter (Web Worker)
- **100K rows**: < 1s sort/filter (Web Worker + IndexedDB)
- **Pagination**: < 16ms (60 FPS)
- **Memory**: < 100MB for 100K rows

## Integration Pattern

### Basic Usage

```tsx
import { PaginatedDataTable } from '@carbon-labs/react';

function MyTable() {
  const rows = [...]; // Your data
  const headers = [...]; // Your headers

  return (
    <PaginatedDataTable rows={rows} headers={headers}>
      {({ rows, headers, getHeaderProps, getRowProps, getTableProps, getPaginationProps }) => (
        <TableContainer>
          <Table {...getTableProps()}>
            {/* Table markup */}
          </Table>
          <Pagination {...getPaginationProps()} />
        </TableContainer>
      )}
    </PaginatedDataTable>
  );
}
```

### With Async Data Generation

```tsx
import { PaginatedDataTable, useAsyncDataGeneration } from '@carbon-labs/react';

function LargeTable() {
  const { data: rows, skeleton } = useAsyncDataGeneration({
    totalRows: 10000,
    generateBatch: (count, startIndex) => generateRows(count, startIndex),
    headers,
  });

  if (skeleton) return skeleton;

  return (
    <PaginatedDataTable
      rows={rows}
      headers={headers}
      useWorker
      cacheKey="data-v1">
      {/* Same render props pattern */}
    </PaginatedDataTable>
  );
}
```

## Testing Strategy

### Unit Tests

- Primitives logic (sorting, filtering, selection)
- Hook behavior (async generation, progress tracking)
- Component state management

### Integration Tests

- Selection across pages
- Sorting with large datasets
- Filtering with search
- Pagination navigation

### Performance Tests

- Data generation benchmarks
- Sort/filter timing
- Memory usage monitoring
- Worker overhead measurement

## Future Enhancements

### Planned Features

- [ ] Server-side pagination support
- [ ] Advanced filtering (date ranges, multi-select)
- [ ] Column resizing and reordering
- [ ] Export to CSV/Excel
- [ ] Keyboard navigation improvements

### Performance Improvements

- [ ] Incremental rendering for 100K+ rows
- [ ] Request animation frame batching
- [ ] Memoization of expensive calculations
- [ ] Streaming data support

## License

Copyright IBM Corp. 2026

Licensed under the Apache-2.0 license.
