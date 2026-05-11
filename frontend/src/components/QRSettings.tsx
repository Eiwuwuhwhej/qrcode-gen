import { useState, useEffect } from 'react'
import { Save, RotateCcw, Info, Database, Server, Shield } from 'lucide-react'

interface Settings {
  defaultSize: number
  defaultFormat: 'png' | 'svg' | 'jpeg' | 'webp'
  defaultEcc: 'L' | 'M' | 'Q' | 'H'
  darkMode: 'system' | 'light' | 'dark'
  showPreview: boolean
}

export default function QRSettings() {
  const [settings, setSettings] = useState<Settings>({
    defaultSize: 512,
    defaultFormat: 'png',
    defaultEcc: 'M',
    darkMode: 'system',
    showPreview: true,
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('qrforge_settings')
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const saveSettings = () => {
    localStorage.setItem('qrforge_settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const resetSettings = () => {
    const defaults = {
      defaultSize: 512,
      defaultFormat: 'png' as const,
      defaultEcc: 'M' as const,
      darkMode: 'system' as const,
      showPreview: true,
    }
    setSettings(defaults)
    localStorage.setItem('qrforge_settings', JSON.stringify(defaults))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const SettingCard = ({ 
    icon: Icon, 
    title, 
    description, 
    children 
  }: { 
    icon: React.ElementType
    title: string
    description: string
    children: React.ReactNode 
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Customize your QRForge experience</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetSettings}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveSettings}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <SettingCard
          icon={Database}
          title="Default Size"
          description="Select the default QR code resolution for new generations"
        >
          <select
            value={settings.defaultSize}
            onChange={(e) => setSettings({ ...settings, defaultSize: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          >
            <option value={256}>256 x 256 (Small)</option>
            <option value={512}>512 x 512 (Medium)</option>
            <option value={1024}>1024 x 1024 (Large)</option>
            <option value={2048}>2048 x 2048 (Extra Large)</option>
          </select>
        </SettingCard>

        <SettingCard
          icon={Server}
          title="Default Format"
          description="Choose the preferred output format for QR codes"
        >
          <div className="grid grid-cols-4 gap-2">
            {(['png', 'svg', 'jpeg', 'webp'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setSettings({ ...settings, defaultFormat: format })}
                className={`px-3 py-2 rounded-lg text-sm font-medium uppercase transition-colors ${
                  settings.defaultFormat === format
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </SettingCard>

        <SettingCard
          icon={Shield}
          title="Error Correction"
          description="Set the default error correction level for better scan reliability"
        >
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'L', label: 'Low', desc: '~7% recovery' },
              { value: 'M', label: 'Medium', desc: '~15% recovery' },
              { value: 'Q', label: 'Quartile', desc: '~25% recovery' },
              { value: 'H', label: 'High', desc: '~30% recovery' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setSettings({ ...settings, defaultEcc: value as Settings['defaultEcc'] })}
                className={`px-4 py-3 rounded-lg text-left transition-colors ${
                  settings.defaultEcc === value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{label}</div>
                <div className={`text-xs ${settings.defaultEcc === value ? 'text-white/80' : 'text-gray-500'}`}>
                  {desc}
                </div>
              </button>
            ))}
          </div>
        </SettingCard>

        <SettingCard
          icon={Info}
          title="Appearance"
          description="Configure the visual appearance of the application"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Theme Mode</span>
              <select
                value={settings.darkMode}
                onChange={(e) => setSettings({ ...settings, darkMode: e.target.value as Settings['darkMode'] })}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Show Preview Panel</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showPreview}
                  onChange={(e) => setSettings({ ...settings, showPreview: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-500"></div>
              </label>
            </div>
          </div>
        </SettingCard>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Settings are stored locally in your browser. They will not sync across devices.
        </p>
      </div>
    </div>
  )
}
