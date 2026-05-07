/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { SortConfig, SortDirection, TableRow } from './types.js';

/**
 * Default comparison function for sorting
 * @param {any} a - First value
 * @param {any} b - Second value
 * @returns {number} Comparison result
 */
function defaultCompare(a: any, b: any): number {
  // Handle null/undefined
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }

  // String comparison
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  // Number comparison
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Date comparison
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Boolean comparison
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 0 : a ? 1 : -1;
  }

  // Fallback to string comparison
  return String(a).localeCompare(String(b));
}

/**
 * SortManager handles sorting logic for table data
 */
export class SortManager {
  private sortConfig: SortConfig | null = null;
  private customCompareFns: Map<string, (a: any, b: any) => number> = new Map();

  /**
   * Set a custom comparison function for a specific column
   * @param {string} columnId - Column identifier
   * @param {(a: any, b: any) => number} compareFn - Custom comparison function
   */
  setCustomCompare(
    columnId: string,
    compareFn: (a: any, b: any) => number
  ): void {
    this.customCompareFns.set(columnId, compareFn);
  }

  /**
   * Remove custom comparison function for a column
   * @param {string} columnId - Column identifier
   */
  removeCustomCompare(columnId: string): void {
    this.customCompareFns.delete(columnId);
  }

  /**
   * Sort data by a column
   * @param {TableRow[]} data - Data to sort
   * @param {string} columnId - Column to sort by
   * @param {SortDirection} direction - Sort direction
   * @returns {TableRow[]} Sorted data
   */
  sort(
    data: TableRow[],
    columnId: string,
    direction: SortDirection
  ): TableRow[] {
    if (direction === 'none') {
      return data;
    }

    this.sortConfig = { columnId, direction };

    const compareFn = this.customCompareFns.get(columnId) || defaultCompare;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...data].sort((a, b) => {
      const aVal = a[columnId];
      const bVal = b[columnId];
      return compareFn(aVal, bVal) * multiplier;
    });
  }

  /**
   * Toggle sort direction for a column
   * @param {string} columnId - Column to toggle
   * @returns {SortDirection} New sort direction
   */
  toggleSort(columnId: string): SortDirection {
    if (!this.sortConfig || this.sortConfig.columnId !== columnId) {
      return 'asc';
    }

    switch (this.sortConfig.direction) {
      case 'asc':
        return 'desc';
      case 'desc':
        return 'none';
      case 'none':
        return 'asc';
      default:
        return 'asc';
    }
  }

  /**
   * Get current sort configuration
   * @returns {SortConfig | null} Current sort config or null
   */
  getSortConfig(): SortConfig | null {
    return this.sortConfig ? { ...this.sortConfig } : null;
  }

  /**
   * Clear sort configuration
   */
  clearSort(): void {
    this.sortConfig = null;
  }

  /**
   * Check if a column is currently sorted
   * @param {string} columnId - Column to check
   * @returns {boolean} True if column is sorted
   */
  isSorted(columnId: string): boolean {
    return (
      this.sortConfig !== null &&
      this.sortConfig.columnId === columnId &&
      this.sortConfig.direction !== 'none'
    );
  }

  /**
   * Get sort direction for a column
   * @param {string} columnId - Column to check
   * @returns {SortDirection} Sort direction or 'none'
   */
  getSortDirection(columnId: string): SortDirection {
    if (this.sortConfig && this.sortConfig.columnId === columnId) {
      return this.sortConfig.direction;
    }
    return 'none';
  }
}
