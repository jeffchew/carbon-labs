/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { TableRow } from './types.js';

const DB_NAME = 'carbon-labs-datatable';
const DB_VERSION = 1;
const STORE_NAME = 'datasets';

export interface CacheEntry {
  key: string;
  data: TableRow[];
  timestamp: number;
  version: string;
}

/**
 * IndexedDB cache for large datasets
 * Stores datasets in browser's IndexedDB for fast retrieval
 */
export class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB connection
   */
  private async init(): Promise<void> {
    if (this.db) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store data in IndexedDB
   */
  async set(key: string, data: TableRow[], version = '1.0.0'): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      version,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store data'));
    });
  }

  /**
   * Retrieve data from IndexedDB
   */
  async get(key: string): Promise<TableRow[] | null> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        resolve(entry ? entry.data : null);
      };

      request.onerror = () => reject(new Error('Failed to retrieve data'));
    });
  }

  /**
   * Check if data exists in cache
   */
  async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete data'));
    });
  }

  /**
   * Clear all cached data
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear cache'));
    });
  }

  /**
   * Get cache size (number of entries)
   */
  async size(): Promise<number> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to get cache size'));
    });
  }

  /**
   * Get all cache keys
   */
  async keys(): Promise<string[]> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(new Error('Failed to get cache keys'));
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
