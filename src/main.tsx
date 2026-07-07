import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

const StudioApp = lazy(() => import('./App.tsx'));
const LandingPage = lazy(() => import('./landing/LandingPage.tsx'));

// ponytail: two static routes, full-page nav between them — react-router when a third page exists
const isStudio =
  window.location.pathname === '/studio' ||
  window.location.pathname.startsWith('/studio/');

document.title = isStudio
  ? 'Animation Studio Pro — Studio'
  : 'Animation Studio Pro — AI Scroll Animation Builder';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div className="h-screen w-full bg-slate-950" />}>
      {isStudio ? <StudioApp /> : <LandingPage />}
    </Suspense>
  </StrictMode>,
);
