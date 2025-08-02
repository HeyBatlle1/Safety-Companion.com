import React from 'react';
import AuthWrapper from './components/AuthWrapper';
import AppLayout from './layouts/AppLayout';
import AppRoutes from './routes/AppRoutes';
import ToastContainer from './components/common/ToastContainer';

function App() {
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-slate-900">
        <AppLayout>
          <AppRoutes />
        </AppLayout>
        <ToastContainer />
      </div>
    </AuthWrapper>
  );
}

export default App;