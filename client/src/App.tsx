import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import AnalysisHistory from './pages/AnalysisHistory';
import Maps from './pages/Maps';
import Videos from './pages/Videos';
import Drawings from './pages/Drawings';
import SDS from './pages/SDS';
import ToastContainer from './components/common/ToastContainer';

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/analysis" element={<AnalysisHistory />} />
          <Route path="/history" element={<AnalysisHistory />} />
          <Route path="/maps" element={<Maps />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/drawings" element={<Drawings />} />
          <Route path="/sds" element={<SDS />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
      <ToastContainer />
    </div>
  );
}

export default App;