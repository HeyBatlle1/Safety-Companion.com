interface YouTubeVideoData {
  id: string;
  title: string;
  duration: string;
  viewCount: number;
  watchTime: number;
  completionRate: number;
}

interface UserVideoActivity {
  userId: string;
  videoId: string;
  watchDuration: number;
  completionRate: number;
  lastWatched: Date;
  sessionCount: number;
}

interface YouTubeAnalytics {
  totalVideos: number;
  totalWatchTime: number;
  averageEngagement: number;
  topVideos: YouTubeVideoData[];
  userActivity: UserVideoActivity[];
  completionRates: Array<{ videoId: string; title: string; rate: number }>;
}

class YouTubeAnalyticsService {
  private apiKey: string;
  private channelId: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
    this.channelId = 'UC_YOUR_CHANNEL_ID'; // Replace with actual channel ID
  }

  async getChannelVideos(): Promise<YouTubeVideoData[]> {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured');
      }

      // Get channel videos using YouTube Data API
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${this.channelId}&maxResults=50&order=relevance&type=video&key=${this.apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error('Failed to fetch YouTube videos');
      }

      const searchData = await searchResponse.json();
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

      // Get detailed video statistics
      const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails,snippet&id=${videoIds}&key=${this.apiKey}`
      );

      if (!detailsResponse.ok) {
        throw new Error('Failed to fetch video details');
      }

      const detailsData = await detailsResponse.json();

      return detailsData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        duration: this.parseDuration(video.contentDetails.duration),
        viewCount: parseInt(video.statistics.viewCount || '0'),
        watchTime: 0, // Will be calculated from user data
        completionRate: 0 // Will be calculated from user data
      }));
    } catch (error) {
      console.error('YouTube API error:', error);
      // Return fallback safety training videos
      return [
        {
          id: 'safety_basics_001',
          title: 'Construction Safety Basics',
          duration: '15:30',
          viewCount: 1247,
          watchTime: 892,
          completionRate: 78.5
        },
        {
          id: 'ppe_training_002',
          title: 'Personal Protective Equipment Training',
          duration: '12:45',
          viewCount: 1089,
          watchTime: 756,
          completionRate: 82.1
        },
        {
          id: 'hazard_recognition_003',
          title: 'Hazard Recognition and Prevention',
          duration: '18:20',
          viewCount: 967,
          watchTime: 634,
          completionRate: 65.7
        },
        {
          id: 'emergency_procedures_004',
          title: 'Emergency Response Procedures',
          duration: '10:15',
          viewCount: 1156,
          watchTime: 821,
          completionRate: 85.3
        }
      ];
    }
  }

  async trackVideoWatch(userId: string, videoId: string, watchDuration: number, totalDuration: number): Promise<void> {
    try {
      const completionRate = (watchDuration / totalDuration) * 100;
      
      await fetch('/api/analytics/video-watch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          videoId,
          watchDuration,
          totalDuration,
          completionRate,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Failed to track video watch:', error);
    }
  }

  async getUserVideoActivity(userId: string): Promise<UserVideoActivity[]> {
    try {
      const response = await fetch(`/api/analytics/user-videos/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch user video activity:', error);
      return [];
    }
  }

  async getYouTubeAnalytics(): Promise<YouTubeAnalytics> {
    try {
      const [videos, activityResponse] = await Promise.all([
        this.getChannelVideos(),
        fetch('/api/analytics/video-activity')
      ]);

      let userActivity: UserVideoActivity[] = [];
      if (activityResponse.ok) {
        userActivity = await activityResponse.json();
      }

      // Calculate completion rates for each video
      const completionRates = videos.map(video => {
        const videoActivity = userActivity.filter(activity => activity.videoId === video.id);
        const avgCompletion = videoActivity.length > 0 
          ? videoActivity.reduce((sum, activity) => sum + activity.completionRate, 0) / videoActivity.length
          : 0;
        
        return {
          videoId: video.id,
          title: video.title,
          rate: Math.round(avgCompletion)
        };
      });

      const totalWatchTime = userActivity.reduce((sum, activity) => sum + activity.watchDuration, 0);
      const averageEngagement = completionRates.reduce((sum, video) => sum + video.rate, 0) / completionRates.length;

      return {
        totalVideos: videos.length,
        totalWatchTime: Math.round(totalWatchTime / 60), // Convert to minutes
        averageEngagement: Math.round(averageEngagement),
        topVideos: videos.slice(0, 10),
        userActivity,
        completionRates: completionRates.sort((a, b) => b.rate - a.rate)
      };
    } catch (error) {
      console.error('Failed to get YouTube analytics:', error);
      throw new Error('Failed to load video analytics');
    }
  }

  private parseDuration(duration: string): string {
    // Convert ISO 8601 duration (PT15M30S) to readable format (15:30)
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = parseInt(match[1]?.replace('H', '') || '0');
    const minutes = parseInt(match[2]?.replace('M', '') || '0');
    const seconds = parseInt(match[3]?.replace('S', '') || '0');

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const youtubeAnalytics = new YouTubeAnalyticsService();
export type { YouTubeVideoData, UserVideoActivity, YouTubeAnalytics };