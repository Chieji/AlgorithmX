import React, { useState, useEffect, useRef } from 'react';
import type { Post } from '../types';
import { Icon } from './icons';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: Omit<Post, 'id' | 'author' | 'avatar'>) => void;
  mode: 'create' | 'edit';
  initialData?: Partial<Post>;
}

const toDateTimeLocal = (isoString?: string): string => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return '';
      // Adjust for timezone offset to display local time correctly in the input
      const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
      const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
      return localISOTime;
    } catch (e) {
      console.error("Error formatting date:", e);
      return '';
    }
};

export const PostModal: React.FC<PostModalProps> = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
  const [caption, setCaption] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setCaption(initialData.caption || '');
      setImage(initialData.imageUrl || null);
      setScheduledTime(toDateTimeLocal(initialData.scheduledTime));
      setTimestamp(toDateTimeLocal(initialData.timestamp || new Date().toISOString()));
    }
  }, [initialData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scheduleDate = scheduledTime ? new Date(scheduledTime).toISOString() : undefined;
    const postDate = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    onSubmit({ caption, timestamp: postDate, scheduledTime: scheduleDate, imageUrl: image });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{mode === 'edit' ? 'Edit Post' : 'Create New Post'}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
              className="w-full p-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="timestamp" className="block text-xs font-medium text-slate-600 mb-1">Post Time (for backdating)</label>
                    <input
                        id="timestamp"
                        type="datetime-local"
                        value={timestamp}
                        onChange={(e) => setTimestamp(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="scheduledTime" className="block text-xs font-medium text-slate-600 mb-1">Schedule Time (optional)</label>
                     <div className="relative">
                        <Icon name="calendar" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            id="scheduledTime"
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="w-full p-2 pl-9 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            {image ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={image} alt="Preview" className="w-full h-auto max-h-60 object-cover" />
                 <button 
                    type="button"
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/75 transition-colors">
                    <Icon name="trash" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-md text-slate-500 hover:bg-slate-50 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
                <Icon name="image" className="w-8 h-8 mb-2" />
                <span className="font-semibold">Add Photo</span>
                <span className="text-xs">or drag and drop</span>
              </button>
            )}

          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              {mode === 'edit' ? 'Save Changes' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
