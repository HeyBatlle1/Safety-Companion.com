import supabase, { getCurrentUser } from './supabase';
import { trackVideoInteraction } from '../utils/analytics';

interface WatchedVideo {
  id: string;
  videoId: string;
  watchedAt: string;
}

/**
 * Get all videos that have been watched by the current user
 */
export const getWatchedVideos = async (): Promise<string[]> => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return getLocalWatchedVideos();
    }
    
    const { data, error } = await supabase
      .from('watched_videos')
      .select('video_id')
      .eq('user_id', user.id);
      
    if (error) {
      
      return getLocalWatchedVideos();
    }
    
    return data.map(item => item.video_id);
  } catch (error) {
    
    return getLocalWatchedVideos();
  }
};

/**
 * Mark a video as watched by the current user
 */
export const markVideoAsWatched = async (videoId: string): Promise<boolean> => {
  try {
    // Track analytics event
    trackVideoInteraction('mark_watched', videoId);
    
    const user = await getCurrentUser();
    
    if (!user) {
      return markLocalVideoAsWatched(videoId);
    }
    
    const { error } = await supabase
      .from('watched_videos')
      .insert([{
        user_id: user.id,
        video_id: videoId,
        watched_at: new Date().toISOString()
      }])
      .onConflict(['user_id', 'video_id'])
      .merge(); // Update the watched_at timestamp if record already exists
      
    if (error) {
      
      return markLocalVideoAsWatched(videoId);
    }
    
    return true;
  } catch (error) {
    
    return markLocalVideoAsWatched(videoId);
  }
};

/**
 * Remove a video from the watched list
 */
export const markVideoAsUnwatched = async (videoId: string): Promise<boolean> => {
  try {
    // Track analytics event
    trackVideoInteraction('mark_unwatched', videoId);
    
    const user = await getCurrentUser();
    
    if (!user) {
      return markLocalVideoAsUnwatched(videoId);
    }
    
    const { error } = await supabase
      .from('watched_videos')
      .delete()
      .eq('user_id', user.id)
      .eq('video_id', videoId);
      
    if (error) {
      
      return markLocalVideoAsUnwatched(videoId);
    }
    
    return true;
  } catch (error) {
    
    return markLocalVideoAsUnwatched(videoId);
  }
};

// Local storage fallbacks for offline/unauthenticated usage
const LOCAL_STORAGE_KEY = 'toolbox-talks-watched-videos';

const getLocalWatchedVideos = (): string[] => {
  try {
    const watchedVideos = localStorage.getItem(LOCAL_STORAGE_KEY);
    return watchedVideos ? JSON.parse(watchedVideos) : [];
  } catch (error) {
    
    return [];
  }
};

const markLocalVideoAsWatched = (videoId: string): boolean => {
  try {
    const watchedVideos = getLocalWatchedVideos();
    if (!watchedVideos.includes(videoId)) {
      watchedVideos.push(videoId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(watchedVideos));
    }
    return true;
  } catch (error) {
    
    return false;
  }
};

const markLocalVideoAsUnwatched = (videoId: string): boolean => {
  try {
    let watchedVideos = getLocalWatchedVideos();
    watchedVideos = watchedVideos.filter(id => id !== videoId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(watchedVideos));
    return true;
  } catch (error) {
    
    return false;
  }
};

export default {
  getWatchedVideos,
  markVideoAsWatched,
  markVideoAsUnwatched
};