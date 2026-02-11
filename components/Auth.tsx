import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC<any> = ({ onLogin }) => {
  const [step, setStep] = useState<'method' | 'email' | 'code'>('method');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      // On success, the AuthContext state will update and App.tsx will handle the redirect
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    // This part is still using the mock "code" flow for now
    setTimeout(() => {
      setStep('code');
      setIsLoading(false);
    }, 1000);
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) return;
    // Mock legacy login for demo purposes
    onLogin({
      id: 'mock-id',
      email: email,
      name: email.split('@')[0],
      role: 'User',
      tier: 'Free',
      credits: { images: 3, videos: 1 }
    });
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-8 animate-in fade-in duration-700">
      <div className="max-w-md w-full space-y-12 text-center">
        <div className="space-y-4">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-serif tracking-[0.25em] text-emerald-950 font-bold uppercase leading-none">AMRAH</span>
            <span className="text-[9px] font-bold text-gold uppercase tracking-[0.6em] mt-3">Visual Intelligence Lab</span>
          </div>
          <h1 className="text-3xl font-serif text-emerald-950 pt-10">Maison Authorization</h1>
          <p className="text-emerald-950/40 text-[10px] font-bold uppercase tracking-[0.3em]">Sign in to access e-commerce-ready neural shoots</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-2xl text-center">
            {error}
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-5 px-6 border border-emerald-50 rounded-2xl flex items-center justify-center gap-4 hover:bg-emerald-50 transition-all group btn-luxury"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-widest">Authorize with Google</span>
                </>
              )}
            </button>
            <div className="flex items-center gap-6 text-emerald-950/10">
              <div className="h-[1px] flex-1 bg-current" />
              <span className="text-[9px] font-bold uppercase tracking-widest">or</span>
              <div className="h-[1px] flex-1 bg-current" />
            </div>
            <button 
              onClick={() => setStep('email')}
              className="w-full py-5 border border-emerald-50 rounded-2xl text-[11px] font-bold text-emerald-950/60 uppercase tracking-widest hover:text-gold transition-all"
            >
              Sign in with Corporate Email
            </button>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-8 animate-in slide-in-from-right-4">
            <div className="space-y-3 text-left">
              <label className="text-[10px] font-bold text-emerald-950/40 uppercase tracking-widest ml-4">Maison Email</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@maison-dna.com"
                className="w-full px-8 py-5 bg-emerald-50/20 border-emerald-50 rounded-3xl text-sm focus:bg-white"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-emerald-950 text-white rounded-3xl text-[11px] font-bold uppercase tracking-widest hover:bg-gold transition-all shadow-xl"
            >
              {isLoading ? 'Sending Authentication Code...' : 'Send Verification Code'}
            </button>
            <button onClick={() => setStep('method')} className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block mx-auto hover:text-emerald-950 transition-colors">Back to Options</button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className="space-y-8 animate-in slide-in-from-right-4 text-center">
            <p className="text-xs text-emerald-950/60 font-light">We've sent a 6-digit code to <br/><span className="font-bold text-emerald-950">{email}</span></p>
            <div className="flex justify-center">
               <input 
                type="text" 
                maxLength={6}
                required 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-48 text-center text-3xl font-serif tracking-[0.6em] py-5 bg-emerald-50/20 border-emerald-50 rounded-3xl"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading || code.length < 6}
              className={`w-full py-5 rounded-3xl text-[11px] font-bold uppercase tracking-widest transition-all ${code.length === 6 ? 'bg-emerald-950 text-white hover:bg-gold shadow-xl' : 'bg-emerald-50 text-emerald-200 cursor-not-allowed'}`}
            >
              {isLoading ? 'Synchronizing Session...' : 'Authorize Session'}
            </button>
            <div className="space-y-3 pt-2">
               <button type="button" onClick={() => setStep('email')} className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block mx-auto hover:text-emerald-950">Resend Code</button>
               <button type="button" onClick={() => setStep('method')} className="text-[10px] font-bold text-emerald-950/30 uppercase tracking-widest block mx-auto hover:text-emerald-950">Change Method</button>
            </div>
          </form>
        )}

        <div className="pt-20 text-[9px] text-emerald-950/20 font-medium leading-relaxed max-w-xs mx-auto">
          Authorization grants access to e-commerce neural synthesis. 
          Assets are brand-safe and private to your account.
        </div>
      </div>
    </div>
  );
};

export default Auth;