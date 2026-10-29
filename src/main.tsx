import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Enregistrement immédiat du Service Worker PWA
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);

