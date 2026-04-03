import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './components/layout/AppRouter'
import { ToastProvider } from './components/ui/Toast'
import { BirdAudioProvider } from './contexts/BirdAudioContext'

export default function App() {
  return (
    <BrowserRouter>
      <BirdAudioProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </BirdAudioProvider>
    </BrowserRouter>
  )
}
