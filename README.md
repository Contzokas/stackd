# 📋 Stackd

A modern, **offline-first** task management application with free-form drag-and-drop columns and cards. Built with Next.js, Clerk authentication, and Supabase for real-time collaboration.

![Stackd Logo](public/Stackd.png)

## ✨ Features

### Core Features
- **🔐 User Authentication**: Secure sign-in with Clerk (Email, Google, GitHub)
- **☁️ Cloud Storage**: All data stored in Supabase PostgreSQL database
- **📴 Offline-First**: Full CRUD operations work offline with automatic sync
- **🎯 Free-Form Columns**: Drag and position columns anywhere on the canvas
- **📝 Drag & Drop Cards**: Move cards between columns seamlessly
- **💾 Auto-Save**: Changes save automatically 1 second after you stop typing

### Collaboration Features
- **� Board Sharing**: Share boards with role-based permissions (Owner, Admin, Editor, Viewer)
- **�💬 Card Comments**: Add threaded comments with user avatars and timestamps
- **� Real-time Sync**: Polling-based synchronization updates every 3 seconds across all users
- **📊 Analytics Dashboard**: Track board metrics, overdue cards, and team performance

### Advanced Features
- **� Due Dates**: Set deadlines with overdue tracking and badges
- **🏷️ Tags**: Categorize cards with 8 predefined tags (Urgent, High Priority, Bug, etc.)
- **🖼️ Card Images**: Add images to cards via URL
- **📱 PWA Support**: Install as a native app on desktop and mobile
- **⚡ Optimized Performance**: Built with React.memo, useCallback for smooth interactions

