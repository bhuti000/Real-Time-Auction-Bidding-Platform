import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import the Context Providers using Named Imports
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider manages user sessions and login state */}
    <AuthProvider>
      {/* SocketProvider enables real-time bid updates via Socket.io */}
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
)