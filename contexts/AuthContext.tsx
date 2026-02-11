
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
  /* Added session property to resolve 'session does not exist' error in UpgradeModal.tsx */
  session: { access_token: string } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  /* Added session state to provide access token to components */
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase Auth state with our internal User type
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        /* Capture the Firebase ID token as the session access_token */
        const token = await firebaseUser.getIdToken();
        setSession({ access_token: token });

        // Since we aren't using Firestore yet, we map the Firebase user
        // and use default "Free" tier settings as placeholders.
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
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('Email or password is incorrect');
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      throw new Error(error.message || 'Google sign-in failed');
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('User already exists. Please sign in');
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    // No-op for now as profile data isn't in Firestore
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, loginWithGoogle, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
