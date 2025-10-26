"use client";
import { useState, memo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";

function CardModalContent({ card, onClose, onSave, onDelete }) {
  const { user } = useUser();
  const [title, setTitle] = useState(card.title);
  const [localDescription, setLocalDescription] = useState(card.description || "");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  
  // Track the last saved values to compare against
  const lastSavedTitle = useRef(card.title);
  const lastSavedDescription = useRef(card.description || "");
  const isSavingRef = useRef(false);

  // Update local state when card prop changes from external source
  // but not if we're in the middle of typing/saving
  useEffect(() => {
    if (!isSavingRef.current) {
      if (card.title !== title) {
        console.log('CardModal: Updating title from prop', { from: title, to: card.title });
        setTitle(card.title);
        lastSavedTitle.current = card.title;
      }
      if ((card.description || "") !== localDescription) {
        console.log('CardModal: Updating description from prop', { from: localDescription, to: card.description });
        setLocalDescription(card.description || "");
        lastSavedDescription.current = card.description || "";
      }
    }
  }, [card.title, card.description]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!card.id) return;
    
    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/comments?cardId=${card.id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        console.error('Failed to fetch comments:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [card.id]);

  // Load comments on mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Post new comment
  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          comment: newComment.trim(),
        }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        console.log('New comment data received:', newCommentData);
        setComments([...comments, newCommentData]);
        setNewComment("");
      } else {
        const errorText = await response.text();
        console.error('Failed to post comment:', errorText);
        alert('Failed to post comment. Please try again.');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Error posting comment. Please check your connection and try again.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Update comment
  const handleUpdateComment = async (commentId) => {
    if (!editingCommentText.trim()) return;

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: editingCommentText.trim() }),
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === commentId ? updatedComment : c));
        setEditingCommentId(null);
        setEditingCommentText("");
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments?id=${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setComments(comments.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleSave = useCallback(() => {
    // Only send title if it's different, and description if it's different
    const updates = {};
    if (title.trim() !== lastSavedTitle.current) {
      updates.title = title.trim();
    }
    if (localDescription !== lastSavedDescription.current) {
      updates.description = localDescription;
    }
    
    console.log('CardModal handleSave:', {
      currentTitle: title,
      currentDesc: localDescription,
      lastSavedTitle: lastSavedTitle.current,
      lastSavedDesc: lastSavedDescription.current,
      updates
    });
    
    // Only call onSave if there are actual changes
    if (Object.keys(updates).length > 0) {
      // Set saving flag
      isSavingRef.current = true;
      
      // Update refs to prevent re-saving the same values
      if (updates.title !== undefined) {
        lastSavedTitle.current = updates.title;
      }
      if (updates.description !== undefined) {
        lastSavedDescription.current = updates.description;
      }
      
      console.log('Calling onSave with updates:', updates);
      onSave(card.id, updates);
      
      // Clear saving flag after a short delay
      setTimeout(() => {
        isSavingRef.current = false;
      }, 500);
    } else {
      console.log('No changes to save');
    }
  }, [card.id, title, localDescription, onSave]);

  const handleManualSave = useCallback(() => {
    console.log('Manual save button clicked');
    // Force save with current values regardless of refs
    const updates = {
      title: title.trim(),
      description: localDescription
    };
    
    console.log('Force saving with current values:', updates);
    
    // Update refs
    lastSavedTitle.current = updates.title;
    lastSavedDescription.current = updates.description;
    
    onSave(card.id, updates);
  }, [card.id, title, localDescription, onSave]);

  // Auto-save changes after user stops typing (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const titleChanged = title.trim() !== lastSavedTitle.current;
      const descriptionChanged = localDescription !== lastSavedDescription.current;
      
      if (titleChanged || descriptionChanged) {
        handleSave();
      }
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [title, localDescription, handleSave]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#2E3436] rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="border-b border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-2 py-1"
                placeholder="Card title"
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white ml-4 text-2xl"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description Section */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              📝 Description
            </label>
            <textarea
              value={localDescription}
              onChange={(e) => setLocalDescription(e.target.value)}
              className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[150px] resize-y"
              placeholder="Add a more detailed description..."
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-700 pt-4">
            <label className="block text-white font-semibold mb-3 text-sm">
              💬 Comments ({comments.length})
            </label>
            
            {/* New Comment Input */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handlePostComment();
                  }
                }}
                className="w-full bg-[#1a1a1a] text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[80px] resize-y"
                placeholder="Write a comment... (Ctrl/Cmd + Enter to post)"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handlePostComment}
                  disabled={isPostingComment || !newComment.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPostingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {isLoadingComments ? (
                <p className="text-gray-400 text-sm text-center py-4">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-[#1a1a1a] rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      {comment.imageUrl && (
                        <img 
                          src={comment.imageUrl} 
                          alt={comment.username}
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">@{comment.username}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {user?.id === comment.user_id && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditingCommentText(comment.comment);
                                }}
                                className="text-gray-400 hover:text-blue-400 text-xs px-2 py-1"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-400 hover:text-red-400 text-xs px-2 py-1"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {editingCommentId === comment.id ? (
                          <div>
                            <textarea
                              value={editingCommentText}
                              onChange={(e) => setEditingCommentText(e.target.value)}
                              className="w-full bg-[#2E3436] text-white rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm min-h-[60px]"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleUpdateComment(comment.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentText("");
                                }}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{comment.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card Info */}
          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-xs">
              Card ID: <span className="text-gray-500">{card.id}</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-between items-center">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this card?')) {
                onDelete(card.id);
                onClose();
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            Delete Card
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleManualSave();
                onClose();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}

function CardModal({ card, isOpen, onClose, onSave, onDelete }) {
  if (!isOpen) return null;
  
  return <CardModalContent card={card} onClose={onClose} onSave={onSave} onDelete={onDelete} />;
}

// Memoize the modal to prevent re-renders
export default memo(CardModal);
