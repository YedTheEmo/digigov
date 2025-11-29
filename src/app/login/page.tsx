"use client";

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/cases';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', { email, password, callbackUrl, redirect: false });
      if (res?.ok) {
        window.location.href = res.url || callbackUrl;
      } else {
        setError('Invalid credentials. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
      setLoading(false);
      console.error('Login error:', err);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg-secondary)] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-md shadow-md">
          <div className="px-8 pt-8 pb-6 border-b border-[var(--color-border-primary)]">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              DigiGov
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Sign in with your official account.
            </p>
          </div>

          {error && (
            <div className="px-8 pt-4">
              <div className="rounded-md border border-[var(--color-error)] bg-[var(--color-error-light)] px-3 py-2.5 text-sm text-[var(--color-error)] flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
                <span className="flex-1">{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} className="px-8 pt-4 pb-8 space-y-5">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--color-border-primary)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Sign in
            </Button>

            {process.env.NEXT_PUBLIC_DEMO === '1' && (
              <div className="mt-4 rounded-md border border-[var(--color-info)] bg-[var(--color-info-light)] px-3 py-2 text-xs text-[var(--color-info)]">
                <span className="font-semibold">Demo mode:</span> Use any provisioned test account
                (password provided separately).
              </div>
            )}
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} DigiGov. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
