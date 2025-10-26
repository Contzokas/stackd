# Due Date Tracking Feature

Track card deadlines and monitor overdue tasks with comprehensive analytics showing how many days tasks took beyond their due dates.

## 📅 Features

### Card Due Dates
- Set due dates with time for any card
- Visual indicators on cards (overdue badges)
- Automatic calculation of days overdue
- Clear display in card modal

### Analytics Tracking
- **Overdue Count**: Number of tasks currently past their due date
- **Average Days Overdue**: How long overdue tasks have been pending
- **Completed Late Count**: Tasks that were finished after their due date
- **Average Days Late**: How many days late tasks were when completed
- **On-Time Rate**: Percentage of tasks completed before or on their due date

## 🚀 Quick Start

### 1. Run Database Migration

Execute the updated analytics schema in your Supabase SQL Editor:

```sql
-- Open: Supabase Dashboard → SQL Editor → New query
-- Paste the contents of: analytics-schema.sql
-- Click: Run
```

This will add:
- `due_date` column to the `cards` table
- Index on `due_date` for fast queries
- Updated `cards_with_board` view with `days_overdue` calculation

### 2. Set a Due Date

1. Click on any card to open the card modal
2. Find the **📅 Due Date** section at the top
3. Click the date/time input field
4. Select a date and time
5. The due date will auto-save after 1 second

### 3. Monitor Overdue Cards

**On the Board:**
- Overdue cards have a red border
- Red "⚠️ Overdue" badge shows days overdue
- Blue "📅 Due" badge shows upcoming due dates

**In Analytics:**
- **Overdue** stat card shows current overdue count
- **On-Time Rate** shows delivery performance
- Average days overdue/late calculations

## 📊 Analytics Metrics Explained

### Overdue Count
Number of cards that:
- Have a due date set
- Are NOT completed
- Due date is in the past

Example: 3 cards are overdue

### Average Days Overdue
Average time past due date for currently overdue cards.

Calculation:
```
Sum of (Today - Due Date) for all overdue cards / Number of overdue cards
```

Example: Card A is 5 days overdue, Card B is 3 days overdue
Average = (5 + 3) / 2 = 4 days

### Completed Late Count
Number of completed cards where:
- Completion date > Due date

Example: Card was due May 1st, completed May 5th = Late

### Average Days Late
Average delay for cards completed after their due date.

Calculation:
```
Sum of (Completed Date - Due Date) for all late cards / Number of late cards
```

Example: Card A completed 2 days late, Card B completed 4 days late
Average = (2 + 4) / 2 = 3 days late

### On-Time Rate
Percentage of completed cards finished on or before their due date.

Calculation:
```
(Completed Count - Late Count) / Completed Count × 100
```

Example: 10 completed, 2 were late
On-Time Rate = (10 - 2) / 10 × 100 = 80%

## 🎨 Visual Indicators

### Card Badges

**Overdue Badge (Red)**
```
⚠️ Overdue | 3d
```
- Shows when: Due date has passed and card not completed
- Color: Red background
- Information: Number of days overdue

**Due Soon Badge (Blue)**
```
📅 Due | Jan 15
```
- Shows when: Card has due date in the future
- Color: Blue background
- Information: Short date format (Month Day)

### Card Modal Indicators

When a due date is set:
```
Due: Jan 15, 2025, 2:00 PM
⚠️ Overdue   (if past due and not completed)
```

### Analytics Dashboard

**Stat Cards:**
- 🚨 **Red Card**: Overdue count with average days
- 🎯 **Teal Card**: On-time rate with late count
- ⏱️ **Purple Card**: Average completion with late average

## 💡 Best Practices

### Setting Due Dates

**✅ DO:**
- Set realistic due dates based on task complexity
- Include time for reviews and revisions
- Consider dependencies with other tasks
- Set due dates for all important deliverables

**❌ DON'T:**
- Set arbitrary dates without planning
- Ignore overdue notifications
- Change due dates repeatedly without reason
- Set due dates too far in the future

### Managing Overdue Tasks

1. **Daily Review**: Check overdue cards each morning
2. **Prioritize**: Focus on most overdue tasks first
3. **Communicate**: If late, update stakeholders
4. **Adjust**: If consistently late, revise estimation process
5. **Learn**: Use analytics to improve future estimates

