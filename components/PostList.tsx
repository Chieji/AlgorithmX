import React from 'react';
import type { Post } from '../types';
import { PostCard } from './PostCard';
import { Icon } from './icons';

interface PostListProps {
  posts: Post[];
  onOpenEditModal: (post: Post) => void;
  onDelete: (postId: string) => void;
  isFacebookConnected: boolean;
  onOpenSettings: () => void;
}

export const PostList: React.FC<PostListProps> = ({ posts, onOpenEditModal, onDelete, isFacebookConnected, onOpenSettings }) => {
  const now = new Date();
  
  const scheduledPosts = posts
    .filter(p => p.scheduledTime && new Date(p.scheduledTime) > now)
    .sort((a, b) => new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime());
    
  const publishedPosts = posts
    .filter(p => !p.scheduledTime || new Date(p.scheduledTime) <= now)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getSubtitle = () => {
    const scheduledCount = scheduledPosts.length;
    const publishedCount = publishedPosts.length;
    
    if (scheduledCount === 0 && publishedCount === 0) {
      if (!isFacebookConnected) return "Connect your account to get started.";
      return "A live view of your page content.";
    }

    const parts = [];
    if (publishedCount > 0) {
        parts.push(`${publishedCount} Published`);
    }
    if (scheduledCount > 0) {
        parts.push(`${scheduledCount} Scheduled`);
    }
    return parts.join(' • ');
  };

  return (
    <div className="flex-1 flex flex-col">
      <header className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800">Your Posts</h2>
        <p className="text-sm text-slate-500">{getSubtitle()}</p>
      </header>
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {!isFacebookConnected ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 bg-slate-100 rounded-lg p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Icon name="facebook" className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Connect Your Account</h3>
            <p className="mt-1 max-w-sm">Please connect your Facebook account in the settings to start creating, editing, and managing your posts.</p>
            <button
                onClick={onOpenSettings}
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
                Go to Settings
            </button>
          </div>
        ) : posts.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {scheduledPosts.length > 0 && (
              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Scheduled</h3>
                <div className="space-y-6">
                  {scheduledPosts.map(post => (
                    <PostCard key={post.id} post={post} onOpenEditModal={onOpenEditModal} onDelete={onDelete} />
                  ))}
                </div>
              </div>
            )}
            
            {publishedPosts.length > 0 && (
              <div>
                 <h3 className="mb-4 text-sm font-semibold text-slate-500 uppercase tracking-wider">Published</h3>
                 <div className="space-y-6">
                    {publishedPosts.map(post => (
                        <PostCard key={post.id} post={post} onOpenEditModal={onOpenEditModal} onDelete={onDelete} />
                    ))}
                 </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Posts Yet</h3>
            <p className="mt-1">Use the chat assistant to create your first post.</p>
          </div>
        )}
      </div>
    </div>
  );
};
