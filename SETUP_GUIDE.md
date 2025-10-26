# 🚀 Stackd - Multi-User Collaborative Setup Guide

## ✅ What's Been Implemented

Your Stackd app now has:
- ✅ User authentication with Clerk
- ✅ Cloud database with Supabase
- ✅ Multiple boards synced across devices
- ✅ Real-time collaboration (see changes instantly)
- ✅ Board sharing with team members
- ✅ Permission management (owner/editor/viewer)
- ✅ Permanent cloud storage

## 📋 Setup Steps

### Step 1: Install Required Packages

Run this command in your terminal:

```bash
npm install @clerk/nextjs @supabase/supabase-js
```

**Note:** If you get a PowerShell execution policy error, open PowerShell as Administrator and run:
```powershell
Set-ExecutionPolicy RemoteSigned
```
Then try the npm install again.

### Step 2: Set Up Clerk (Authentication)

1. Go to [https://clerk.com](https://clerk.com) and create a free account
2. Create a new application
3. Choose your authentication methods (Email, Google, GitHub, etc.)
4. Copy your API keys from the dashboard

### Step 3: Set Up Supabase (Database)

1. Go to [https://supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the database to be provisioned (~2 minutes)
4. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### Step 4: Run the Database Schema

1. In Supabase, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from your project
3. Copy all the SQL code
4. Paste it into the SQL Editor
5. Click **Run** to create all tables and security policies

### Step 5: Create Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```

2. Open `.env.local` and fill in your keys:

```env
# Clerk Authentication (from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx

# Clerk URLs (keep these as-is)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase (from supabase.com project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
```

### Step 6: Start Your App

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 How To Use

### Creating an Account
1. Click "Sign In" or visit `/sign-in`
2. Create a new account or sign in with a social provider
3. You'll be redirected to your dashboard

### Creating and Managing Boards
1. Click the board selector at the top center
2. Click "+ Create new board" to add a new board
3. Click on a board name to switch to it
4. Use the ✏️ icon to rename a board
5. Use the 🗑️ icon to delete a board
6. Use the 👥 icon to share a board with team members

### Sharing Boards
1. Click the 👥 (share) icon next to any board
2. Get the User ID from the person you want to share with:
   - They can find it in Clerk's User Button (top right)
   - Or in their account settings
3. Enter their User ID in the share modal
4. Choose permission level:
   - **Viewer**: Can only view the board (read-only)
   - **Editor**: Can create/edit/delete cards and columns
5. Click "Share Board"

### Real-Time Collaboration
- Open the same board on multiple devices or browsers
- Changes made by anyone are instantly visible to all users
- No refresh needed - it's live!

### Working with Columns and Cards
- Drag columns by the ⋮⋮ handle to move them around
- Click "Add Column" button (bottom right) to create columns
- Click column titles to rename them
- Drag cards between columns
- Click cards to edit title and description
- All changes sync across all devices in real-time

## 🔒 Security Features

- **Row Level Security (RLS)**: Users can only see their own boards and shared boards
- **Permission-based access**: Viewers can't edit, Editors can modify, Owners have full control
- **Secure authentication**: Handled by Clerk with industry-standard OAuth
- **Protected API routes**: All API endpoints require authentication

## 📁 New Files Created

### Core Files
- `lib/supabase.js` - Supabase client configuration
- `supabase-schema.sql` - Database schema with RLS policies
- `.env.local.example` - Environment variables template

### Authentication
- `app/sign-in/[[...sign-in]]/page.js` - Sign in page
- `app/sign-up/[[...sign-up]]/page.js` - Sign up page
- `middleware.js` - Route protection

### API Routes
- `app/api/boards/route.js` - List and create boards
- `app/api/boards/[boardId]/route.js` - Get, update, delete boards
- `app/api/boards/[boardId]/share/route.js` - Share boards with users
- `app/api/columns/route.js` - CRUD operations for columns
- `app/api/cards/route.js` - CRUD operations for cards

### Components
- `components/CloudBoardManager.jsx` - Cloud-synced board manager
- `components/ShareBoardModal.jsx` - UI for sharing boards
- Updated `components/BoardSelector.jsx` - Added share button

## 🐛 Troubleshooting

### "Unauthorized" errors
- Make sure you're signed in
- Check that your `.env.local` has the correct Clerk keys

### Database errors
- Verify you ran the `supabase-schema.sql` in Supabase SQL Editor
- Check that RLS policies are enabled

### Real-time not working
- Confirm Supabase project has Realtime enabled (it's on by default)
- Check browser console for WebSocket errors

### Can't share boards
- Make sure the User ID is correct (starts with `user_`)
- Verify the target user has created an account in your app

## 🎉 Success!

You now have a fully functional, multi-user collaborative task management app!

Features included:
- ✅ User authentication
- ✅ Cloud storage
- ✅ Real-time collaboration
- ✅ Board sharing
- ✅ Permission management
- ✅ Cross-device sync

## 📚 Next Steps

1. Deploy to Vercel: `vercel deploy`
2. Update your Clerk allowed URLs with your production domain
3. Update Supabase allowed URLs with your production domain
4. Invite your team members!

## 🆘 Need Help?

- Clerk Docs: https://clerk.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
