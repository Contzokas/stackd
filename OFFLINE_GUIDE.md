# 📴 Stackd Offline-First Guide

## Overview

Stackd now works completely offline! All your changes are saved locally and automatically synced when you're back online. No data loss, instant UI updates, and seamless experience.

## 🚀 Features

### ✅ What Works Offline

- ✨ **Create, Edit, Delete** boards, columns, and cards
- 🏷️ **Add tags** and set due dates
- 🖼️ **Add images** to cards
- 📝 **Update descriptions** and titles
- 🔄 **Drag and drop** cards between columns
- 📊 **View analytics** (from cached data)

### 🔄 Automatic Sync

- Changes are queued locally in IndexedDB
- Sync happens automatically when back online
- Visual indicators show sync status
- Manual sync button available
- Retry logic for failed syncs

### 💾 Data Storage

- **IndexedDB** stores all board data locally
- **Service Worker** caches app resources
- **PWA Support** - install as desktop/mobile app
- **Data persists** across browser sessions

## 📱 How to Use

### Normal Usage

1. **Online**: Everything works as usual + data is cached locally
2. **Goes Offline**: Yellow indicator appears, you can keep working
3. **Back Online**: Green notification + automatic sync
4. **Done**: All changes are saved to Supabase

### Manual Sync

If you want to force sync immediately:
1. Look for the sync indicator (bottom-right)
2. Click "Sync Now" button
3. Wait for sync completion

### Install as App (PWA)

**Desktop (Chrome/Edge):**
1. Click ⚙️ icon in address bar
2. Select "Install Stackd"
3. Use like a native app!

**Mobile (iOS/Android):**
1. Open browser menu
2. Select "Add to Home Screen"
3. Open Stackd from your home screen

## 🛠️ Technical Details

### Architecture

```
┌─────────────────┐
│   React UI      │
├─────────────────┤
│ Offline Hooks   │ ← useOfflineCards, useOfflineColumns
├─────────────────┤
│ Sync Manager    │ ← Queue operations, handle sync
├─────────────────┤
│ IndexedDB       │ ← Local storage (Dexie.js)
├─────────────────┤
│ Service Worker  │ ← Cache app resources
└─────────────────┘
        ↕
┌─────────────────┐
│   Supabase      │ ← Cloud database
└─────────────────┘
```

### Files Created

- **lib/db.js** - IndexedDB schema and setup
- **lib/syncManager.js** - Sync logic and queue management
- **hooks/useOfflineBoard.js** - Board operations
- **hooks/useOfflineColumns.js** - Column operations
- **hooks/useOfflineCards.js** - Card operations
- **components/OfflineIndicator.jsx** - Status display
- **public/manifest.json** - PWA configuration

### How It Works

1. **Write Operations**:
   ```javascript
   // User creates a card
   await addCard({ title: 'New Task' })
   
   // 1. Save to IndexedDB immediately (instant UI)
   // 2. Add to sync queue
   // 3. Try to sync if online
   ```

2. **Sync Queue**:
   ```javascript
   syncQueue: [
     { action: 'create', table: 'cards', data: {...} },
     { action: 'update', table: 'cards', data: {...} },
     { action: 'delete', table: 'columns', data: {...} }
   ]
   ```

3. **Sync Process**:
   ```javascript
   // When online
   for (operation in syncQueue) {
     await supabase.from(table)[action](data)
     removeFromQueue(operation)
   }
   ```

### Temp IDs

Offline-created items get temporary IDs:
```javascript
id: "temp_1635789012345_abc123"
```

These are replaced with real UUIDs from Supabase after sync.

## 🔍 Monitoring

### Sync Status Indicators

**🔴 Offline Mode**
- Red dot = No internet connection
- Changes saved locally
- Will sync when online

**🔄 Syncing**
- Blue spinner = Currently syncing
- Uploading queued changes

**⏳ Pending Sync**
- Gray icon = Changes waiting to sync
- Number shows pending operations

**🟢 Synced**
- Green indicator (temporary)
- All changes uploaded

### Developer Tools

Check IndexedDB in browser:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Click "IndexedDB" → "stackd_offline"
4. Inspect tables: boards, columns, cards, syncQueue

### Console Logs

```javascript
// Sync operations
'🟢 Back online - starting sync...'
'Queued create operation for cards: temp_123'
'✓ Synced create cards: temp_123'
'✓ Sync completed'

// Errors
'Failed to sync update cards: Network error'
'⚠️ Max retries reached for cards:abc-123'
```

## 🐛 Troubleshooting

### Sync Not Working

**Problem**: Changes not syncing when back online

**Solutions**:
1. Check sync indicator (bottom-right)
2. Click "Sync Now" button
3. Check browser console for errors
4. Verify internet connection
5. Check Supabase connection

### Data Not Loading

**Problem**: Board appears empty offline

**Solutions**:
1. Must load board while online at least once
2. Data is cached automatically
3. Force refresh: Close and reopen board
4. Clear cache and reload online

### Sync Conflicts

**Problem**: Changes made on multiple devices

**Current Behavior**: Last-write-wins (simple)
**Future**: Merge conflicts intelligently

**Workaround**: Sync one device before using another

### Performance Issues

**Problem**: App feels slow offline

**Solutions**:
1. Clear old data: Settings → Clear Cache
2. Reduce number of cached boards
3. Check IndexedDB size (shouldn't exceed 50MB)

### Clear All Offline Data

```javascript
// In browser console
import { syncManager } from '@/lib/syncManager'
await syncManager.clearAllData()
location.reload()
```

## 📊 Limitations

### Current Limitations

- ❌ **Real-time collaboration offline** - Changes from other users won't appear until sync
- ❌ **File uploads offline** - Images must be added while online
- ❌ **Board sharing offline** - Must be online to invite users
- ❌ **Analytics offline** - Uses cached data only

### Storage Limits

- **IndexedDB**: ~50MB per origin (varies by browser)
- **Service Worker Cache**: ~50-100MB
- **Recommendations**: 
  - Keep 5-10 boards cached max
  - Clear old boards periodically

## 🔐 Security

### Data Privacy

- ✅ Data encrypted in transit (HTTPS)
- ✅ IndexedDB is per-user/per-browser
- ✅ No cross-site data access
- ⚠️ Local data not encrypted (use device encryption)

### Best Practices

1. **Don't use on shared computers** - Data stays in browser
2. **Use private browsing cautiously** - Data cleared when closed
3. **Enable device encryption** - Protects local data
4. **Regular backups** - Sync frequently when online

## 🚀 Future Enhancements

### Planned Features

- 🔄 **Conflict resolution UI** - Merge changes from multiple devices
- 📷 **Offline image support** - Cache images locally
- 🔔 **Background sync** - Sync even when app closed
- 📱 **Push notifications** - Notify when sync completes
- 🗜️ **Compression** - Reduce storage usage
- 🔐 **Encryption** - Encrypt local data

### Feedback

Found a bug? Have a suggestion?
- Open an issue on GitHub
- Contact: [Your Email]

## 💡 Tips & Tricks

1. **Install as PWA** - Better offline experience
2. **Sync before going offline** - Ensure latest data
3. **Check sync status** - Look at indicator regularly
4. **Use manual sync** - Force sync after big changes
5. **Clear old data** - Better performance

## 📚 Additional Resources

- [Dexie.js Documentation](https://dexie.org)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

**🎉 Enjoy working offline with Stackd!**
