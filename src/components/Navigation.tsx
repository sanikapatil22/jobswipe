'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Briefcase, FileText, User, Flame } from 'lucide-react';
import type { UserProfile } from '@/types';

interface NavigationProps {
  userProfile: UserProfile;
  appliedCount: number;
}

export function Navigation({ userProfile, appliedCount }: NavigationProps) {
  const pathname = usePathname();

  const tabClass = (href: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-102'
        : 'text-slate-600 hover:text-indigo-600 hover:bg-white'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-4 border-slate-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/discover" className="flex items-center gap-3.5 cursor-pointer">
            <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">SwipePrep</span>
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 uppercase tracking-wide">
                  AI HUB
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold hidden sm:block">
                Discover • Apply • Prepare with AI
              </p>
            </div>
          </Link>

          <nav className="flex items-center bg-slate-100/80 p-1.5 rounded-2xl border-2 border-slate-200/60">
            <Link href="/discover" className={tabClass('/discover')}>
              <Flame className="w-4 h-4" />
              <span>Discover</span>
            </Link>

            <Link href="/companies" className={`${tabClass('/companies')} relative`}>
              <Briefcase className="w-4 h-4" />
              <span>My Companies</span>
              {appliedCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] font-black bg-white text-indigo-700 rounded-full shadow-sm">
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

          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-100 border-2 border-emerald-200 text-emerald-800 text-xs font-black">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>
                ATS Score: <strong className="text-emerald-950">{userProfile.atsScore}/100</strong>
              </span>
            </div>

            <Link
              href="/profile"
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 hover:border-indigo-500 text-xs font-bold text-slate-800 shadow-sm transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                {userProfile.name.charAt(0)}
              </div>
              <span className="font-extrabold max-w-[100px] truncate">{userProfile.name}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
