import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl space-y-8 animate-lux-in">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-serif text-emerald-950">{isLogin ? 'Welcome Back' : 'Join the Maison'}</h2>
          <p className="text-[10px] text-emerald-950/40 font-bold uppercase tracking-[0.3em]">Access Neural Visual Intelligence</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-2xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest ml-2">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-sm focus:bg-white outline-none" placeholder="Christian Dior" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest ml-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-sm focus:bg-white outline-none" placeholder="you@maison.com" />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-emerald-950/40 uppercase tracking-widest ml-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-6 py-4 rounded-2xl text-sm focus:bg-white outline-none" placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-emerald-950 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-gold transition-all shadow-xl">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-6 text-emerald-950/10 py-2">
          <div className="h-[1px] flex-1 bg-current" />
          <span className="text-[9px] font-bold uppercase tracking-widest">or</span>
          <div className="h-[1px] flex-1 bg-current" />
        </div>

        <button onClick={signInWithGoogle} className="w-full py-5 border border-emerald-50 rounded-full flex items-center justify-center gap-4 hover:bg-emerald-50 transition-all text-[11px] font-bold text-emerald-950 uppercase tracking-widest">
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Google
        </button>

        <div className="text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest hover:text-gold transition-colors">
            {isLogin ? "Don't have an account? Sign Up" : "Already a member? Sign In"}
          </button>
        </div>

        <button onClick={onClose} className="absolute top-8 right-8 text-emerald-950/20 hover:text-gold transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
