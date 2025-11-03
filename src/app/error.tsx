'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log del error al servidor/consola
    console.error('🔥 Application Error:', error)
    console.error('Stack:', error.stack)
    console.error('Message:', error.message)
    console.error('Digest:', error.digest)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Algo salió mal
          </h2>
          <p className="text-gray-600">
            La aplicación encontró un error inesperado
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800 font-mono break-words">
            {error.message || 'Error desconocido'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors font-medium"
          >
            🔄 Intentar de nuevo
          </button>
          
          <button
            onClick={() => {
              localStorage.clear()
              window.location.href = '/'
            }}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            🗑️ Limpiar datos y recargar
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ↻ Recargar página
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Si el problema persiste, contacta al soporte técnico
          </p>
        </div>
      </div>
    </div>
  )
}
