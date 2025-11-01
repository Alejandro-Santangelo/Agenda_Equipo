'use client'

import { useAuth } from '@/hooks/useAuth'
import LoginScreen from './LoginScreen'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth()

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