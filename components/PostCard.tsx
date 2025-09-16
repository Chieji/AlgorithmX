import React, { useState } from 'react';
import type { Post } from '../types';
import { Icon } from './icons';

interface PostCardProps {
  post: Post;
  onOpenEditModal: (post: Post) => void;
  onDelete: (postId: string) => void;
}

const timeAgo = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 5) return "Just now";
    
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30.44);
    const years = Math.round(days / 365.25);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    
    return `${years} year${years > 1 ? 's' : ''} ago`;
  } catch (e) {
    return dateString;
  }
};


const formatScheduleTime = (timeValue?: string): string => {
  if (!timeValue) return '';
  try {
    const date = new Date(timeValue);
    if (isNaN(date.getTime())) return timeValue;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return timeValue;
  }
};


export const PostCard: React.FC<PostCardProps> = ({ post, onOpenEditModal, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleEdit = () => {
    onOpenEditModal(post);
    setIsMenuOpen(false);
  };

  const handleDeleteRequest = () => {
    setIsMenuOpen(false);
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = () => {
    onDelete(post.id);
    setIsConfirmingDelete(false);
  };

  const handleCancelDelete = () => {
    setIsConfirmingDelete(false);
  };
  
  const isScheduled = post.scheduledTime && new Date(post.scheduledTime) > new Date();

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden ${isScheduled ? 'border-l-4 border-l-blue-500' : ''}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-slate-800">{post.author}</p>
                <p className="text-xs text-slate-500">{timeAgo(post.timestamp)}</p>
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                  <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                      <Icon name="edit" className="w-4 h-4"/> Edit Post
                  </button>
                  <button onClick={handleDeleteRequest} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                      <Icon name="trash" className="w-4 h-4" /> Delete Post
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-slate-700 text-sm whitespace-pre-wrap">{post.caption}</p>
          {isScheduled && (
            <div className="mt-3 p-2 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200 flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4" />
              <span>Scheduled for: {formatScheduleTime(post.scheduledTime)}</span>
            </div>
          )}
        </div>
        {post.imageUrl && (
          <div className="bg-slate-100">
            <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
          </div>
        )}
      </div>

      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <p className="text-slate-800 font-semibold text-center sm:text-left">Are you sure you want to delete this post?</p>
                <div className="mt-6 flex justify-end gap-3">
                <button onClick={handleCancelDelete} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                    No
                </button>
                <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
                    Yes
                </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};