import React from 'react';
import ReactDOM from 'react-dom/client';
import AppContent from './App';
import { LibraryProvider } from './context/LibraryContext';
import { PlayerProvider } from './context/PlayerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LibraryProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </LibraryProvider>
  </React.StrictMode>
);
