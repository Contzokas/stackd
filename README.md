# 📋 Stackd

A modern, cloud-based task management application with free-form drag-and-drop columns and cards. Built with Next.js, Clerk authentication, and Supabase for real-time collaboration.

![Stackd Logo](public/Stackd.png)

## ✨ Features

- **🔐 User Authentication**: Secure sign-in with Clerk (Email, Google, GitHub)
- **☁️ Cloud Storage**: All data stored in Supabase PostgreSQL database
- **🎯 Free-Form Columns**: Drag and position columns anywhere on the canvas
- **📝 Drag & Drop Cards**: Move cards between columns seamlessly
- **💾 Auto-Save**: Changes save automatically 1 second after you stop typing
- **💬 Card Comments**: Add threaded comments with user avatars and timestamps
- **👥 Board Sharing**: Share boards with other users via email
- **🔄 Real-time Sync**: All changes persist to database instantly
- **⚡ Optimized Performance**: Built with React.memo, useCallback for smooth interactions
- **🎨 Modern UI**: Clean, dark-themed interface with smooth transitions
- **📱 Responsive Design**: Works great on desktop and mobile devices

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

Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor:
```bash
# The file contains table definitions for:
# - boards (with RLS policies)
# - columns
# - cards
# - comments
# - board_members
```

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
│   ├── FreeFormColumn.jsx   # Draggable column component
│   ├── Card.jsx             # Individual card component
│   ├── CardModal.jsx        # Card detail modal with comments
│   ├── ShareBoardModal.jsx  # Board sharing interface
│   └── Footer.jsx           # Footer component
├── hooks/
│   ├── useDragAndDrop.js        # Hook for card drag & drop
│   ├── useColumnDragAndDrop.js  # Hook for column reordering
│   └── useFreeFormDrag.js       # Hook for free-form positioning
├── lib/
│   └── supabase.js          # Supabase client configuration
└── public/
    └── Stackd.png           # Logo and assets
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

### Comments
- **Add Comment**: Type in the comment box at the bottom of the card modal
- **View Comments**: All comments show with user avatars and timestamps
- **Edit Comment**: Click the edit icon on your own comments
- **Delete Comment**: Click the trash icon on your own comments

### Sharing Boards
- **Share Board**: Click the share icon, enter user email addresses
- **Collaborators**: All board members can view and edit in real-time
- **View Members**: See all current board members in the share modal

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.0.0](https://nextjs.org/) with App Router
- **Authentication**: [Clerk](https://clerk.com/) - User management and auth
- **Database**: [Supabase](https://supabase.com/) - PostgreSQL with Row Level Security
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: JavaScript (ES6+)
- **Performance**: React.memo, useCallback, optimized re-renders
- **API**: RESTful API routes with Next.js App Router

## 🎨 Key Features Explained

### Free-Form Dragging
Unlike traditional Kanban boards, Stackd allows you to position columns anywhere on the canvas, giving you complete control over your workspace layout.

### Auto-Save System
- **Debounced Auto-Save**: Changes save automatically 1 second after you stop typing
- **Smart Syncing**: Modal only resets state when switching to a different card
- **Optimistic Updates**: UI updates immediately while saving in the background
- **Database-First**: Always displays the latest data from the database

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

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)**: Detailed setup instructions for Clerk and Supabase
- **[QUICK_START.md](QUICK_START.md)**: Quick reference for getting started
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**: Common issues and solutions
- **supabase-schema.sql**: Database schema for Supabase setup

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

**Constantinos Tziogadoros**

- Twitter: [@Tziogadoros](https://x.com/Tziogadoros)
- GitHub: [@Contzokas](https://github.com/Contzokas)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication by [Clerk](https://clerk.com/)
- Database by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Font: [Geist](https://vercel.com/font)

---

⭐ Star this repo if you find it helpful!
