import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { apiFetch, setToken, getToken } from '../lib/api';

interface UserProfile {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string, fullName: string, role: 'candidate' | 'hr', companyName?: string) => Promise<string>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ message: string }>;
  confirmResetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT payload safely
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(base64));
  } catch {
    return {};
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real user profile from /auth/me
  const fetchMe = async () => {
    try {
      const profile = await apiFetch<UserProfile>('/api/v1/auth/me');
      setUser(profile);
    } catch {
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // Optimistically set from JWT claims while /me loads
    const decoded = decodeJWT(token);
    if (decoded?.sub) {
      setUser({
        id: parseInt(decoded.sub || '0'),
        email: decoded.email || '',
        role: decoded.role || 'candidate',
        name: decoded.name || 'User',
      });
    }
    fetchMe().finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await apiFetch<{ token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(res.token);
    const decoded = decodeJWT(res.token);
    const role = decoded?.role || 'candidate';
    // Optimistic update; then fetch real profile
    setUser({ id: parseInt(decoded?.sub || '0'), email, role, name: decoded?.name || 'User' });
    // Fetch real profile in background
    fetchMe();
    return role;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'candidate' | 'hr', companyName?: string) => {
    await apiFetch<{ token: string; userID: number }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password, role, company_name: companyName }),
    });
    return role;
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await apiFetch<{ token: string }>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    setToken(res.token);
    const decoded = decodeJWT(res.token);
    const actualRole = decoded?.role;
    setUser({ id: parseInt(decoded?.sub || '0'), email, role: actualRole, name: decoded?.name });
    return actualRole;
  };

  const signOut = async () => {
    setToken(null);
    setUser(null);
  };

  /**
   * Step 1 of password reset: request OTP.
   * Returns { dev_otp } in development mode so the UI can show it.
   */
  const resetPassword = async (email: string) => {
    const res = await apiFetch<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return res;
  };

  /**
   * Step 2 of password reset: verify OTP + set new password.
   */
  const confirmResetPassword = async (email: string, otp: string, newPassword: string) => {
    await apiFetch('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password: newPassword }),
    });
  };

  /**
   * Update the authenticated user's display name.
   */
  const updateProfile = async (name: string) => {
    const updated = await apiFetch<UserProfile>('/api/v1/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    setUser(updated);
  };

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, resetPassword, confirmResetPassword, updateProfile, verifyEmail }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
