// Sync Manager - Handles offline operations and syncing with Supabase
import { db, isBrowser } from './db';
import { supabase } from './supabase';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncCallbacks = new Set();
    
    if (isBrowser) {
      // Listen for online/offline events
      window.addEventListener('online', () => this.onOnline());
      window.addEventListener('offline', () => this.onOffline());
      
      // Start sync if online
      if (navigator.onLine) {
        this.processSyncQueue();
      }
    }
  }

  // Subscribe to sync status changes
  subscribe(callback) {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  // Notify all subscribers
  notify(status) {
    this.syncCallbacks.forEach(callback => callback(status));
  }

  // Handle coming back online
  async onOnline() {
    console.log('🟢 Back online - starting sync...');
    this.notify({ online: true, syncing: true });
    await this.processSyncQueue();
  }

  // Handle going offline
  onOffline() {
    console.log('🔴 Offline mode activated');
    this.notify({ online: false, syncing: false });
  }

  // Check if online
  isOnline() {
    return isBrowser ? navigator.onLine : true;
  }

  // Get pending sync count
  async getPendingCount() {
    if (!isBrowser) return 0;
    return await db.syncQueue.count();
  }

  // Queue an operation for syncing
  async queueOperation(action, table, recordId, data) {
    if (!isBrowser) return;
    
    try {
      await db.syncQueue.add({
        action, // 'create', 'update', 'delete'
        table,
        record_id: recordId,
        data,
        timestamp: Date.now(),
        retries: 0,
        error: null
      });

      console.log(`Queued ${action} operation for ${table}:`, recordId);

      // Try to sync immediately if online
      if (this.isOnline()) {
        await this.processSyncQueue();
      }

      this.notify({ pendingCount: await this.getPendingCount() });
    } catch (error) {
      console.error('Failed to queue operation:', error);
    }
  }

  // Process all pending operations in the queue
  async processSyncQueue() {
    if (!isBrowser || this.isSyncing || !this.isOnline()) {
      return;
    }

    this.isSyncing = true;
    this.notify({ syncing: true });

    try {
      const queue = await db.syncQueue.orderBy('timestamp').toArray();
      console.log(`Processing ${queue.length} queued operations...`);

      for (const item of queue) {
        try {
          await this.syncItem(item);
          await db.syncQueue.delete(item.id);
          console.log(`✓ Synced ${item.action} ${item.table}:`, item.record_id);
        } catch (error) {
          console.error(`Failed to sync ${item.action} ${item.table}:`, error);
          
          // Increment retry count
          const retries = item.retries + 1;
          
          // If too many retries, mark as error
          if (retries >= 5) {
            await db.syncQueue.update(item.id, {
              retries,
              error: error.message
            });
            console.error(`⚠️ Max retries reached for ${item.table}:${item.record_id}`);
          } else {
            await db.syncQueue.update(item.id, { retries });
          }
        }
      }

      console.log('✓ Sync completed');
    } catch (error) {
      console.error('Sync queue processing error:', error);
    } finally {
      this.isSyncing = false;
      this.notify({ 
        syncing: false, 
        pendingCount: await this.getPendingCount() 
      });
    }
  }

  // Sync a single item with Supabase
  async syncItem(item) {
    const { action, table, data } = item;

    switch (action) {
      case 'create':
        const { error: createError } = await supabase
          .from(table)
          .insert(data);
        if (createError) throw createError;
        
        // Mark as synced in local DB
        await db[table].update(data.id, { synced: true });
        break;

      case 'update':
        const { error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', data.id);
        if (updateError) throw updateError;
        
        // Mark as synced in local DB
        await db[table].update(data.id, { synced: true });
        break;

      case 'delete':
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id);
        if (deleteError) throw deleteError;
        
        // Already deleted from local DB
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  // Pull data from Supabase and store locally
  async pullFromServer(boardId) {
    if (!isBrowser || !this.isOnline()) {
      console.log('Cannot pull: offline or not in browser');
      return;
    }

    try {
      console.log(`Pulling data for board ${boardId}...`);

      // Pull board
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;
      if (board) {
        await db.boards.put({ ...board, synced: true });
      }

      // Pull columns
      const { data: columns, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId);

      if (columnsError) throw columnsError;
      if (columns && columns.length > 0) {
        await db.columns.bulkPut(columns.map(col => ({ ...col, synced: true })));
      }

      // Pull cards
      if (columns && columns.length > 0) {
        const columnIds = columns.map(c => c.id);
        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', columnIds);

        if (cardsError) throw cardsError;
        if (cards && cards.length > 0) {
          await db.cards.bulkPut(cards.map(card => ({ ...card, synced: true })));
        }
      }

      // Pull board members
      const { data: members, error: membersError } = await supabase
        .from('board_members')
        .select('*')
        .eq('board_id', boardId);

      if (membersError) throw membersError;
      if (members && members.length > 0) {
        await db.board_members.bulkPut(members.map(m => ({ ...m, synced: true })));
      }

      console.log('✓ Data pulled successfully');
      
      // Store last sync time
      await db.syncMeta.put({ 
        key: `last_sync_${boardId}`, 
        value: Date.now() 
      });
    } catch (error) {
      console.error('Failed to pull from server:', error);
      throw error;
    }
  }

  // Clear all local data for a board
  async clearBoardData(boardId) {
    if (!isBrowser) return;
    
    try {
      // Get all columns for this board
      const columns = await db.columns.where('board_id').equals(boardId).toArray();
      const columnIds = columns.map(c => c.id);

      // Delete cards in these columns
      if (columnIds.length > 0) {
        await db.cards.where('column_id').anyOf(columnIds).delete();
      }

      // Delete columns
      await db.columns.where('board_id').equals(boardId).delete();

      // Delete board members
      await db.board_members.where('board_id').equals(boardId).delete();

      // Delete board
      await db.boards.delete(boardId);

      console.log(`Cleared local data for board ${boardId}`);
    } catch (error) {
      console.error('Failed to clear board data:', error);
    }
  }

  // Clear all offline data
  async clearAllData() {
    if (!isBrowser) return;
    
    try {
      await db.boards.clear();
      await db.columns.clear();
      await db.cards.clear();
      await db.board_members.clear();
      await db.syncQueue.clear();
      await db.syncMeta.clear();
      console.log('✓ All offline data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
