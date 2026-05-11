import { useState, useEffect } from 'react'
import { QrCode, Moon, Sun, History, Settings, ExternalLink } from 'lucide-react'
import QRGenerator from './components/QRGenerator'
import QRHistory from './components/QRHistory'
import QRSettings from './components/QRSettings'
import { API_URL } from './config'

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'settings'>('generate')
  const [healthStatus, setHealthStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })
      if (response.ok) {
        setHealthStatus('online')
      } else {
        setHealthStatus('offline')
      }
    } catch {
      setHealthStatus('offline')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-500 rounded-xl">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">QRForge</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Privacy-first QR Generator</p>
              </div>
            </div>

            {/* Nav & Actions */}
            <div className="flex items-center gap-4">
              {/* Health Indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`w-2 h-2 rounded-full ${
                  healthStatus === 'online' ? 'bg-green-500 animate-pulse' :
                  healthStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{healthStatus}</span>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'generate', label: 'Generate', icon: QrCode },
              { id: 'history', label: 'History', icon: History },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'generate' && <QRGenerator />}
        {activeTab === 'history' && <QRHistory />}
        {activeTab === 'settings' && <QRSettings />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Self-hosted, privacy-first QR code generator.
            </p>
            <a
              href="/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              API Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
