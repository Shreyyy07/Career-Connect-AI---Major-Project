import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiFetch, setToken, getToken } from '../lib/api';

interface AuthContextType {
  user: { id: number; email: string; role: string; name: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string, fullName: string, role: 'candidate' | 'hr') => Promise<string>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload safely
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return {};
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // v1: token presence => "authenticated"; profile endpoint will be added next.
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const decoded = decodeJWT(token);
    setUser({ 
      id: parseInt(decoded?.sub || '0'), 
      email: 'authenticated', 
      role: decoded?.role || 'candidate', 
      name: 'User' 
    });
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await apiFetch<{ token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    const decoded = decodeJWT(res.token);
    const role = decoded?.role || 'candidate';
    setUser({ id: parseInt(decoded?.sub || '0'), email, role, name: 'User' });
    return role;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'candidate' | 'hr') => {
    const res = await apiFetch<{ token: string; userID: number }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password, role }),
    });
    setToken(res.token);
    const decoded = decodeJWT(res.token);
    const actualRole = decoded?.role || role;
    setUser({ id: res.userID || parseInt(decoded?.sub || '0'), email, role: actualRole, name: fullName });
    return actualRole;
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    // PRD specifies OTP reset; backend endpoint will be added later.
    // For now, keep UX consistent.
    await Promise.resolve(email);
    throw new Error('Password reset is not implemented yet. We will add OTP flow next.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
