import { ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Video, FileText, BarChart2, User, LogOut, Sparkles, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout = ({ children, currentPage, onNavigate }: LayoutProps) => {
  const { user, signOut } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
    { icon: Video, label: 'Start Interview', page: 'interview' },
    { icon: FileText, label: 'Assessments', page: 'assessments' },
    { icon: Sparkles, label: 'Resume & Match', page: 'resume-match' },
    { icon: BarChart2, label: 'My Reports', page: 'reports' },
    { icon: User, label: 'Profile', page: 'profile' },
  ];

  const getInitial = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const effectiveIcon = useMemo(() => {
    return theme === 'dark' ? Sun : Moon;
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem('ccai_theme');
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved);
    } else {
      const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ccai_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex">
      <aside className="w-60 bg-white/70 dark:bg-slate-900/60 border-r border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
            Career Connect AI
          </h1>
        </div>

        <nav className="flex-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;

            return (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'text-white bg-gradient-to-r from-indigo-600 to-cyan-500 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white/60 dark:bg-slate-900/50 border-b border-slate-200/70 dark:border-slate-800/70 backdrop-blur-xl px-8 py-4 flex justify-end items-center">
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-semibold shadow-sm">
              {user?.email && getInitial(user.email)}
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
              title="Toggle dark mode"
              aria-label="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={signOut}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto text-slate-900 dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
};
