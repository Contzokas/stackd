"use client";"use client";

import { useState, useEffect, useCallback, useMemo } from "react";import { useState, useEffect, useCallback } from "react";

import FreeFormColumn from "./FreeFormColumn";import FreeFormColumn from "./FreeFormColumn";

import { useDragAndDrop } from "@/hooks/useDragAndDrop";import { useDragAndDrop } from "@/hooks/useDragAndDrop";

import { useFreeFormDrag } from "@/hooks/useFreeFormDrag";import { useFreeFormDrag } from "@/hooks/useFreeFormDrag";



export default function Board({ boardId, initialData, onBoardUpdate }) {export default function Board({ boardId, boardData, onBoardUpdate }) {

  const [columns, setColumns] = useState([]);  const [columns, setColumns] = useState(boardData?.columns || []);

  const [cards, setCards] = useState([]);  const [cards, setCards] = useState(boardData?.cards || []);

  const [isInitialized, setIsInitialized] = useState(false);

  // Update local state when switching boards

  // Initialize board data when boardId changes  useEffect(() => {

  const boardKey = useMemo(() => boardId, [boardId]);    setColumns(boardData?.columns || []);

      setCards(boardData?.cards || []);

  useEffect(() => {  }, [boardId, boardData]);

    setColumns(initialData?.columns || []);

    setCards(initialData?.cards || []);  // Notify parent of changes for saving (debounced)

    setIsInitialized(true);  useEffect(() => {

  }, [boardKey]); // eslint-disable-line react-hooks/exhaustive-deps    const timeoutId = setTimeout(() => {

      if (onBoardUpdate) {

  // Use drag and drop hooks        onBoardUpdate(boardId, { columns, cards });

  const {      }

    draggedCard,    }, 500);

    dragOverColumn,

    handleDragStart,    return () => clearTimeout(timeoutId);

    handleDragEnd,  }, [columns, cards, boardId, onBoardUpdate]);

    handleDragOver,  useEffect(() => {

    handleDragLeave,    if (draggedColumn) {

    handleDrop,      document.addEventListener("mousemove", handleMouseMove);

  } = useDragAndDrop(cards, setCards);      document.addEventListener("mouseup", handleMouseUp);



  const {      return () => {

    draggedColumn,        document.removeEventListener("mousemove", handleMouseMove);

    handleColumnMouseDown,        document.removeEventListener("mouseup", handleMouseUp);

    handleMouseMove,      };

    handleMouseUp,    }

  } = useFreeFormDrag(columns, setColumns);  }, [draggedColumn, handleMouseMove, handleMouseUp]);



  // Notify parent of changes (debounced)  const handleAddCard = useCallback((column_id) => {

  useEffect(() => {    setCards((prevCards) => [

    if (!isInitialized) return;      ...prevCards,

      { id: `card_${Date.now()}`, title: "New card", description: "", column_id },

    const timeoutId = setTimeout(() => {    ]);

      if (onBoardUpdate) {  }, []);

        onBoardUpdate(boardId, { columns, cards });

      }  const handleDeleteCard = useCallback((cardId) => {

    }, 500);    setCards((prev) => prev.filter((card) => card.id !== cardId));

  }, []);

    return () => clearTimeout(timeoutId);

  }, [columns, cards]); // eslint-disable-line react-hooks/exhaustive-deps  const handleEditCard = useCallback((cardId, newTitle, newDescription) => {

    setCards((prev) =>

  // Add mouse event listeners for free-form dragging      prev.map((card) =>

  useEffect(() => {        card.id === cardId 

    if (draggedColumn) {          ? { 

      document.addEventListener("mousemove", handleMouseMove);              ...card, 

      document.addEventListener("mouseup", handleMouseUp);              title: newTitle?.trim() || card.title,

              description: newDescription !== undefined ? newDescription : card.description

      return () => {            } 

        document.removeEventListener("mousemove", handleMouseMove);          : card

        document.removeEventListener("mouseup", handleMouseUp);      )

      };    );

    }  }, []);

  }, [draggedColumn]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddColumn = useCallback(() => {

  const handleAddCard = useCallback((column_id) => {    // Find a position that doesn't overlap with existing columns

    setCards((prevCards) => [    const rightmostColumn = columns.reduce((max, col) => 

      ...prevCards,      col.position.x > max ? col.position.x : max, 0

      { id: `card_${Date.now()}`, title: "New card", description: "", column_id },    );

    ]);    

  }, []);    const newColumn = {

      id: `col_${Date.now()}`,

  const handleDeleteCard = useCallback((cardId) => {      title: "New Column",

    setCards((prev) => prev.filter((card) => card.id !== cardId));      position: { x: rightmostColumn + 350, y: 50 }

  }, []);    };

    

  const handleEditCard = useCallback((cardId, newTitle, newDescription) => {    setColumns((prev) => [...prev, newColumn]);

    setCards((prev) =>  }, [columns]);

      prev.map((card) =>

        card.id === cardId   const handleEditColumn = useCallback((columnId, newTitle) => {

          ? {     setColumns((prev) =>

              ...card,       prev.map((col) =>

              title: newTitle?.trim() || card.title,        col.id === columnId ? { ...col, title: newTitle } : col

              description: newDescription !== undefined ? newDescription : card.description      )

            }     );

          : card  }, []);

      )

    );  const handleDeleteColumn = useCallback((columnId) => {

  }, []);    setColumns((prev) => prev.filter((col) => col.id !== columnId));

    // Also delete all cards in this column

  const handleAddColumn = useCallback(() => {    setCards((prev) => prev.filter((card) => card.column_id !== columnId));

    // Find a position that doesn't overlap with existing columns  }, []);

    const rightmostColumn = columns.reduce((max, col) => 

      col.position.x > max ? col.position.x : max, 0  return (

    );    <div

          className="relative w-full min-h-screen overflow-auto"

    const newColumn = {      style={{

      id: `col_${Date.now()}`,        minWidth: "90%",

      title: "New Column",        minHeight: "100vh",

      position: { x: rightmostColumn + 350, y: 50 }        padding: "1px",

    };        background: "linear-gradient(to bottom, #1a1a1a, #2a2a2a)",

          }}

    setColumns((prev) => [...prev, newColumn]);    >

  }, [columns]);      {columns.map((col) => {

        const cardsForCol = cards.filter((card) => card.column_id === col.id);

  const handleEditColumn = useCallback((columnId, newTitle) => {        return (

    setColumns((prev) =>          <FreeFormColumn

      prev.map((col) =>            key={col.id}

        col.id === columnId ? { ...col, title: newTitle } : col            column={col}

      )            cards={cardsForCol}

    );            onAddCard={handleAddCard}

  }, []);            onDeleteCard={handleDeleteCard}

            onEditCard={handleEditCard}

  const handleDeleteColumn = useCallback((columnId) => {            onEditColumn={handleEditColumn}

    setColumns((prev) => prev.filter((col) => col.id !== columnId));            onDeleteColumn={handleDeleteColumn}

    // Also delete all cards in this column            onDragStart={handleDragStart}

    setCards((prev) => prev.filter((card) => card.column_id !== columnId));            onDragEnd={handleDragEnd}

  }, []);            onDragOver={handleDragOver}

            onDragLeave={handleDragLeave}

  return (            onDrop={handleDrop}

    <div            draggedCard={draggedCard}

      className="relative w-full min-h-screen overflow-auto"            isDragOver={dragOverColumn === col.id}

      style={{            onMouseDown={handleColumnMouseDown}

        minWidth: "90%",            isDragging={draggedColumn?.id === col.id}

        minHeight: "100vh",          />

        padding: "1px",        );

        background: "linear-gradient(to bottom, #1a1a1a, #2a2a2a)",      })}

      }}

    >      {/* Floating Add Column Button */}

      {columns.map((col) => {      <button

        const cardsForCol = cards.filter((card) => card.column_id === col.id);        onClick={handleAddColumn}

        return (        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-2xl transition-all hover:scale-110 z-40 flex items-center gap-2"

          <FreeFormColumn        title="Add new column"

            key={col.id}      >

            column={col}        <span className="text-2xl font-bold">+</span>

            cards={cardsForCol}        <span className="font-semibold">Add Column</span>

            onAddCard={handleAddCard}      </button>

            onDeleteCard={handleDeleteCard}    </div>

            onEditCard={handleEditCard}  );

            onEditColumn={handleEditColumn}}

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

      {/* Floating Add Column Button */}
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
