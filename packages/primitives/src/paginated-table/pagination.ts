/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Calculate pagination details for a dataset
 */
export interface PaginationResult {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Start index in the dataset (0-based) */
  startIndex: number;
  /** End index in the dataset (0-based, exclusive) */
  endIndex: number;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * Calculate pagination details
 * @param {number} page - Current page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @param {number} totalItems - Total number of items in the dataset
 * @returns {PaginationResult} Pagination details
 */
export function calculatePagination(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationResult {
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page: currentPage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPrevious: currentPage > 1,
    hasNext: currentPage < totalPages,
  };
}

/**
 * Get a page of data from a dataset
 *
 * **Note:** This utility is provided for advanced use cases, Web Components implementation,
 * and server-side pagination scenarios. The React PaginatedDataTable component handles
 * pagination internally and does not require this function.
 *
 * @template T
 * @param {T[]} data - The full dataset
 * @param {number} page - Current page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {T[]} The current page of data
 *
 * @example
 * ```typescript
 * // Manual pagination
 * const currentPage = getPage(allData, 2, 25); // Get page 2 with 25 items per page
 * ```
 */
export function getPage<T>(data: T[], page: number, pageSize: number): T[] {
  const pagination = calculatePagination(page, pageSize, data.length);
  return data.slice(pagination.startIndex, pagination.endIndex);
}
