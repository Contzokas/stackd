"use client";
import { memo, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import ShareBoardModal from "./ShareBoardModal";
import AnalyticsDashboard from "./AnalyticsDashboard";

function BoardSelector({ 
  boards, 
  activeBoard, 
  onSelectBoard, 
  onCreateBoard, 
  onRenameBoard, 
  onDeleteBoard 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [boardToShare, setBoardToShare] = useState(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleCreateBoard = useCallback(() => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName("");
      setIsCreating(false);
    }
  }, [newBoardName, onCreateBoard]);

  const handleStartEdit = useCallback((board, e) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditedName(board.name);
  }, []);

  const handleSaveEdit = useCallback((boardId) => {
    if (editedName.trim() && editedName !== boards.find(b => b.id === boardId)?.name) {
      onRenameBoard(boardId, editedName.trim());
    }
    setEditingBoardId(null);
    setEditedName("");
  }, [editedName, boards, onRenameBoard]);

  const handleDeleteBoard = useCallback((boardId, e) => {
    e.stopPropagation();
    const board = boards.find(b => b.id === boardId);
    if (window.confirm(`Delete board "${board?.name}"? This cannot be undone.`)) {
      onDeleteBoard(boardId);
    }
  }, [boards, onDeleteBoard]);

  const handleKeyDown = useCallback((e, action, boardId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (action === 'create') {
        handleCreateBoard();
      } else if (action === 'edit') {
        handleSaveEdit(boardId);
      }
    } else if (e.key === 'Escape') {
      if (action === 'create') {
        setIsCreating(false);
        setNewBoardName("");
      } else if (action === 'edit') {
        setEditingBoardId(null);
        setEditedName("");
      }
    }
  }, [handleCreateBoard, handleSaveEdit]);

  const activeBoardData = boards.find(b => b.id === activeBoard);
  const userRole = activeBoardData?.userRole || 'viewer';
  const canViewAnalytics = userRole === 'owner' || userRole === 'admin';

  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      {/* Current Board Display */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#2E3436] text-white px-6 py-3 rounded-lg shadow-lg hover:bg-[#3a4244] transition-colors flex items-center gap-3"
        >
          <span className="font-semibold text-lg">{activeBoardData?.name || "Select Board"}</span>
          <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
        </button>
        
        {/* Analytics Button - Only for Owners and Admins */}
        {activeBoard && canViewAnalytics && (
          <button
            onClick={() => setAnalyticsOpen(true)}
            className="bg-[#2E3436] text-white px-4 py-3 rounded-lg shadow-lg hover:bg-[#3a4244] transition-colors flex items-center gap-2"
            title="View Analytics"
          >
            <span className="text-xl">📊</span>
            <span className="font-medium">Analytics</span>
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-[#2E3436] rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-[400px]">
          <div className="max-h-[400px] overflow-y-auto">
            {/* Board List */}
            {boards.map((board) => (
              <div
                key={board.id}
                className={`flex items-center justify-between p-3 hover:bg-[#3a4244] transition-colors ${
                  board.id === activeBoard ? 'bg-blue-600 hover:bg-blue-700' : ''
                }`}
              >
                {editingBoardId === board.id ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={() => handleSaveEdit(board.id)}
                    onKeyDown={(e) => handleKeyDown(e, 'edit', board.id)}
                    className="flex-1 bg-[#1a1a1a] text-white px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSelectBoard(board.id);
                        setIsOpen(false);
                      }}
                      className="flex-1 text-left text-white"
                    >
                      {board.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoardToShare(board);
                          setShareModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="text-gray-400 hover:text-blue-400 p-1 rounded hover:bg-[#1a1a1a] transition-colors"
                        title="Share board"
                      >
                        👥
                      </button>
                      <button
                        onClick={(e) => handleStartEdit(board, e)}
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#1a1a1a] transition-colors"
                        title="Rename board"
                      >
                        ✏️
                      </button>
                      {boards.length > 1 && (
                        <button
                          onClick={(e) => handleDeleteBoard(board.id, e)}
                          className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-[#1a1a1a] transition-colors"
                          title="Delete board"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create New Board Section */}
          <div className="border-t border-gray-700 p-3">
            {isCreating ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'create')}
                  placeholder="Board name..."
                  className="flex-1 bg-[#1a1a1a] text-white px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <button
                  onClick={handleCreateBoard}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewBoardName("");
                  }}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full text-left text-blue-400 hover:text-blue-300 transition-colors"
              >
                + Create new board
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Board Modal */}
      {boardToShare && shareModalOpen && (
        <ShareBoardModal
          boardId={boardToShare.id}
          boardName={boardToShare.name}
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setBoardToShare(null);
          }}
        />
      )}
      </div>
      
      {/* Analytics Dashboard - Render via Portal to escape parent constraints */}
      {analyticsOpen && activeBoard && typeof window !== 'undefined' && createPortal(
        <AnalyticsDashboard
          boardId={activeBoard}
          onClose={() => setAnalyticsOpen(false)}
        />,
        document.body
      )}
    </>
  );
}

export default memo(BoardSelector);
