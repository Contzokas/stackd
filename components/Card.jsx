"use client";
import { memo } from "react";

function Card({ card, onDelete, onDragStart, onDragEnd, isDragging }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(card)}
      onDragEnd={onDragEnd}
      className={`group bg-[#7D8C91] p-2 rounded shadow-sm mb-2 flex justify-between items-center cursor-move transition-opacity ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <span className="text-white">{card.title}</span>
      <button
        onClick={() => onDelete(card.id)}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
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