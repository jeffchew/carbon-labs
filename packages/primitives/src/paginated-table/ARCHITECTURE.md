/\*\*

- Copyright IBM Corp. 2026
-
- This source code is licensed under the Apache-2.0 license found in the
- LICENSE file in the root directory of this source tree. \*/

# PaginatedTable Primitives Architecture

## Overview

This package provides framework-agnostic business logic for handling large
datasets in paginated tables. The primitives are designed to be shared across
React, Web Components, and other frameworks.

## Design Principles

### 1. Framework Agnostic

All business logic is pure TypeScript/JavaScript with no framework dependencies.
This enables:

- 80-90% code reuse across React, Web Components, Vue, Angular, etc.
- Consistent behavior across all implementations
- Easier testing and maintenance

### 2. Performance First

Automatic optimization based on dataset size:

- **< 500 rows**: Synchronous data generation and operations (instant)
- **≥ 500 rows**: Asynchronous data generation with chunking (non-blocking)
- **≥ 10K rows**: + Web Workers for heavy operations (sort, filter)
- **≥ 50K rows**: + IndexedDB caching for persistence

### 3. Separation of Concerns

- **Primitives**: Business logic (this package)
- **Components**: UI rendering (React/Web Components packages)
- **State**: Split between UI state (component) and data state (primitives)

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (Framework)                     │
│              React / Web Components / Vue / etc.             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Primitives Layer (This Package)           │
│  SelectionManager │ SortManager │ FilterManager │ etc.      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Execution Layer                           │
│         Main Thread  │  Web Workers  │  IndexedDB           │
└─────────────────────────────────────────────────────────────┘
```

## Core Primitives

### Data Generator (`data-generator/index.ts`)

**Purpose**: Non-blocking async data generation for large datasets

**Execution**: Main thread with chunking for ≥500 rows

**Why Async Generation?**

- Prevents UI freezing during data generation
- Allows progress feedback to users
- Keeps application responsive
- Automatically determines optimal chunk size and delay

**Key Functions**:

```typescript
shouldUseAsyncGeneration(rowCount: number): boolean
  // Returns true if rowCount >= 500

getOptimalChunkConfig(totalRows: number): ChunkConfig
  // Auto-calculates optimal chunk size and delay
  // 500-5K rows: 500 chunk, 10ms delay
  // 5K-20K rows: 1000 chunk, 5ms delay
  // 20K+ rows: 2000 chunk, 0ms delay

generateDataAsync(options: GenerateDataOptions): Promise<any[]>
  // Generates data in chunks with progress callbacks
```

**Usage Pattern**:

```typescript
import {
  shouldUseAsyncGeneration,
  getOptimalChunkConfig,
  generateDataAsync,
} from '@carbon-labs/primitives/data-generator';

// Check if async needed
if (shouldUseAsyncGeneration(totalRows)) {
  const config = getOptimalChunkConfig(totalRows);

  const data = await generateDataAsync({
    totalRows,
    generateBatch: (count, startIndex) => createRows(count, startIndex),
    onProgress: (progress) => console.log(`${progress}% complete`),
    chunkSize: config.chunkSize,
    chunkDelay: config.chunkDelay,
  });
} else {
  // Sync generation for small datasets
  const data = createRows(totalRows, 0);
}
```

**Performance**:

- 500 rows: ~50ms (chunked)
- 1K rows: ~100ms (chunked)
- 5K rows: ~500ms (chunked)
- 10K rows: ~1s (chunked)

### SelectionManager (`selection.ts`)

**Purpose**: Manage cross-page selection state

**Execution**: Always main thread

**Why Main Thread?**

- Instant UI feedback required (checkboxes must respond immediately)
- Lightweight operations (Set.add/delete/has are O(1))
- Synchronous state needed for rendering
- Even 50K selections is just ~1MB in memory

**Key Methods**:

```typescript
select(id: string): void           // Add to selection
deselect(id: string): void         // Remove from selection
toggle(id: string): void           // Toggle selection
selectAll(rows): void              // Select all rows
deselectAll(rows): void            // Deselect all rows
isSelected(id: string): boolean    // Check if selected
getSelectedRows(rows): Row[]       // Get selected rows from dataset
subscribe(listener): () => void    // Observable pattern for UI updates
```

**State Storage**:

```typescript
private selectedIds: Set<string>   // O(1) lookup, add, delete
```

**Usage Pattern**:

```typescript
const selectionManager = new SelectionManager();

