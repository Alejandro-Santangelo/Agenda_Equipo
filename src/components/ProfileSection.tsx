'use client'

// Updated 2025-11-02 - Avatar fixes deployed
import { useState, useRef } from 'react'
import Image from 'next/image'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Camera, 
  Save,
  Eye,
  EyeOff,
  X,
  Crown,
  Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import { offlineDB } from '@/lib/offline'
import { supabase } from '@/lib/supabase'

export default function ProfileSection() {
  const { currentUser, updateCurrentUser } = useAppStore()
  const { updateProfile } = useAuth()
  const { isOnline, addOperationToQueue } = useOfflineSync()

  // Estados del formulario
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Estados para la foto
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentUser?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de UI
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Debes iniciar sesión para ver tu perfil</p>
      </div>
    )
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('🔍 TESTING: Archivo seleccionado:', file.name, file.size, 'bytes')

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('❌ Por favor selecciona una imagen válida (JPG, PNG, GIF, etc.)')
      return
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      toast.error(`❌ La imagen es muy grande (${sizeMB}MB). Máximo: 5MB`)
      return
    }

    // Mostrar confirmación
    toast.success(`📷 Imagen seleccionada: ${file.name}`)
    
    setAvatarFile(file)
    
    // Crear preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setAvatarPreview(result)
      console.log('📸 Preview de avatar creado exitosamente')
    }
    reader.onerror = () => {
      toast.error('❌ Error al procesar la imagen')
    }
    reader.readAsDataURL(file)
    
    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    e.target.value = ''
  }

  const uploadAvatar = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // En modo offline, usar URL de blob local
      if (!supabase || !isOnline) {
        console.log('📱 Avatar guardado localmente - Modo offline')
        
        // Crear blob URL para uso local
        const blobUrl = URL.createObjectURL(file)
        
        // Guardar referencia en localStorage para persistencia
        try {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            localStorage.setItem(`avatar-${currentUser.id}`, base64)
            console.log('💾 Avatar guardado en localStorage')
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.warn('No se pudo guardar en localStorage:', error)
        }
        
        return blobUrl
      }

      // Upload a Supabase si está disponible
      const { error: uploadError } = await supabase.storage
        .from('team-files')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading to Supabase:', uploadError)
        
        // Fallback a modo local
        console.log('📱 Fallback: Guardando avatar localmente')
        const blobUrl = URL.createObjectURL(file)
        
        try {
          const reader = new FileReader()
          reader.onload = () => {
            const base64 = reader.result as string
            localStorage.setItem(`avatar-${currentUser.id}`, base64)
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.warn('No se pudo guardar en localStorage:', error)
        }
        
        return blobUrl
      }

      const { data } = supabase.storage
        .from('team-files')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      
      // Último fallback: usar blob URL
      try {
        const blobUrl = URL.createObjectURL(file)
        console.log('📱 Último fallback: Usando blob URL')
        return blobUrl
      } catch {
        return null
      }
    }
  }

  const handleSave = async () => {
    if (!currentUser) return

    setIsSaving(true)

    try {
      // Mostrar toast informativo si hay avatar pendiente
      if (avatarFile) {
        toast('💾 Guardando perfil y subiendo nueva foto...', { duration: 2000 })
      } else {
        toast('💾 Guardando cambios del perfil...', { duration: 2000 })
      }

      // Validaciones
      if (!formData.name.trim()) {
        toast.error('El nombre es requerido')
        return
      }

      if (!formData.email.trim()) {
        toast.error('El email es requerido')
      }

      // Validar email formato
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Formato de email inválido')
        return
      }

      // Si hay cambio de contraseña, validar
      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast.error('Debes ingresar tu contraseña actual')
          return
        }

        if (formData.newPassword.length < 4) {
          toast.error('La nueva contraseña debe tener al menos 4 caracteres')
          return
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast.error('Las contraseñas no coinciden')
          return
        }
      }

      let avatarUrl = currentUser.avatar_url

      // Subir nueva foto si hay una seleccionada
      if (avatarFile) {
        console.log('🔍 TESTING: Intentando subir avatar:', avatarFile.name, 'Online:', isOnline)
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
          console.log('✅ TESTING: Avatar subido exitosamente:', uploadedUrl)
          toast.success('📷 Foto de perfil actualizada correctamente')
        } else {
          console.log('❌ TESTING: Error al subir avatar')
          toast.error('Error al subir la foto. Los demás cambios se guardarán.')
        }
      }

      // Preparar datos actualizados
      const updatedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        avatar_url: avatarUrl
      }

      // Actualizar perfil usando el hook de auth
      const result = await updateProfile(updatedData)

      if (!result.success) {
        toast.error(result.error || 'Error al actualizar el perfil')
        return
      }

      // Actualizar usuario en el store local
      updateCurrentUser({
        ...currentUser,
        ...updatedData
      })

      // Guardar offline
      try {
        await offlineDB.updateMember(currentUser.id, updatedData)
      } catch (offlineError) {
        console.error('Error saving offline:', offlineError)
      }

      // Si no hay conexión, agregar a cola de sincronización
      if (!isOnline) {
        await addOperationToQueue('profile_update', updatedData)
      }

      toast.success('Perfil actualizado exitosamente')
      setIsEditing(false)
      setAvatarFile(null)
      
      // Limpiar campos de contraseña
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))

    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error al actualizar el perfil')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setAvatarPreview(currentUser.avatar_url || null)
    setAvatarFile(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Perfil</h2>
          <p className="text-gray-600">Gestiona tu información personal y configuración</p>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
          >
            <User size={16} />
            Editar Perfil
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {avatarPreview ? (
                <div className={`relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-lg transition-all ${
                  avatarFile ? 'border-yellow-400 shadow-yellow-200' : 'border-white'
                }`}>
                  <Image
                    src={avatarPreview}
                    alt={`Avatar de ${currentUser.name}`}
                    fill
                    sizes="128px"
                    className="object-cover"
                    onError={() => {
                      console.log('Error cargando avatar, usando fallback')
                      setAvatarPreview(null)
                    }}
                  />
                  {avatarFile && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                      !
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {currentUser.name[0]}
                </div>
              )}
              
              {isEditing && (
                <>
                  {/* Botón de cámara */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                    title="Cambiar foto de perfil"
                  >
                    <Camera size={18} />
                  </button>
                  
                  {/* Overlay de hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 text-white text-xs font-medium">
                      Cambiar foto
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            
            {avatarFile && (
              <div className="text-center px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">
                  📷 Nueva foto seleccionada
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Haz clic en &ldquo;Guardar Cambios&rdquo; para aplicar
                </p>
              </div>
            )}
            
            <div className="text-center">
              <h3 className="font-semibold text-lg text-gray-900">{currentUser.name}</h3>
              <div className="flex items-center justify-center gap-2 mt-1">
                {currentUser.role === 'admin' ? (
                  <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    <Crown size={12} />
                    Administrador
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    <Shield size={12} />
                    Miembro
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="flex-1 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-1" />
                Nombre completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Tu nombre completo"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{currentUser.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail size={16} className="inline mr-1" />
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="tu@email.com"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{currentUser.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-1" />
                Teléfono / WhatsApp
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="+54 9 11 1234-5678"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {currentUser.phone || 'No especificado'}
                </p>
              )}
            </div>

            {/* Password Section - Only in edit mode */}
            {isEditing && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 mb-4">Cambiar contraseña (opcional)</h4>
                
                {/* Current Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lock size={16} className="inline mr-1" />
                    Contraseña actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                      placeholder="Nueva contraseña (mínimo 4 caracteres)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar nueva contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                      placeholder="Confirma tu nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {avatarFile ? 'Guardando y subiendo foto...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {avatarFile ? 'Guardar Cambios + Foto' : 'Guardar Cambios'}
                  {avatarFile && <span className="ml-1 text-yellow-200">📷</span>}
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-gray-600">
          {isOnline ? 'Conectado - Cambios se sincronizan automáticamente' : 'Offline - Los cambios se sincronizarán cuando haya conexión'}
        </span>
      </div>
    </div>
  )
}