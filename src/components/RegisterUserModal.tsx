'use client'

import { useState } from 'react'
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, UserPlus, Phone, Send } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface RegisterFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface RegisterUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function RegisterUserModal({ isOpen, onClose, onSuccess }: RegisterUserModalProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirm: false
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { loading, currentUser } = useAuth()

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio')
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('El email debe ser válido')
      return
    }

    if (!formData.password || formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    // Verificar que solo admins pueden registrar usuarios
    if (currentUser?.role !== 'admin') {
      setError('Solo los administradores pueden agregar usuarios')
      return
    }

    try {
      // Llamar a la API para crear el miembro en la base de datos
      const response = await fetch('/api/add-member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          invitedBy: currentUser?.name || 'Administrador',
          useNativeNotifications: true // Flag para usar notificaciones nativas
        }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        // Importar y usar notificaciones nativas
        const { notifyNewMemberNative } = await import('@/lib/notifications-native')
        
        // Abrir aplicaciones nativas para notificar
        const notificationResults = notifyNewMemberNative({
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          invitedBy: currentUser?.name || 'Administrador'
        })

        // Mostrar resultado
        let notificationStatus = ''
        const emailAttempted = notificationResults.email.attempted
        const whatsappAttempted = notificationResults.whatsapp.attempted
        
        if (emailAttempted && whatsappAttempted) {
          notificationStatus = ' 📧📱 Email y WhatsApp abiertos para envío'
        } else if (emailAttempted) {
          notificationStatus = ' 📧 Cliente de email abierto para envío'
        } else {
          notificationStatus = ' ⚠️ Revisa las aplicaciones para enviar notificaciones'
        }

        setSuccess(`¡${formData.name} agregada exitosamente!${notificationStatus}`)
        
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        })
        
        // Cerrar modal después de 5 segundos para dar tiempo a enviar notificaciones
        setTimeout(() => {
          onSuccess()
          onClose()
          setSuccess('')
        }, 5000)
      } else {
        setError(result.error || 'Error al agregar miembro')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Error de conexión al servidor')
    }
  }

  const togglePasswordVisibility = (field: 'password' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Agregar Nuevo Miembro
          </h2>
          <p className="text-gray-600">
            Se enviará email y WhatsApp automáticamente
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="register-name" className="text-sm font-medium text-gray-700 block">
              Nombre completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Nombre del nuevo usuario"
                disabled={loading}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium text-gray-700 block">
              Correo electrónico *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="maria@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <label htmlFor="register-phone" className="text-sm font-medium text-gray-700 block">
              Número de celular/WhatsApp
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Ej: +54 9 11 1234-5678"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium text-gray-700 block">
              Contraseña inicial *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-password"
                type={showPasswords.password ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Contraseña temporal (min. 4 caracteres)"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('password')}
                disabled={loading}
              >
                {showPasswords.password ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <label htmlFor="register-confirm-password" className="text-sm font-medium text-gray-700 block">
              Confirmar contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="register-confirm-password"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Confirma la contraseña"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={loading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Información del proceso */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              <strong>📋 Proceso de Invitación:</strong><br />
              • El nuevo miembro será agregado como &quot;Miembro&quot;<br />
              • Se abrirá tu <strong>cliente de email</strong> para enviar credenciales<br />
              • Se abrirá <strong>WhatsApp Web</strong> (si se proporciona número)<br />
              • Debes enviar manualmente los mensajes generados<br />
              • El nuevo miembro debe cambiar su contraseña al ingresar
            </p>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-medium hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirmPassword}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Agregando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Agregar y Notificar</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-xs">
            <strong>Nota:</strong> El nuevo usuario recibirá credenciales para acceder al sistema. 
            Podrá cambiar su contraseña desde su perfil una vez que inicie sesión.
          </p>
        </div>
      </div>
    </div>
  )
}