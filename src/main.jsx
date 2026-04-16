import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../App.jsx'

// Polyfill window.storage using localStorage (replaces Claude artifact storage)
window.storage = {
  get: (key) =>
    Promise.resolve(
      localStorage.getItem(key) ? { value: localStorage.getItem(key) } : null
    ),
  set: (key, value) =>
    Promise.resolve(localStorage.setItem(key, value)),
  list: (prefix) =>
    Promise.resolve({
      keys: Object.keys(localStorage).filter((k) => k.startsWith(prefix)),
    }),
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
