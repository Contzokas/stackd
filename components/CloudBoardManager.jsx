"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Board from "./Board_Original";
import BoardSelector from "./BoardSelector";
import UserAccountButton from "./UserAccountButton";
import { supabase } from "@/lib/supabase";

export default function CloudBoardManager() {
  const { user, isLoaded } = useUser();
  const [boards, setBoards] = useState([]);
  const [activeBoard, setActiveBoard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBoardData, setActiveBoardData] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all boards for the user
  const fetchBoards = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch('/api/boards');
      if (response.ok) {
        const data = await response.json();
        setBoards(data);
        
        // Set first board as active if none selected
        if (data.length > 0 && !activeBoard) {
          setActiveBoard(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, activeBoard]);

  // Fetch active board with columns and cards
  const fetchActiveBoardData = useCallback(async () => {
    if (!activeBoard) return;

    try {
      const response = await fetch(`/api/boards/${activeBoard}`);
      if (response.ok) {
        const data = await response.json();
        setActiveBoardData(data);
      }
    } catch (error) {
      console.error('Error fetching board data:', error);
    }
  }, [activeBoard]);

  // Initial load
  useEffect(() => {
    if (isLoaded && user) {
      fetchBoards();
    }
  }, [isLoaded, user, fetchBoards]);

  // Load active board data
  useEffect(() => {
    if (activeBoard) {
      fetchActiveBoardData();
    }
  }, [activeBoard, fetchActiveBoardData]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!activeBoard) return;

    // Subscribe to columns changes
    const columnsChannel = supabase
      .channel(`board_${activeBoard}_columns`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'columns',
          filter: `board_id=eq.${activeBoard}`,
        },
        () => {
          fetchActiveBoardData();
        }
      )
      .subscribe();

    // Subscribe to cards changes
    const cardsChannel = supabase
      .channel(`board_${activeBoard}_cards`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        () => {
          fetchActiveBoardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(columnsChannel);
      supabase.removeChannel(cardsChannel);
    };
  }, [activeBoard, fetchActiveBoardData]);

  const handleCreateBoard = useCallback(async (name) => {
    console.log('Creating board:', name);
    setIsCreating(true);
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const newBoard = await response.json();
        console.log('New board created:', newBoard);
        setBoards((prev) => [newBoard, ...prev]);
        setActiveBoard(newBoard.id);
      } else {
        const errorText = await response.text();
        console.error('Failed to create board:', response.status, errorText);
        alert(`Failed to create board: ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating board:', error);
      alert(`Error creating board: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }, []);

  const handleRenameBoard = useCallback(async (boardId, newName) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        const updatedBoard = await response.json();
        setBoards((prev) =>
          prev.map((board) =>
            board.id === boardId ? updatedBoard : board
          )
        );
      }
    } catch (error) {
      console.error('Error renaming board:', error);
    }
  }, []);

  const handleDeleteBoard = useCallback(async (boardId) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBoards((prev) => {
          const filtered = prev.filter((board) => board.id !== boardId);
          
          // If deleting active board, switch to first remaining board
          if (boardId === activeBoard && filtered.length > 0) {
            setActiveBoard(filtered[0].id);
          }
          
          return filtered;
        });
      }
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  }, [activeBoard]);

  const handleBoardUpdate = useCallback(async (boardId, { columns, cards }) => {
    if (!boardId) return;

    try {
      // Update columns
      for (const column of columns) {
        if (column.id.startsWith('col_')) {
          // This is a temporary ID from local state, create new column
          await fetch('/api/columns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              board_id: boardId,
              title: column.title,
              position_x: column.position.x,
              position_y: column.position.y,
            }),
          });
        } else {
          // Update existing column
          await fetch(`/api/columns?id=${column.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: column.title,
              position_x: column.position.x,
              position_y: column.position.y,
            }),
          });
        }
      }

      // Update cards
      for (const card of cards) {
        if (card.id.startsWith('card_')) {
          // Create new card
          await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              column_id: card.column_id,
              title: card.title,
              description: card.description || '',
            }),
          });
        } else {
          // Update existing card
          await fetch(`/api/cards?id=${card.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              column_id: card.column_id,
              title: card.title,
              description: card.description || '',
            }),
          });
        }
      }
    } catch (error) {
      console.error('Error updating board:', error);
    }
  }, []);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Please sign in to continue</div>
      </div>
    );
  }

  return (
    <>
      <UserAccountButton />
      
      {boards.length > 0 && (
        <BoardSelector
          boards={boards}
          activeBoard={activeBoard}
          onSelectBoard={setActiveBoard}
          onCreateBoard={handleCreateBoard}
          onRenameBoard={handleRenameBoard}
          onDeleteBoard={handleDeleteBoard}
        />
      )}
      
      {activeBoardData ? (
        <Board
          key={activeBoard}
          boardId={activeBoard}
          initialColumns={activeBoardData.columns}
          initialCards={activeBoardData.cards}
          onBoardUpdate={handleBoardUpdate}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-white text-lg">No boards yet. Create your first board to get started!</p>
          <button
            onClick={() => handleCreateBoard('My First Board')}
            disabled={isCreating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Your First Board'}
          </button>
        </div>
      )}
    </>
  );
}
