'use client'

// Force Vercel deploy - 2025-11-02 v2
import { useState, useEffect } from 'react'
import { Mail, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loginAttempts, setLoginAttempts] = useState(0)
  const MAX_ATTEMPTS = 3

  const { login, loading, initialize } = useAuth()

  useEffect(() => {
    // Inicializar autenticación al cargar el componente
    initialize()
  }, [initialize])

  // Efecto para limpiar campos al cargar
  useEffect(() => {
    // Limpiar los campos DOM para prevenir autocompletado
    const timer = setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.reset()
      }
    }, 50)
    
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (loginAttempts >= MAX_ATTEMPTS) {
      setError('Has superado el número máximo de intentos. Inténtalo más tarde.')
      return
    }

    setError('')

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // Login exitoso
        setLoginAttempts(0)
      } else {
        // Login fallido
        setLoginAttempts(prev => prev + 1)
        const remaining = MAX_ATTEMPTS - loginAttempts - 1
        
        if (remaining > 0) {
          setError(result.error || `Credenciales incorrectas. Te quedan ${remaining} intento${remaining > 1 ? 's' : ''}.`)
        } else {
          setError('Has superado el número máximo de intentos. Inténtalo más tarde.')
        }
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    }
  }

  const isFormValid = formData.email.trim() && formData.password.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Agenda de Equipo
          </h1>
          <p className="text-gray-600">
            Inicia sesión para acceder a tu workspace
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            {/* Hidden fields to confuse browser autocomplete */}
            <input type="text" style={{display: 'none'}} />
            <input type="password" style={{display: 'none'}} />
            
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700 block">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="tu-email@equipo.com"
                  disabled={loading || loginAttempts >= MAX_ATTEMPTS}
                  autoComplete="off"
                  data-form-type="other"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 block">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Ingresa tu contraseña"
                  autoComplete="new-password"
                  data-form-type="other"
                  disabled={loading || loginAttempts >= MAX_ATTEMPTS}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || loginAttempts >= MAX_ATTEMPTS}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading || loginAttempts >= MAX_ATTEMPTS}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-indigo-500 disabled:hover:to-purple-600 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>
        </div>

        {/* Demo Credentials - TEMPORAL */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="text-sm font-medium text-amber-900 mb-2">⚠️ Acceso Temporal:</h3>
          <div className="text-xs text-amber-800 space-y-1">
            <div><strong>Gabi:</strong> gabi@equipo.com / 3333</div>
            <div><strong>Caro:</strong> caro@equipo.com / 2222</div>
            <div className="mt-2 text-amber-700 italic">
              Actualiza tu perfil con tu email real después del primer ingreso
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2024 Agenda de Equipo. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}