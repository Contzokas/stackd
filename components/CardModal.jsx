"use client";
import { useState, memo, useCallback } from "react";
import { createPortal } from "react-dom";

function CardModalContent({ card, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(card.title);
  const [localDescription, setLocalDescription] = useState(card.description || "");

  const handleSave = useCallback(() => {
    onSave(card.id, { title, description: localDescription });
    onClose();
  }, [card.id, title, localDescription, onSave, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2E3436] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                placeholder="Card title"
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white ml-4 text-2xl"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description Section */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              📝 Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[150px] resize-y"
              placeholder="Add a more detailed description..."
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Card Info */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-xs">
              Card ID: <span className="text-gray-500">{card.id}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this card?')) {
                onDelete(card.id);
                onClose();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Delete Card
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function CardModal({ card, isOpen, onClose, onSave, onDelete }) {
  if (!isOpen) return null;
  
  return <CardModalContent card={card} onClose={onClose} onSave={onSave} onDelete={onDelete} />;
}

// Memoize the modal to prevent re-renders
export default memo(CardModal);
