import React, { useState, useRef, useEffect } from 'react';
import type { Message, GoogleUser } from '../types';
import { Icon } from './icons';
import { useAuth } from '../AuthContext';

interface ChatInterfaceProps {
  user: GoogleUser;
  messages: Message[];
  onSendCommand: (command: string, file: string | null) => void;
  isLoading: boolean;
  onOpenSettings: () => void;
  isFacebookConnected: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, messages, onSendCommand, isLoading, onOpenSettings, isFacebookConnected }) => {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { signOutUser } = useAuth();

  const handleSend = async () => {
    if ((input.trim() || attachedFile) && isFacebookConnected) {
      let fileData: string | null = null;
      if (attachedFile) {
        fileData = await fileToBase64(attachedFile);
      }
      onSendCommand(input.trim(), fileData);
      setInput('');
      setAttachedFile(null);
      setFilePreview(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };
  
  const removeAttachment = () => {
      setAttachedFile(null);
      setFilePreview(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isDisabled = isLoading || !isFacebookConnected;

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
            <Icon name="algorithmx" className="w-8 h-8 text-indigo-600" />
            <div>
                <h1 className="text-xl font-bold text-slate-800">AlgorithmX</h1>
                <p className="text-sm text-slate-500">Your personal content manager</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={onOpenSettings} 
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-full hover:text-indigo-600 transition-colors"
                aria-label="Open settings"
            >
                <Icon name="settings" className="w-6 h-6" />
            </button>
            <div className="relative group">
                <img src={user.picture || undefined} alt="User" className="w-9 h-9 rounded-full cursor-pointer"/>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-slate-200 hidden group-hover:block">
                     <div className="px-4 py-3 border-b">
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                     </div>
                     <button onClick={signOutUser} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        Sign Out
                     </button>
                </div>
            </div>
        </div>
      </header>
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
        <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                 {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                    <Icon name="algorithmx" className="w-5 h-5" />
                  </div>
                )}
                <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-slate-200 text-slate-700 rounded-bl-lg'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
                {msg.sender === 'user' && msg.user && (
                    <img src={msg.user.picture || undefined} alt="User avatar" className="w-8 h-8 rounded-full flex-shrink-0" />
                )}
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                     <Icon name="algorithmx" className="w-5 h-5" />
                  </div>
                   <div className="max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 rounded-bl-lg">
                      <div className="flex items-center space-x-2">
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-.3s]"></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse [animation-delay:-.15s]"></div>
                           <div className="w-2 h-2 bg-slate-500 rounded-full animate-pulse"></div>
                      </div>
                   </div>
               </div>
            )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-200">
        {filePreview && (
          <div className="relative w-24 h-24 mb-2 rounded-lg overflow-hidden">
            <img src={filePreview} alt="attachment preview" className="w-full h-full object-cover" />
            <button 
                onClick={removeAttachment}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/75 transition-colors">
                <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !isDisabled && handleSend()}
            placeholder={isFacebookConnected ? "Type your command..." : "Please connect to Facebook in settings"}
            className="flex-1 w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
            disabled={isDisabled}
          />
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled} 
            className="p-2 text-slate-500 hover:text-indigo-600 disabled:text-slate-300 transition-colors">
            <Icon name="paperclip" className="w-6 h-6" />
          </button>
          <button 
            onClick={handleSend}
            disabled={isDisabled || (!input.trim() && !attachedFile)} 
            className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
            <Icon name="send" className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};