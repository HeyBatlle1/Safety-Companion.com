import supabase from '@/services/supabase';

/**
 * Centralized API request helper with Supabase JWT authentication
 */
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};
