"use client";
import { useState, memo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

function CardModalContent({ card, onClose, onSave, onDelete }) {
  const { user } = useUser();
  const [title, setTitle] = useState(card.title);
  const [localDescription, setLocalDescription] = useState(card.description || "");
  const [imageUrl, setImageUrl] = useState(card.image_url || "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const fileInputRef = useRef(null);
  
  // Track the last saved values to detect actual data changes from database
  const lastSyncedTitle = useRef(card.title);
  const lastSyncedDescription = useRef(card.description || "");
  const lastSyncedImageUrl = useRef(card.image_url || "");
  const currentCardIdRef = useRef(card.id);

  // Sync local state when:
  // 1. Card ID changes (switching to different card)
  // 2. Card title/description changes from database (after save or reload)
  useEffect(() => {
    const titleChanged = card.title !== lastSyncedTitle.current;
    const descriptionChanged = (card.description || "") !== lastSyncedDescription.current;
    const imageUrlChanged = (card.image_url || "") !== lastSyncedImageUrl.current;
    const cardIdChanged = currentCardIdRef.current !== card.id;
    
    if (cardIdChanged || titleChanged || descriptionChanged || imageUrlChanged) {
      console.log('CardModal: Syncing state -', {
        cardIdChanged,
        titleChanged,
        descriptionChanged,
        imageUrlChanged,
        newTitle: card.title,
        newDescription: card.description,
        newImageUrl: card.image_url
      });
      
      // Update refs
      currentCardIdRef.current = card.id;
      lastSyncedTitle.current = card.title;
      lastSyncedDescription.current = card.description || "";
      lastSyncedImageUrl.current = card.image_url || "";
      
      // Update local state
      setTitle(card.title);
      setLocalDescription(card.description || "");
      setImageUrl(card.image_url || "");
    }
  }, [card.id, card.title, card.description, card.image_url])

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

  const handleManualSave = useCallback(() => {
    console.log('=== Manual save clicked ===');
    console.log('Saving:', { title: title.trim(), description: localDescription, image_url: imageUrl });
    
    // Always save current values
    const updates = {
      title: title.trim(),
      description: localDescription,
      image_url: imageUrl
    };
    
    onSave(card.id, updates);
  }, [card.id, title, localDescription, imageUrl, onSave]);

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setIsUploadingImage(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${card.id}-${Date.now()}.${fileExt}`;
      const filePath = `card-images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('card-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      console.log('Image uploaded:', publicUrl);
      setImageUrl(publicUrl);

      // Auto-save with new image
      onSave(card.id, {
        title: title.trim(),
        description: localDescription,
        image_url: publicUrl
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image removal
  const handleRemoveImage = async () => {
    if (!imageUrl) return;

    try {
      // Extract file path from URL if it's a Supabase URL
      if (imageUrl.includes('card-images/')) {
        const urlParts = imageUrl.split('card-images/');
        const filePath = `card-images/${urlParts[1].split('?')[0]}`;
        
        // Delete from storage
        await supabase.storage
          .from('card-images')
          .remove([filePath]);
      }

      setImageUrl('');
      
      // Auto-save without image
      onSave(card.id, {
        title: title.trim(),
        description: localDescription,
        image_url: ''
      });
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // Auto-save: Trigger save 1 second after user stops typing
  useEffect(() => {
    const titleChanged = title.trim() !== card.title;
    const descriptionChanged = localDescription !== (card.description || "");
    const imageUrlChanged = imageUrl !== (card.image_url || "");
    
    // Only auto-save if something actually changed
    if (titleChanged || descriptionChanged || imageUrlChanged) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-saving after typing stopped');
        const updates = {
          title: title.trim(),
          description: localDescription,
          image_url: imageUrl
        };
        onSave(card.id, updates);
      }, 1000); // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId);
    }
  }, [title, localDescription, imageUrl, card.id, card.title, card.description, card.image_url, onSave]);

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
              {card.createdByUsername && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                  {card.createdByImageUrl && (
                    <img 
                      src={card.createdByImageUrl} 
                      alt={card.createdByUsername}
                      className="w-5 h-5 rounded-full"
                    />
                  )}
                  <span>Created by @{card.createdByUsername}</span>
                </div>
              )}
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
          {/* Image Section */}
          <div>
            <label className="block text-white font-semibold mb-2 text-sm">
              🖼️ Image
            </label>
            {imageUrl ? (
              <div className="relative">
                <img 
                  src={imageUrl} 
                  alt="Card image"
                  className="w-full rounded-lg max-h-96 object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg transition-colors"
                  title="Remove image"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-400 hover:text-white rounded-lg p-4 border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploadingImage ? (
                    <span>📤 Uploading...</span>
                  ) : (
                    <span>📎 Click to upload image (max 5MB)</span>
                  )}
                </button>
              </div>
            )}
          </div>

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
