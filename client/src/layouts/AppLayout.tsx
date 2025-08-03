import React from 'react';
import BottomNav from '../components/navigation/BottomNav';
import TopBar from '../components/navigation/TopBar';
import MatrixRain from '../components/graphics/MatrixRain';
import BackgroundSkyscraper from '../components/graphics/BackgroundSkyscraper';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {

  return (
    <div className="flex flex-col min-h-screen relative">
      <MatrixRain />
      <BackgroundSkyscraper />
      <TopBar />





      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;