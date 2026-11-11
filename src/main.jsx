import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App';
import './styles/mobile/mobile.css';
import { setAuthTokenGetter } from './mock-api';
import { getAuthToken } from './mock-api/auth.js';

setAuthTokenGetter(getAuthToken);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
