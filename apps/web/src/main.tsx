import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import { App } from './App';
import { IdbProgressStore } from './storage/IdbProgressStore';
import { ProgressProvider } from './storage/ProgressProvider';

const store = new IdbProgressStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider store={store}>
      <App />
    </ProgressProvider>
  </StrictMode>,
);
