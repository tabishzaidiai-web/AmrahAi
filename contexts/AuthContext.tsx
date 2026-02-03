import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper for local guest user simulation - Persistent across sessions via LocalStorage
const getLocalGuest = (): User => {
  const saved = localStorage.getItem('amrah_guest_user');
  if (saved) return JSON.parse(saved);
  
  const newUser: User = {
    id: 'guest-' + Math.random().toString(36).substr(2, 9),
    email: 'guest@maison.com',
    name: 'Maison Guest',
    role: 'Admin', // Default to Admin in Local Mode for full feature testing
    tier: 'Maison',
    registrationDate: Date.now(),
    lastLogin: Date.now(),
    credits: { images: 1000, videos: 500 },
    totalGenerated: 0
  };
  localStorage.setItem('amrah_guest_user', JSON.stringify(newUser));
  return newUser;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial local sync
  useEffect(() => {
    const guest = getLocalGuest();
    setUser(guest);
    setSession({ user: { id: guest.id, email: guest.email } });
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Local mode bypass
    console.log("Local Login Attempt:", email);
  };

  const signup = async (email: string, password: string, name: string) => {
    // Local mode bypass
    console.log("Local Signup Attempt:", email, name);
  };

  const logout = async () => {
    localStorage.removeItem('amrah_guest_user');
    setUser(null);
    setSession(null);
    // Auto-recreate guest for continuous demo experience
    setTimeout(() => {
      const guest = getLocalGuest();
      setUser(guest);
      setSession({ user: { id: guest.id } });
    }, 500);
  };

  const signInWithGoogle = async () => {
    console.log("Local Google Auth Bypass");
  };

  const refreshProfile = async () => {
    const guest = getLocalGuest();
    setUser(guest);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, signup, logout, signInWithGoogle, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
