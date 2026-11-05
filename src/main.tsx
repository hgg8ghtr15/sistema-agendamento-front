import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// createRoot monta o React na div com id="root" do index.html
// StrictMode ativa verificações extras durante o desenvolvimento
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)