# Troubleshooting Guide

## Fixed Issues

### 1. Middleware Auth Error ✅
**Error:** `auth().protect is not a function`

**Fix:** Updated `middleware.js` to use the correct Clerk API:
```javascript
// OLD (incorrect):
export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();  // ❌ Wrong
  }
});

// NEW (correct):
export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();  // ✅ Correct
  }
});
```

### 2. API Routes Using Wrong Supabase Client ✅
**Issue:** API routes were using the anon key instead of service key, causing RLS policy issues.

**Fix:** Updated all API routes to use `getServiceSupabase()`:
```javascript
// OLD:
import { supabase } from '@/lib/supabase';

// NEW:
import { getServiceSupabase } from '@/lib/supabase';

export async function POST(req) {
  const supabase = getServiceSupabase();  // Use service key for server-side ops
  // ...
}
```

## Current Status

### ✅ Completed Setup
- [x] Middleware configured correctly
- [x] API routes using service key
- [x] Better error logging added
- [x] Environment variables template ready

### ⚠️ Pending User Actions

#### 1. Install Packages
```bash
npm install @clerk/nextjs @supabase/supabase-js
```

#### 2. Configure Environment Variables
Edit `.env.local` and add your real keys:
```bash
# Clerk (from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key
CLERK_SECRET_KEY=sk_test_your_actual_key

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://fmnvwttrntaxpgpindnco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SHH7LGSYiA2y5je4vY2U2A_Sji7JYa4
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3. Create Database Tables
1. Go to https://supabase.com/dashboard/project/fmnvwttrntaxpgpindnco/sql
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Click "Run"

#### 4. Restart Dev Server
```bash
npm run dev
```

## How to Test

### Check Browser Console (F12)
When you click "Create Your First Board", you should see:
```
Creating board: My First Board
Response status: 200
New board created: { id: '...', name: 'My First Board', ... }
```

### Check Terminal (Server Logs)
You should see:
```
POST /api/boards - Starting
User ID: user_xxxxx
Board name: My First Board
Creating board in Supabase...
Board created: { ... }
Creating default columns...
Default columns created
```

## Common Errors & Solutions

### Error: "Publishable key not valid"
**Cause:** Clerk keys not configured
**Solution:** Add real Clerk keys to `.env.local` from https://dashboard.clerk.com

### Error: "Failed to create board: 500"
**Possible Causes:**
1. Database tables not created → Run `supabase-schema.sql`
2. Missing service key → Add `SUPABASE_SERVICE_KEY` to `.env.local`
3. Packages not installed → Run `npm install @clerk/nextjs @supabase/supabase-js`

**Check:** Look at terminal output for detailed error message

### Error: "Unauthorized" (401)
**Cause:** Not signed in or Clerk not configured
**Solution:** 
1. Make sure Clerk keys are in `.env.local`
2. Restart dev server
3. Sign in at `/sign-in`

### Error: "relation 'boards' does not exist"
**Cause:** Database tables not created
**Solution:** Run the SQL schema in Supabase SQL Editor

## Debugging Checklist

When something doesn't work:

1. ✅ Check browser console (F12) for client-side errors
2. ✅ Check terminal for server-side logs  
3. ✅ Verify `.env.local` has all required keys
4. ✅ Confirm packages are installed: check `node_modules/@clerk` and `node_modules/@supabase`
5. ✅ Verify database tables exist in Supabase Table Editor
6. ✅ Make sure dev server was restarted after changing `.env.local`

## Next Steps After Setup

Once everything works:

1. **Test Board Creation:** Click "Create Your First Board"
2. **Test Adding Columns:** Drag and add new columns
3. **Test Adding Cards:** Add cards to columns
4. **Test Sharing:** Share board with another user
5. **Test Real-time:** Open board in two browsers, edit in one, see updates in the other

## Need Help?

Check console and terminal output first - they contain detailed error messages that point to exactly what's wrong!
