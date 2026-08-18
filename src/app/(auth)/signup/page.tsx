'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Flame } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    const { error: authError } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.name,
    });
    if (authError) {
      setError(authError.message || 'Sign up failed');
      return;
    }
    router.push('/discover');
    router.refresh();
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C12] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-white/[0.03] border-2 border-slate-200 dark:border-white/10 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-50">Create your account</h1>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-500">Start discovering roles with AI</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">Full name</label>
            <input
              type="text"
              {...register('name')}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">Email</label>
            <input
              type="email"
              {...register('email')}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold focus:outline-none focus:border-indigo-600"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-200 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2.5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-xs font-bold focus:outline-none focus:border-indigo-600"
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
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 font-black">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
