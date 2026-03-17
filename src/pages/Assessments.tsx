import { useEffect, useState } from 'react';
import { FileText, Plus, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Assessment } from '../types';

export const Assessments = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssessments();
    }
  }, [user]);

  const fetchAssessments = async () => {
    try {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewAssessment = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user?.id)
        .maybeSingle();

      if (!profile) {
        alert('Please complete your profile first');
        return;
      }

      const { error } = await supabase
        .from('assessments')
        .insert({
          user_id: user?.id,
          title: `Assessment ${assessments.length + 1}`,
          status: 'pending',
        });

      if (error) throw error;
      fetchAssessments();
    } catch (error) {
      console.error('Error creating assessment:', error);
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments</h1>
          <p className="text-gray-600">Manage and track your assessments</p>
        </div>
        <button
          onClick={createNewAssessment}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          New Assessment
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No assessments yet</h3>
          <p className="text-gray-600 mb-6">Create your first assessment to get started</p>
          <button
            onClick={createNewAssessment}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Create Assessment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-yellow-600" size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  assessment.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {assessment.status === 'completed' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Pending
                    </span>
                  )}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{assessment.title}</h3>

              {assessment.score !== null && assessment.score !== undefined && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Score</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(assessment.score)}%</p>
                </div>
              )}

              <p className="text-sm text-gray-500">
                Created {new Date(assessment.created_at).toLocaleDateString()}
              </p>

              {assessment.status === 'pending' && (
                <button className="w-full mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                  Start Assessment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
