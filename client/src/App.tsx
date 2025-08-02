import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/layouts/AppLayout';
import PrivateRoute from '@/components/auth/PrivateRoute';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Home from '@/pages/Home';
import Profile from '@/pages/Profile';
import Chat from '@/pages/Chat';
import AnalysisHistory from '@/pages/AnalysisHistory';
import Maps from '@/pages/Maps';
import Videos from '@/pages/Videos';
import Drawings from '@/pages/Drawings';
import SDS from '@/pages/SDS';
import Checklists from '@/pages/Checklists';
import ChecklistView from '@/pages/ChecklistView';
import Profiles from '@/pages/Profiles';
import ToastContainer from '@/components/common/ToastContainer';

function App() {
  const { loading, user } = useAuth();

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading Safety Companion...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-slate-900">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <PrivateRoute>
            <AppLayout>
              <Home />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/chat" element={
          <PrivateRoute>
            <AppLayout>
              <Chat />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/analysis" element={
          <PrivateRoute>
            <AppLayout>
              <AnalysisHistory />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute>
            <AppLayout>
              <AnalysisHistory />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/maps" element={
          <PrivateRoute>
            <AppLayout>
              <Maps />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/videos" element={
          <PrivateRoute>
            <AppLayout>
              <Videos />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/drawings" element={
          <PrivateRoute>
            <AppLayout>
              <Drawings />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/sds" element={
          <PrivateRoute>
            <AppLayout>
              <SDS />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/checklists" element={
          <PrivateRoute>
            <AppLayout>
              <Checklists />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/checklist/:templateId" element={
          <PrivateRoute>
            <AppLayout>
              <ChecklistView />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="/profiles" element={
          <PrivateRoute>
            <AppLayout>
              <Profiles />
            </AppLayout>
          </PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;