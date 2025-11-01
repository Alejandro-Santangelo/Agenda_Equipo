'use client'

import { useState } from 'react'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface ProfileFormData {
  name: string
  email: string
  phone: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfileScreen() {
  const { currentUser, updateProfile, changePassword, loading } = useAuth()
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [messages, setMessages] = useState({
    profile: '',
    password: ''
  })

  const [messageTypes, setMessageTypes] = useState({
    profile: 'success' as 'success' | 'error',
    password: 'success' as 'success' | 'error'
  })

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar mensajes cuando el usuario empieza a escribir
    if (field === 'name' || field === 'email' || field === 'phone') {
      setMessages(prev => ({ ...prev, profile: '' }))
    } else {
      setMessages(prev => ({ ...prev, password: '' }))
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setMessages(prev => ({ ...prev, profile: 'El nombre es obligatorio' }))
      setMessageTypes(prev => ({ ...prev, profile: 'error' }))
      return
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setMessages(prev => ({ ...prev, profile: 'El email debe ser válido' }))
      setMessageTypes(prev => ({ ...prev, profile: 'error' }))
      return
    }

    const result = await updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined
    })

    if (result.success) {
      setMessages(prev => ({ ...prev, profile: 'Perfil actualizado correctamente' }))
      setMessageTypes(prev => ({ ...prev, profile: 'success' }))
    } else {
      setMessages(prev => ({ ...prev, profile: result.error || 'Error al actualizar perfil' }))
      setMessageTypes(prev => ({ ...prev, profile: 'error' }))
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.currentPassword) {
      setMessages(prev => ({ ...prev, password: 'Ingresa tu contraseña actual' }))
      setMessageTypes(prev => ({ ...prev, password: 'error' }))
      return
    }

    if (!formData.newPassword || formData.newPassword.length < 4) {
      setMessages(prev => ({ ...prev, password: 'La nueva contraseña debe tener al menos 4 caracteres' }))
      setMessageTypes(prev => ({ ...prev, password: 'error' }))
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessages(prev => ({ ...prev, password: 'Las contraseñas no coinciden' }))
      setMessageTypes(prev => ({ ...prev, password: 'error' }))
      return
    }

    const result = await changePassword(formData.newPassword)

    if (result.success) {
      setMessages(prev => ({ ...prev, password: 'Contraseña cambiada correctamente' }))
      setMessageTypes(prev => ({ ...prev, password: 'success' }))
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } else {
      setMessages(prev => ({ ...prev, password: result.error || 'Error al cambiar contraseña' }))
      setMessageTypes(prev => ({ ...prev, password: 'error' }))
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Perfil</h1>
        <p className="text-gray-600">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Información Personal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Información Personal
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-gray-700 block">
                Nombre completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Tu nombre completo"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="profile-email" className="text-sm font-medium text-gray-700 block">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="tu-email@equipo.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700 block">
                Número de teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="+1 234 567 8900"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Mensaje de perfil */}
            {messages.profile && (
              <div className={`flex items-center space-x-2 text-sm p-3 rounded-lg border ${
                messageTypes.profile === 'success' 
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                {messageTypes.profile === 'success' ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{messages.profile}</span>
              </div>
            )}

            {/* Botón guardar perfil */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Cambiar Contraseña
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Contraseña actual */}
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium text-gray-700 block">
                Contraseña actual
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Tu contraseña actual"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('current')}
                  disabled={loading}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva contraseña */}
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-gray-700 block">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Tu nueva contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('new')}
                  disabled={loading}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 block">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Confirma tu nueva contraseña"
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

            {/* Mensaje de contraseña */}
            {messages.password && (
              <div className={`flex items-center space-x-2 text-sm p-3 rounded-lg border ${
                messageTypes.password === 'success' 
                  ? 'text-green-600 bg-green-50 border-green-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              }`}>
                {messageTypes.password === 'success' ? (
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{messages.password}</span>
              </div>
            )}

            {/* Botón cambiar contraseña */}
            <button
              type="submit"
              disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cambiando...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Cambiar Contraseña</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Información de la cuenta */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la cuenta</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Rol:</span>
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
              currentUser?.role === 'admin' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {currentUser?.role === 'admin' ? '👑 Administradora' : '🛡️ Miembro'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Cuenta creada:</span>
            <span className="ml-2 text-gray-600">
              {currentUser?.created_at ? new Date(currentUser.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Última actualización:</span>
            <span className="ml-2 text-gray-600">
              {currentUser?.updated_at ? new Date(currentUser.updated_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}