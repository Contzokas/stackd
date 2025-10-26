// IndexedDB database configuration using Dexie
import Dexie from 'dexie';

export const db = new Dexie('stackd_offline');

// Define database schema
db.version(1).stores({
  // Boards table
  boards: 'id, name, owner_id, created_at, updated_at, synced',
  
  // Columns table
  columns: 'id, board_id, title, position, created_at, updated_at, synced',
  
  // Cards table
  cards: 'id, column_id, title, description, tag, due_date, status, created_at, updated_at, synced, image_url',
  
  // Board members table
  board_members: 'id, board_id, user_id, role, created_at, synced',
  
  // Sync queue for operations that need to be sent to server
  syncQueue: '++id, action, table, record_id, data, timestamp, retries, error',
  
  // Metadata for tracking sync status
  syncMeta: 'key, value'
});

// Add hooks for automatic timestamp updates
db.boards.hook('creating', function(primKey, obj) {
  if (!obj.created_at) obj.created_at = new Date().toISOString();
  if (!obj.updated_at) obj.updated_at = new Date().toISOString();
  obj.synced = false;
});

db.boards.hook('updating', function(modifications, primKey, obj) {
  modifications.updated_at = new Date().toISOString();
  modifications.synced = false;
  return modifications;
});

db.columns.hook('creating', function(primKey, obj) {
  if (!obj.created_at) obj.created_at = new Date().toISOString();
  if (!obj.updated_at) obj.updated_at = new Date().toISOString();
  obj.synced = false;
});

db.columns.hook('updating', function(modifications, primKey, obj) {
  modifications.updated_at = new Date().toISOString();
  modifications.synced = false;
  return modifications;
});

db.cards.hook('creating', function(primKey, obj) {
  if (!obj.created_at) obj.created_at = new Date().toISOString();
  if (!obj.updated_at) obj.updated_at = new Date().toISOString();
  obj.synced = false;
});

db.cards.hook('updating', function(modifications, primKey, obj) {
  modifications.updated_at = new Date().toISOString();
  modifications.synced = false;
  return modifications;
});

// Helper function to check if running in browser
export const isBrowser = typeof window !== 'undefined';

// Initialize database
if (isBrowser) {
  db.open().catch((err) => {
    console.error('Failed to open IndexedDB:', err);
  });
}

export default db;
