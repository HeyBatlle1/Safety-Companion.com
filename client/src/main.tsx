import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import TestAuth from './test-auth';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestAuth />
  </StrictMode>
);