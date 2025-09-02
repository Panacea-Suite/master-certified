/**
 * Utility to read URL parameters from both search params (?key=value) and hash params (#key=value)
 * Prioritizes search params over hash params
 */
export function getHashSafeParam(key: string, location?: { search: string; hash: string }): string | null {
  const currentLocation = location || window.location;
  
  // Check regular search params first
  const searchParams = new URLSearchParams(currentLocation.search);
  const searchValue = searchParams.get(key);
  if (searchValue) return searchValue;
  
  // Check hash-based params
  if (currentLocation.hash) {
    const hashQuery = currentLocation.hash.split('?')[1];
    if (hashQuery) {
      const hashParams = new URLSearchParams(hashQuery);
      return hashParams.get(key);
    }
  }
  
  return null;
}

/**
 * Extract multiple parameters at once from URL
 */
export function extractParams(keys: string[], location?: { search: string; hash: string }): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  keys.forEach(key => {
    result[key] = getHashSafeParam(key, location);
  });
  return result;
}