// Polyfills for Solana wallet adapters - MUST be first
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;
(window as any).global = window;

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
