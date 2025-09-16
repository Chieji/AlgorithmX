import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { Icon } from './icons';

export const Login: React.FC = () => {
  const { handleCredentialResponse } = useAuth();
  const googleButtonDiv = useRef<HTMLDivElement>(null);
  const [isGsiLoading, setIsGsiLoading] = useState(true);
  const [gsiError, setGsiError] = useState<string | null>(null);

  const initializeGsi = useCallback(() => {
    if (!googleButtonDiv.current) {
        return;
    }

    // FIX: Cast `import.meta` to `any` to resolve TypeScript error 'Property 'env' does not exist on type 'ImportMeta''.
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      setGsiError("Google Sign-In is not configured. VITE_GOOGLE_CLIENT_ID is missing from environment variables.");
      setIsGsiLoading(false);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        googleButtonDiv.current,
        { theme: "outline", size: "large", type: 'standard', text: 'signin_with', shape: 'rectangular' }
      );

      window.google.accounts.id.prompt();
    } catch (error)
    {
      console.error("Google Sign-In initialization error:", error);
      setGsiError("An error occurred during Google Sign-In setup.");
    }
    finally {
      setIsGsiLoading(false);
    }
  }, [handleCredentialResponse]);

  useEffect(() => {
    let scriptLoadCheckId: ReturnType<typeof setInterval>;
    let timeoutId: ReturnType<typeof setTimeout>;

    if (typeof window.google?.accounts?.id !== 'undefined') {
      initializeGsi();
      return;
    }

    scriptLoadCheckId = setInterval(() => {
      if (typeof window.google?.accounts?.id !== 'undefined') {
        clearInterval(scriptLoadCheckId);
        if (timeoutId) clearTimeout(timeoutId);
        initializeGsi();
      }
    }, 100);

    timeoutId = setTimeout(() => {
      clearInterval(scriptLoadCheckId);
      if (typeof window.google?.accounts?.id === 'undefined') {
        setGsiError("Google Sign-In script failed to load. Please check your internet connection and try again.");
        setIsGsiLoading(false);
      }
    }, 5000);

    return () => {
      clearInterval(scriptLoadCheckId);
      clearTimeout(timeoutId);
    };
  }, [initializeGsi]);


  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center items-center gap-4 mb-6">
          <Icon name="algorithmx" className="w-12 h-12 text-indigo-600" />
          <h1 className="text-5xl font-bold text-slate-800 tracking-tight">AlgorithmX</h1>
        </div>
        <p className="text-slate-600 mb-8 max-w-sm mx-auto">
          The intelligent, conversational AI agent for managing your Facebook Page content.
        </p>
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Welcome</h2>
          <p className="text-slate-500 mb-6">Sign in to continue to your dashboard.</p>
          
          <div className="flex justify-center items-center min-h-[40px]">
            {isGsiLoading && (
              <div className="flex items-center justify-center p-2 border border-slate-200 rounded-md w-full bg-slate-50">
                <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="ml-2 text-sm text-slate-500">Loading Sign-In...</span>
              </div>
            )}
            {gsiError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md w-full flex items-center gap-2 text-left">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{gsiError}</span>
              </div>
            )}
            <div ref={googleButtonDiv} className={`flex justify-center ${isGsiLoading || gsiError ? 'hidden' : ''}`}></div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-8">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
};