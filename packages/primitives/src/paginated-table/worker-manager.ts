/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {
  WorkerRequest,
  WorkerResponse,
  WorkerMessageType,
} from './data-worker.js';
import type { TableRow } from './types.js';

/**
 * Callback for worker operation completion
 */
type WorkerCallback = (result: TableRow[], error?: string) => void;

/**
 * WorkerManager handles Web Worker lifecycle and communication
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private pendingRequests: Map<string, WorkerCallback> = new Map();
  private requestIdCounter = 0;

  /**
   * Initialize the worker
   * @param {string | URL} workerUrl - URL to the worker script
   */
  initialize(workerUrl: string | URL): void {
    if (this.worker) {
      return;
    }

    try {
      this.worker = new Worker(workerUrl, { type: 'module' });
      this.worker.addEventListener('message', this.handleMessage.bind(this));
      this.worker.addEventListener('error', this.handleError.bind(this));
    } catch (error) {
      console.error('Failed to initialize worker:', error);
    }
  }

  /**
   * Handle worker message
   * @param {MessageEvent<WorkerResponse>} event - Message event
   */
  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const { id, result, error } = event.data;
    const callback = this.pendingRequests.get(id);

    if (callback) {
      callback(result, error);
      this.pendingRequests.delete(id);
    }
  }

  /**
   * Handle worker error
   * @param {ErrorEvent} event - Error event
   */
  private handleError(event: ErrorEvent): void {
    console.error('Worker error:', event.message);

    // Reject all pending requests
    this.pendingRequests.forEach((callback) => {
      callback([], `Worker error: ${event.message}`);
    });
    this.pendingRequests.clear();
  }

  /**
   * Send a request to the worker
   * @param {WorkerMessageType} type - Message type
   * @param {TableRow[]} data - Data to process
   * @param {any} config - Operation configuration
   * @returns {Promise<TableRow[]>} Processed data
   */
  async request(
    type: WorkerMessageType,
    data: TableRow[],
    config: any
  ): Promise<TableRow[]> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestIdCounter}`;

      /**
       * Callback to handle worker response
       * @param {TableRow[]} result - Processed data
       * @param {string} [error] - Error message if any
       */
      const callback: WorkerCallback = (result, error) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
      };

      this.pendingRequests.set(id, callback);

      const request: WorkerRequest = {
        type,
        id,
        data,
        config,
      };

      this.worker!.postMessage(request);
    });
  }

  /**
   * Sort data using the worker
   * @param {TableRow[]} data - Data to sort
   * @param {string} columnId - Column to sort by
   * @param {'asc' | 'desc' | 'none'} direction - Sort direction
   * @returns {Promise<TableRow[]>} Sorted data
   */
  async sort(
    data: TableRow[],
    columnId: string,
    direction: 'asc' | 'desc' | 'none'
  ): Promise<TableRow[]> {
    return this.request('sort', data, { columnId, direction });
  }

  /**
   * Search data using the worker
   * @param {TableRow[]} data - Data to search
   * @param {string} query - Search query
   * @param {string[]} columns - Columns to search in
   * @returns {Promise<TableRow[]>} Filtered data
   */
  async search(
    data: TableRow[],
    query: string,
    columns: string[]
  ): Promise<TableRow[]> {
    return this.request('search', data, { query, columns });
  }

  /**
   * Check if worker is initialized
   * @returns {boolean} True if worker is initialized
   */
  isInitialized(): boolean {
    return this.worker !== null;
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending requests
    this.pendingRequests.forEach((callback) => {
      callback([], 'Worker terminated');
    });
    this.pendingRequests.clear();
  }
}
