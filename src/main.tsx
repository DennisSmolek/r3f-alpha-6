import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AnnouncementPage from './page';
import './style.css';
createRoot(document.getElementById('root')!).render(<StrictMode><AnnouncementPage /></StrictMode>);
