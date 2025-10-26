"use client";
import { memo, useState, useCallback } from "react";
import Card from "./Card";

function FreeFormColumn({
  column,
  cards,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedCard,
  isDragOver,
  onMouseDown,
  isDragging,
  onEditColumn,
  onDeleteColumn,
}) {
  const position = column.position || { x: 0, y: 0 };
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);

  const handleDragHandleMouseDown = (e) => {
    e.stopPropagation();
    onMouseDown(e, column);
  };

  const handleTitleClick = useCallback(() => {
    setIsEditingTitle(true);
    setEditedTitle(column.title);
  }, [column.title]);

  const handleTitleBlur = useCallback(() => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== column.title) {
      onEditColumn(column.id, editedTitle.trim());
    } else {
      setEditedTitle(column.title);
    }
  }, [editedTitle, column.id, column.title, onEditColumn]);

  const handleTitleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(column.title);
    }
  }, [handleTitleBlur, column.title]);

  const handleDeleteColumn = useCallback(() => {
    if (window.confirm(`Delete "${column.title}" column? All cards in it will be deleted.`)) {
      onDeleteColumn(column.id);
    }
  }, [column.id, column.title, onDeleteColumn]);

  return (
    <div
      data-column
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        willChange: isDragging ? 'left, top' : 'auto',
      }}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
      className={`bg-[#2E3436] p-3 rounded-xl w-72 shrink-0 h-fit ${
        isDragOver ? 'ring-2 ring-blue-400 bg-[#3a4244]' : ''
      } ${
        isDragging ? 'opacity-80 shadow-2xl' : 'opacity-100 shadow-lg'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <button
          data-drag-handle
          onMouseDown={handleDragHandleMouseDown}
          className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing text-lg select-none p-1 hover:bg-[#3a4244] rounded transition-colors"
          title="Drag to move column"
        >
          ⋮⋮
        </button>
        {isEditingTitle ? (
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className="flex-1 bg-[#1a1a1a] text-white font-semibold px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
        ) : (
          <h2 
            onClick={handleTitleClick}
            className="font-semibold text-white select-none flex-1 cursor-text hover:bg-[#3a4244] px-2 py-1 rounded transition-colors"
            title="Click to edit"
          >
            {column.title}
          </h2>
        )}
        <button
          onClick={handleDeleteColumn}
          className="text-gray-500 hover:text-red-400 text-sm p-1 hover:bg-[#3a4244] rounded transition-colors"
          title="Delete column"
        >
          🗑️
        </button>
      </div>
      
      <div className="min-h-[100px]">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
            onEdit={onEditCard}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggedCard?.id === card.id}
          />
        ))}
      </div>

      <button
        className="mt-2 text-sm underline text-gray-300 hover:text-white"
        onClick={() => onAddCard(column.id)}
      >
        + Add card
      </button>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(FreeFormColumn, (prevProps, nextProps) => {
  // Check if cards array has same length and each card has same data
  const cardsUnchanged = 
    prevProps.cards.length === nextProps.cards.length &&
    prevProps.cards.every((prevCard, index) => {
      const nextCard = nextProps.cards[index];
      return (
        prevCard.id === nextCard.id &&
        prevCard.title === nextCard.title &&
        prevCard.description === nextCard.description &&
        prevCard.column_id === nextCard.column_id
      );
    });

  return (
    prevProps.column.id === nextProps.column.id &&
    prevProps.column.title === nextProps.column.title &&
    prevProps.column.position.x === nextProps.column.position.x &&
    prevProps.column.position.y === nextProps.column.position.y &&
    cardsUnchanged &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.draggedCard?.id === nextProps.draggedCard?.id
  );
});