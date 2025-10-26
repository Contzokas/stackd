"use client";
import { useState, useEffect, useCallback } from "react";
import FreeFormColumn from "./FreeFormColumn";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useFreeFormDrag } from "@/hooks/useFreeFormDrag";

export default function Board() {
  const STORAGE_KEY = "stackd-board-v1";

  const defaultColumns = [
    { id: "col_1", title: "To Do", position: { x: 50, y: 50 } },
    { id: "col_2", title: "In Progress", position: { x: 400, y: 50 } },
    { id: "col_3", title: "Done", position: { x: 750, y: 50 } },
  ];

  const defaultCards = [
    { id: "card_1", title: "Task 1", column_id: "col_1" },
    { id: "card_2", title: "Task 2", column_id: "col_2" },
    { id: "card_3", title: "Task 3", column_id: "col_3" },
  ];

  const [columns, setColumns] = useState(defaultColumns);
  const [cards, setCards] = useState(defaultCards);
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Load from localStorage AFTER hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.columns) setColumns(parsed.columns);
        if (parsed.cards) setCards(parsed.cards);
      }
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever columns or cards change (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ columns, cards }));
      } catch (e) {
        console.error("Failed to save board:", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [columns, cards, isLoaded]);

  // Add mouse event listeners for free-form dragging
  useEffect(() => {
    if (draggedColumn) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [draggedColumn, handleMouseMove, handleMouseUp]);

  const handleAddCard = useCallback((column_id) => {
    setCards((prevCards) => [
      ...prevCards,
      { id: `card_${Date.now()}`, title: "New card", column_id },
    ]);
  }, []);

  const handleDeleteCard = useCallback((cardId) => {
    setCards((prev) => prev.filter((card) => card.id !== cardId));
  }, []);

  const handleEditCard = useCallback((cardId, newTitle) => {
    if (!newTitle?.trim()) return;
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, title: newTitle.trim() } : card
      )
    );
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
    </div>
  );
}
