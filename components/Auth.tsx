
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Zap, Loader2, AlertCircle, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
           <div className="relative z-10 flex flex-col items-center">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-blue-400" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Digital Logbook</h1>
              <p className="text-slate-400 text-sm mt-1 font-medium tracking-wide">PLTP ULUMBU</p>
           </div>
           
           {/* Background Deco */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Form Container */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Selamat Datang</h2>
            <p className="text-sm text-slate-500 mt-1">
              Silakan masuk untuk mengakses logbook
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
                 <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                 <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
               <div className="relative">
                 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                   required
                   type="email" 
                   value={email}
                   onChange={e => setEmail(e.target.value)}
                   className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                   placeholder="nama@pln.co.id"
                 />
               </div>
            </div>

            <div className="space-y-1">
               <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                 <input 
                   required
                   type={showPassword ? "text" : "password"}
                   value={password}
                   onChange={e => setPassword(e.target.value)}
                   className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-700"
                   placeholder="••••••••"
                 />
                 <button
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md transition-colors"
                 >
                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Masuk Aplikasi
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-xs text-slate-400">
             © 2024 Digital Logbook PLTP Ulumbu. Secure Access.
           </p>
        </div>

      </div>
    </div>
  );
}
