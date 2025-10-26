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
    // Pass individual fields to onEdit, handling partial updates
    const newTitle = updates.title !== undefined ? updates.title : undefined;
    const newDescription = updates.description !== undefined ? updates.description : undefined;
    onEdit(cardId, newTitle, newDescription);
  }, [onEdit]);

  // Log when card prop changes
  useEffect(() => {
    console.log('Card component received new card prop:', card);
  }, [card]);

  return (
    <>
      <div
        draggable={!isEditing && !isModalOpen}
        onDragStart={() => !isEditing && !isModalOpen && onDragStart(card)}
        onDragEnd={onDragEnd}
        onClick={handleCardClick}
        className={`group bg-[#7D8C91] p-2 rounded shadow-sm mb-2 flex justify-between items-center transition-opacity ${
          isDragging ? "opacity-50" : "opacity-100"
        } ${isEditing ? '' : 'cursor-pointer'}`}
      >
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
          <span className="text-white flex-1">
            {card.title}
          </span>
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
    prevProps.isDragging === nextProps.isDragging
  );
  
  if (!shouldNotUpdate) {
    console.log('Card memo: Re-rendering because something changed:', {
      id: prevProps.card.id,
      titleChanged: prevProps.card.title !== nextProps.card.title,
      descriptionChanged: prevProps.card.description !== nextProps.card.description,
      columnChanged: prevProps.card.column_id !== nextProps.card.column_id,
      draggingChanged: prevProps.isDragging !== nextProps.isDragging,
      prevTitle: prevProps.card.title,
      nextTitle: nextProps.card.title
    });
  }
  
  return shouldNotUpdate;
});