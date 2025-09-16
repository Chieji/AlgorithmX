
import { useState } from 'react';
import type { Post } from '../types';

const initialPosts: Post[] = [
  {
    id: 'post3',
    author: 'CodeCrafters Inc.',
    avatar: 'https://i.pravatar.cc/48?u=post3',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    caption: 'Just pushed a new update for our flagship product. Check out the new features and let us know what you think! #SoftwareUpdate #Tech',
    imageUrl: 'https://picsum.photos/seed/post3/800/600',
  },
  {
    id: 'post2',
    author: 'CodeCrafters Inc.',
    avatar: 'https://i.pravatar.cc/48?u=post2',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    caption: 'Team outing was a huge success! Great to unwind and bond with the colleagues. Here\'s to more fun times ahead. #WorkLifeBalance',
    imageUrl: 'https://picsum.photos/seed/post2/800/600',
  },
  {
    id: 'post1',
    author: 'CodeCrafters Inc.',
    avatar: 'https://i.pravatar.cc/48?u=post1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    caption: 'We are hiring! Looking for passionate frontend developers to join our team. If you love React and building beautiful UIs, apply now! Link in bio. #Hiring #FrontendDev #ReactJS',
    imageUrl: null,
  },
];

export const useFacebookManager = () => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const addPost = (postData: Omit<Post, 'id' | 'author' | 'avatar'>) => {
    const newPost: Post = {
      id: `post${Date.now()}`,
      author: 'CodeCrafters Inc.',
      avatar: `https://i.pravatar.cc/48?u=post${Date.now()}`,
      ...postData,
    };
    setPosts(prevPosts => [newPost, ...prevPosts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  const editPost = (postId: string, updates: Partial<Post>) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, ...updates } : post
      ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  };
  
  const getLatestPostId = (): string | undefined => {
      const sortedPosts = [...posts].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return sortedPosts.length > 0 ? sortedPosts[0].id : undefined;
  };

  return { posts, addPost, editPost, deletePost, getLatestPostId };
};
