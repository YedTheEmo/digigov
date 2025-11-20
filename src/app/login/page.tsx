"use client";

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/procurement';
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
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-md">
          <div className="px-8 pt-8 pb-6 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              DigiGov
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Sign in with your official account.
            </p>
          </div>

          {error && (
            <div className="px-8 pt-4">
              <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-900/10 dark:border-red-700 px-3 py-2.5 text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
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
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
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
              <div className="mt-4 rounded-md border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 px-3 py-2 text-xs text-blue-900 dark:text-blue-100">
                <span className="font-semibold">Demo mode:</span> Use any provisioned test account
                (password provided separately).
              </div>
            )}
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} DigiGov. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