// Subscribe to changes (React/Web Components)
const unsubscribe = selectionManager.subscribe(() => {
  // Trigger re-render
});

// User clicks checkbox
selectionManager.toggle(rowId);

// Check if row is selected
const isChecked = selectionManager.isSelected(rowId);

// Get all selected rows
const selected = selectionManager.getSelectedRows(allRows);
```

### FilterManager (`filtering.ts`)

**Purpose**: Search/filter rows by text query

**Execution**: Main thread for < 10K rows

**Performance**:

- < 1K rows: < 10ms
- 1K-10K rows: 10-100ms
- ≥ 10K rows: Use WorkerManager instead

**Key Methods**:

```typescript
filter(rows, query, columnIds): Row[]  // Filter rows by search query
```

**Algorithm**:

```typescript
// Case-insensitive search across specified columns
rows.filter((row) =>
  columnIds.some((col) =>
    String(row[col]).toLowerCase().includes(query.toLowerCase())
  )
);
```

### SortManager (`sorting.ts`)

**Purpose**: Sort rows by column and direction

**Execution**: Main thread for < 10K rows

**Performance**:

- < 1K rows: < 10ms
- 1K-10K rows: 10-100ms
- ≥ 10K rows: Use WorkerManager instead

**Key Methods**:

```typescript
sort(rows, column, direction): Row[]  // Sort rows
```

**Algorithm**:

```typescript
// Stable sort with type-aware comparison
rows.sort((a, b) => {
  const aVal = a[column];
  const bVal = b[column];

  // Handle numbers, strings, dates, etc.
  const comparison = compare(aVal, bVal);
  return direction === 'asc' ? comparison : -comparison;
});
```

### WorkerManager (`worker-manager.ts`)

**Purpose**: Offload heavy operations to Web Workers

**Execution**: Background thread (Web Worker)

**When Used**: Automatically for datasets ≥ 10K rows

**Key Methods**:

```typescript
search(rows, query, columnIds): Promise<Row[]>  // Async filter
sort(rows, column, direction): Promise<Row[]>   // Async sort
terminate(): void                                // Cleanup
```

**Worker Communication**:

```typescript
// Main thread → Worker
postMessage({
  type: 'SEARCH',
  payload: { rows, query, columnIds },
});

// Worker → Main thread
postMessage({
  type: 'SEARCH_COMPLETE',
  payload: { result: filteredRows },
});
```

**Benefits**:

- Non-blocking UI (user can still interact)
- Prevents "freezing" during heavy operations
- Automatic fallback to main thread if workers unavailable

### IndexedDBCache (`indexeddb-cache.ts`)

**Purpose**: Persist processed data for faster subsequent loads

**Execution**: Asynchronous (IndexedDB API)

**When Used**: Optional, for datasets ≥ 50K rows

**Key Methods**:

```typescript
set(key, data): Promise<void>      // Cache processed data
get(key): Promise<data | null>     // Retrieve cached data
delete(key): Promise<void>         // Remove cached data
clear(): Promise<void>             // Clear all cache
close(): void                      // Close database connection
```

**Storage Strategy**:

```typescript
// Cache key format
const cacheKey = `table-${tableId}-${searchQuery}-${sortColumn}-${sortDirection}`;

// Store processed results
await cache.set(cacheKey, processedRows);

// Retrieve on next load
const cached = await cache.get(cacheKey);
if (cached) {
  return cached; // Skip processing
}
```

### Pagination Utilities (`pagination.ts`)

**Purpose**: Calculate pagination metadata

**Execution**: Always main thread (instant)

**Key Functions**:

```typescript
calculatePagination(page, pageSize, totalItems): PaginationResult
getPage(rows, page, pageSize): Row[]
```

**Returns**:

```typescript
{
  page: number,           // Current page (1-based)
  pageSize: number,       // Items per page
  totalItems: number,     // Total items in dataset
  totalPages: number,     // Total number of pages
  startIndex: number,     // Array start index (0-based)
  endIndex: number,       // Array end index (exclusive)
  hasNextPage: boolean,   // Can go forward
  hasPreviousPage: boolean // Can go back
}
```

## Data Processing Pipeline

### Initial Data Generation Flow

#### Small Dataset (< 500 rows)

```
Component Mount
    ↓
