import axios from 'axios';

// Use the non-GenAI Google API key for YouTube
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const CHANNEL_ID = 'UCfHD4CSGq_Hsm0fePToS6WQ';
const PLAYLIST_ID = 'PLWm_Z39r3ZLdhDgnuZLcggIYFtUcNA46b';

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  description: string;
}

export const fetchPlaylistVideos = async (): Promise<YouTubeVideo[]> => {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/playlistItems',
      {
        params: {
          part: 'snippet',
          maxResults: 12,
          playlistId: PLAYLIST_ID,
          key: API_KEY,
        },
      }
    );

    return response.data.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description || 'No description available',
      thumbnail: item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium?.url || 
                item.snippet.thumbnails.default?.url,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
    }));
  } catch (error) {
    
    return [];
  }
};

export const getChannelInfo = async () => {
  try {
    const response = await axios.get(
      'https://www.googleapis.com/youtube/v3/channels',
      {
        params: {
          part: 'snippet,statistics',
          id: CHANNEL_ID,
          key: API_KEY,
        },
      }
    );

    const channel = response.data.items[0];
    return {
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.default.url,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
    };
  } catch (error) {
    // Return fallback data on error
    return {
      title: 'Safety Channel',
      description: 'This channel provides safety training and tips.',
      thumbnail: 'https://via.placeholder.com/100',
      subscriberCount: '1000',
      videoCount: '25',
    };
  }
};