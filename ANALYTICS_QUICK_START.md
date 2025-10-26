# 🚀 Quick Setup: Analytics Dashboard

## ⚠️ Getting "Analytics Not Set Up" Error?

You need to run the database migration first!

---

## 📋 3 Simple Steps

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**

### Step 2: Copy & Paste SQL
1. Open the file: `analytics-schema.sql`
2. Copy ALL the contents
3. Paste into the Supabase SQL Editor

### Step 3: Run the Script
1. Click the **"Run"** button (or press Ctrl/Cmd + Enter)
2. Wait for "Success" message
3. Verify in **Table Editor** that:
   - `cards` table has new columns: `status`, `completed_at`
   - `card_history` table exists

---

## ✅ Done!

Now go back to Stackd and click the **📊 Analytics** button again.

---

## 🔍 What This Does

The SQL script adds:
- ✅ `status` field to track card progress
- ✅ `completed_at` timestamp for completion tracking
- ✅ `card_history` table to log all card movements
- ✅ Indexes for fast analytics queries
- ✅ Row Level Security policies

---

## ❓ Still Having Issues?

Check the full guide: **[ANALYTICS_SETUP.md](ANALYTICS_SETUP.md)**

Or verify in Supabase Table Editor:
```sql
-- Run this to check if columns exist:
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cards' 
AND column_name IN ('status', 'completed_at');
```

Should return 2 rows if setup correctly.

---

**Need help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
