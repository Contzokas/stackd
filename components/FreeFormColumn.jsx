"use client";
import { memo } from "react";
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
}) {
  const position = column.position || { x: 0, y: 0 };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        willChange: isDragging ? 'left, top' : 'auto',
      }}
      onMouseDown={(e) => onMouseDown(e, column)}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
      className={`bg-[#2E3436] p-3 rounded-xl w-72 shrink-0 h-fit cursor-move ${
        isDragOver ? 'ring-2 ring-blue-400 bg-[#3a4244]' : ''
      } ${
        isDragging ? 'opacity-80 shadow-2xl' : 'opacity-100 shadow-lg'
      }`}
    >
      <h2 className="font-semibold mb-3 text-white cursor-grab active:cursor-grabbing select-none">
        {column.title}
      </h2>
      
      <div className="min-h-[100px]">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
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
  return (
    prevProps.column.id === nextProps.column.id &&
    prevProps.column.position.x === nextProps.column.position.x &&
    prevProps.column.position.y === nextProps.column.position.y &&
    prevProps.cards.length === nextProps.cards.length &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.draggedCard?.id === nextProps.draggedCard?.id
  );
});