import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Force reload on chunk load failure (white screen issue)
window.addEventListener('error', (e) => {
  if (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk')) {
    console.log('New update detected, reloading...');
    window.location.reload();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
