"use client";
import { useState, useEffect, useCallback } from "react";
import Board from "./Board_Original";
import BoardSelector from "./BoardSelector";

export default function MultiBoardManager() {
  const STORAGE_KEY = "stackd-boards-v2";
  
  const defaultBoard = {
    id: "board_1",
    name: "My First Board",
    columns: [
      { id: "col_1", title: "To Do", position: { x: 50, y: 50 } },
      { id: "col_2", title: "In Progress", position: { x: 400, y: 50 } },
      { id: "col_3", title: "Done", position: { x: 750, y: 50 } },
    ],
    cards: [
      { id: "card_1", title: "Task 1", description: "", column_id: "col_1" },
      { id: "card_2", title: "Task 2", description: "", column_id: "col_2" },
      { id: "card_3", title: "Task 3", description: "", column_id: "col_3" },
    ],
  };

  const [boards, setBoards] = useState([defaultBoard]);
  const [activeBoard, setActiveBoard] = useState("board_1");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.boards && parsed.boards.length > 0) {
          setBoards(parsed.boards);
          setActiveBoard(parsed.activeBoard || parsed.boards[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load boards:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoard }));
      } catch (e) {
        console.error("Failed to save boards:", e);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [boards, activeBoard, isLoaded]);

  const handleCreateBoard = useCallback((name) => {
    const newBoard = {
      id: `board_${Date.now()}`,
      name,
      columns: [
        { id: `col_${Date.now()}_1`, title: "To Do", position: { x: 50, y: 50 } },
        { id: `col_${Date.now()}_2`, title: "In Progress", position: { x: 400, y: 50 } },
        { id: `col_${Date.now()}_3`, title: "Done", position: { x: 750, y: 50 } },
      ],
      cards: [],
    };

    setBoards((prev) => [...prev, newBoard]);
    setActiveBoard(newBoard.id);
  }, []);

  const handleRenameBoard = useCallback((boardId, newName) => {
    setBoards((prev) =>
      prev.map((board) =>
        board.id === boardId ? { ...board, name: newName } : board
      )
    );
  }, []);

  const handleDeleteBoard = useCallback((boardId) => {
    setBoards((prev) => {
      const filtered = prev.filter((board) => board.id !== boardId);
      
      // If deleting active board, switch to first remaining board
      if (boardId === activeBoard && filtered.length > 0) {
        setActiveBoard(filtered[0].id);
      }
      
      return filtered;
    });
  }, [activeBoard]);

  const handleBoardUpdate = useCallback((boardId, { columns, cards }) => {
    setBoards((prev) =>
      prev.map((board) =>
        board.id === boardId ? { ...board, columns, cards } : board
      )
    );
  }, []);

  const activeBoardData = boards.find((b) => b.id === activeBoard);

  return (
    <>
      <BoardSelector
        boards={boards}
        activeBoard={activeBoard}
        onSelectBoard={setActiveBoard}
        onCreateBoard={handleCreateBoard}
        onRenameBoard={handleRenameBoard}
        onDeleteBoard={handleDeleteBoard}
      />
      
      {activeBoardData && (
        <Board
          key={activeBoard}
          boardId={activeBoard}
          initialColumns={activeBoardData.columns}
          initialCards={activeBoardData.cards}
          onBoardUpdate={handleBoardUpdate}
        />
      )}
    </>
  );
}
