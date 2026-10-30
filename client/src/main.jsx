import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { supabaseConfigProblems } from './lib/supabaseClient';
import ConfigErrorScreen from './components/common/ConfigErrorScreen';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {supabaseConfigProblems.length ? <ConfigErrorScreen problems={supabaseConfigProblems} /> : <App />}
  </StrictMode>,
);
