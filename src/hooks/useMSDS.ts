import { useState, useEffect, useCallback } from 'react';
import { PubChemCompound } from '../services/pubchem';
import { searchCompounds } from '../services/pubchem';
import { enhanceCompoundData } from '../services/msds';

export const useMSDS = (searchTerm: string) => {
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
      const compounds = await searchCompounds(searchTerm);
      const enhancedCompounds = await Promise.all(
        compounds.map(compound => enhanceCompoundData(compound))
      );
      setData(enhancedCompounds);
    } catch (err) {
      setError('Failed to fetch chemical data');
      console.error('MSDS search error:', err);
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