
import React, { useState } from 'react';
import type { ApiKeys, AppSettings } from '../types';
import { Icon } from './icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  initialSettings: AppSettings;
}

const providers = [
  { id: 'groq', name: 'Groq' },
  { id: 'openrouter', name: 'OpenRouter' },
  { id: 'tavily', name: 'Tavily AI' },
  { id: 'cohere', name: 'Cohere' },
  { id: 'together', name: 'Together AI' },
] as const;

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  const handleApiKeyChange = (provider: keyof ApiKeys, value: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: value,
      }
    }));
  };

  const handleFacebookConnectToggle = () => {
      setSettings(prev => ({
          ...prev,
          facebook: {
              ...prev.facebook,
              connected: !prev.facebook.connected
          }
      }))
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  if (!isOpen) return null;
  
  const isConnected = settings.facebook?.connected;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Settings</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
             
            {/* Facebook Integration */}
            <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Facebook Integration</h3>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    {isConnected ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icon name="facebook" className="w-6 h-6 text-blue-600" />
                                <div>
                                    <p className="font-semibold text-slate-700">Connected to Facebook</p>
                                    <p className="text-xs text-slate-500">Ready to manage your posts.</p>
                                </div>
                            </div>
                            <button type="button" onClick={handleFacebookConnectToggle} className="text-sm font-semibold text-red-600 hover:text-red-800">Disconnect</button>
                        </div>
                    ) : (
                         <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">Connect your account to get started.</p>
                            <button type="button" onClick={handleFacebookConnectToggle} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700">Connect</button>
                         </div>
                    )}
                </div>
            </div>

            {/* Safe Posting Guide */}
            <div className="space-y-3">
                <h3 className="font-semibold text-slate-800">Safe Posting Practices</h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 space-y-2">
                    <div className="flex items-start gap-3">
                        <Icon name="shield-check" className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                        <div>
                           <span className="font-semibold">Prioritize Quality:</span> Always aim to create high-quality, engaging content that feels human-written.
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Icon name="shield-check" className="w-5 h-5 mt-0.5 text-green-600 flex-shrink-0" />
                        <div>
                           <span className="font-semibold">Avoid Spam Tactics:</span> Don't overuse hashtags or post repetitive content. Let the AI help you vary your posts.
                        </div>
                    </div>
                </div>
            </div>

            {/* API Keys */}
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-800">Optional API Keys</h3>
              <div className="p-3 bg-slate-100 rounded-md">
                <label htmlFor="google" className="block text-sm font-medium text-slate-700">Google Gemini</label>
                <input
                  id="google"
                  type="text"
                  value="Using pre-configured key"
                  disabled
                  className="mt-1 w-full p-2 bg-slate-200 border border-slate-300 rounded-md text-slate-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-slate-500">The Google Gemini API key is securely managed by the platform.</p>
              </div>

              {providers.map(provider => (
                <div key={provider.id}>
                  <label htmlFor={provider.id} className="block text-sm font-medium text-slate-700">{provider.name}</label>
                  <input
                    id={provider.id}
                    type="password"
                    value={settings.apiKeys[provider.id as keyof ApiKeys] || ''}
                    onChange={(e) => handleApiKeyChange(provider.id as keyof ApiKeys, e.target.value)}
                    placeholder={`Enter your ${provider.name} API key`}
                    className="mt-1 w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>

          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};