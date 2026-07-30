'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { Flame } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/discover';
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    const { error: authError } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (authError) {
      setError(authError.message || 'Sign in failed');
      return;
    }
    router.push(next);
    router.refresh();
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white border-2 border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Welcome back</h1>
            <p className="text-xs font-semibold text-slate-500">Sign in to SwipePrep</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
            <button
              type="button"
              onClick={() =>
                authClient.signIn.social({ provider: 'google', callbackURL: next })
              }
              className="w-full py-3 rounded-2xl bg-white border-2 border-slate-200 font-black text-xs"
            >
              Continue with Google
            </button>
          )}
          {process.env.NEXT_PUBLIC_GITHUB_ENABLED === 'true' && (
            <button
              type="button"
              onClick={() =>
                authClient.signIn.social({ provider: 'github', callbackURL: next })
              }
              className="w-full py-3 rounded-2xl bg-white border-2 border-slate-200 font-black text-xs"
            >
              Continue with GitHub
            </button>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500 text-center">
          No account?{' '}
          <Link href="/signup" className="text-indigo-600 font-black">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
