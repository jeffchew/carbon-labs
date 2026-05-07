/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { FilterConfig, TableRow } from './types.js';

/**
 * FilterManager handles filtering logic for table data
 */
export class FilterManager {
  private filterConfig: FilterConfig | null = null;

  /**
   * Filter data based on search query
   * @param {TableRow[]} data - Data to filter
   * @param {string} query - Search query
   * @param {string[]} columns - Column IDs to search in
   * @returns {TableRow[]} Filtered data
   */
  filter(data: TableRow[], query: string, columns: string[]): TableRow[] {
    if (!query || query.trim() === '') {
      return data;
    }

    this.filterConfig = { query, columns };

    const searchLower = query.toLowerCase().trim();

    return data.filter((row) => {
      return columns.some((columnId) => {
        const value = row[columnId];

        if (value == null) {
          return false;
        }

        // Convert value to string and search
        const valueStr = String(value).toLowerCase();
        return valueStr.includes(searchLower);
      });
    });
  }

  /**
   * Filter data with custom filter function
   * @param {TableRow[]} data - Data to filter
   * @param {(row: TableRow) => boolean} filterFn - Custom filter function
   * @returns {TableRow[]} Filtered data
   */
  filterCustom(
    data: TableRow[],
    filterFn: (row: TableRow) => boolean
  ): TableRow[] {
    return data.filter(filterFn);
  }

  /**
   * Filter data by column value
   * @param {TableRow[]} data - Data to filter
   * @param {string} columnId - Column to filter by
   * @param {any} value - Value to match
   * @returns {TableRow[]} Filtered data
   */
  filterByColumn(data: TableRow[], columnId: string, value: any): TableRow[] {
    return data.filter((row) => row[columnId] === value);
  }

  /**
   * Filter data by multiple column values
   * @param {TableRow[]} data - Data to filter
   * @param {Record<string, any>} filters - Column filters as key-value pairs
   * @returns {TableRow[]} Filtered data
   */
  filterByColumns(data: TableRow[], filters: Record<string, any>): TableRow[] {
    return data.filter((row) => {
      return Object.entries(filters).every(([columnId, value]) => {
        return row[columnId] === value;
      });
    });
  }

  /**
   * Get current filter configuration
   * @returns {FilterConfig | null} Current filter config or null
   */
  getFilterConfig(): FilterConfig | null {
    return this.filterConfig ? { ...this.filterConfig } : null;
  }

  /**
   * Clear filter configuration
   */
  clearFilter(): void {
    this.filterConfig = null;
  }

  /**
   * Check if filtering is active
   * @returns {boolean} True if filtering is active
   */
  isFiltering(): boolean {
    return this.filterConfig !== null && this.filterConfig.query !== '';
  }
}
