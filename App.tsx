import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PostList } from './components/PostList';
import { useFacebookManager } from './hooks/useFacebookManager';
import { interpretCommand } from './services/geminiService';
import type { Message, Post, InterpretedCommand, AppSettings } from './types';
import { PostModal } from './components/PostModal';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  const { posts, addPost, editPost, deletePost, getLatestPostId } = useFacebookManager();
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), text: 'Hello! Please connect your Facebook account in the settings to get started.', sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data?: Partial<Post>;
  }>({ isOpen: false, mode: 'create', data: {} });
  
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
        const storedSettings = localStorage.getItem('appSettings');
        return storedSettings ? JSON.parse(storedSettings) : { apiKeys: {}, facebook: { connected: false } };
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return { apiKeys: {}, facebook: { connected: false } };
    }
  });

  const isFacebookConnected = appSettings.facebook?.connected === true;

  useEffect(() => {
    if (isFacebookConnected && messages.length === 1 && messages[0].text.includes('connect your Facebook account')) {
        setMessages([{ id: Date.now(), text: 'Great, you are connected! How can I help you manage your Facebook page today?', sender: 'ai' }]);
    }
  }, [isFacebookConnected, messages]);


  const handleSaveSettings = (newSettings: AppSettings) => {
    const wasConnected = isFacebookConnected;
    setAppSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    setIsSettingsOpen(false);
    
    const isNowConnected = newSettings.facebook?.connected === true;

    if (isNowConnected && !wasConnected) {
        setMessages(prev => [...prev, { id: Date.now(), text: "Successfully connected to Facebook!", sender: 'ai' }]);
    } else {
        setMessages(prev => [...prev, { id: Date.now(), text: "Your settings have been saved.", sender: 'ai' }]);
    }
  };

  const handleCommand = async (commandText: string, attachedFile: string | null) => {
    if (!isFacebookConnected) return;
    setIsLoading(true);
    const userMessage: Message = { id: Date.now(), text: commandText, sender: 'user', attachment: attachedFile };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await interpretCommand(commandText);
      
      const aiResponseMessage: Message = { id: Date.now() + 1, text: result.responseText, sender: 'ai' };
      setMessages(prev => [...prev, aiResponseMessage]);

      await processInterpretedCommand(result, attachedFile);
    } catch (error) {
      console.error("Error interpreting command:", error);
      const errorMessage: Message = { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openCreateModal = (initialData: Partial<Post> = {}) => {
    setModalState({ isOpen: true, mode: 'create', data: initialData });
  };

  const openEditModal = (postToEdit: Post) => {
    setModalState({ isOpen: true, mode: 'edit', data: postToEdit });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, mode: 'create', data: {} });
  };
  
  const handleModalSubmit = (postData: Omit<Post, 'id' | 'author' | 'avatar'>) => {
    if (modalState.mode === 'create') {
        addPost(postData);
        setMessages(prev => [...prev, { id: Date.now(), text: "Great! Your post has been created.", sender: 'ai' }]);
    } else if (modalState.mode === 'edit' && modalState.data?.id) {
        editPost(modalState.data.id, postData);
        setMessages(prev => [...prev, { id: Date.now(), text: "Your post has been updated successfully.", sender: 'ai' }]);
    }
    closeModal();
  };

  const processInterpretedCommand = async (result: InterpretedCommand, attachedFile: string | null) => {
    const { intent, slots } = result;
    
    switch (intent) {
      case 'create_post':
        openCreateModal({
          caption: slots.caption || '',
          imageUrl: attachedFile || '',
          scheduledTime: slots.schedule_time || undefined,
        });
        break;
      
      case 'edit_post':
        let postIdToEdit = slots.post_id;
        if (postIdToEdit === 'LATEST') {
          postIdToEdit = getLatestPostId();
        }
        const postToEdit = posts.find(p => p.id === postIdToEdit);
        if (postToEdit) {
            if (slots.new_caption) {
                // If AI provides a new caption, open modal with it pre-filled
                openEditModal({ ...postToEdit, caption: slots.new_caption });
            } else {
                openEditModal(postToEdit);
            }
        } else {
           setMessages(prev => [...prev, { id: Date.now(), text: "I couldn't find the post you want to edit. Could you be more specific?", sender: 'ai' }]);
        }
        break;
        
      case 'delete_post':
        let postIdToDelete = slots.post_id;
        if (postIdToDelete === 'LATEST') {
          postIdToDelete = getLatestPostId();
        }
        if (postIdToDelete) {
          deletePost(postIdToDelete);
        } else {
           setMessages(prev => [...prev, { id: Date.now(), text: "I need to know which post to delete. Could you be more specific?", sender: 'ai' }]);
        }
        break;

      case 'list_posts':
        // The posts are always visible, but we can add a confirmation message.
        break;
        
      default:
        // 'unknown' intent is handled by the default responseText from Gemini
        break;
    }
  };
  
  return (
    <div className="flex h-screen font-sans antialiased text-slate-800">
      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        <div className="w-full md:w-1/3 xl:w-1/4 h-1/2 md:h-full flex flex-col bg-white border-r border-slate-200">
          <ChatInterface 
            messages={messages} 
            onSendCommand={handleCommand} 
            isLoading={isLoading} 
            onOpenSettings={() => setIsSettingsOpen(true)}
            isFacebookConnected={isFacebookConnected}
          />
        </div>
        <div className="w-full md:w-2/3 xl:w-3/4 h-1/2 md:h-full flex flex-col bg-slate-50">
          <PostList 
            posts={posts} 
            onOpenEditModal={openEditModal} 
            onDelete={deletePost}
            isFacebookConnected={isFacebookConnected}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </main>
      
      {modalState.isOpen && (
        <PostModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
          mode={modalState.mode}
          initialData={modalState.data}
        />
      )}
      
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={appSettings}
        />
      )}
    </div>
  );
};

export default App;