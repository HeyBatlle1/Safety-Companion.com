import React from 'react';
import AppLayout from './layouts/AppLayout';
import AppRoutes from './routes/AppRoutes';
import ToastContainer from './components/common/ToastContainer';

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <AppLayout>
        <AppRoutes />
      </AppLayout>
      <ToastContainer />
    </div>
  );
}

export default App;