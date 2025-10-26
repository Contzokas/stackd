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
  const [isSyncing, setIsSyncing] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');

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
    if (!activeBoard) {
      setActiveBoardData(null);
      return;
    }

    console.log('Fetching board data for:', activeBoard);

    try {
      const response = await fetch(`/api/boards/${activeBoard}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Received board data:', {
          boardId: data.id,
          columns: data.columns?.length || 0,
          cards: data.cards?.length || 0
        });
        setActiveBoardData(data);
      } else {
        console.error('Failed to fetch board:', response.status);
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
    fetchActiveBoardData();
  }, [fetchActiveBoardData]);

  // Set up real-time updates using polling (fallback since broadcasts are timing out)`r`n  useEffect(() => {`r`n    if (!activeBoard || !user) return;`r`n`r`n    console.log(' Setting up polling for board:', activeBoard);`r`n    `r`n    // Poll every 3 seconds for updates`r`n    const interval = setInterval(() => {`r`n      console.log(' Polling for board updates...');`r`n      setIsSyncing(true);`r`n      fetchActiveBoardData();`r`n      setTimeout(() => setIsSyncing(false), 500);`r`n    }, 3000);`r`n`r`n    // Cleanup on unmount or when board changes`r`n    return () => {`r`n      console.log(' Stopping polling for board:', activeBoard);`r`n      clearInterval(interval);`r`n    };`r`n  }, [activeBoard, fetchActiveBoardData, user]);

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
      
      {/* Real-time sync indicator */}
      {isSyncing && (
        <div className="fixed top-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-pulse">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Syncing changes...
        </div>
      )}
      
      {/* Realtime connection status (only show if not connected) */}
      {realtimeStatus !== 'SUBSCRIBED' && realtimeStatus !== 'disconnected' && activeBoard && (
        <div className="fixed top-20 right-4 bg-yellow-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          Real-time: {realtimeStatus}
        </div>
      )}
      
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

