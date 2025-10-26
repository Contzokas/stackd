import { useState } from 'react';

export function useDragAndDrop(cards, setCards) {
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (card) => {
    setDraggedCard(card);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    
    if (!draggedCard || draggedCard.column_id === targetColumnId) {
      setDragOverColumn(null);
      return;
    }

    setCards((prevCards) =>
      prevCards.map((card) =>
        card.id === draggedCard.id
          ? { ...card, column_id: targetColumnId }
          : card
      )
    );

    setDragOverColumn(null);
  };

  return {
    draggedCard,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}