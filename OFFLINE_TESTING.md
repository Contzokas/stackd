# 🧪 Testing Offline Functionality

## Quick Test Guide

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Open in Browser

Navigate to `http://localhost:3000`

### 3. Load a Board

1. Sign in with Clerk
2. Open or create a board
3. **Important**: The board must load at least once while online to cache data

### 4. Simulate Offline Mode

**Method 1: Browser DevTools (Recommended)**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Change "No throttling" to "Offline"
4. ✅ You're now offline!

**Method 2: Disable WiFi/Ethernet**
1. Turn off your WiFi/network
2. Browser will detect offline status

### 5. Test Offline Operations

Try these while offline:

**✅ Create a Card**
```
1. Click "+ Add card" in any column
2. Enter a title
3. Card appears immediately (saved to IndexedDB)
4. Notice: 🔴 Offline indicator shows in bottom-right
```

**✅ Edit a Card**
```
1. Click on any card
2. Change title, description, tag, or due date
3. Close modal
4. Changes appear immediately
5. Notice: Pending sync count increases
```

**✅ Move a Card**
```
1. Drag a card to another column
2. Drop it
3. Card moves immediately
```

**✅ Delete a Card**
```
1. Click on a card
2. Click delete button
3. Card disappears immediately
```

### 6. Go Back Online

**Method 1: DevTools**
1. In Network tab, change "Offline" back to "No throttling"
2. Watch for green "Back Online" notification
3. See sync indicator show spinning icon

**Method 2: Enable Network**
1. Turn WiFi/network back on
2. Green notification appears

### 7. Verify Sync

**Check Console**
```javascript
// You should see logs like:
🟢 Back online - starting sync...
Processing 3 queued operations...
✓ Synced create cards: temp_1635789012345_abc
✓ Synced update cards: abc-123-def-456
✓ Synced delete columns: xyz-789
✓ Sync completed
```

**Check Database**
1. Go to Supabase Dashboard
2. Open Tables → cards
3. Verify your offline changes are there

**Check IndexedDB**
1. DevTools → Application tab
2. IndexedDB → stackd_offline
3. Check tables:
   - `cards` - Should have your cards
   - `columns` - Should have columns
   - `syncQueue` - Should be empty after sync

### 8. Test PWA Installation (Optional)

**Chrome/Edge Desktop:**
1. Look for install icon in address bar (⚙️ or +)
2. Click "Install Stackd"
3. App opens in standalone window
4. Test offline in standalone mode

**Mobile:**
1. Open in mobile browser
2. Menu → Add to Home Screen
3. Open from home screen
4. Test offline functionality

## 🔍 What to Look For

### Visual Indicators

**🔴 Offline Mode**
- Yellow/red badge in bottom-right
- Shows "Offline Mode"
- Lists number of pending changes

**🔄 Syncing**
- Blue spinner animation
- Shows "Syncing..."

**🟢 Synced**
- Brief green notification
- Shows "Back Online"
- Syncing your changes...

### Expected Behavior

| Action | Offline | Online |
|--------|---------|--------|
| Create Card | ✅ Instant, saved locally | ✅ Instant, synced to DB |
| Edit Card | ✅ Instant, saved locally | ✅ Instant, synced to DB |
| Delete Card | ✅ Instant, removed locally | ✅ Instant, removed from DB |
| Drag Card | ✅ Works, saved locally | ✅ Works, synced to DB |
| Load Board | ⚠️ Uses cached data | ✅ Fetches latest data |
| Add Image | ❌ Not supported yet | ✅ Works normally |

## 🐛 Common Issues

### Issue: "Board is empty offline"

**Solution**: Load the board while online first. Data is cached on first load.

### Issue: "Changes not syncing"

**Check:**
1. Are you actually back online? (check WiFi icon)
2. Check browser console for errors
3. Check Supabase is running
4. Try clicking "Sync Now" button

### Issue: "Sync taking too long"

**Normal**: First sync after many changes takes time
**Check**: Look at console logs for specific errors

### Issue: "Duplicate cards appearing"

**Cause**: Sync conflict (rare)
**Solution**: Refresh the page, newer version wins

## 📊 Monitor Sync Queue

### Check Pending Operations

**In DevTools Console:**
```javascript
import { syncManager } from '@/lib/syncManager'
const count = await syncManager.getPendingCount()
console.log(`Pending operations: ${count}`)
```

### View Sync Queue

**In DevTools:**
1. Application tab
2. IndexedDB → stackd_offline
3. Click "syncQueue" table
4. See all pending operations

### Manually Trigger Sync

**In DevTools Console:**
```javascript
import { syncManager } from '@/lib/syncManager'
await syncManager.processSyncQueue()
```

### Clear All Offline Data

**In DevTools Console:**
```javascript
import { syncManager } from '@/lib/syncManager'
await syncManager.clearAllData()
location.reload()
```

## ✅ Success Checklist

- [ ] Board loads with data
- [ ] Can create cards offline
- [ ] Can edit cards offline
- [ ] Can delete cards offline
- [ ] Can drag cards offline
- [ ] Offline indicator appears
- [ ] Pending count shows correctly
- [ ] Sync triggers when back online
- [ ] Green "Back Online" notification appears
- [ ] Console shows sync logs
- [ ] Supabase reflects changes
- [ ] syncQueue becomes empty

## 🎯 Advanced Testing

### Test Conflict Resolution

1. Open board on Device A (online)
2. Go offline on Device A
3. Make changes on Device A
4. Make different changes on Device B (online)
5. Go back online on Device A
6. Watch sync behavior (last-write-wins currently)

### Test Long Offline Period

1. Go offline
2. Make many changes (20+ operations)
3. Close browser
4. Reopen browser (still offline)
5. Verify changes persisted
6. Go back online
7. Watch bulk sync

### Test Network Interruption

1. Start creating a card
2. Go offline mid-operation
3. Complete the operation
4. Verify saved locally
5. Go back online
6. Verify syncs correctly

## 🚀 Next Steps

Once offline works:
1. Deploy to production
2. Test on real mobile devices
3. Share with users
4. Monitor error logs
5. Gather feedback

## 📝 Notes

- **IndexedDB persists** across browser sessions
- **Service Worker** caches app files
- **Sync is automatic** when online
- **Manual sync** available via button
- **Retry logic** handles temporary failures

---

**Happy Testing! 🎉**
