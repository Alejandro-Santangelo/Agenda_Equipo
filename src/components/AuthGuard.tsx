'use client'

import { useAuth } from '@/hooks/useAuth'
import LoginScreen from './LoginScreen'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [error, setError] = useState<Error | null>(null)
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    // Listener global para errores no capturados
    const handleError = (event: ErrorEvent) => {
      console.error('🔥 Error capturado en AuthGuard:', event.error)
      setError(event.error)
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Si hay un error crítico, mostrar pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de aplicación</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Limpiar y Recargar
          </button>
        </div>
      </div>
    )
  }

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, mostrar login
  if (!isAuthenticated) {
    return <LoginScreen />
  }

  // Si está autenticado, mostrar la aplicación
  return <>{children}</>
}