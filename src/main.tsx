import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Auth0Provider } from '@auth0/auth0-react'
import ProtectedRoute from './ProtectedRoute.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './Login.tsx'



console.log(import.meta.env.VITE_REACT_APP_AUTH0_DOMAIN,import.meta.env.VITE_REACT_APP_CLIENT_ID);

console.log(window.location.origin+"/home")

createRoot(document.getElementById('root')!).render(
  
  <StrictMode>
    <Auth0Provider
  domain={import.meta.env.VITE_REACT_APP_AUTH0_DOMAIN as string}
  clientId={import.meta.env.VITE_REACT_APP_CLIENT_ID as string}
  authorizationParams={{
   redirect_uri: window.location.origin+"/home",
      }}>
      <BrowserRouter>
      <Routes>
    <Route index path='/' element={<Login />} />
    <Route path="/home" element={<App />} />

   </Routes>
   </BrowserRouter>
      </Auth0Provider>
  </StrictMode>
)
