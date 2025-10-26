// Hook for offline-first column operations
'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isBrowser } from '@/lib/db';
import { syncManager } from '@/lib/syncManager';

export function useOfflineColumns(boardId) {
  // Get columns from IndexedDB (reactive, auto-updates on changes)
  const columns = useLiveQuery(
    () => isBrowser && boardId 
      ? db.columns.where('board_id').equals(boardId).sortBy('position')
      : [],
    [boardId]
  );

  // Add new column
  const addColumn = async (columnData) => {
    if (!isBrowser) return null;
    
    try {
      const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const column = {
        id,
        board_id: boardId,
        title: columnData.title || 'New Column',
        position: columnData.position || { x: 0, y: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      };

      // Add locally first
      await db.columns.add(column);

      // Queue for sync
      await syncManager.queueOperation('create', 'columns', id, column);

      return column;
    } catch (error) {
      console.error('Failed to add column:', error);
      throw error;
    }
  };

  // Update column
  const updateColumn = async (columnId, updates) => {
    if (!isBrowser) return;
    
    try {
      // Update locally
      await db.columns.update(columnId, updates);

      // Get updated column
      const updatedColumn = await db.columns.get(columnId);

      // Queue for sync
      await syncManager.queueOperation('update', 'columns', columnId, updatedColumn);

      return updatedColumn;
    } catch (error) {
      console.error('Failed to update column:', error);
      throw error;
    }
  };

  // Delete column
  const deleteColumn = async (columnId) => {
    if (!isBrowser) return;
    
    try {
      // Delete all cards in this column first
      await db.cards.where('column_id').equals(columnId).delete();

      // Delete column locally
      await db.columns.delete(columnId);

      // Queue for sync
      await syncManager.queueOperation('delete', 'columns', columnId, { id: columnId });
    } catch (error) {
      console.error('Failed to delete column:', error);
      throw error;
    }
  };

  return {
    columns: columns || [],
    addColumn,
    updateColumn,
    deleteColumn
  };
}
