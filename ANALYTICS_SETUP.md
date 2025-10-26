# 📊 Analytics Dashboard Setup Guide

## Overview

The Stackd analytics dashboard provides data-driven insights into your workflow, including:
- **Tasks completed per week**: Track productivity trends over time
- **Bottlenecks by column**: Identify where cards get stuck
- **Average time in progress**: Understand how long cards spend in each column
- **Overall statistics**: Completion rates, active cards, and more

## 🚀 Setup Instructions

### 1. Database Schema Updates

Run the analytics schema SQL in your Supabase SQL Editor:

```sql
-- Located in: analytics-schema.sql
```

This script will:
- ✅ Add `status` and `completed_at` fields to the `cards` table
- ✅ Create `card_history` table to track card movements
- ✅ Set up Row Level Security policies
- ✅ Create indexes for optimized analytics queries
- ✅ Add helper functions for time calculations

### 2. Verify Database Changes

After running the SQL, verify the changes in Supabase:

1. Go to **Table Editor**
2. Check the `cards` table has new columns:
   - `status` (varchar) - Default: 'in_progress'
   - `completed_at` (timestamp with time zone)
3. Verify the `card_history` table exists with columns:
   - `id`, `card_id`, `from_column_id`, `to_column_id`, `moved_by`, `moved_at`

### 3. Dependencies

The analytics feature uses **Recharts** for visualizations. This has already been installed via:

```bash
npm install recharts
```

### 4. How It Works

#### Card Status Tracking

Cards can have the following statuses:
- `backlog` - Not started yet
- `todo` - Ready to work on
- `in_progress` - Currently being worked on (default)
- `review` - Under review
- `completed` - Finished
- `archived` - No longer active

#### Movement Tracking

When a card moves between columns:
1. The `PUT /api/cards` endpoint detects the `column_id` change
2. A new entry is created in `card_history` table with:
   - Previous column ID
   - New column ID
   - User who moved it
   - Timestamp

#### Completion Tracking

When a card's status changes to `completed`:
- The `completed_at` timestamp is automatically set
- This triggers inclusion in "Tasks completed per week" charts

## 📈 Using the Analytics Dashboard

### Accessing Analytics

1. Select any board from the board selector
2. Click the **📊 Analytics** button next to the board selector
3. The dashboard opens in a modal overlay

### Understanding the Metrics

#### Overall Stats (Top Cards)
- **Total Cards**: All cards on the board
- **Completed**: Cards with `status = 'completed'`
- **In Progress**: Cards currently being worked on
- **Avg Completion Time**: Average days from creation to completion

#### Tasks Completed Per Week (Bar Chart)
- Shows the last 12 weeks of data
- Counts cards marked as completed each week
- Helps identify productivity trends and sprint velocities

#### Bottlenecks by Column (Bar Chart + Alerts)
- **Number of Cards**: How many cards are in each column
- **Avg Age (days)**: Average time cards have been in that column
- **Bottleneck Detection**: Automatically flags columns with:
  - More than 5 cards AND
  - Average age > 7 days

Use this to identify workflow blockers and areas needing attention.

#### Average Time per Column (Line Chart + Table)
- Calculates average hours/days cards spend in each column
- Based on card movement history
- Helps optimize workflow and estimate timelines
- **Note**: Requires cards to have moved between columns to generate data

## 🔧 Customization

### Adjusting Bottleneck Thresholds

Edit `app/api/analytics/[boardId]/route.js`:

```javascript
// Current: >5 cards and >7 days average age
isBottleneck: cards.length > 5 && avgAge > 7

// Example: More sensitive detection
isBottleneck: cards.length > 3 && avgAge > 5
```

### Adding Custom Card Statuses

Modify `analytics-schema.sql` and update the status field comment:

```sql
COMMENT ON COLUMN cards.status IS 'Card status: your_custom_status, ...';
```

Then update your card components to use the new statuses.

### Customizing Chart Colors

Edit `components/AnalyticsDashboard.jsx`:

```javascript
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
```

## 🎯 Best Practices

### For Accurate Analytics

1. **Use Consistent Statuses**: Train your team to use the same status values
2. **Move Cards Between Columns**: Time tracking requires card movements
3. **Mark Cards Complete**: Set status to 'completed' when done
4. **Regular Review**: Check analytics weekly to identify patterns

### Performance Considerations

- Analytics queries are optimized with database indexes
- Data is calculated on-demand (not cached)
- For boards with 1000+ cards, queries may take 2-3 seconds
- Consider archiving old completed cards if performance becomes an issue

## 🐛 Troubleshooting

### "No time tracking data available"

**Cause**: No cards have been moved between columns yet.

**Solution**: 
- Move some cards between columns
- Wait for at least one complete workflow cycle
- The history table needs movements to calculate time metrics

### "No completed tasks yet"

**Cause**: No cards have been marked as completed.

**Solution**:
- Mark some cards with `status: 'completed'`
- Optionally update existing cards in the database:
  ```sql
  UPDATE cards 
  SET status = 'completed', completed_at = NOW() 
  WHERE id = 'your-card-id';
  ```

### Analytics button not appearing

**Cause**: No active board selected.

**Solution**: Select a board from the board selector first.

### Permission errors

**Cause**: RLS policies not properly set up.

**Solution**: Ensure you ran the complete `analytics-schema.sql` script including the RLS policies section.

## 📊 Future Enhancements

Possible additions to the analytics dashboard:

- **Cycle Time Analysis**: Time from start to completion
- **Throughput Metrics**: Cards completed per day/week/month
- **User Performance**: Individual contributor statistics
- **Custom Date Ranges**: Filter analytics by date
- **Export Data**: Download analytics as CSV/PDF
- **Predictive Analytics**: Estimate completion dates based on history
- **Burndown Charts**: Track progress toward goals
- **Velocity Tracking**: Sprint planning metrics

## 📝 API Reference

### GET `/api/analytics/[boardId]`

Fetches all analytics data for a board.

**Response:**
```json
{
  "boardId": "uuid",
  "completedPerWeek": [...],
  "cardsByColumn": [...],
  "avgTimePerColumn": [...],
  "overallStats": {
    "totalCards": 42,
    "completedCount": 15,
    "inProgressCount": 20,
    "completionRate": 36,
    "avgCompletionDays": 5.2
  },
  "generatedAt": "2025-10-26T12:00:00Z"
}
```

**Authentication**: Requires Clerk authentication and board access.

---

Need help? Check the main [TROUBLESHOOTING.md](TROUBLESHOOTING.md) or open an issue on GitHub.
