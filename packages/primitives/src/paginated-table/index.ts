/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Export types
export type {
  SelectionMode,
  SortDirection,
  SelectionConfig,
  SortConfig,
  FilterConfig,
  Column,
  TableRow,
  StateChangeListener,
  SelectionChangeListener,
} from './types.js';

// Export core classes
export { SelectionManager } from './selection.js';
export { SortManager } from './sorting.js';
export { FilterManager } from './filtering.js';
export { WorkerManager } from './worker-manager.js';

// Export worker types
export type {
  WorkerMessageType,
  WorkerRequest,
  WorkerResponse,
} from './data-worker.js';

// Export IndexedDB cache
export { IndexedDBCache } from './indexeddb-cache.js';
export type { CacheEntry } from './indexeddb-cache.js';

// Export pagination utilities
export { calculatePagination, getPage } from './pagination.js';
export type { PaginationResult } from './pagination.js';
