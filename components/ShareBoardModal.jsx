"use client";
import { useState, useCallback, useEffect, useRef } from "react";

export default function ShareBoardModal({ boardId, boardName, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [role, setRole] = useState("editor");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState("");
  const searchTimeoutRef = useRef(null);

  // Search for users by username
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchUsers]);

  // Fetch existing members
  const fetchMembers = useCallback(async () => {
    if (!boardId) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/share`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [boardId]);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      setSearchQuery("");
      setSelectedUser(null);
      setShowResults(false);
    }
  }, [isOpen, fetchMembers]);

  const handleShare = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!selectedUser) {
      setError("Please select a user");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/boards/${boardId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, role }),
      });

      if (response.ok) {
        setSearchQuery("");
        setSelectedUser(null);
        setShowResults(false);
        fetchMembers();
      } else {
        const errorText = await response.text();
        setError(errorText || 'Failed to share board');
      }
    } catch (error) {
      setError('Error sharing board');
      console.error('Error sharing board:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(`@${user.username}`);
    setShowResults(false);
    setSearchResults([]);
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this user from the board?')) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/share?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-[#2E3436] rounded-lg shadow-2xl overflow-hidden min-w-[300px] max-w-[400px] z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Share &quot;{boardName}&quot;</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Share Form */}
        <form onSubmit={handleShare} className="mb-4">
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-gray-300 mb-2">
                Search by username
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedUser(null);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="@username"
                className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoComplete="off"
              />
              
              {/* Search Results Dropdown */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute w-full mt-1 bg-[#1a1a1a] rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-10 border border-gray-700">
                  {isSearching ? (
                    <div className="p-3 text-gray-400 text-sm">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left p-3 hover:bg-[#2E3436] transition-colors flex items-center gap-2"
                      >
                        {user.imageUrl && (
                          <img 
                            src={user.imageUrl} 
                            alt={user.username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div>
                          <p className="text-white text-sm">@{user.username}</p>
                          {user.fullName && (
                            <p className="text-gray-400 text-xs">{user.fullName}</p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-gray-400 text-sm">No users found</div>
                  )}
                </div>
              )}
              
              <p className="text-gray-400 text-sm mt-1">
                Type @ followed by username to search
              </p>
            </div>
            
            <div>
              <label className="block text-gray-300 mb-2">
                Permission Level
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="viewer">👁️ Viewer (read-only)</option>
                <option value="editor">✏️ Editor (create/edit content)</option>
                <option value="admin">👑 Admin (manage people + analytics)</option>
              </select>
              <p className="text-gray-400 text-xs mt-2">
                {role === 'viewer' && '• Can only view board content'}
                {role === 'editor' && '• Can create/edit cards and columns'}
                {role === 'admin' && '• Can manage members, view analytics, and edit content'}
              </p>
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-2 rounded">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Sharing...' : 'Share Board'}
            </button>
          </div>
        </form>

        {/* Members List */}
        {members.length > 0 && (
          <div className="border-t border-gray-700 pt-3">
            <h3 className="text-white font-semibold mb-2 text-sm">Shared With:</h3>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-2 gap-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {member.imageUrl && (
                      <img 
                        src={member.imageUrl} 
                        alt={member.username}
                        className="w-6 h-6 rounded-full shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">@{member.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.user_id, e.target.value)}
                      className="bg-[#2E3436] text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="viewer">👁️ Viewer</option>
                      <option value="editor">✏️ Editor</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      className="text-red-400 hover:text-red-300 text-sm px-2"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
