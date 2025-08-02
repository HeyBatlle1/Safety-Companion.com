import React, { useState } from 'react';
import BottomNav from '../components/navigation/BottomNav';
import TopBar from '../components/navigation/TopBar';
import MatrixRain from '../components/graphics/MatrixRain';
import BackgroundSkyscraper from '../components/graphics/BackgroundSkyscraper';
import { AlertTriangle } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [dbStatus, setDbStatus] = useState<'ok' | 'warning' | 'error'>('ok');

  const handleDatabaseStatusChange = (status: 'ok' | 'warning' | 'error') => {
    setDbStatus(status);
  };

  return (
    <div className="flex flex-col min-h-screen relative">
      <MatrixRain />
      <BackgroundSkyscraper />
      <TopBar onDatabaseStatusChange={handleDatabaseStatusChange} />

      {dbStatus === 'error' && (
        <div className="bg-red-500/10 border-b border-red-500/30 py-2 px-4 text-sm text-red-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>Database connection issues detected. Some features may be unavailable.</span>
        </div>
      )}

      {dbStatus === 'warning' && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/30 py-2 px-4 text-sm text-yellow-400 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span>Database schema issues detected. The application may have limited functionality.</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;