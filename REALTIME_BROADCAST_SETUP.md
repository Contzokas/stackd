# Real-time Broadcast Synchronization

## How It Works

This project now uses **Supabase Broadcast Channels** for real-time synchronization across shared boards. This approach works without requiring users to authenticate with Supabase directly (since we use Clerk for auth).

## Architecture

### Broadcasting (Server-side)
When a card or column is created, updated, or deleted via the API routes:

1. **API Route Updates Database**: The API route saves changes to the Supabase PostgreSQL database
2. **Broadcast Event Sent**: After the database update, the API route broadcasts an event to a channel named `board-changes-{boardId}`
3. **Event Contains Payload**: The broadcast includes the updated/deleted data

### Listening (Client-side)
In `CloudBoardManager.jsx`:

1. **Subscribe to Channel**: When a board is opened, the component subscribes to `board-changes-{boardId}`
2. **Listen for Events**: The component listens for:
   - `card-update` - Card created or updated
   - `card-delete` - Card deleted
   - `column-update` - Column created or updated
   - `column-delete` - Column deleted
3. **Refresh UI**: When an event is received, the component fetches fresh board data and updates the UI

## Broadcast Events

### Card Events
- **Event**: `card-update`
- **Payload**: `{ card: { ...cardData, createdByUsername, createdByFullName, createdByImageUrl } }`
- **Triggered by**: POST /api/cards, PUT /api/cards

- **Event**: `card-delete`
- **Payload**: `{ cardId: string }`
- **Triggered by**: DELETE /api/cards

### Column Events
- **Event**: `column-update`
- **Payload**: `{ column: { ...columnData } }`
- **Triggered by**: POST /api/columns, PUT /api/columns

- **Event**: `column-delete`
- **Payload**: `{ columnId: string }`
- **Triggered by**: DELETE /api/columns

## Configuration

### Supabase Client (`lib/supabase.js`)
```javascript
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
```

### Channel Setup (`CloudBoardManager.jsx`)
```javascript
const channel = supabase
  .channel(`board-changes-${activeBoard}`, {
    config: {
      broadcast: { ack: false, self: false },
    }
  })
  .on('broadcast', { event: 'card-update' }, handleCardUpdate)
  .on('broadcast', { event: 'card-delete' }, handleCardDelete)
  .on('broadcast', { event: 'column-update' }, handleColumnUpdate)
  .on('broadcast', { event: 'column-delete' }, handleColumnDelete)
  .subscribe();
```

### Broadcasting from API (`app/api/cards/route.js`, `app/api/columns/route.js`)
```javascript
const channel = supabase.channel(`board-changes-${boardId}`);
await channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.send({
      type: 'broadcast',
      event: 'card-update',
      payload: { card: updatedCard }
    });
    await supabase.removeChannel(channel);
  }
});
```

## Why Broadcast Instead of postgres_changes?

1. **No Authentication Required**: Broadcast channels don't require Supabase authentication, perfect for Clerk-based apps
2. **No RLS Conflicts**: Bypasses Row Level Security issues
3. **Simpler Setup**: No need to enable database replication or configure publication tables
4. **Controlled Events**: We explicitly send only what we want, with exactly the payload we need

## Testing

To test real-time sync:

1. Open the same board in two different browser windows (or incognito mode)
2. Make changes in one window (create/edit/delete cards or columns)
3. The other window should update automatically within 1 second
4. Check the browser console for broadcast event logs:
   - `🔄 Card updated:` - Card was created or edited
   - `🗑️ Card deleted:` - Card was removed
   - `🔄 Column updated:` - Column was created or edited
   - `🗑️ Column deleted:` - Column was removed

## Troubleshooting

### Changes not syncing?

1. **Check browser console** for errors or subscription status
2. **Verify Supabase Realtime is enabled** in your Supabase project dashboard
3. **Check environment variables**: Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
4. **Look for broadcast logs**: API routes should log "Error broadcasting..." if sending fails

### Slow updates?

- The sync includes a 1-second debounce to prevent too many rapid refreshes
- Network latency can affect broadcast delivery speed
- Check your Supabase project's region - closer is faster

## Future Improvements

- **Optimistic Updates**: Update UI immediately before server confirms
- **Granular Updates**: Update only changed cards instead of refetching entire board
- **Presence**: Show which users are currently viewing the board
- **Typing Indicators**: Show when someone is editing a card
