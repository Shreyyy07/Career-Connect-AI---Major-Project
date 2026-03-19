const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export type ApiError = {
  status: number;
  message: string;
};

const TOKEN_KEY = 'ccai_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem(TOKEN_KEY);
  else localStorage.setItem(TOKEN_KEY, token);
}

async function parseError(res: Response): Promise<ApiError> {
  const status = res.status;
  try {
    const data = await res.json();
    const message =
      (typeof data?.detail === 'string' && data.detail) ||
      (Array.isArray(data?.detail) && data.detail[0]?.msg) ||
      'Request failed';
    return { status, message };
  } catch {
    return { status, message: 'Request failed' };
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function healthCheck() {
  return apiFetch<{ ok: boolean }>('/api/v1/health');
}

