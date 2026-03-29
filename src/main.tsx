import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.tsx'

// Light mode is default — only go dark if user explicitly chose dark
const savedTheme = localStorage.getItem('theme')

if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PrivyProvider
        appId={import.meta.env.VITE_PRIVY_APP_ID}
        config={{
          loginMethods: ['twitter'],
          appearance: {
            theme: 'dark',
            accentColor: '#7C3AED',
            logo: '',
          },
        }}
      >
        <App />
      </PrivyProvider>
    </BrowserRouter>
  </StrictMode>,
)