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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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
      } else {
        if (!user || (user.id !== 'maison-guest' && user.id !== 'local-mode')) {
          setSession(null);
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthError = (error: any) => {
    if (error.code === 'auth/unauthorized-domain') {
      setIsCloudRestricted(true);
    }
    throw error;
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('Email or password is incorrect');
      }
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
      tier: 'Pro',
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
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists. Please sign in');
      }
      handleAuthError(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
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