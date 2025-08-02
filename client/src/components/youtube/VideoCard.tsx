import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Calendar, EyeOff, Eye, CheckCircle, Loader } from 'lucide-react';
import { markVideoAsWatched, markVideoAsUnwatched } from '../../services/videoService';

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    description: string;
  };
  isWatched: boolean;
  onWatchStatusChange: (videoId: string, watched: boolean) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isWatched, onWatchStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank');
  };

  const handleWatchToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the video
    setIsUpdating(true);
    setError(null);
    
    try {
      if (isWatched) {
        // Mark as unwatched
        const success = await markVideoAsUnwatched(video.id);
        if (success) {
          onWatchStatusChange(video.id, false);
        } else {
          setError("Couldn't update watch status");
        }
      } else {
        // Mark as watched
        const success = await markVideoAsWatched(video.id);
        if (success) {
          onWatchStatusChange(video.id, true);
        } else {
          setError("Couldn't update watch status");
        }
      }
    } catch (err) {
      setError("Error updating watch status");
      
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative rounded-xl overflow-hidden bg-slate-800/50 backdrop-blur-sm border ${
        isWatched ? 'border-green-500/40' : 'border-blue-500/20'
      }`}
      onClick={handleClick}
    >
      {isWatched && (
        <div className="absolute top-2 right-2 z-10 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          <span>Watched</span>
        </div>
      )}
      
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <motion.div 
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors"
          whileHover={{ scale: 1.1 }}
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-8 h-8 text-white" fill="white" />
          </div>
        </motion.div>
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-semibold line-clamp-2 mb-2">{video.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{video.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-400">
            <Calendar className="w-4 h-4 mr-1" />
            {video.publishedAt}
          </div>
          
          <button
            onClick={handleWatchToggle}
            disabled={isUpdating}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-xs ${
              isWatched 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
            }`}
          >
            {isUpdating ? (
              <Loader className="w-3 h-3 animate-spin mr-1" />
            ) : isWatched ? (
              <EyeOff className="w-3 h-3 mr-1" />
            ) : (
              <Eye className="w-3 h-3 mr-1" />
            )}
            <span>{isWatched ? 'Mark Unwatched' : 'Mark as Watched'}</span>
          </button>
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-1 rounded">
            {error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default VideoCard;