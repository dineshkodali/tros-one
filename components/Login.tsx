import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, ShoppingBag, UserPlus, Settings, ExternalLink } from 'lucide-react';
import { auth, db, resetFirebaseConfig } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const role = (email.toLowerCase().includes('admin') || email.toLowerCase() === 'dineshkodali.uk@gmail.com') ? 'Administrator' : 'Vendor';
        try {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            role: role,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr: any) {
          console.warn("Profile creation skipped.");
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      
      // Auto-provision demo accounts if they don't exist yet
      // This handles the 'auth/invalid-credential' error for first-time demo users
      const isDemoEmail = email === 'dineshkodali.uk@gmail.com' || email === 'vendor@tros.one';
      if (!isRegistering && isDemoEmail && (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found')) {
         try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const role = (email.toLowerCase().includes('admin') || email.toLowerCase() === 'dineshkodali.uk@gmail.com') ? 'Administrator' : 'Vendor';
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                role: role,
                createdAt: new Date().toISOString()
            });
            // Implicit success, loop ends, component re-renders on auth state change
            setIsLoading(false);
            return;
         } catch (createErr: any) {
            console.warn("Demo auto-creation failed", createErr.code);
            // If creation fails because email exists, it implies the password 'password123' was wrong for the existing user.
            if (createErr.code === 'auth/email-already-in-use') {
               setError("This demo account already exists but the password provided is incorrect. Please enter the correct password manually.");
               setPassword(''); // Clear wrong password
               setIsLoading(false);
               return;
            }
         }
      }

      // Firebase v9+ with Email Enumeration Protection enabled returns 'auth/invalid-credential' 
      // for both wrong password and user-not-found.
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid email or password. If you haven't created an account yet, please switch to 'Sign Up' or use a Demo button.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please sign in instead.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(err.message || "An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCreds = (type: 'admin' | 'vendor') => {
    if (type === 'admin') {
      setEmail('dineshkodali.uk@gmail.com');
      setPassword('password123');
    } else {
      setEmail('vendor@tros.one');
      setPassword('password123');
    }
    setError(null);
    // Automatically switch to login mode since these are existing demo accounts (conceptually)
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-300/20 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-lime-300/20 blur-[120px]"></div>
      </div>

      <button 
        onClick={resetFirebaseConfig}
        className="absolute top-4 right-4 p-2 text-emerald-800 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-2 text-xs font-medium"
      >
        <Settings size={16} /> Reset DB
      </button>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border border-white">
        {/* Header */}
        <div className="bg-[#064e3b] p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
             <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto mb-4 flex items-center justify-center backdrop-blur-sm border border-white/20">
                <span className="text-3xl font-bold text-white">T</span>
             </div>
             <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">TROS One</h1>
             <p className="text-emerald-200/80 text-sm font-medium">Business Operations Platform</p>
          </div>
        </div>

        <div className="p-8">
           <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#064e3b]">
                {isRegistering ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isRegistering ? 'Sign up to manage your inventory' : 'Sign in to access your dashboard'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-start gap-2 text-xs animate-fade-in text-left">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="font-medium">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="Email Address"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="Password"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#064e3b] hover:bg-[#065f46] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 transform active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                  {isRegistering ? <UserPlus className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="text-sm text-emerald-700 font-bold hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
             <div className="flex justify-center gap-3">
               <button onClick={() => fillDemoCreds('admin')} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1">
                  <ShieldCheck size={14}/> Admin Demo
               </button>
               <button onClick={() => fillDemoCreds('vendor')} className="px-4 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1">
                  <ShoppingBag size={14}/> Vendor Demo
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;