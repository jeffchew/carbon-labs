/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface DataGeneratorConfig<T = any> {
  /**
   * Total number of rows to generate
   */
  totalRows: number;

  /**
   * Function that generates a batch of rows
   * @param count - Number of rows to generate
   * @param startIndex - Starting index for this batch
   * @returns Array of generated rows
   */
  generateBatch: (count: number, startIndex: number) => T[];

  /**
   * Chunk size for async generation (default: 500 for <10K, 1000 for >=10K)
   */
  chunkSize?: number;

  /**
   * Delay between chunks in milliseconds (default: 25ms for <10K, 50ms for >=10K)
   */
  chunkDelay?: number;

  /**
   * Callback for progress updates (0-100)
   */
  onProgress?: (progress: number) => void;
}

export interface DataGeneratorResult<T = any> {
  /**
   * Generated data rows
   */
  data: T[];

  /**
   * Whether generation is complete
   */
  isComplete: boolean;

  /**
   * Current progress (0-100)
   */
  progress: number;
}

/**
 * Determines optimal chunk size and delay based on total rows
 */
export function getOptimalChunkConfig(totalRows: number): {
  chunkSize: number;
  chunkDelay: number;
} {
  if (totalRows < 10000) {
    return { chunkSize: 500, chunkDelay: 25 };
  }
  return { chunkSize: 1000, chunkDelay: 50 };
}

/**
 * Generates data asynchronously in chunks to avoid blocking the UI
 *
 * @param config - Data generation configuration
 * @returns Promise that resolves with generated data
 */
export async function generateDataAsync<T = any>(
  config: DataGeneratorConfig<T>
): Promise<T[]> {
  const { totalRows, generateBatch, onProgress } = config;

  // Use provided or optimal chunk configuration
  const { chunkSize, chunkDelay } =
    config.chunkSize && config.chunkDelay
      ? { chunkSize: config.chunkSize, chunkDelay: config.chunkDelay }
      : getOptimalChunkConfig(totalRows);

  const allRows: T[] = [];

  for (let i = 0; i < totalRows; i += chunkSize) {
    // Yield to browser between chunks
    await new Promise((resolve) => setTimeout(resolve, chunkDelay));

    // Generate this chunk
    const count = Math.min(chunkSize, totalRows - i);
    const chunk = generateBatch(count, i);
    allRows.push(...chunk);

    // Report progress
    if (onProgress) {
      const progress = Math.round(((i + count) / totalRows) * 100);
      onProgress(progress);
    }
  }

  return allRows;
}

/**
 * Determines if data should be generated asynchronously based on row count
 *
 * @param rowCount - Number of rows
 * @returns true if async generation is recommended
 */
export function shouldUseAsyncGeneration(rowCount: number): boolean {
  return rowCount >= 500;
}
