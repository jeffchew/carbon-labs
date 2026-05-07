# @carbon-labs/primitives

Framework-agnostic primitives for Carbon Labs components.

## Overview

This package contains shared, framework-agnostic logic that can be used across
different Carbon Labs implementations (Web Components, React, Vue, etc.). It
includes state machines, data management utilities, and other reusable
primitives.

## Installation

```bash
npm install @carbon-labs/primitives
# or
yarn add @carbon-labs/primitives
```

## Primitives

### Paginated Table

Framework-agnostic business logic for handling large datasets in paginated
tables with automatic performance optimization.

#### Features

- **Automatic Performance Optimization**: Web Workers for datasets >10K rows
- **Smart Caching**: Optional IndexedDB caching for faster subsequent loads
- **Framework Agnostic**: Works with React, Web Components, Vue, Angular, etc.
- **Async Data Generation**: Non-blocking data generation with progress tracking

#### Core Modules

**Selection Management** (`selection.ts`)

```typescript
import { SelectionManager } from '@carbon-labs/primitives/paginated-table';

const selectionManager = new SelectionManager();
selectionManager.select('row-1');
selectionManager.toggle('row-2');
const selected = selectionManager.getSelectedRows(allRows);
```

**Sorting** (`sorting.ts`)

```typescript
import { SortManager } from '@carbon-labs/primitives/paginated-table';

const sortManager = new SortManager();
const sorted = sortManager.sort(rows, 'name', 'asc');
```

**Filtering** (`filtering.ts`)

```typescript
import { FilterManager } from '@carbon-labs/primitives/paginated-table';

const filterManager = new FilterManager();
const filtered = filterManager.filter(rows, 'search query', ['name', 'status']);
```

**Web Workers** (`worker-manager.ts`)

```typescript
import { WorkerManager } from '@carbon-labs/primitives/paginated-table';

const workerManager = new WorkerManager();
const sorted = await workerManager.sort(rows, 'name', 'asc');
const filtered = await workerManager.search(rows, 'query', ['name']);
```

**Async Data Generation** (`data-generator/index.ts`)

```typescript
import {
  generateDataAsync,
  shouldUseAsyncGeneration,
  getOptimalChunkConfig,
} from '@carbon-labs/primitives/data-generator';

// Check if async generation is needed (≥500 rows)
if (shouldUseAsyncGeneration(rowCount)) {
  const config = getOptimalChunkConfig(rowCount);
  await generateDataAsync({
    totalRows: rowCount,
    generateBatch: (count, startIndex) => createRows(count, startIndex),
    onProgress: (progress) => console.log(`${progress}% complete`),
    ...config,
  });
}
```

**IndexedDB Caching** (`indexeddb-cache.ts`)

```typescript
import { IndexedDBCache } from '@carbon-labs/primitives/paginated-table';

const cache = new IndexedDBCache('my-table');
await cache.set('data-v1', processedRows);
const cached = await cache.get('data-v1');
```

**Pagination** (`pagination.ts`)

```typescript
import {
  calculatePagination,
  getPage,
} from '@carbon-labs/primitives/paginated-table';

const pagination = calculatePagination(1, 25, 1000);
const pageRows = getPage(allRows, 1, 25);
```

#### Architecture

See [ARCHITECTURE.md](./src/paginated-table/ARCHITECTURE.md) for detailed
architecture documentation.

### Date Picker State Machine

A comprehensive state machine for managing date picker behavior, including:

- Single and range date selection
- Calendar navigation
- Keyboard interactions
- Input validation
- Accessibility features

#### Usage

```typescript
import { DatePickerStateMachine } from '@carbon-labs/primitives/date-picker';

// Create a new state machine instance
const machine = new DatePickerStateMachine({
  mode: 'single',
  value: '',
  minDate: '2024-01-01',
  maxDate: '2024-12-31',
});

// Subscribe to state changes
machine.subscribe((transition) => {
  console.log('State changed:', transition);
});

// Send events
machine.send('CALENDAR_OPEN');
machine.send('DATE_SELECT', { date: { year: 2024, month: 3, day: 15 } });
```

#### API

See the [Date Picker documentation](./src/date-picker/README.md) for detailed
API information.

## Framework Integration

### Web Components

```typescript
import { DatePickerStateMachine } from '@carbon-labs/primitives/date-picker';

class MyDatePicker extends HTMLElement {
  private machine: DatePickerStateMachine;

  constructor() {
    super();
    this.machine = new DatePickerStateMachine({
      mode: 'single',
    });
  }
}
```

### React

```typescript
import { useMemo } from 'react';
import { DatePickerStateMachine } from '@carbon-labs/primitives/date-picker';

function useDatePicker(config) {
  const machine = useMemo(() => new DatePickerStateMachine(config), [config]);

  // Use machine in your component
  return machine;
}
```

## Development

### Building

```bash
yarn build
```

### Testing

```bash
yarn test
```

## Contributing

See the main [Carbon Labs contributing guide](../../CONTRIBUTING.md).

## License

Apache-2.0
