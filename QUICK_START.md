# 🎯 Quick Setup Checklist

## Prerequisites
- [ ] Node.js installed
- [ ] Project running locally (`npm run dev`)

## Setup Steps

### 1. Install Packages (5 min)
```bash
npm install @clerk/nextjs @supabase/supabase-js
```

### 2. Create Clerk Account (3 min)
- Go to [clerk.com](https://clerk.com)
- Create application
- Copy API keys

### 3. Create Supabase Account (5 min)
- Go to [supabase.com](https://supabase.com)
- Create project
- Wait for provisioning
- Copy URL and keys

### 4. Run Database Schema (2 min)
- Open Supabase SQL Editor
- Paste `supabase-schema.sql` content
- Click Run

### 5. Configure Environment (3 min)
- Copy `.env.local.example` to `.env.local`
- Paste Clerk keys
- Paste Supabase keys

### 6. Start App (1 min)
```bash
npm run dev
```

### 7. Test It! (2 min)
- Visit http://localhost:3000
- Create account
- Create a board
- Add some cards
- Share with a friend!

## Total Time: ~20 minutes

## ✅ You're Done!

Your app now has:
- 🔐 User authentication
- ☁️ Cloud database
- 🔄 Real-time sync
- 👥 Team collaboration
- 🌍 Multi-device access

## Quick Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel
```

## Important Files

- `.env.local` - Your secret keys (DO NOT COMMIT!)
- `supabase-schema.sql` - Database structure
- `SETUP_GUIDE.md` - Detailed instructions
