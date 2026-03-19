import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { InterviewSelection } from './pages/InterviewSelection';
import { Assessments } from './pages/Assessments';
import { Reports } from './pages/Reports';
import { Profile } from './pages/Profile';
import { ResumeMatch } from './pages/ResumeMatch';

function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [appPage, setAppPage] = useState<string>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (currentPage === 'register') {
      return <Register onNavigate={setCurrentPage} />;
    }
    if (currentPage === 'reset-password') {
      return <ResetPassword onNavigate={setCurrentPage} />;
    }
    return <Login onNavigate={setCurrentPage} />;
  }

  const renderPage = () => {
    switch (appPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setAppPage} />;
      case 'interview':
        return <InterviewSelection onNavigate={setAppPage} />;
      case 'assessments':
        return <Assessments />;
      case 'resume-match':
        return <ResumeMatch />;
      case 'reports':
        return <Reports />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onNavigate={setAppPage} />;
    }
  };

  return (
    <Layout currentPage={appPage} onNavigate={setAppPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
