import { useState, useCallback, useEffect } from 'react'
import { 
  Loader2, Download, Copy, Check, RefreshCw, Link2, Type, 
  Smartphone, Wifi, Mail, Palette, Maximize, Shield, AlertCircle
} from 'lucide-react'
import { API_URL } from '../config'

interface QRResponse {
  success: boolean;
  download_url: string;
  filename: string;
  generated_at: string;
}

export default function QRGenerator() {
  const [content, setContent] = useState('')
  const [format, setFormat] = useState<'png' | 'svg' | 'jpeg' | 'webp'>('png')
  const [size, setSize] = useState(512)
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [margin, setMargin] = useState(4)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QRResponse | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [validation, setValidation] = useState({ valid: true, isUrl: false, length: 0 })

  // Quick input types
  const inputTypes = [
    { id: 'text', icon: Type, label: 'Text', placeholder: 'Enter any text...' },
    { id: 'url', icon: Link2, label: 'URL', placeholder: 'https://example.com' },
    { id: 'email', icon: Mail, label: 'Email', placeholder: 'email@example.com' },
    { id: 'wifi', icon: Wifi, label: 'WiFi', placeholder: 'WIFI:S:network;T:WPA;P:password;;' },
    { id: 'phone', icon: Smartphone, label: 'Phone', placeholder: '+1 234 567 8900' },
  ]
  const [activeInputType, setActiveInputType] = useState('text')

  useEffect(() => {
    validateContent(content)
  }, [content])

  const validateContent = async (value: string) => {
    if (!value) {
      setValidation({ valid: false, isUrl: false, length: 0 })
      return
    }

    const isUrl = /^https?:\/\//i.test(value)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const isPhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value)
    
    setValidation({
      valid: value.length > 0 && value.length <= 5000,
      isUrl: isUrl || isEmail || isPhone,
      length: value.length
    })
  }

  const generateQR = useCallback(async () => {
    if (!content.trim() || content.length > 5000) {
      setError('Please enter valid content (1-5000 characters)')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${API_URL}/api/v1/qr/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          format,
          size,
          ecc,
          fg_color: fgColor,
          bg_color: bgColor,
          margin,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to generate QR code')
      }

      const data: QRResponse = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [content, format, size, ecc, fgColor, bgColor, margin])

  const copyToClipboard = async () => {
    if (!result) return
    try {
      const response = await fetch(`${API_URL}${result.download_url}`)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for unsupported browsers
      navigator.clipboard.writeText(`${window.location.origin}${API_URL}${result.download_url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadQR = () => {
    if (!result) return
    const link = document.createElement('a')
    link.href = `${API_URL}${result.download_url}`
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          {/* Input Type Selector */}
          <div className="flex flex-wrap gap-2">
            {inputTypes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveInputType(id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeInputType === id
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content to Encode
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={inputTypes.find(t => t.id === activeInputType)?.placeholder}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none transition-colors"
              maxLength={5000}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={`${validation.valid ? 'text-green-600' : 'text-red-500'}`}>
                {validation.valid ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {validation.isUrl ? 'Valid URL detected' : 'Valid input'}
                  </span>
                ) : content.length > 5000 ? (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Content too long (max 5000 chars)
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Enter content to generate QR
                  </span>
                )}
              </span>
              <span className="text-gray-400">
                {content.length}/5000
              </span>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Output Format
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['png', 'svg', 'jpeg', 'webp'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium uppercase transition-colors ${
                    format === f
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Size & Error Correction */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Maximize className="inline w-4 h-4 mr-1" />
                Size (px)
              </label>
              <select
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value={256}>256 x 256</option>
                <option value={512}>512 x 512</option>
                <option value={1024}>1024 x 1024</option>
                <option value={2048}>2048 x 2048</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                <Shield className="inline w-4 h-4 mr-1" />
                Error Correction
              </label>
              <select
                value={ecc}
                onChange={(e) => setEcc(e.target.value as typeof ecc)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="L">Low (L)</option>
                <option value="M">Medium (M)</option>
                <option value="Q">Quartile (Q)</option>
                <option value="H">High (H)</option>
              </select>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              <Palette className="inline w-4 h-4 mr-1" />
              Colors
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Foreground</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Background</span>
              </div>
              <button
                onClick={() => { setFgColor('#000000'); setBgColor('#ffffff'); }}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Margin */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Margin: {margin}
            </label>
            <input
              type="range"
              min={0}
              max={20}
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={generateQR}
            disabled={loading || !content.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5" />
                Generate QR Code
              </>
            )}
          </button>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Preview
              </h3>

              {result ? (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                    <img
                      src={`${API_URL}${result.download_url}`}
                      alt="Generated QR Code"
                      className="max-w-full h-auto rounded-lg shadow-sm"
                      style={{ maxHeight: '400px' }}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={downloadQR}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Generated: {new Date(result.generated_at).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex items-center justify-center mb-4">
                    <span className="text-4xl">📱</span>
                  </div>
                  <p>Your QR code will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
