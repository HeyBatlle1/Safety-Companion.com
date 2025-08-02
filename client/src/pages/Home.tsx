import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink } from 'lucide-react';
import ModernSkyscraper from '../components/graphics/ModernSkyscraper';
import WaveBackground from '../components/graphics/WaveBackground';
import { fetchConstructionNews } from '../services/news';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  published_at: string;
  source?: {
    name: string;
  };
}

const Home = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setIsLoading(true);
        const articles = await fetchConstructionNews();
        setNews(articles);
      } catch (error) {
        console.error('Error loading news:', error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNews();

    // Set up refresh timer - every 5 minutes
    const refreshTimer = window.setInterval(loadNews, 5 * 60 * 1000);

    // Cleanup function
    return () => {
      window.clearInterval(refreshTimer);
    };
  }, []);

  return (
    <div className="relative max-w-md mx-auto px-4 py-8">
      <WaveBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="text-center">
          <motion.div 
            className="flex justify-center mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="w-48 h-64 md:w-64 md:h-96 relative">
              <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-2xl" />
              <ModernSkyscraper />
            </div>
          </motion.div>
          
          <motion.h1
            className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 mb-4"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
          >
            Where's Your PPE?
          </motion.h1>
          <p className="text-gray-300 mb-8">
            Your source for the latest global news and trending stories
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-blue-400">
                <Newspaper className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Latest News</h2>
              </div>
              <span className="text-sm text-gray-400">Updated Recently</span>
            </div>
            {news.map((article, index) => (
              <motion.a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group block p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 hover:border-blue-500/40 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-white font-medium flex-1">{article.title}</h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-400 ml-2 flex-shrink-0" />
                </div>
                <p className="text-sm text-gray-400 line-clamp-2">{article.description}</p>
                {article.source && (
                  <div className="mt-2 flex items-center text-xs text-gray-500">
                    <span>{article.source.name}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(article.published_at).toLocaleDateString()}</span>
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No news articles available at the moment.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Home;