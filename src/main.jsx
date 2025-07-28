import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "./components/Sidebar/Sidebar.css"
import "./components/Dashboard/Dashboard.css"
import "./components/Homepage/Homepage.css"
import "./components/Relay/Relay.css"
import "./components/Sensor/Sensor.css"
import "./components/MicroController/MicroController.css"
import "./components/Feeder/Feeder.css"

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