Synchronous Data Generation [Main Thread, instant]
    ↓
Render UI
```

#### Large Dataset (≥ 500 rows)

```
Component Mount
    ↓
shouldUseAsyncGeneration() → true
    ↓
Show Skeleton UI
    ↓
getOptimalChunkConfig() [Calculate chunk size/delay]
    ↓
generateDataAsync() [Chunked generation with progress]
    ↓ (non-blocking, UI shows skeleton)
Chunk 1 → Chunk 2 → ... → Chunk N
    ↓
Data Complete
    ↓
Hide Skeleton, Render Table
```

### Standard Flow (< 10K rows)

```
User Input (search/sort)
    ↓
Component State Update
    ↓
FilterManager.filter() [Main Thread, ~50ms]
    ↓
SortManager.sort() [Main Thread, ~50ms]
    ↓
calculatePagination() [Main Thread, instant]
    ↓
Array.slice() [Main Thread, instant]
    ↓
SelectionManager.isSelected() [Main Thread, instant]
    ↓
Render UI
```

### Optimized Flow (≥ 10K rows)

```
User Input (search/sort)
    ↓
Component State Update (isProcessing = true)
    ↓
WorkerManager.search() [Web Worker, ~200ms]
    ↓ (non-blocking, UI still responsive)
WorkerManager.sort() [Web Worker, ~200ms]
    ↓
IndexedDBCache.set() [Async, optional]
    ↓
Component State Update (isProcessing = false)
    ↓
calculatePagination() [Main Thread, instant]
    ↓
Array.slice() [Main Thread, instant]
    ↓
SelectionManager.isSelected() [Main Thread, instant]
    ↓
Render UI
```

## Performance Characteristics

### Operation Complexity

| Operation          | Complexity | 500 rows | 1K rows | 10K rows | 50K rows |
| ------------------ | ---------- | -------- | ------- | -------- | -------- |
| Data Gen (sync)    | O(n)       | instant  | instant | N/A      | N/A      |
| Data Gen (async)   | O(n)       | 50ms     | 100ms   | 1s       | 5s       |
| Selection (Set)    | O(1)       | < 1ms    | < 1ms   | < 1ms    | < 1ms    |
| Pagination (slice) | O(n)       | < 1ms    | < 1ms   | < 1ms    | < 1ms    |
| Filter (main)      | O(n\*m)    | 5ms      | 10ms    | 50ms     | 250ms    |
| Filter (worker)    | O(n\*m)    | N/A      | N/A     | 100ms    | 500ms    |
| Sort (main)        | O(n log n) | 5ms      | 10ms    | 100ms    | 500ms    |
| Sort (worker)      | O(n log n) | N/A      | N/A     | 150ms    | 750ms    |

_n = rows, m = columns searched_

### Memory Usage

| Dataset   | Memory | Notes             |
| --------- | ------ | ----------------- |
| 1K rows   | ~100KB | All in memory     |
| 10K rows  | ~1MB   | All in memory     |
| 50K rows  | ~5MB   | Consider caching  |
| 100K rows | ~10MB  | Cache recommended |

### Worker Overhead

- **Startup**: ~50ms (one-time)
- **Data transfer**: ~10ms per MB (serialization)
- **Processing**: Same as main thread
- **Total overhead**: ~60-100ms

**Break-even point**: ~10K rows (overhead < processing time saved)

## State Management Strategy

### Component State (Framework-specific)

```typescript
// UI-specific state
const [page, setPage] = useState(1);
const [pageSize, setPageSize] = useState(25);
const [searchValue, setSearchValue] = useState('');
const [isProcessing, setIsProcessing] = useState(false);
```

### Primitives State (Framework-agnostic)

```typescript
// Business logic state
SelectionManager.selectedIds: Set<string>
SortManager.lastSort: { column, direction }
FilterManager.lastQuery: string
```

### Why Split State?

1. **Reusability**: Primitives work in any framework
2. **Testability**: Business logic tested independently
3. **Consistency**: Same behavior across implementations
4. **Performance**: Primitives don't trigger framework re-renders

## Integration Patterns

### React Integration

```typescript
import { SelectionManager, SortManager, FilterManager } from '@carbon-labs/primitives';

