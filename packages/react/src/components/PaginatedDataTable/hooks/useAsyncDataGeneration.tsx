/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect, ReactNode } from 'react';
import { DataTableSkeleton } from '@carbon/react';
import {
  generateDataAsync,
  shouldUseAsyncGeneration,
  type DataGeneratorConfig,
} from '@carbon-labs/primitives';

export interface UseAsyncDataGenerationOptions<T = any> {
  /**
   * Total number of rows to generate
   */
  totalRows: number;

  /**
   * Function that generates a batch of rows
   */
  generateBatch: (count: number, startIndex: number) => T[];

  /**
   * Column headers for skeleton display
   */
  headers: any[];

  /**
   * Number of skeleton rows to show (default: 10)
   */
  skeletonRows?: number;

  /**
   * Custom chunk size (optional, auto-calculated if not provided)
   */
  chunkSize?: number;

  /**
   * Custom chunk delay in ms (optional, auto-calculated if not provided)
   */
  chunkDelay?: number;
}

export interface UseAsyncDataGenerationResult<T = any> {
  /**
   * Generated data (empty array while generating)
   */
  data: T[];

  /**
   * Whether data is currently being generated
   */
  isGenerating: boolean;

  /**
   * Current generation progress (0-100)
   */
  progress: number;

  /**
   * Skeleton component to render while generating
   * Returns null if not generating or if data is small enough for sync generation
   */
  skeleton: ReactNode;
}

/**
 * Hook for async data generation with automatic skeleton state
 *
 * Automatically determines if async generation is needed based on row count.
 * For small datasets (<1000 rows), generates synchronously.
 * For larger datasets, generates asynchronously with skeleton loading state.
 *
 * @example
 * ```tsx
 * const { data, isGenerating, skeleton } = useAsyncDataGeneration({
 *   totalRows: 10000,
 *   generateBatch: (count, startIndex) => generateRows(count, startIndex),
 *   headers: myHeaders,
 * });
 *
 * if (skeleton) return skeleton;
 *
 * return <PaginatedDataTable rows={data} headers={headers}>...</PaginatedDataTable>;
 * ```
 */
export function useAsyncDataGeneration<T = any>(
  options: UseAsyncDataGenerationOptions<T>
): UseAsyncDataGenerationResult<T> {
  const {
    totalRows,
    generateBatch,
    headers,
    skeletonRows = 10,
    chunkSize,
    chunkDelay,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const generate = async () => {
      setIsGenerating(true);

      // For small datasets, generate synchronously
      if (!shouldUseAsyncGeneration(totalRows)) {
        const rows = generateBatch(totalRows, 0);
        setData(rows);
        setIsGenerating(false);
        return;
      }

      // For large datasets, generate asynchronously
      const config: DataGeneratorConfig<T> = {
        totalRows,
        generateBatch,
        chunkSize,
        chunkDelay,
        onProgress: setProgress,
      };

      const rows = await generateDataAsync(config);
      setData(rows);
      setIsGenerating(false);
    };

    generate();
  }, [totalRows, generateBatch, chunkSize, chunkDelay]);

  // Only show skeleton for async generation
  const skeleton =
    isGenerating && shouldUseAsyncGeneration(totalRows) ? (
      <div style={{ padding: '2rem' }}>
        <DataTableSkeleton
          columnCount={headers.length}
          rowCount={skeletonRows}
        />
      </div>
    ) : null;

  return {
    data,
    isGenerating,
    progress,
    skeleton,
  };
}
