/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Selection mode for table rows
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation. The React PaginatedDataTable component
 * handles selection internally.
 */
export type SelectionMode = 'single' | 'multiple' | 'none';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | 'none';

/**
 * Configuration for selection manager
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation.
 */
export interface SelectionConfig {
  /** Selection mode */
  mode: SelectionMode;
  /** Set of IDs that cannot be selected */
  disabledIds?: Set<string>;
}

/**
 * Sort configuration for a column
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation.
 */
export interface SortConfig {
  /** Column identifier */
  columnId: string;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Filter configuration
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation.
 */
export interface FilterConfig {
  /** Search query string */
  query: string;
  /** Column IDs to search in */
  columns: string[];
}

/**
 * Column definition
 *
 * **Note:** This type is part of the public API for TypeScript users and
 * future Web Components implementation.
 */
export interface Column {
  /** Unique column identifier */
  id: string;
  /** Column header text */
  header: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Custom sort function */
  sortFunction?: (a: any, b: any) => number;
  /** Whether column is filterable */
  filterable?: boolean;
}

/**
 * Table row data
 *
 * **Note:** This type is part of the public API for TypeScript users and
 * future Web Components implementation.
 */
export interface TableRow {
  /** Unique row identifier */
  id: string;
  /** Row data as key-value pairs */
  [key: string]: any;
}

/**
 * State change listener
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation.
 */
export type StateChangeListener = () => void;

/**
 * Selection change listener
 *
 * **Note:** This type is part of the public API for advanced use cases and
 * future Web Components implementation.
 */
export type SelectionChangeListener = (selectedIds: Set<string>) => void;
