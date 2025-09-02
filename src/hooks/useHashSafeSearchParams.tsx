import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useHashSafeSearchParams = () => {
  const location = useLocation();
  
  return useMemo(() => {
    // First try regular search params
    const searchParams = new URLSearchParams(location.search);
    
    // Then try hash-based params (after #)
    let hashParams = new URLSearchParams();
    if (location.hash) {
      const hashQuery = location.hash.split('?')[1];
      if (hashQuery) {
        hashParams = new URLSearchParams(hashQuery);
      }
    }
    
    // Create combined getter that prefers search params over hash params
    const get = (key: string) => {
      return searchParams.get(key) || hashParams.get(key);
    };
    
    return { get, searchParams, hashParams };
  }, [location.search, location.hash]);
};