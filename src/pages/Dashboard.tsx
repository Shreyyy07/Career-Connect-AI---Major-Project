import { useEffect, useState } from 'react';
import { Video, FileText, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserStats } from '../types';
import { apiFetch } from '../lib/api';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [userName, setUserName] = useState('User');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const profile = await apiFetch<{ id: number; email: string; name: string; role: string }>('/api/v1/profile');
      if (profile?.name) setUserName(profile.name);

      const s = await apiFetch<{
        completed_interviews: number;
        pending_assessments: number;
        average_score: number;
        total_sessions: number;
      }>('/api/v1/dashboard/stats');

      setStats({
        id: '',
        user_id: String(user?.id || ''),
        completed_interviews: s.completed_interviews || 0,
        pending_assessments: s.pending_assessments || 0,
        average_score: s.average_score || 0,
        total_sessions: s.total_sessions || 0,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Track your interview progress and improve your skills
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-500/15 to-cyan-500/15">
              <Video className="text-indigo-600 dark:text-indigo-300" size={24} />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Completed Interviews</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.completed_interviews || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-amber-500/15 to-yellow-500/15">
              <FileText className="text-amber-600 dark:text-amber-300" size={24} />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Pending Assessments</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.pending_assessments || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-emerald-500/15 to-green-500/15">
              <TrendingUp className="text-emerald-600 dark:text-emerald-300" size={24} />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Average Score</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(stats?.average_score || 0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-fuchsia-500/15 to-purple-500/15">
              <Award className="text-purple-600 dark:text-purple-300" size={24} />
            </div>
            <div>
              <p className="text-slate-600 dark:text-slate-300 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{stats?.total_sessions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('interview')}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-4 rounded-lg font-semibold hover:opacity-95 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Video size={20} />
              Start Interview
            </button>
            <button
              onClick={() => onNavigate('assessments')}
              className="bg-white/60 dark:bg-slate-800/40 text-indigo-600 dark:text-indigo-300 px-6 py-4 rounded-lg font-semibold border-2 border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <FileText size={20} />
              Take Assessment
            </button>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Weekly Progress</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">Overall Score</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{Math.round(stats?.average_score || 0)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.average_score || 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">Technical</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round((stats?.average_score || 0) * 0.6)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((stats?.average_score || 0) * 0.6)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-300">Communication</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {Math.round((stats?.average_score || 0) * 0.4)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-rose-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.round((stats?.average_score || 0) * 0.4)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Performance Trend</h2>
          <div className="h-48 flex items-end justify-center text-slate-400 dark:text-slate-500">
            <p>No data available</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-6 shadow-sm border border-slate-200/70 dark:border-slate-800/60">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Skill Distribution</h2>
          <div className="h-48 flex items-center justify-center text-slate-400 dark:text-slate-500">
            <p>No data available</p>
          </div>
        </div>
      </div>
    </div>
  );
};
