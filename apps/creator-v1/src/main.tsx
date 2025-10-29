import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/layout-variables.css'
import './styles/design-tokens.css'

// Load debugging utilities in development
if (import.meta.env.DEV) {
  import('./utils/quickSignupTest').catch(console.error);
}

createRoot(document.getElementById("root")!).render(<App />);
