// Use API key from environment variables
const BRAVE_SEARCH_KEY = import.meta.env.VITE_BRAVE_SEARCH_KEY;

export const createBraveSearchUrl = (query: string): string => {
  return `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web&key=${BRAVE_SEARCH_KEY}`;
};