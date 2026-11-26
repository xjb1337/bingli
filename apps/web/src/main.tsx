import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { applyNativeInsetsClass } from './native-host';
import { registerServiceWorker } from './pwa/register';
import './styles.css';

applyNativeInsetsClass();

const root = document.getElementById('root');
if (!root) throw new Error('Missing root element');

registerServiceWorker();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
