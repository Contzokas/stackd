// Hook for offline-first board operations
'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isBrowser } from '@/lib/db';
import { syncManager } from '@/lib/syncManager';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

export function useOfflineBoard(boardId) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get board from IndexedDB (reactive)
  const board = useLiveQuery(
    () => isBrowser && boardId ? db.boards.get(boardId) : null,
    [boardId]
  );

  // Initial data load
  useEffect(() => {
    if (!boardId || !isBrowser) return;

    async function loadBoard() {
      try {
        setIsLoading(true);
        
        // Check if we have local data
        const localBoard = await db.boards.get(boardId);
        
        // If online and no local data, or local data is old, fetch from server
        if (syncManager.isOnline()) {
          const lastSync = await db.syncMeta.get(`last_sync_${boardId}`);
          const shouldSync = !localBoard || !lastSync || 
                           (Date.now() - lastSync.value > 60000); // 1 minute cache
          
          if (shouldSync) {
            await syncManager.pullFromServer(boardId);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Failed to load board:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    loadBoard();
  }, [boardId]);

  // Update board
  const updateBoard = async (updates) => {
    if (!isBrowser || !boardId) return;
    
    try {
      // Update locally first (optimistic)
      await db.boards.update(boardId, updates);

      // Queue for sync
      const updatedBoard = await db.boards.get(boardId);
      await syncManager.queueOperation('update', 'boards', boardId, updatedBoard);

      return updatedBoard;
    } catch (err) {
      console.error('Failed to update board:', err);
      throw err;
    }
  };

  // Delete board
  const deleteBoard = async () => {
    if (!isBrowser || !boardId) return;
    
    try {
      // Clear all board data locally
      await syncManager.clearBoardData(boardId);

      // Queue deletion for sync
      await syncManager.queueOperation('delete', 'boards', boardId, { id: boardId });
    } catch (err) {
      console.error('Failed to delete board:', err);
      throw err;
    }
  };

  return {
    board,
    isLoading,
    error,
    updateBoard,
    deleteBoard
  };
}
