"use client";
import Card from "./Card";

export default function Column({
  column,
  cards,
  onAddCard,
  onDeleteCard,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  draggedCard,
  isDragOver,
  // Column drag props
  onColumnDragStart,
  onColumnDragEnd,
  onColumnDragOver,
  onColumnDragLeave,
  onColumnDrop,
  isColumnDragging,
  isColumnDragOver,
}) {
  return (
    <div
      draggable
      onDragStart={() => onColumnDragStart(column)}
      onDragEnd={onColumnDragEnd}
      onDragOver={(e) => {
        onDragOver(e, column.id);
        onColumnDragOver(e, column.id);
      }}
      onDragLeave={() => {
        onDragLeave();
        onColumnDragLeave();
      }}
      onDrop={(e) => {
        onDrop(e, column.id);
        onColumnDrop(e, column.id);
      }}
      className={`bg-[#2E3436] p-3 rounded-xl w-72 shrink-0 h-fit transition-all cursor-move ${
        isDragOver ? 'ring-2 ring-blue-400 bg-[#3a4244]' : ''
      } ${
        isColumnDragOver ? 'ring-2 ring-green-400' : ''
      } ${
        isColumnDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <h2 className="font-semibold mb-3 text-white cursor-grab active:cursor-grabbing">
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