function MyTable() {
  // Initialize managers once
  const selectionManager = useMemo(() => new SelectionManager(), []);
  const sortManager = useMemo(() => new SortManager(), []);
  const filterManager = useMemo(() => new FilterManager(), []);

  // Subscribe to selection changes
  const [selectionVersion, setSelectionVersion] = useState(0);
  useEffect(() => {
    return selectionManager.subscribe(() => {
      setSelectionVersion(v => v + 1); // Force re-render
    });
  }, [selectionManager]);

  // Use managers
  const handleSearch = (query) => {
    const filtered = filterManager.filter(rows, query, columnIds);
    setProcessedRows(filtered);
  };

  const handleSelect = (id) => {
    selectionManager.toggle(id);
  };

  return (
    // Render UI
  );
}
```

### Web Components Integration

```typescript
import {
  SelectionManager,
  SortManager,
  FilterManager,
} from '@carbon-labs/primitives';

class MyTable extends LitElement {
  private selectionManager = new SelectionManager();
  private sortManager = new SortManager();
  private filterManager = new FilterManager();

  connectedCallback() {
    super.connectedCallback();

    // Subscribe to selection changes
    this.selectionManager.subscribe(() => {
      this.requestUpdate(); // Trigger re-render
    });
  }

  handleSearch(query) {
    const filtered = this.filterManager.filter(
      this.rows,
      query,
      this.columnIds
    );
    this.processedRows = filtered;
  }

  handleSelect(id) {
    this.selectionManager.toggle(id);
  }
}
```

## Testing Strategy

### Unit Tests (Primitives)

```typescript
describe('SelectionManager', () => {
  it('should select and deselect rows', () => {
    const manager = new SelectionManager();
    manager.select('row-1');
    expect(manager.isSelected('row-1')).toBe(true);
    manager.deselect('row-1');
    expect(manager.isSelected('row-1')).toBe(false);
  });
});
```

### Integration Tests (Components)

```typescript
describe('PaginatedDataTable', () => {
  it('should maintain selections across pages', () => {
    // Select on page 1
    // Navigate to page 2
    // Navigate back to page 1
    // Verify selections still checked
  });
});
```

### Performance Tests

```typescript
describe('Performance', () => {
  it('should filter 10K rows in < 100ms', () => {
    const start = performance.now();
    filterManager.filter(rows10K, 'query', columns);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
```

## Future Enhancements

### Planned Features

- [ ] Virtual scrolling for 100K+ rows
- [ ] Server-side pagination support
- [ ] Advanced filtering (date ranges, multi-select)
- [ ] Column resizing and reordering
- [ ] Export to CSV/Excel
- [ ] Keyboard navigation

### Performance Improvements

- [ ] Incremental rendering for large datasets
- [ ] Request animation frame batching
- [ ] Memoization of expensive calculations
- [ ] Lazy loading of off-screen rows

## Troubleshooting

### Issue: Selections lost on page change

**Cause**: Not using SelectionManager **Solution**: Use SelectionManager from
primitives, not component state

### Issue: UI freezes with large datasets

**Cause**: Not using WorkerManager for ≥10K rows **Solution**: Check
`shouldUseWorker` logic in component

### Issue: Slow initial load

**Cause**: Processing all data on mount **Solution**: Use lazy initialization
with `startTransition`

### Issue: Memory leaks

**Cause**: Not cleaning up managers **Solution**: Call `terminate()` and
`close()` in cleanup

## Contributing

When adding new primitives:

1. **Keep it framework-agnostic** - No React/Lit dependencies
2. **Add TypeScript types** - Full type safety
3. **Document performance** - Include complexity analysis
4. **Add tests** - Unit tests for all public methods
5. **Update this doc** - Keep architecture docs current

## License

Copyright IBM Corp. 2026

Licensed under the Apache-2.0 license.
