export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  user_id: string;
  type: 'ai' | 'hr';
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  feedback?: string;
  created_at: string;
  completed_at?: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'completed';
  score?: number;
  created_at: string;
  completed_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  type: 'interview' | 'assessment';
  reference_id?: string;
  duration_minutes: number;
  created_at: string;
}

export interface UserStats {
  id: string;
  user_id: string;
  completed_interviews: number;
  pending_assessments: number;
  average_score: number;
  total_sessions: number;
  updated_at: string;
}
