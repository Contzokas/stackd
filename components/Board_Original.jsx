"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import FreeFormColumn from "./FreeFormColumn";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useFreeFormDrag } from "@/hooks/useFreeFormDrag";

export default function Board({ boardId, initialColumns, initialCards, onBoardUpdate }) {
  const [columns, setColumns] = useState(initialColumns || []);
  const [cards, setCards] = useState(initialCards || []);
  const [hasChanged, setHasChanged] = useState(false);

  const boardKey = useMemo(() => boardId, [boardId]);

  // Reset state when board changes
  useEffect(() => {
    setColumns(initialColumns || []);
    setCards(initialCards || []);
    setHasChanged(false);
  }, [boardKey]); // Only depend on boardKey memo

  // Use drag and drop hooks
  const {
    draggedCard,
    dragOverColumn,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useDragAndDrop(cards, setCards);

  const {
    draggedColumn,
    handleColumnMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useFreeFormDrag(columns, setColumns);

  // Notify parent of changes (debounced)
  useEffect(() => {
    if (!hasChanged) {
      setHasChanged(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (onBoardUpdate) {
        onBoardUpdate(boardId, { columns, cards });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [columns, cards]); // Minimal dependencies

  // Add mouse event listeners for column dragging
  useEffect(() => {
    if (draggedColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedColumn]); // Minimal dependencies

  const handleAddCard = useCallback((column_id) => {
    setCards((prevCards) => [
      ...prevCards,
      { id: `card_${Date.now()}`, title: "New card", description: "", column_id },
    ]);
  }, []);

  const handleDeleteCard = useCallback((cardId) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  }, []);

  const handleEditCard = useCallback((cardId, newTitle, newDescription) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId 
          ? { 
              ...card, 
              title: newTitle?.trim() || card.title,
              description: newDescription !== undefined ? newDescription : card.description
            } 
          : card
      )
    );
  }, []);

  const handleAddColumn = useCallback(() => {
    const rightmostColumn = columns.reduce((max, col) => 
      col.position.x > max ? col.position.x : max, 0
    );
    
    const newColumn = {
      id: `col_${Date.now()}`,
      title: "New Column",
      position: { x: rightmostColumn + 350, y: 50 }
    };
    
    setColumns((prev) => [...prev, newColumn]);
  }, [columns]);

  const handleEditColumn = useCallback((columnId, newTitle) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, title: newTitle } : col
      )
    );
  }, []);

  const handleDeleteColumn = useCallback((columnId) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    setCards((prev) => prev.filter((card) => card.column_id !== columnId));
  }, []);

  return (
    <div
      className="relative w-full min-h-screen overflow-auto"
      style={{
        minWidth: "90%",
        minHeight: "100vh",
        padding: "1px",
        background: "linear-gradient(to bottom, #1a1a1a, #2a2a2a)",
      }}
    >
      {columns.map((col) => {
        const cardsForCol = cards.filter((card) => card.column_id === col.id);
        return (
          <FreeFormColumn
            key={col.id}
            column={col}
            cards={cardsForCol}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onEditCard={handleEditCard}
            onEditColumn={handleEditColumn}
            onDeleteColumn={handleDeleteColumn}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            draggedCard={draggedCard}
            isDragOver={dragOverColumn === col.id}
            onMouseDown={handleColumnMouseDown}
            isDragging={draggedColumn?.id === col.id}
          />
        );
      })}

      <button
        onClick={handleAddColumn}
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 z-40 flex items-center gap-2"
        title="Add new column"
      >
        <span className="text-2xl font-bold">+</span>
        <span className="font-semibold">Add Column</span>
      </button>
    </div>
  );
}
