import { useState, useEffect } from 'react'
import { Trash2, Download, Clock, AlertCircle } from 'lucide-react'
import { API_URL } from '../config'

interface HistoryItem {
  id: string
  content: string
  filename: string
  format: string
  generated_at: string
}

export default function QRHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/qr/history?limit=20`)
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      setHistory(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) return
    
    try {
      const response = await fetch(`${API_URL}/api/v1/qr/history`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to clear history')
      setHistory([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history')
    }
  }

  const downloadFile = (filename: string) => {
    const link = document.createElement('a')
    link.href = `${API_URL}/api/v1/qr/download/${filename}`
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No History Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Generated QR codes will appear here. History is stored in memory and will be cleared on restart.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Generations ({history.length})
        </h2>
        <button
          onClick={clearHistory}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`${API_URL}/generated/${item.filename}`}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                      <span className="text-sm text-gray-900 dark:text-white truncate max-w-xs">
                        {item.content}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-400 uppercase">
                      {item.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.generated_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => downloadFile(item.filename)}
                      className="p-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
