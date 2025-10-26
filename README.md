# 📋 Stackd

A modern, intuitive task management application with free-form drag-and-drop columns and cards. Built with Next.js and optimized for performance.

![Stackd Logo](public/Stackd.png)

## ✨ Features

- **🎯 Free-Form Columns**: Drag and position columns anywhere on the canvas
- **📝 Drag & Drop Cards**: Move cards between columns seamlessly
- **💾 Auto-Save**: All changes persist to localStorage automatically
- **⚡ Optimized Performance**: Built with React.memo, useCallback, and RAF for smooth 60fps dragging
- **🎨 Modern UI**: Clean, dark-themed interface with smooth transitions
- **📱 Responsive Design**: Works great on desktop and mobile devices
- **🔄 Real-time Updates**: Instant visual feedback for all interactions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Contzokas/stackd.git
cd stackd
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
stackd/
├── app/
│   ├── layout.js          # Root layout with footer
│   ├── page.js            # Main page component
│   └── globals.css        # Global styles
├── components/
│   ├── Board.jsx          # Main board orchestrator
│   ├── FreeFormColumn.jsx # Draggable column component
│   ├── Card.jsx           # Individual card component
│   └── Footer.jsx         # Footer component
├── hooks/
│   ├── useDragAndDrop.js        # Hook for card drag & drop
│   ├── useColumnDragAndDrop.js  # Hook for column reordering
│   └── useFreeFormDrag.js       # Hook for free-form positioning
└── public/
    └── Stackd.png         # Logo and assets
```

## 🎮 Usage

### Managing Columns
- **Move Columns**: Click and drag any column header to reposition it anywhere on the board
- **Reorder Columns**: Drag a column over another to reorder them

### Managing Cards
- **Add Card**: Click the "+ Add card" button in any column
- **Move Card**: Drag a card and drop it in a different column
- **Delete Card**: Hover over a card and click the ✕ button

### Data Persistence
All your columns, cards, and positions are automatically saved to your browser's localStorage and restored when you return.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16.0.0](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: JavaScript (ES6+)
- **Performance**: React.memo, useCallback, RequestAnimationFrame
- **Storage**: localStorage for data persistence

## 🎨 Key Features Explained

### Free-Form Dragging
Unlike traditional Kanban boards, Stackd allows you to position columns anywhere on the canvas, giving you complete control over your workspace layout.

### Performance Optimization
- **React.memo**: Prevents unnecessary re-renders of columns and cards
- **useCallback**: Memoizes event handlers to avoid recreation
- **RequestAnimationFrame**: Ensures smooth 60fps dragging
- **Debounced Saves**: localStorage updates are batched to prevent performance hits

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
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Font: [Geist](https://vercel.com/font)

---

⭐ Star this repo if you find it helpful!
