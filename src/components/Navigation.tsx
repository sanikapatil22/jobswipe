'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Briefcase, FileText, User, Flame, Moon, Sun } from 'lucide-react';
import type { UserProfile } from '@/types';
import { useTheme } from '@/components/theme-provider';

interface NavigationProps {
  userProfile: UserProfile;
  appliedCount: number;
}

export function Navigation({ userProfile, appliedCount }: NavigationProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const tabClass = (href: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-950 scale-102'
        : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-white/5'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0C12]/90 backdrop-blur-md border-b-4 border-slate-100 dark:border-white/10 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          <Link href="/discover" className="flex items-center gap-3.5 cursor-pointer min-w-0">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
                  SwipePrep
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-500/30 uppercase tracking-wide">
                  AI HUB
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold hidden sm:block truncate">
                Discover • Apply • Prepare with AI
              </p>
            </div>
          </Link>

          <nav className="flex items-center bg-slate-100/80 dark:bg-white/[0.05] p-1.5 rounded-2xl border-2 border-slate-200/60 dark:border-white/10 overflow-x-auto max-w-full">
            <Link href="/discover" className={tabClass('/discover')}>
              <Flame className="w-4 h-4" />
              <span>Discover</span>
            </Link>

            <Link href="/companies" className={`${tabClass('/companies')} relative`}>
              <Briefcase className="w-4 h-4" />
              <span>Interested</span>
              {appliedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-white dark:bg-white/90 text-indigo-700 rounded-full shadow-sm">
                  {appliedCount}
                </span>
              )}
            </Link>

            <Link href="/resume" className={tabClass('/resume')}>
              <FileText className="w-4 h-4" />
              <span>Resume AI</span>
            </Link>

            <Link href="/profile" className={tabClass('/profile')}>
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          </nav>

          <div className="flex items-center gap-3 flex-none">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white dark:bg-white/[0.06] border-2 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-300 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all shadow-sm"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border-2 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-black">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                ATS Score: <strong className="text-emerald-950 dark:text-emerald-200">{userProfile.atsScore}/100</strong>
              </span>
            </div>

            <Link
              href="/profile"
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-white/[0.06] border-2 border-slate-200 dark:border-white/10 hover:border-indigo-500 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                {userProfile.name.charAt(0)}
              </div>
              <span className="font-extrabold max-w-25 truncate">{userProfile.name}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
