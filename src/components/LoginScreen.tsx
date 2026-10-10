import React, { useRef, useState } from 'react';
import { DEMO_USER } from '../data/mockBusquedas';
import { Usuario } from '../types';
import { TalentBookLogo } from './TalentBookLogo';
import { Button } from './ui/Button';
import { Field } from './ui/Field';

interface LoginScreenProps {
  onLoginSuccess: (user: Usuario) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('carlos.morales@talentbook.com');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter your corporate email and password to continue.');
      emailRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Simulated authentication; production connects to the .NET backend on Azure.
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
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <TalentBookLogo className="h-10" showText />

        <h1 className="mt-8 text-3xl font-semibold leading-tight">Sign in</h1>
        <p className="mt-1.5 text-ink-2">Sales team access to searches, the profile book and the candidate pool.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <Field id="email" label="Corporate email">
            <input
              ref={emailRef}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              autoCapitalize="none"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              placeholder="name@company.com"
            />
          </Field>

          <Field id="password" label="Password">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
            />
          </Field>

          {errorMessage && (
            <p role="alert" className="rounded-md border border-danger/25 bg-danger-wash px-3 py-2 text-[13px] text-danger">
              {errorMessage}
            </p>
          )}

          <Button type="submit" variant="primary" loading={isLoading} loadingLabel="Signing in…" className="w-full">
            Sign in
          </Button>
        </form>

        <div className="mt-8 border-t border-rule pt-6">
          <p className="text-[13px] text-ink-2">
            For demos, use the preconfigured account of <strong className="font-semibold text-ink">{DEMO_USER.nombre}</strong>,{' '}
            {DEMO_USER.rol}.
          </p>
          <Button variant="secondary" onClick={handleQuickDemoLogin} disabled={isLoading} className="mt-3 w-full">
            Use the demo account
          </Button>
        </div>

        <p className="mt-10 text-center text-xs text-ink-3">Production sign-in connects to the .NET backend on Azure.</p>
      </div>
    </main>
  );
};
