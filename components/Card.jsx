"use client";
import { memo, useState, useCallback, useEffect } from "react";
import CardModal from "./CardModal";

function Card({ card, onDelete, onEdit, onDragStart, onDragEnd, isDragging }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editValue, setEditValue] = useState(card.title);

  // Update editValue when card.title changes from outside
  useEffect(() => {
    if (!isEditing) {
      setEditValue(card.title);
    }
  }, [card.title, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(card.title);
  };

  const handleSave = () => {
    onEdit(card.id, editValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(card.title);
      setIsEditing(false);
    }
  };

  const handleCardClick = (e) => {
    // Don't open modal if clicking buttons or in edit mode
    if (e.target.tagName === 'BUTTON' || isEditing) return;
    setIsModalOpen(true);
  };

  const handleModalSave = useCallback((cardId, updates) => {
    console.log('Card handleModalSave:', { cardId, updates });
    // Pass all updates to onEdit
    onEdit(cardId, updates);
  }, [onEdit]);

  // Log when card prop changes
  useEffect(() => {
    console.log('Card component received new card prop:', card);
  }, [card]);

  // Check if card is overdue
  const isOverdue = card.due_date && 
                    card.status !== 'completed' && 
                    new Date(card.due_date) < new Date();
  
  const daysOverdue = isOverdue 
    ? Math.floor((new Date() - new Date(card.due_date)) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <>
      <div
        draggable={!isEditing && !isModalOpen}
        onDragStart={() => !isEditing && !isModalOpen && onDragStart(card)}
        onDragEnd={onDragEnd}
        onClick={handleCardClick}
        className={`group bg-[#7D8C91] p-2 rounded shadow-sm mb-2 transition-opacity ${
          isDragging ? "opacity-50" : "opacity-100"
        } ${isEditing ? '' : 'cursor-pointer'} ${isOverdue ? 'border-2 border-red-500' : ''}`}
      >
        {isOverdue && (
          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded mb-2 flex items-center justify-between">
            <span>⚠️ Overdue</span>
            <span className="font-semibold">{daysOverdue}d</span>
          </div>
        )}
        {card.due_date && !isOverdue && card.status !== 'completed' && (
          <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded mb-2 flex items-center justify-between">
            <span>📅 Due</span>
            <span>{new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
        {card.image_url && !isEditing && (
          <img 
            src={card.image_url} 
            alt={card.title}
            className="w-full h-32 object-cover rounded mb-2"
          />
        )}
        <div className="flex justify-between items-center">
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 bg-white text-black px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          ) : (
            <div className="flex-1 flex flex-col">
              <span className="text-white">
                {card.title}
              </span>
              {card.createdByUsername && (
                <span className="text-xs text-gray-300 mt-1">
                  by @{card.createdByUsername}
                </span>
              )}
            </div>
          )}
          <div className="flex gap-1">
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit card name"
              >
                ✏️
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete card"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CardModal
          card={card}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(Card, (prevProps, nextProps) => {
  const shouldNotUpdate = (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.card.description === nextProps.card.description &&
    prevProps.card.column_id === nextProps.card.column_id &&
    prevProps.card.createdByUsername === nextProps.card.createdByUsername &&
    prevProps.card.image_url === nextProps.card.image_url &&
    prevProps.card.due_date === nextProps.card.due_date &&
    prevProps.card.status === nextProps.card.status &&
    prevProps.isDragging === nextProps.isDragging
  );
  
  if (!shouldNotUpdate) {
    console.log('Card memo: Re-rendering because something changed:', {
      id: prevProps.card.id,
      titleChanged: prevProps.card.title !== nextProps.card.title,
      descriptionChanged: prevProps.card.description !== nextProps.card.description,
      columnChanged: prevProps.card.column_id !== nextProps.card.column_id,
      creatorChanged: prevProps.card.createdByUsername !== nextProps.card.createdByUsername,
      imageChanged: prevProps.card.image_url !== nextProps.card.image_url,
      draggingChanged: prevProps.isDragging !== nextProps.isDragging,
      prevTitle: prevProps.card.title,
      nextTitle: nextProps.card.title
    });
  }
  
  return shouldNotUpdate;
});