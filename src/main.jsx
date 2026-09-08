import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import { PortfolioProvider } from './lib/PortfolioContext.jsx'
import './index.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'devicon/devicon.min.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/*" element={<PortfolioProvider><App /></PortfolioProvider>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
