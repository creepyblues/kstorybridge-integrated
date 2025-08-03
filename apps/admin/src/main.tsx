import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Import auth debug utils in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/authDebug.ts');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)