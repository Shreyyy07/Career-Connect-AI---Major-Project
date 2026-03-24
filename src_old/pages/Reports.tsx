import { useEffect, useState } from 'react';
import { BarChart2, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

type InterviewRow = {
  sessionID: string;
  type: 'ai' | 'hr';
  completed_at: string | null;
  score: number;
  feedback?: string;
  evalID?: number | null;
  reportURL?: string | null;
};

export const Reports = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInterviews();
    }
  }, [user]);

  const fetchInterviews = async () => {
    try {
      const data = await apiFetch<InterviewRow[]>('/api/v1/candidate/history');
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const averageScore =
    interviews.length > 0 ? interviews.reduce((sum, interview) => sum + (interview.score || 0), 0) / interviews.length : 0;

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reports</h1>
        <p className="text-gray-600">View your interview performance and progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart2 className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Interviews</p>
              <p className="text-3xl font-bold text-gray-900">{interviews.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(averageScore)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Award className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-gray-600 text-sm">Best Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {interviews.length > 0
                  ? Math.round(Math.max(...interviews.map(i => i.score || 0)))
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Interview History</h2>

        {interviews.length === 0 ? (
          <div className="text-center py-12">
            <BarChart2 className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No completed interviews</h3>
            <p className="text-gray-600">Complete your first interview to see reports here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Feedback</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.sessionID} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {interview.completed_at
                        ? new Date(interview.completed_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        interview.type === 'ai'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {interview.type === 'ai' ? 'AI Interview' : 'HR Interview'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${
                        (interview.score || 0) >= 70
                          ? 'text-green-600'
                          : (interview.score || 0) >= 50
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {interview.score ? Math.round(interview.score) : 0}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center justify-between gap-3">
                        <span>{interview.feedback || 'No feedback available'}</span>
                        {interview.reportURL && (
                          <a
                            href={`http://127.0.0.1:8000${interview.reportURL}`}
                            className="text-blue-600 hover:underline whitespace-nowrap"
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download PDF
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
