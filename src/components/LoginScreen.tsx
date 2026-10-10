import React, { useState } from 'react';
import { LogIn, Shield, Sparkles, UserCheck, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { DEMO_USER } from '../data/mockBusquedas';
import { Usuario } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('carlos.morales@talentbook.com');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulate quick authentication
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(DEMO_USER);
    }, 600);
  };

  const handleQuickDemoLogin = () => {
    setEmail(DEMO_USER.email);
    setPassword('demo1234');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(DEMO_USER);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Wordmark */}
        <div className="flex justify-center items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl bg-[#007685] text-white flex items-center justify-center font-bold text-lg tracking-wider shadow-md">
            TB
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#EE7825] ring-2 ring-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Talent Book
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Commercial Sales Platform
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#007685]/10 text-[#007685] border border-[#007685]/20">
            <Shield className="w-3.5 h-3.5 text-[#007685]" />
            Internal Sales Representative Access
          </span>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Corporate Email
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685] transition-all"
                  placeholder="sales.rep@talentbook.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#20BFD0]/40 focus:border-[#007685] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-white bg-[#007685] hover:bg-[#005d69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#007685] transition-all shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign in to Talent Book</span>
                </>
              )}
            </button>
          </form>

          {/* Demo account quick access box */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="bg-[#F5F5F6] border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#007685]" />
                  Demo Account
                </span>
                <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Ready to use
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Preconfigured user: <strong className="text-slate-800">{DEMO_USER.nombre}</strong> ({DEMO_USER.rol})
              </p>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-slate-300 hover:border-[#007685] hover:text-[#007685] text-slate-700 transition-all flex items-center justify-center gap-1.5 shadow-2xs group"
              >
                <span>Sign in directly with Demo account</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Production authentication connects to the .NET backend on Azure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
