/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TableRow, SortDirection } from './types.js';

/**
 * Message types for worker communication
 */
export type WorkerMessageType = 'sort' | 'filter' | 'search' | 'generate';

/**
 * Worker request message
 */
export interface WorkerRequest {
  type: WorkerMessageType;
  id: string;
  data: TableRow[];
  config: any;
}

/**
 * Worker response message
 */
export interface WorkerResponse {
  type: WorkerMessageType;
  id: string;
  result: TableRow[];
  error?: string;
}

/**
 * Sort configuration for worker
 */
interface SortConfig {
  columnId: string;
  direction: SortDirection;
}

/**
 * Filter configuration for worker
 */
interface FilterConfig {
  filters: Array<{
    column: string;
    test: (value: any) => boolean;
  }>;
}

/**
 * Search configuration for worker
 */
interface SearchConfig {
  query: string;
  columns: string[];
}

/**
 * Generate configuration for worker
 */
interface GenerateConfig {
  count: number;
  chunkSize?: number;
  template: (index: number) => TableRow;
}

/**
 * Default comparison function for sorting
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {number} Comparison result
 */
function defaultCompare(a: any, b: any): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  return String(a).localeCompare(String(b));
}

/**
 * Sort data by column
 * @param {TableRow[]} data - Data to sort
 * @param {SortConfig} config - Sort configuration
 * @returns {TableRow[]} Sorted data
 */
function sortData(data: TableRow[], config: SortConfig): TableRow[] {
  if (config.direction === 'none') {
    return data;
  }

  const { columnId, direction } = config;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    const aVal = a[columnId];
    const bVal = b[columnId];
    return defaultCompare(aVal, bVal) * multiplier;
  });
}

/**
 * Filter data with custom filters
 * @param {TableRow[]} data - Data to filter
 * @param {FilterConfig} config - Filter configuration
 * @returns {TableRow[]} Filtered data
 */
function filterData(data: TableRow[], config: FilterConfig): TableRow[] {
  return data.filter((row) => {
    return config.filters.every((filter) => {
      const value = row[filter.column];
      return filter.test(value);
    });
  });
}

/**
 * Search data across columns
 * @param {TableRow[]} data - Data to search
 * @param {SearchConfig} config - Search configuration
 * @returns {TableRow[]} Filtered data
 */
function searchData(data: TableRow[], config: SearchConfig): TableRow[] {
  const searchLower = config.query.toLowerCase().trim();

  if (!searchLower) {
    return data;
  }

  return data.filter((row) => {
    return config.columns.some((columnId) => {
      const value = row[columnId];

      if (value == null) {
        return false;
      }

      const valueStr = String(value).toLowerCase();
      return valueStr.includes(searchLower);
    });
  });
}

/**
 * Generate data in chunks
 * @param {GenerateConfig} config - Generation configuration
 * @param {Function} progressCallback - Progress callback
 * @returns {TableRow[]} Generated data
 */
function generateData(
  config: GenerateConfig,
  progressCallback?: (progress: number) => void
): TableRow[] {
  const { count, chunkSize = 5000, template } = config;
  const result: TableRow[] = [];

  for (let i = 0; i < count; i++) {
    result.push(template(i));

    // Report progress every chunk
    if (progressCallback && i % chunkSize === 0) {
      progressCallback(Math.round((i / count) * 100));
    }
  }

  if (progressCallback) {
    progressCallback(100);
  }

  return result;
}

/**
 * Worker message handler
 * This code runs in the Web Worker context
 */
if (typeof self !== 'undefined' && 'postMessage' in self) {
  self.addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
    const { type, id, data, config } = e.data;

    try {
      let result: TableRow[];

      switch (type) {
        case 'sort':
          result = sortData(data, config as SortConfig);
          break;

        case 'filter':
          result = filterData(data, config as FilterConfig);
          break;

        case 'search':
          result = searchData(data, config as SearchConfig);
          break;

        case 'generate':
          result = generateData(config as GenerateConfig, (progress) => {
            // Send progress updates
            self.postMessage({
              type: 'progress',
              id,
              progress,
            });
          });
          break;

        default:
          throw new Error(`Unknown worker message type: ${type}`);
      }

      const response: WorkerResponse = {
        type,
        id,
        result,
      };

      self.postMessage(response);
    } catch (error) {
      const response: WorkerResponse = {
        type,
        id,
        result: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      self.postMessage(response);
    }
  });
}

/**
 * Export types and functions for testing
 */
export { sortData, filterData, searchData, generateData };
