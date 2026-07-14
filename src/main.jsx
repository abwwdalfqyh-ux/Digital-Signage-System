import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GlobalErrorBoundary from './shared/components/GlobalErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './core/api/queryClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)
