import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SwipePrep - Fast AI Job Discovery & Interview Prep',
  description:
    'The fastest way for students to discover, apply to, and prepare for tech internships and jobs with AI roadmaps.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900`}
    >
      <body className="h-full bg-slate-50 dark:bg-[#0A0C12] text-slate-900 dark:text-slate-100 font-[family-name:var(--font-sans)]">
        <Providers>
          <ThemeProvider>{children}</ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
