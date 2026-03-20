import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { InterviewSelection } from './pages/InterviewSelection';
import { AIInterview } from './pages/AIInterview';
import { EvaluationResult } from './pages/EvaluationResult';
import { Assessments } from './pages/Assessments';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { ResumeMatch } from './pages/ResumeMatch';

interface InterviewState {
  sessionID: string;
  firstQuestion: string;
  jobTitle?: string;
}

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [appPage, setAppPage] = useState<string>('dashboard');

  // Interview flow state
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [evalID, setEvalID] = useState<number | null>(null);

  const navigateTo = (page: string, state?: any) => {
    if (page === 'ai-interview' && state) {
      setInterviewState(state as InterviewState);
    }
    if (page === 'evaluation' && typeof state === 'number') {
      setEvalID(state);
    }
    setAppPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'register') return <Register onNavigate={setCurrentPage} />;
    if (currentPage === 'reset-password') return <ResetPassword onNavigate={setCurrentPage} />;
    return <Login onNavigate={setCurrentPage} />;
  }

  const renderPage = () => {
    switch (appPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;

      case 'interview':
        return <InterviewSelection onNavigate={navigateTo} />;

      case 'ai-interview':
        if (!interviewState) { navigateTo('interview'); return null; }
        return (
          <AIInterview
            sessionID={interviewState.sessionID}
            firstQuestion={interviewState.firstQuestion}
            jobTitle={interviewState.jobTitle}
            onEnd={(id) => navigateTo('evaluation', id)}
            onBack={() => navigateTo('interview')}
          />
        );

      case 'evaluation':
        if (!evalID) { navigateTo('interview'); return null; }
        return (
          <EvaluationResult
            evalID={evalID}
            onRetake={() => navigateTo('interview')}
            onDashboard={() => navigateTo('dashboard')}
          />
        );

      case 'assessments':
        return <Assessments onNavigate={navigateTo} />;

      case 'resume-match':
        return <ResumeMatch />;

      case 'reports':
        return <Reports />;

      case 'profile':
        return <Profile />;

      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <Layout currentPage={appPage} onNavigate={navigateTo}>
      {renderPage()}
    </Layout>
  );
}

export default App;
