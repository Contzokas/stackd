// Hook for offline-first card operations
'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, isBrowser } from '@/lib/db';
import { syncManager } from '@/lib/syncManager';

export function useOfflineCards(columnId) {
  // Get cards from IndexedDB (reactive, auto-updates on changes)
  const cards = useLiveQuery(
    () => isBrowser && columnId
      ? db.cards.where('column_id').equals(columnId).toArray()
      : [],
    [columnId]
  );

  // Add new card
  const addCard = async (cardData) => {
    if (!isBrowser) return null;
    
    try {
      const id = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const card = {
        id,
        column_id: columnId,
        title: cardData.title || 'Untitled',
        description: cardData.description || '',
        tag: cardData.tag || null,
        due_date: cardData.due_date || null,
        status: cardData.status || 'in_progress',
        image_url: cardData.image_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced: false
      };

      // Add locally first (instant UI update)
      await db.cards.add(card);

      // Queue for sync
      await syncManager.queueOperation('create', 'cards', id, card);

      return card;
    } catch (error) {
      console.error('Failed to add card:', error);
      throw error;
    }
  };

  // Update card
  const updateCard = async (cardId, updates) => {
    if (!isBrowser) return;
    
    try {
      // Update locally first (instant UI update)
      await db.cards.update(cardId, updates);

      // Get updated card
      const updatedCard = await db.cards.get(cardId);

      // Queue for sync
      await syncManager.queueOperation('update', 'cards', cardId, updatedCard);

      return updatedCard;
    } catch (error) {
      console.error('Failed to update card:', error);
      throw error;
    }
  };

  // Delete card
  const deleteCard = async (cardId) => {
    if (!isBrowser) return;
    
    try {
      // Delete locally first
      await db.cards.delete(cardId);

      // Queue for sync
      await syncManager.queueOperation('delete', 'cards', cardId, { id: cardId });
    } catch (error) {
      console.error('Failed to delete card:', error);
      throw error;
    }
  };

  // Move card to different column
  const moveCard = async (cardId, newColumnId) => {
    if (!isBrowser) return;
    
    try {
      // Update locally first
      await db.cards.update(cardId, { column_id: newColumnId });

      // Get updated card
      const updatedCard = await db.cards.get(cardId);

      // Queue for sync
      await syncManager.queueOperation('update', 'cards', cardId, updatedCard);

      return updatedCard;
    } catch (error) {
      console.error('Failed to move card:', error);
      throw error;
    }
  };

  return {
    cards: cards || [],
    addCard,
    updateCard,
    deleteCard,
    moveCard
  };
}

// Hook to get all cards for a board
export function useOfflineBoardCards(boardId) {
  const cards = useLiveQuery(
    async () => {
      if (!isBrowser || !boardId) return [];
      
      // Get all columns for this board
      const columns = await db.columns.where('board_id').equals(boardId).toArray();
      const columnIds = columns.map(c => c.id);
      
      if (columnIds.length === 0) return [];
      
      // Get all cards in these columns
      return await db.cards.where('column_id').anyOf(columnIds).toArray();
    },
    [boardId]
  );

  return cards || [];
}
