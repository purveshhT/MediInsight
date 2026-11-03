import { useState, useEffect } from 'react';
import axios from 'axios';

export function useApi<T>(fetchFn: () => Promise<{ data: T }>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFn()
      .then(res => {
        if (!cancelled) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) setError(err?.response?.data?.detail || err.message || 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}

