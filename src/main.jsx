import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./App.css";
import logoMate from './assets/MateLogoUtil.png'

// favicon dinámico: la URL la genera el build, nunca 404
const linkIcono = document.querySelector("link[rel='icon']")
if (linkIcono) linkIcono.href = logoMate

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)