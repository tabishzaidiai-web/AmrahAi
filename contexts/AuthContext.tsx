import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  session: { access_token: string } | null;
  loading: boolean;
  isCloudRestricted: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCloudRestricted, setIsCloudRestricted] = useState(false);

  useEffect(() => {
    // Proactive domain check for restricted environments (e.g., AI Studio previews)
    const hostname = window.location.hostname;
    if (hostname.includes('googleusercontent.com') || hostname.includes('webcontainer.io')) {
      console.info("AMRAH: Restricted environment detected. Cloud Sync may be limited.");
      setIsCloudRestricted(true);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          setSession({ access_token: token });

          const mappedUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Maison User',
            role: 'User',
            tier: 'Free',
            registrationDate: Date.now(),
            lastLogin: Date.now(),
            credits: { images: 3, videos: 1 },
            totalGenerated: 0
          };
          setUser(mappedUser);
          setIsCloudRestricted(false);
        } catch (e) {
          console.warn("Firebase token failure in isolated environment.");
        }
      } else {
        // Persist local-mode user if already set
        if (!user || (user.id !== 'local-mode')) {
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: any) => {
    const code = error.code || '';
    const message = error.message || '';
    if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
      setIsCloudRestricted(true);
      // We don't throw here if we want the UI to handle it gracefully
    }
    throw error;
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const loginAsGuest = () => {
    const guestUser: User = {
      id: 'local-mode',
      email: 'guest@amrah.ai',
      name: 'Maison Guest',
      role: 'User',
      tier: 'Maison', // High-fidelity testing tier
      registrationDate: Date.now(),
      lastLogin: Date.now(),
      credits: { images: 999, videos: 999 },
      totalGenerated: 0
    };
    setUser(guestUser);
    setSession({ access_token: 'local-session-token' });
    setIsCloudRestricted(true);
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setSession(null);
    setIsCloudRestricted(false);
  };

  const refreshProfile = async () => {};

  return (
    <AuthContext.Provider value={{ user, session, loading, isCloudRestricted, login, loginWithGoogle, loginAsGuest, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};