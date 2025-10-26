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
    handleDrop: originalHandleDrop,
  } = useDragAndDrop(cards, setCards);

  // Wrap handleDrop to save card position to database
  const handleDrop = useCallback(async (e, targetColumnId) => {
    originalHandleDrop(e, targetColumnId);
    
    if (draggedCard && draggedCard.column_id !== targetColumnId) {
      // Save the card's new column to database
      try {
        await fetch(`/api/cards?id=${draggedCard.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ column_id: targetColumnId })
        });
      } catch (error) {
        console.error('Error saving card position:', error);
      }
    }
  }, [draggedCard, originalHandleDrop]);

  const {
    draggedColumn,
    handleColumnMouseDown,
    handleMouseMove,
    handleMouseUp: originalHandleMouseUp,
  } = useFreeFormDrag(columns, setColumns);

  // Wrap handleMouseUp to save column position to database
  const handleMouseUp = useCallback(async () => {
    if (draggedColumn) {
      // Save the column position to database
      const column = columns.find(col => col.id === draggedColumn.id);
      if (column) {
        try {
          await fetch(`/api/columns?id=${column.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              position_x: column.position.x,
              position_y: column.position.y
            })
          });
        } catch (error) {
          console.error('Error saving column position:', error);
        }
      }
    }
    originalHandleMouseUp();
  }, [draggedColumn, columns, originalHandleMouseUp]);

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

  const handleAddCard = useCallback(async (column_id) => {
    try {
      // Create card directly in database
      const response = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id,
          title: 'New card',
          description: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await response.json();
      
      // Add the card with its real database UUID
      setCards((prevCards) => [...prevCards, newCard]);
    } catch (error) {
      console.error('Error creating card:', error);
      alert('Failed to create card. Please try again.');
    }
  }, []);

  const handleDeleteCard = useCallback(async (cardId) => {
    try {
      // Delete from database
      const response = await fetch(`/api/cards?id=${cardId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // Remove from local state
      setCards((prev) => prev.filter((card) => card.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Failed to delete card. Please try again.');
    }
  }, []);

  const handleEditCard = useCallback(async (cardId, newTitle, newDescription) => {
    console.log('Board handleEditCard called:', { cardId, newTitle, newDescription });
    
    try {
      // Build update object with only the fields that are provided
      const updates = {};
      if (newTitle !== undefined) {
        updates.title = newTitle?.trim() || 'Untitled';
      }
      if (newDescription !== undefined) {
        updates.description = newDescription;
      }

      console.log('Sending updates to API:', updates);

      // Only update if there's something to update
      if (Object.keys(updates).length === 0) {
        console.log('No updates to send');
        return;
      }

      // Update in database
      const response = await fetch(`/api/cards?id=${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      const updatedCard = await response.json();
      console.log('Received updated card from API:', updatedCard);

      // Update local state with the response from database
      // Force a new object to ensure React detects the change
      setCards((prev) => {
        const newCards = prev.map((card) =>
          card.id === cardId ? { ...updatedCard } : card
        );
        console.log('Updated cards state:', newCards);
        console.log('Updated card details:', newCards.find(c => c.id === cardId));
        return newCards;
      });
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card. Please try again.');
    }
  }, []);

  const handleAddColumn = useCallback(async () => {
    const rightmostColumn = columns.reduce((max, col) => 
      col.position.x > max ? col.position.x : max, 0
    );
    
    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id: boardId,
          title: 'New Column',
          position_x: rightmostColumn + 350,
          position_y: 50
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create column');
      }

      const newColumn = await response.json();
      
      // Transform database format to frontend format
      const transformedColumn = {
        ...newColumn,
        position: { x: newColumn.position_x, y: newColumn.position_y }
      };
      
      setColumns((prev) => [...prev, transformedColumn]);
    } catch (error) {
      console.error('Error creating column:', error);
      alert('Failed to create column. Please try again.');
    }
  }, [columns, boardId]);

  const handleEditColumn = useCallback(async (columnId, newTitle) => {
    try {
      const response = await fetch(`/api/columns?id=${columnId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) {
        throw new Error('Failed to update column');
      }

      const updatedColumn = await response.json();
      
      // Transform database format to frontend format
      const transformedColumn = {
        ...updatedColumn,
        position: { x: updatedColumn.position_x, y: updatedColumn.position_y }
      };

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? transformedColumn : col
        )
      );
    } catch (error) {
      console.error('Error updating column:', error);
      alert('Failed to update column. Please try again.');
    }
  }, []);

  const handleDeleteColumn = useCallback(async (columnId) => {
    try {
      const response = await fetch(`/api/columns?id=${columnId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete column');
      }

      // Remove from local state (cards will be removed by database cascade)
      setColumns((prev) => prev.filter((col) => col.id !== columnId));
      setCards((prev) => prev.filter((card) => card.column_id !== columnId));
    } catch (error) {
      console.error('Error deleting column:', error);
      alert('Failed to delete column. Please try again.');
    }
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