### Using Analytics

**Track Trends:**
- Monitor on-time rate weekly
- Compare average days late month-over-month
- Identify patterns in overdue cards
- Adjust team capacity based on completion times

**Team Performance:**
- Set team goals for on-time rate (e.g., 90%)
- Celebrate improvements in average days late
- Use data for sprint retrospectives
- Identify bottlenecks causing delays

## 🔧 Technical Implementation

### Database Schema

```sql
-- Cards table additions
ALTER TABLE cards ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
CREATE INDEX idx_cards_due_date ON cards(due_date);
```

### View with Overdue Calculation

```sql
CREATE OR REPLACE VIEW cards_with_board AS
SELECT 
  c.*,
  col.title as column_title,
  col.board_id,
  b.name as board_name,
  CASE 
    WHEN c.due_date IS NOT NULL 
      AND c.status != 'completed' 
      AND NOW() > c.due_date 
    THEN EXTRACT(DAY FROM NOW() - c.due_date)::INTEGER
    ELSE 0
  END as days_overdue
FROM cards c
JOIN columns col ON c.column_id = col.id
JOIN boards b ON col.board_id = b.id;
```

### API Updates

**Cards API** (`/api/cards`):
- Added `due_date` to `allowedFields` array
- Accepts ISO 8601 datetime string
- Auto-saves from CardModal after 1 second

**Analytics API** (`/api/analytics/[boardId]`):
- Queries `due_date` field with cards
- Calculates 5 new metrics related to due dates
- Returns in `overallStats` object

### Component Updates

**CardModal.jsx:**
- `datetime-local` input for due date selection
- Auto-save on change (1 second debounce)
- Displays overdue warning if past due

**Card.jsx:**
- Checks `due_date` vs current time
- Shows red border if overdue
- Displays badge with days overdue or upcoming due date

**AnalyticsDashboard.jsx:**
- 6 stat cards (added 3 new ones)
- Overdue, On-Time Rate, and enhanced Avg Completion
- Color-coded: Red for overdue, Teal for on-time

## 📈 Example Scenarios

### Scenario 1: Project Deadline Tracking
```
Project: Website Redesign
Cards:
- Homepage Design (Due: Jan 10) → Completed Jan 9 ✅ On-time
- API Integration (Due: Jan 12) → Completed Jan 15 ⚠️ 3 days late
- Testing (Due: Jan 15) → Still in progress, Jan 17 ⚠️ 2 days overdue

Analytics:
- Overdue: 1 card
- Avg Days Overdue: 2 days
- Completed Late: 1 card
- Avg Days Late: 3 days
- On-Time Rate: 50% (1 of 2 completed)
```

### Scenario 2: Sprint Planning
```
Sprint Duration: 2 weeks
Cards: 15 total

Week 1:
- 8 cards completed on time
- 2 cards completed late (avg 1.5 days)

Week 2:
- 3 cards still overdue (avg 4 days)
- 2 cards pending with upcoming due dates

Analytics Show:
- On-Time Rate: 80%
- Team needs to address 3 overdue cards urgently
- Future sprints: add buffer or reduce scope
```

## 🐛 Troubleshooting

### Due Date Not Saving
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure `due_date` column exists in database
4. Check API route is processing `due_date` field

### Overdue Badge Not Showing
1. Verify due date is in the past
2. Check card status (shouldn't be 'completed')
3. Refresh the page to reload card data
4. Check browser console for JavaScript errors

### Analytics Not Showing Overdue Metrics
1. Ensure analytics schema migration ran successfully
2. Check that cards have `due_date` values
3. Verify analytics API is returning new fields
4. Check browser network tab for API errors

### Wrong Timezone Display
- Due dates are stored in UTC
- Displayed in user's local timezone
- Use `datetime-local` input for consistent UX
- Analytics calculations use server time (UTC)

## 📚 Related Documentation

- [Analytics Setup](ANALYTICS_SETUP.md) - Setting up analytics
- [Analytics Implementation](ANALYTICS_IMPLEMENTATION.md) - Technical details
- [Role Permissions](ROLE_PERMISSIONS.md) - Who can set due dates

---

**Last Updated**: October 26, 2025  
**Version**: 1.0.0  
**Feature**: Due Date Tracking with Overdue Analytics
