import { useState, useEffect, useCallback } from 'react';
import { getErrorMessage } from '../utils/errorHandler';

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Custom hook for API data fetching with built-in loading and error states
 * 
 * @param fetchFn Function that returns a promise with data
 * @param dependencies Array of dependencies that should trigger refetch when changed
 * @param initialData Optional initial data
 * @returns Object containing data, loading and error states, and reload function
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  initialData: T | null = null
): ApiState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]);

  // Function to manually reload data
  const reload = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { data, loading, error, reload };
}

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T>(
  fetchFn: (page: number, limit: number) => Promise<{ items: T[]; total: number }>,
  page: number,
  limit: number,
  dependencies: any[] = []
) {
  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn(page, limit);
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
      console.error('Paginated API error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, limit]);

  useEffect(() => {
    fetchData();
  }, [page, limit, ...dependencies, fetchData]);

  return { items, total, loading, error, reload: fetchData };
}

/**
 * Hook for API mutations (POST, PUT, DELETE, etc.)
 */
export function useMutation<T, P = any>(
  mutationFn: (params: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (params: P): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await mutationFn(params);
        setData(result);
        return result;
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        setError(errorMsg);
        console.error('Mutation error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, data, loading, error };
}

export default {
  useApi,
  usePaginatedApi,
  useMutation
};