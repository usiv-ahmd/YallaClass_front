<<<<<<< Updated upstream
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App';
import './styles/mobile/mobile.css';
import { setAuthTokenGetter } from './mock-api';
import { getAuthToken } from './mock-api/auth.js';
=======
// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initClient } from "./api/client";
import { AuthProvider } from "./store/auth.store.jsx";
import { OrganizationProvider } from "./store/organization.store.jsx";
import "./styles/global.css";
import "./styles/mobile/mobile.css";
>>>>>>> Stashed changes

setAuthTokenGetter(getAuthToken);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
