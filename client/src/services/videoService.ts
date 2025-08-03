import { trackVideoInteraction } from '../utils/analytics';

interface WatchedVideo {
  id: string;
  videoId: string;
  watchedAt: string;
}

// Local storage key for watched videos
const WATCHED_VIDEOS_KEY = 'safety-companion-watched-videos';

/**
 * Get watched videos from localStorage
 */
const getLocalWatchedVideos = (): string[] => {
  try {
    const stored = localStorage.getItem(WATCHED_VIDEOS_KEY);
    if (!stored) return [];
    const videos = JSON.parse(stored);
    return Array.isArray(videos) ? videos : [];
  } catch (error) {
    console.error('Error reading watched videos:', error);
    return [];
  }
};

/**
 * Save watched videos to localStorage
 */
const saveLocalWatchedVideos = (videoIds: string[]): void => {
  try {
    localStorage.setItem(WATCHED_VIDEOS_KEY, JSON.stringify(videoIds));
  } catch (error) {
    console.error('Error saving watched videos:', error);
  }
};

/**
 * Get all videos that have been watched by the current user
 */
export const getWatchedVideos = async (): Promise<string[]> => {
  // TODO: Implement API endpoint when backend is ready
  // For now, use localStorage
  return getLocalWatchedVideos();
};

/**
 * Mark a video as watched by the current user
 */
export const markVideoAsWatched = async (videoId: string): Promise<boolean> => {
  try {
    // Track analytics event
    trackVideoInteraction('mark_watched', videoId);
    
    // Get current watched videos
    const watched = getLocalWatchedVideos();
    
    // Add if not already watched
    if (!watched.includes(videoId)) {
      watched.push(videoId);
      saveLocalWatchedVideos(watched);
    }
    
    return true;
  } catch (error) {
    console.error('Error marking video as watched:', error);
    return false;
  }
};

/**
 * Mark a video as unwatched by the current user
 */
export const markVideoAsUnwatched = async (videoId: string): Promise<boolean> => {
  try {
    // Track analytics event
    trackVideoInteraction('mark_unwatched', videoId);
    
    // Get current watched videos
    const watched = getLocalWatchedVideos();
    
    // Remove from watched list
    const updated = watched.filter(id => id !== videoId);
    saveLocalWatchedVideos(updated);
    
    return true;
  } catch (error) {
    console.error('Error marking video as unwatched:', error);
    return false;
  }
};