### Technical Features
- **🎨 Modern UI**: Clean, dark-themed interface with smooth transitions
- **📱 Responsive Design**: Works great on desktop and mobile devices
- **🔒 Row Level Security**: Supabase RLS ensures data privacy and security
- **💾 IndexedDB Storage**: Local data persistence for offline capabilities
- **🔄 Smart Sync Queue**: Automatic retry logic for failed operations

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- Clerk account ([clerk.com](https://clerk.com))
- Supabase account ([supabase.com](https://supabase.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Contzokas/stackd.git
cd stackd
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. Set up Supabase database:

Run the complete database migration in your Supabase SQL Editor:
```bash
# Use COMPLETE_DATABASE_UPDATE.sql which includes:
# - boards, columns, cards tables with RLS policies
# - card_history for analytics tracking
# - board_members with role-based permissions
# - Due dates, tags, and status columns
# - Comments system
# - Analytics views and functions
```

For detailed database setup, see [COMPLETE_DATABASE_UPDATE.sql](COMPLETE_DATABASE_UPDATE.sql)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
stackd/
├── app/
│   ├── api/
│   │   ├── boards/          # Board CRUD operations
│   │   ├── cards/           # Card CRUD operations
│   │   ├── columns/         # Column CRUD operations
│   │   ├── comments/        # Comment CRUD operations
│   │   └── users/           # User search
│   ├── sign-in/             # Clerk sign-in page
│   ├── sign-up/             # Clerk sign-up page
│   ├── layout.js            # Root layout with authentication
│   ├── page.js              # Main page with board manager
│   └── globals.css          # Global styles
├── components/
│   ├── Board_Original.jsx   # Main board component
│   ├── MultiBoardManager.jsx # Multi-board management
│   ├── CloudBoardManager.jsx # Cloud board CRUD
│   ├── AnalyticsDashboard.jsx # Board analytics and metrics
│   ├── FreeFormColumn.jsx   # Draggable column component
│   ├── Card.jsx             # Individual card component
│   ├── CardModal.jsx        # Card detail modal with tags, due dates
│   ├── ShareBoardModal.jsx  # Board sharing with role management
│   ├── OfflineIndicator.jsx # Offline/sync status display
│   ├── UserAccountButton.jsx # User profile and settings
│   └── Footer.jsx           # Footer component
├── hooks/
│   ├── useDragAndDrop.js        # Hook for card drag & drop
│   ├── useColumnDragAndDrop.js  # Hook for column reordering
│   ├── useFreeFormDrag.js       # Hook for free-form positioning
│   ├── useOfflineBoard.js       # Offline board operations
│   ├── useOfflineCards.js       # Offline card operations
│   └── useOfflineColumns.js     # Offline column operations
├── lib/
│   ├── supabase.js          # Supabase client configuration
│   ├── db.js                # IndexedDB setup with Dexie
│   └── syncManager.js       # Offline sync queue manager
└── public/
    ├── Stackd.png           # Logo and assets
    └── manifest.json        # PWA manifest
```

## 🎮 Usage

### Getting Started
1. **Sign Up/Sign In**: Create an account or sign in with email, Google, or GitHub
2. **Create a Board**: Click "Create New Board" to start your first board
3. **Add Columns**: Click "+ Add Column" to create task categories
4. **Add Cards**: Click "+ Add card" in any column to create tasks

### Managing Columns
- **Move Columns**: Click and drag any column header to reposition it anywhere on the board
- **Rename Column**: Double-click the column title to edit inline
- **Delete Column**: Click the ✕ button on the column header (deletes all cards inside)

### Managing Cards
- **Add Card**: Click the "+ Add card" button in any column
- **Edit Card**: Click on a card to open the detail modal
- **Auto-Save**: Card changes save automatically 1 second after you stop typing
- **Manual Save**: Click the "Save" button to save immediately
- **Move Card**: Drag a card and drop it in a different column
- **Delete Card**: Click the trash icon in the card modal
- **Add Tags**: Select from 8 predefined tags (Urgent, High Priority, Bug, Feature, etc.)
- **Set Due Date**: Pick a deadline - overdue cards show red badges
- **Add Images**: Paste an image URL to display on the card

### Analytics Dashboard
- **Open Analytics**: Click the 📊 icon on any board
- **View Metrics**: See total cards, completed cards, average completion time
- **Track Overdue**: Monitor overdue cards and days past due
- **Card Distribution**: See cards per column with visual charts
- **Time Analysis**: Average time in each column

### Offline Mode
- **Works Offline**: Create, edit, and delete cards without internet
- **Auto-Sync**: Changes sync automatically when back online
- **Visual Indicator**: See offline status and pending sync count
- **Manual Sync**: Click "Sync Now" to force synchronization
- **PWA Install**: Install as an app on desktop or mobile

### Comments
- **Add Comment**: Type in the comment box at the bottom of the card modal
- **View Comments**: All comments show with user avatars and timestamps
- **Edit Comment**: Click the edit icon on your own comments
- **Delete Comment**: Click the trash icon on your own comments

### Sharing Boards
- **Share Board**: Click the share icon to open sharing modal
- **Add Members**: Search users by username or email
- **Role Management**: Assign roles (Owner, Admin, Editor, Viewer)
  - **Owner**: Full control, cannot be removed
  - **Admin**: Manage members, view analytics, create content
  - **Editor**: Create and edit cards/columns
  - **Viewer**: Read-only access
- **Remove Members**: Admins and owners can remove users
- **View Members**: See all current board members with their roles

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.0.0](https://nextjs.org/) with App Router
- **Authentication**: [Clerk](https://clerk.com/) - User management and auth
- **Database**: [Supabase](https://supabase.com/) - PostgreSQL with Row Level Security
- **Offline Storage**: [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- **PWA**: [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa) - Progressive Web App support
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: JavaScript (ES6+)
- **Performance**: React.memo, useCallback, optimized re-renders
- **API**: RESTful API routes with Next.js App Router

## 🎨 Key Features Explained

### Offline-First Architecture
**The game-changer that sets Stackd apart from competitors like Trello:**
- **Full Offline CRUD**: Create, edit, delete cards/columns without internet
- **IndexedDB Storage**: Local data persists across browser sessions
- **Smart Sync Queue**: Operations queue automatically and sync when online
- **Instant UI Updates**: No waiting for server - changes appear immediately
- **Automatic Retry**: Failed syncs retry automatically with exponential backoff
- **Visual Feedback**: Real-time indicators show offline status and pending syncs
- **PWA Installation**: Works like a native app on desktop and mobile

### Role-Based Permissions
- **4-Tier System**: Owner, Admin, Editor, Viewer
- **Granular Control**: Different capabilities for each role
- **Analytics Access**: Only Owners and Admins can view board analytics
- **Member Management**: Owners and Admins can invite/remove users
- **Security**: Row Level Security enforces permissions at database level

### Analytics & Tracking
- **Card Metrics**: Total, completed, in-progress, overdue counts
- **Time Tracking**: Average completion time and time per column
- **Visual Charts**: Distribution graphs and progress indicators
- **Overdue Monitoring**: Automatic calculation of days past due
- **Card History**: Track all card movements between columns

### Free-Form Dragging
Unlike traditional Kanban boards, Stackd allows you to position columns anywhere on the canvas, giving you complete control over your workspace layout.

### Auto-Save System
- **Debounced Auto-Save**: Changes save automatically 1 second after you stop typing
- **Smart Syncing**: Modal only resets state when switching to a different card
- **Optimistic Updates**: UI updates immediately while saving in the background
- **Database-First**: Always displays the latest data from the database

### Real-time Synchronization
- **Polling-Based Updates**: Board state refreshes every 3 seconds
- **Multi-User Collaboration**: Changes made by any user sync to all viewers within 3 seconds
- **Automatic Conflict Resolution**: Latest database state always wins
- **Visual Sync Indicator**: Shows when synchronization is in progress
- **Reliable & Simple**: No WebSocket complexity, works across all networks

### Performance Optimization
- **React.memo**: Prevents unnecessary re-renders of columns and cards
- **Smart Memoization**: Components only re-render when their actual data changes
- **useCallback**: Memoizes event handlers to avoid recreation
- **Service Role Client**: API routes bypass RLS for consistent database access

### Security
- **Clerk Authentication**: Secure, production-ready user authentication
- **Row Level Security**: Supabase RLS policies ensure users only see their boards
- **Service Role Key**: API routes use elevated permissions for consistent access
- **Protected Routes**: All API endpoints check user authentication

## 📚 Additional Documentation

### User Guides
- **[README.el.md](README.el.md)**: Greek version of this README (Ελληνική έκδοση)
- **[QUICK_START.md](QUICK_START.md)**: Quick reference for getting started
- **[ANALYTICS_QUICK_START.md](ANALYTICS_QUICK_START.md)**: Analytics dashboard guide

### Setup & Configuration
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: Detailed setup instructions for Clerk and Supabase
- **[COMPLETE_DATABASE_UPDATE.sql](COMPLETE_DATABASE_UPDATE.sql)**: Complete database schema

### Offline Features
- **[OFFLINE_GUIDE.md](OFFLINE_GUIDE.md)**: Complete offline functionality guide
- **[OFFLINE_TESTING.md](OFFLINE_TESTING.md)**: How to test offline features
- **[OFFLINE_SUMMARY.md](OFFLINE_SUMMARY.md)**: Technical implementation details

### Troubleshooting
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Common issues and solutions

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Constantinos Tzokas**

- Twitter: [@Tziogadoros](https://x.com/Tziogadoros)
- GitHub: [@Contzokas](https://github.com/Contzokas)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Clerk](https://clerk.com/)
- Database by [Supabase](https://supabase.com/)
- Offline storage with [Dexie.js](https://dexie.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Font: [Geist](https://vercel.com/font)
- PWA support: [@ducanh2912/next-pwa](https://www.npmjs.com/package/@ducanh2912/next-pwa)

---

## 🌟 What Makes Stackd Special?

### vs. Trello
✅ **Full offline support** (Trello requires internet)  
✅ **Free-form column positioning** (Trello is fixed layout)  
✅ **Built-in analytics** (Trello requires Power-Ups)  
✅ **Open source** (Trello is proprietary)  
✅ **Self-hostable** (Trello is cloud-only)  

### vs. Notion
✅ **Faster & simpler** (Notion is complex)  
✅ **True offline-first** (Notion's offline is limited)  
✅ **Specialized for tasks** (Notion is general-purpose)  
✅ **Instant UI updates** (Notion can be slow)  

---

⭐ Star this repo if you find it helpful!
