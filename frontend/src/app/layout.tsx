import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'AI Interview Agent — Technical Mock Interviews, Code & Repo Analysis',
  description: 'Master technical interviews with adaptive AI sessions, live coding evaluations, ATS resume scoring, and GitHub repository analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased flex flex-col selection:bg-indigo-500 selection:text-white" suppressHydrationWarning>
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
