import { useState, useEffect, useCallback } from 'react';
import { searchCompounds, PubChemCompound } from '../services/pubchem';

export const usePubChem = (searchTerm: string) => {
  const [data, setData] = useState<PubChemCompound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!searchTerm.trim()) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchCompounds(searchTerm);
      setData(results);
    } catch (err) {
      setError('Failed to fetch chemical data');
      
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const debounceTimer = setTimeout(fetchData, 500);
    return () => clearTimeout(debounceTimer);
  }, [fetchData]);

  return { data, loading, error };
};