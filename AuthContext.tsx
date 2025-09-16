import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { GoogleUser } from './types';

// Declare google accounts object from the GSI script
declare global {
  interface Window {
    google: any;
  }
}

// Helper to decode JWT from Google Sign-In
const decodeJwt = (token: string): GoogleUser | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    // Map Google's token fields to our User type
    return {
        sub: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
    };
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};


interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  handleCredentialResponse: (response: any) => void;
  signOutUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for a saved session on initial load
    try {
      const savedUserJson = sessionStorage.getItem('googleUser');
      if (savedUserJson) {
        setUser(JSON.parse(savedUserJson));
      }
    } catch (error) {
        console.error("Could not parse user from sessionStorage", error);
        sessionStorage.removeItem('googleUser');
    }
    setLoading(false);
  }, []);

  const handleCredentialResponse = useCallback((response: any) => {
    const idToken = response.credential;
    const userObject = decodeJwt(idToken);
    if (userObject) {
      setUser(userObject);
      sessionStorage.setItem('googleUser', JSON.stringify(userObject));
    } else {
        console.error("Google sign-in failed: could not decode token.");
    }
  }, []);

  const signOutUser = () => {
    // Invalidate the session for Google One Tap
    if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    sessionStorage.removeItem('googleUser');
  };

  const value = {
    user,
    loading,
    handleCredentialResponse,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
