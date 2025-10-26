"use client";
import { memo, useState } from "react";

function Card({ card, onDelete, onEdit, onDragStart, onDragEnd, isDragging }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(card.title);

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

  return (
    <div
      draggable={!isEditing}
      onDragStart={() => !isEditing && onDragStart(card)}
      onDragEnd={onDragEnd}
      className={`group bg-[#7D8C91] p-2 rounded shadow-sm mb-2 flex justify-between items-center transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isEditing ? '' : 'cursor-move'}`}
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
            onClick={handleEdit}
            className="text-gray-400 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit card"
          >
            ✏️
          </button>
        )}
        <button
          onClick={() => onDelete(card.id)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Delete card"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(Card, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.title === nextProps.card.title &&
    prevProps.isDragging === nextProps.isDragging
  );
});