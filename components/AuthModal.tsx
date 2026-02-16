import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle, loginAsGuest, isCloudRestricted } = useAuth();

  const currentHostname = window.location.hostname;

  const getErrorMessage = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    if (err.code) return err.code;
    return JSON.stringify(err);
  };

  const errorString = getErrorMessage(error);
  // Detect if the error is related to domain authorization
  const isUnauthorizedDomain = 
    isCloudRestricted ||
    errorString.toLowerCase().includes('unauthorized-domain') || 
    errorString.toLowerCase().includes('unauthorized domain') ||
    errorString.toLowerCase().includes('auth/unauthorized-domain') ||
    errorString.toLowerCase().includes('environment is not authorized');

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
      console.error("Maison Auth Fault:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error("Maison Identity Hub Error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = () => {
    loginAsGuest();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[300] bg-emerald-950/95 backdrop-blur-3xl flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[4rem] p-12 shadow-2xl space-y-10 animate-lux-in relative border border-emerald-50">
        
        <div className="text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-full mx-auto flex items-center justify-center text-gold border border-emerald-100/50 mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20c4.083 0 7.774-2.436 9.262-6H12z" /></svg>
          </div>
          <h2 className="text-3xl font-serif text-emerald-950 italic">
            {isUnauthorizedDomain ? 'Environment Isolation' : isLogin ? 'Maison Identity' : 'Registry Entry'}
          </h2>
          <p className="text-[10px] text-emerald-950/30 font-bold uppercase tracking-[0.5em]">Neural Visual Intelligence Access</p>
        </div>

        {isUnauthorizedDomain ? (
          <div className="space-y-8 animate-in zoom-in-95 duration-500">
            <div className="p-8 bg-amber-50/50 border border-amber-200 rounded-[2.5rem] space-y-6 text-center">
              <div className="flex flex-col items-center gap-4 text-amber-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em]">Neural Local Sync Enabled</p>
                <p className="text-[12px] text-amber-900/70 leading-relaxed font-serif italic">
                  Cloud authentication is limited in this isolated environment (<code className="bg-white/80 px-2 py-0.5 rounded text-amber-950 border border-amber-200 font-mono text-[10px]">{currentHostname}</code>).
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={handleBypass}
                  className="w-full py-6 bg-emerald-950 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-gold transition-all shadow-2xl shadow-emerald-950/20 active:scale-[0.98]"
                >
                  Enter Maison Local Mode
                </button>
                <p className="text-[9px] mt-6 text-emerald-950/30 font-bold uppercase tracking-widest italic">Experience full visual fidelity with local persistence.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-5 border border-emerald-50 rounded-3xl flex items-center justify-center gap-5 hover:bg-emerald-50 transition-all group active:scale-[0.98] shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-[0.2em]">Authorize with Google</span>
              </button>

              <div className="flex items-center gap-6 py-2">
                <div className="flex-1 h-[1px] bg-emerald-50"></div>
                <span className="text-[9px] font-bold text-emerald-950/10 uppercase tracking-[0.4em]">Maison Vault</span>
                <div className="flex-1 h-[1px] bg-emerald-50"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && !isUnauthorizedDomain && (
                <p className="text-[10px] text-center font-bold text-red-500 uppercase tracking-widest">{errorString}</p>
              )}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest ml-4">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-8 py-5 rounded-3xl text-sm font-serif italic focus:bg-white outline-none transition-all shadow-inner" placeholder="Maison Representative" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest ml-4">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-8 py-5 rounded-3xl text-sm focus:bg-white outline-none transition-all shadow-inner" placeholder="name@maison.com" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-emerald-950/30 uppercase tracking-widest ml-4">Access Key</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-emerald-50/20 border-emerald-50 px-8 py-5 rounded-3xl text-sm focus:bg-white outline-none transition-all shadow-inner" placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-950 text-white rounded-full text-[11px] font-bold uppercase tracking-[0.5em] hover:bg-gold transition-all shadow-2xl active:scale-[0.98] mt-4">
                {loading ? 'Orchestrating...' : isLogin ? 'Access Vault' : 'Registry Entry'}
              </button>
            </form>

            <div className="text-center pt-8 space-y-4">
              <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-[0.3em] hover:text-gold transition-colors block w-full">
                {isLogin ? "Request New Identity" : "Return to Vault Access"}
              </button>
              <div className="h-[1px] w-8 bg-gold/20 mx-auto" />
              <button onClick={handleBypass} className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] hover:text-emerald-950 transition-colors block w-full">
                Enter as Maison Guest
              </button>
            </div>
          </>
        )}

        <button onClick={onClose} className="absolute top-10 right-10 text-emerald-950/10 hover:text-gold transition-colors">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
