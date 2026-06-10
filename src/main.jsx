import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@petpals/theme/ThemeProvider.jsx'
import ShelterDashboard from './components/ShelterDashboard'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <ShelterDashboard />
        </ThemeProvider>
    </React.StrictMode>,
)
