/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * SelectionManager - Manages cross-page selection state
 *
 * Maintains a Set of selected row IDs that persists across pagination,
 * filtering, and sorting operations.
 */
export class SelectionManager {
  private selectedIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  /**
   * Select a row by ID
   */
  select(id: string): void {
    this.selectedIds.add(id);
    this.notifyListeners();
  }

  /**
   * Deselect a row by ID
   */
  deselect(id: string): void {
    this.selectedIds.delete(id);
    this.notifyListeners();
  }

  /**
   * Toggle selection for a row
   */
  toggle(id: string): void {
    if (this.selectedIds.has(id)) {
      this.deselect(id);
    } else {
      this.select(id);
    }
  }

  /**
   * Select multiple rows by IDs
   */
  selectMany(ids: string[]): void {
    ids.forEach((id) => this.selectedIds.add(id));
    this.notifyListeners();
  }

  /**
   * Deselect multiple rows by IDs
   */
  deselectMany(ids: string[]): void {
    ids.forEach((id) => this.selectedIds.delete(id));
    this.notifyListeners();
  }

  /**
   * Select all rows from a given array
   */
  selectAll(rows: Array<{ id: string }>): void {
    rows.forEach((row) => this.selectedIds.add(row.id));
    this.notifyListeners();
  }

  /**
   * Deselect all rows from a given array
   */
  deselectAll(rows: Array<{ id: string }>): void {
    rows.forEach((row) => this.selectedIds.delete(row.id));
    this.notifyListeners();
  }

  /**
   * Clear all selections
   */
  clear(): void {
    this.selectedIds.clear();
    this.notifyListeners();
  }

  /**
   * Check if a row is selected
   */
  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  /**
   * Check if all rows in an array are selected
   */
  areAllSelected(rows: Array<{ id: string }>): boolean {
    if (rows.length === 0) return false;
    return rows.every((row) => this.selectedIds.has(row.id));
  }

  /**
   * Check if some (but not all) rows in an array are selected
   */
  areSomeSelected(rows: Array<{ id: string }>): boolean {
    if (rows.length === 0) return false;
    const selectedCount = rows.filter((row) =>
      this.selectedIds.has(row.id)
    ).length;
    return selectedCount > 0 && selectedCount < rows.length;
  }

  /**
   * Get all selected IDs
   */
  getSelectedIds(): string[] {
    return Array.from(this.selectedIds);
  }

  /**
   * Get selected rows from a dataset
   */
  getSelectedRows<T extends { id: string }>(rows: T[]): T[] {
    return rows.filter((row) => this.selectedIds.has(row.id));
  }

  /**
   * Get count of selected items
   */
  getSelectedCount(): number {
    return this.selectedIds.size;
  }

  /**
   * Subscribe to selection changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of selection changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Export selection state for persistence
   */
  export(): string[] {
    return this.getSelectedIds();
  }

  /**
   * Import selection state from persistence
   */
  import(ids: string[]): void {
    this.selectedIds = new Set(ids);
    this.notifyListeners();
  }
}
