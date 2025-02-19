import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react'

import { BrowserRouter, Route, Routes } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <Auth0Provider
  domain='dev-hj6sgg3wjvjv0baa.us.auth0.com'
  clientId='JDAoZUQdCkESot2aEbaMVT7lSZrie4Zs'
      authorizationParams={{
    audience:"https://dev-hj6sgg3wjvjv0baa.us.auth0.com/api/v2/",
   redirect_uri: window.location.origin,
      }}>
      <BrowserRouter>
      <Routes>
    <Route index path='/' element={<App/>} />
   </Routes>
   </BrowserRouter>
      </Auth0Provider>
  </StrictMode>
)

