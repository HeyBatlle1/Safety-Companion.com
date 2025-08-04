import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Users, Video, CheckCircle, Filter } from 'lucide-react';
import { fetchPlaylistVideos, getChannelInfo } from '../services/youtube';
import { getWatchedVideos } from '../services/videoService';
import VideoCard from '../components/youtube/VideoCard';
import WaveBackground from '../components/graphics/WaveBackground';
import BackButton from '../components/navigation/BackButton';

interface ChannelInfo {
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
}

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>([]);
  const [showOnlyUnwatched, setShowOnlyUnwatched] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load videos and watched status in parallel
        const [fetchedVideos, channelData, watchedIds] = await Promise.all([
          fetchPlaylistVideos(),
          getChannelInfo(),
          getWatchedVideos()
        ]);
        
        setVideos(fetchedVideos);
        setChannelInfo(channelData);
        setWatchedVideoIds(watchedIds);
      } catch (error) {
        
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleWatchStatusChange = (videoId: string, watched: boolean) => {
    if (watched) {
      setWatchedVideoIds(prev => [...prev, videoId]);
    } else {
      setWatchedVideoIds(prev => prev.filter(id => id !== videoId));
    }
  };

  const toggleFilter = () => {
    setShowOnlyUnwatched(!showOnlyUnwatched);
  };

  const filteredVideos = showOnlyUnwatched 
    ? videos.filter((video: any) => !watchedVideoIds.includes(video.id))
    : videos;

  const watchedCount = videos.filter((video: any) => 
    watchedVideoIds.includes(video.id)).length;
  
  const completionPercentage = videos.length > 0 
    ? Math.round((watchedCount / videos.length) * 100) 
    : 0;

  return (
    <div className="relative max-w-md mx-auto px-4 py-8">
      <WaveBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
          <BackButton />
          <div className="text-center flex-1">
            <motion.div
              className="inline-flex items-center space-x-2 mb-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <Wrench className="w-6 h-6 text-blue-400" />
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                <div className="flex flex-col leading-tight">
                  <span>ToolBox</span>
                  <span>Talks</span>
                </div>
              </h1>
            </motion.div>
          </div>
          <div className="w-10" /> {/* Spacer for alignment */}
        </div>

        {channelInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20"
          >
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={channelInfo.thumbnail}
                alt={channelInfo.title}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{channelInfo.title}</h2>
                <div className="flex space-x-4 mt-2 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {parseInt(channelInfo.subscriberCount).toLocaleString()} subscribers
                  </div>
                  <div className="flex items-center">
                    <Video className="w-4 h-4 mr-1" />
                    {parseInt(channelInfo.videoCount).toLocaleString()} videos
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm line-clamp-2">{channelInfo.description}</p>
          </motion.div>
        )}

        <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medium">Your Progress</h3>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400 mr-1" />
              <span className="text-sm text-gray-300">
                {statsLoading ? 'Loading...' : `${watchedCount}/${videos.length} complete`}
              </span>
            </div>
          </div>
          
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-green-400"
              initial={{ width: "0%" }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-400">
              {completionPercentage}% of safety training completed
            </p>
            <button 
              onClick={toggleFilter}
              className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full 
              ${showOnlyUnwatched 
                ? 'bg-blue-500 text-white' 
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}
            >
              <Filter className="w-3 h-3 mr-1" />
              <span>{showOnlyUnwatched ? 'Showing Unwatched' : 'Show Unwatched'}</span>
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-300">
            Watch and confirm completion of safety training videos
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div
            className="grid gap-6"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            initial="hidden"
            animate="show"
          >
            {filteredVideos.length > 0 ? (
              filteredVideos.map((video: any) => (
                <motion.div
                  key={video.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                >
                  <VideoCard 
                    video={video} 
                    isWatched={watchedVideoIds.includes(video.id)}
                    onWatchStatusChange={handleWatchStatusChange}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center p-8 bg-slate-800/30 rounded-lg">
                {showOnlyUnwatched && videos.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle className="w-12 h-12 text-green-400 mb-2" />
                    <p className="text-green-400 font-medium">All videos have been watched!</p>
                    <button 
                      onClick={toggleFilter}
                      className="mt-3 bg-slate-700 text-blue-400 py-1 px-3 rounded-lg text-sm hover:bg-slate-600"
                    >
                      Show All Videos
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400">No training videos are currently available.</p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Videos;