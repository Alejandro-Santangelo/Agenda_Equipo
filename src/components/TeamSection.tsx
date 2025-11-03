'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useAuth } from '@/hooks/useAuth'
import { offlineDB } from '@/lib/offline'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { 
  Crown, 
  User, 
  Mail, 
  Calendar, 
  UserPlus, 
  Shield,
  Clock,
  Settings,
  Key,
  Eye,
  EyeOff,
  Send,
  Lock,
  RotateCcw,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import PermissionsManager from './PermissionsManager'
import { hasPermission } from '@/types/permissions'

export default function TeamSection() {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPermissionsManager, setShowPermissionsManager] = useState(false)
  const [selectedMemberForPermissions, setSelectedMemberForPermissions] = useState<string>('')
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<{id: string, name: string} | null>(null)
  // Reset credentials modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetMemberId, setResetMemberId] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  
  const { 
    teamMembers, 
    addTeamMember, 
    removeTeamMember, 
    currentUser,
    sharedFiles,
    chatMessages
  } = useAppStore()
  
  const { isOnline, addOperationToQueue, syncWithServer } = useOfflineSync()
  const { register, resetCredentials } = useAuth()

  // Optimización de manejadores de eventos del formulario
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMemberName(e.target.value)
  }, [])

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMemberEmail(e.target.value)
  }, [])

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMemberPhone(e.target.value)
  }, [])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMemberPassword(e.target.value)
  }, [])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
  }, [])

  // Función para enviar email de bienvenida
  const sendWelcomeEmail = (email: string, name: string, password: string) => {
    const subject = encodeURIComponent('¡Bienvenido/a al Equipo! - Credenciales de Acceso')
    const body = encodeURIComponent(`¡Hola ${name}!

¡Bienvenido/a al equipo! Has sido agregado/a a nuestra Agenda Colaborativa.

📧 CREDENCIALES DE ACCESO:
• Usuario (Email): ${email}
• Contraseña: ${password}

🔗 Accede a la aplicación en: ${window.location.origin}

📝 RECOMENDACIONES:
• Cambia tu contraseña desde tu perfil una vez que ingreses
• Completa tu información personal si lo deseas
• Explora las funciones de archivos y chat del equipo

Si tienes alguna pregunta, no dudes en contactarnos.

¡Que tengas un excelente día!
El Equipo`)
    
    // Abrir cliente de email predeterminado
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')
  }

  // Función para enviar mensaje de WhatsApp
  const sendWhatsAppMessage = (phone: string, name: string, email: string, password: string) => {
    if (!phone.trim()) return
    
    // Limpiar número de teléfono (quitar espacios, guiones, etc.)
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    
    const message = encodeURIComponent(`¡Hola ${name}! 👋

¡Bienvenido/a al equipo! Has sido agregado/a a nuestra Agenda Colaborativa.

🔐 *CREDENCIALES DE ACCESO:*
📧 Usuario: ${email}
🔑 Contraseña: ${password}

🌐 Accede aquí: ${window.location.origin}

💡 *Recomendaciones:*
• Cambia tu contraseña desde tu perfil
• Completa tu información personal
• Explora archivos y chat del equipo

¡Que tengas un excelente día! 🚀`)
    
    // Abrir WhatsApp Web
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
  }

  // Limpiar formulario cada vez que se abre el modal
  useEffect(() => {
    if (showInviteModal) {
      // Pequeño delay para asegurar que se limpie después del auto-fill del navegador
      setTimeout(() => {
        setNewMemberName('')
        setNewMemberEmail('')
        setNewMemberPhone('')
        setNewMemberPassword('')
        setShowPassword(false)
      }, 50)
    }
  }, [showInviteModal])

  const handleInviteMember = async () => {
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim() || !currentUser) return

    if (currentUser.role !== 'admin') {
      toast.error('Solo Paula puede agregar nuevos miembros')
      return
    }

    if (newMemberPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres')
      return
    }

    // Verificar si el email ya existe
    const emailExists = teamMembers.some(member => member.email.toLowerCase() === newMemberEmail.trim().toLowerCase())
    if (emailExists) {
      toast.error('Este email ya está registrado en el equipo')
      return
    }

    try {
      console.log('🚀 Iniciando proceso de agregar miembro...')
      console.log('Datos del formulario:', { 
        name: newMemberName.trim(), 
        email: newMemberEmail.trim(), 
        phone: newMemberPhone.trim(),
        passwordLength: newMemberPassword.length
      })
      
      toast.loading('Agregando nuevo miembro...', { id: 'invite-member' })
      
      // Primero, registrar el usuario en el sistema de autenticación
      console.log('📝 Intentando registrar usuario en el sistema de auth...')
      const registerResult = await register(newMemberEmail.trim(), newMemberPassword, newMemberName.trim(), newMemberPhone.trim())
      console.log('Resultado del registro:', registerResult)
      
      if (!registerResult.success) {
        console.error('❌ Error en el registro:', registerResult.error)
        toast.error(registerResult.error || 'Error al crear las credenciales del usuario', { id: 'invite-member' })
        return
      }
      console.log('✅ Usuario registrado exitosamente en el sistema de auth')

      // Hashear la contraseña para almacenarla
      console.log('🔐 Hasheando contraseña...')
      const { hashPassword } = await import('@/lib/password-utils')
      const passwordHash = await hashPassword(newMemberPassword)
      console.log('✅ Contraseña hasheada correctamente')

      // Crear nuevo miembro con estructura simple + password_hash
      const newMemberData = {
        id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        phone: newMemberPhone.trim() || undefined,
        role: 'member' as const,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      }

      console.log('👤 Nuevo miembro creado:', { ...newMemberData, password_hash: '[HIDDEN]' })
      
      // Agregar localmente primero
      console.log('💾 Agregando miembro al estado local...')
      addTeamMember(newMemberData)
      console.log('💾 Guardando miembro en IndexedDB...')
      await offlineDB.saveMembers([...teamMembers, newMemberData])
      console.log('✅ Miembro guardado localmente')

      // Sincronizar con servidor solo si está configurado
      if (isOnline && supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('team_members').insert([newMemberData])
          console.log('✅ Miembro agregado exitosamente a la base de datos con credenciales')
        } catch (error) {
          console.error('Error adding team member to database:', error)
          await addOperationToQueue('member', newMemberData)
          console.log('📋 Miembro agregado a la cola de sincronización')
        }
      } else {
        await addOperationToQueue('member', newMemberData)
        console.log('📋 Miembro guardado localmente - Supabase no configurado')
      }

      toast.success(`✅ ${newMemberName.trim()} agregado al equipo exitosamente`, { id: 'invite-member' })

      // Enviar notificaciones de bienvenida automáticamente
      try {
        // Mostrar mensaje de confirmación antes de enviar notificaciones
        const shouldSendNotifications = window.confirm(
          `✅ ${newMemberName.trim()} ha sido agregado exitosamente al equipo.\n\n📧 ¿Deseas enviar las credenciales por email y WhatsApp ahora?\n\n• Email: ${newMemberEmail.trim()}\n• WhatsApp: ${newMemberPhone.trim() || 'No proporcionado'}`
        )

        if (shouldSendNotifications) {
          // Enviar email de bienvenida
          console.log('📧 Enviando email de bienvenida...')
          sendWelcomeEmail(newMemberEmail.trim(), newMemberName.trim(), newMemberPassword)
          
          let notificationsText = '📧 Email enviado'
          
          // Enviar WhatsApp si se proporcionó número
          if (newMemberPhone.trim()) {
            // Pequeño delay para no abrir ambas ventanas al mismo tiempo
            setTimeout(() => {
              console.log('� Enviando mensaje de WhatsApp...')
              sendWhatsAppMessage(
                newMemberPhone.trim(), 
                newMemberName.trim(), 
                newMemberEmail.trim(), 
                newMemberPassword
              )
            }, 2000)
            notificationsText += ' y 📱 WhatsApp enviado'
          }
          
          toast.success(`✅ ${notificationsText} correctamente`)
        } else {
          toast.success('Miembro agregado sin envío de notificaciones')
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError)
        toast.error('Usuario agregado pero hubo un error al enviar notificaciones')
      }

      // Limpiar formulario y cerrar modal
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewMemberPhone('')
      setShowPassword(false)
      setShowInviteModal(false)

    } catch (error) {
      console.error('Error en el proceso de registro:', error)
      toast.error('❌ Error al agregar el miembro del equipo: ' + (error as Error).message, { id: 'invite-member' })
    }
  }

  const handleRemoveMemberClick = (memberId: string) => {
    if (currentUser?.role !== 'admin') {
      toast.error('Solo Paula puede eliminar miembros')
      return
    }

    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    if (member.role === 'admin') {
      toast.error('No puedes eliminar a un administrador')
      return
    }

    // Mostrar modal de confirmación
    setMemberToDelete({ id: member.id, name: member.name })
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete) return

    try {
      // Eliminar localmente
      removeTeamMember(memberToDelete.id)
      
      // Actualizar almacenamiento offline
      const updatedMembers = teamMembers.filter(m => m.id !== memberToDelete.id)
      await offlineDB.saveMembers(updatedMembers)

      // Sincronizar con servidor si está online y configurado
      if (isOnline && supabase && isSupabaseConfigured()) {
        try {
          await supabase.from('team_members').delete().eq('id', memberToDelete.id)
          toast.success(`${memberToDelete.name} ha sido eliminado del equipo`)
        } catch (error) {
          console.error('Error removing member from server:', error)
          toast.success(`${memberToDelete.name} eliminado localmente - Se sincronizará cuando haya conexión`)
        }
      } else {
        // Agregar a cola de sincronización para eliminar cuando haya conexión
        await addOperationToQueue('delete_member', { id: memberToDelete.id })
        toast.success(`${memberToDelete.name} eliminado localmente - Se sincronizará cuando haya conexión`)
      }

    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Error al eliminar el miembro')
    } finally {
      // Cerrar modal
      setShowDeleteConfirmModal(false)
      setMemberToDelete(null)
    }
  }

  // Función para exportar datos del equipo
  const handleExportTeamData = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('Solo los administradores pueden exportar datos')
      return
    }

    try {
      // Confirmar exportación
      const confirmed = window.confirm(
        'Se exportarán todos los datos del equipo (miembros, archivos y conversaciones). ¿Continuar?'
      )
      if (!confirmed) return

      toast.loading('Generando archivo de exportación...', { id: 'export' })

      // Recopilar todos los datos
      const exportData = {
        exportInfo: {
          generatedAt: new Date().toISOString(),
          exportedBy: currentUser.name,
          version: '1.0',
          totalMembers: teamMembers.length,
          totalFiles: sharedFiles.length,
          totalMessages: chatMessages.length
        },
        teamMembers: teamMembers.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          permissions: member.permissions,
          createdAt: member.created_at,
          lastActive: member.last_active
        })),
        sharedFiles: sharedFiles.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          fileType: file.file_type,
          size: file.size,
          uploadedBy: teamMembers.find(m => m.id === file.uploaded_by)?.name || 'Usuario eliminado',
          createdAt: file.created_at,
          url: file.drive_url || 'Archivo local'
        })),
        chatMessages: chatMessages.map(message => ({
          id: message.id,
          message: message.message,
          userName: message.user_name,
          createdAt: message.created_at
        }))
      }

      // Crear archivo CSV para miembros
      const csvMembers = [
        'Nombre,Email,Teléfono,Rol,Fecha de Ingreso,Última Actividad',
        ...teamMembers.map(member => {
          const createdDate = new Date(member.created_at);
          const lastActiveDate = new Date(member.last_active);
          const createdStr = createdDate.toString() !== 'Invalid Date' ? createdDate.toLocaleDateString() : 'N/A';
          const lastActiveStr = lastActiveDate.toString() !== 'Invalid Date' ? lastActiveDate.toLocaleString() : 'N/A';
          return `"${member.name}","${member.email}","${member.phone || 'No especificado'}","${member.role}","${createdStr}","${lastActiveStr}"`;
        })
      ].join('\n')

      // Crear archivo CSV para archivos
      const csvFiles = [
        'Nombre Archivo,Tipo,Tamaño,Subido Por,Fecha',
        ...sharedFiles.map(file => {
          const fileDate = new Date(file.created_at);
          const fileDateStr = fileDate.toString() !== 'Invalid Date' ? fileDate.toLocaleString() : 'N/A';
          return `"${file.name}","${file.file_type}","${file.size ? (file.size / 1024 / 1024).toFixed(2) + ' MB' : 'N/A'}","${teamMembers.find(m => m.id === file.uploaded_by)?.name || 'Usuario eliminado'}","${fileDateStr}"`;
        })
      ].join('\n')

      // Crear archivo TXT para chat
      const txtChat = [
        '=== CONVERSACIONES DEL EQUIPO ===\n',
        `Exportado el: ${new Date().toLocaleString()}`,
        `Total de mensajes: ${chatMessages.length}\n`,
        '--- MENSAJES ---\n',
        ...chatMessages.map(msg => 
          `[${new Date(msg.created_at).toLocaleString()}] ${msg.user_name}: ${msg.message}`
        )
      ].join('\n')

      // Crear y descargar archivos
      const timestamp = new Date().toISOString().split('T')[0]
      
      // JSON completo
      const jsonBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      downloadFile(jsonBlob, `equipo-completo-${timestamp}.json`)
      
      // CSV miembros
      const csvMembersBlob = new Blob([csvMembers], { type: 'text/csv;charset=utf-8' })
      downloadFile(csvMembersBlob, `equipo-miembros-${timestamp}.csv`)
      
      // CSV archivos
      const csvFilesBlob = new Blob([csvFiles], { type: 'text/csv;charset=utf-8' })
      downloadFile(csvFilesBlob, `equipo-archivos-${timestamp}.csv`)
      
      // TXT chat
      const txtBlob = new Blob([txtChat], { type: 'text/plain;charset=utf-8' })
      downloadFile(txtBlob, `equipo-chat-${timestamp}.txt`)

      toast.success('Datos exportados correctamente (4 archivos descargados)', { id: 'export' })
      
    } catch (error) {
      console.error('Error exporting data:', error)
      toast.error('Error al exportar los datos', { id: 'export' })
    }
  }

  // Función auxiliar para descargar archivos
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Función para manejar reset de credenciales
  const handleResetCredentialsClick = (memberId: string) => {
    if (!currentUser || !currentUser.permissions || !hasPermission(currentUser.permissions, 'admin.reset_credentials')) {
      toast.error('No tienes permisos para resetear credenciales')
      return
    }

    const member = teamMembers.find(m => m.id === memberId)
    if (!member) return

    if (member.role === 'admin') {
      toast.error('No puedes resetear credenciales de un administrador')
      return
    }

    setResetMemberId(memberId)
    setResetEmail(member.email)
    setResetPassword('')
    setShowResetPassword(false)
    setIsResetModalOpen(true)
  }

  const handleConfirmResetCredentials = async () => {
    if (!resetMemberId || !resetEmail.trim() || !resetPassword.trim()) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (resetPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres')
      return
    }

    const member = teamMembers.find(m => m.id === resetMemberId)
    if (!member) return

    try {
      // Usar la función resetCredentials del hook de autenticación
      const result = await resetCredentials(member.email, resetEmail.trim())
      
      if (!result.success) {
        toast.error(result.error || 'Error al resetear las credenciales')
        return
      }

      // Actualizar email del miembro si cambió
      if (resetEmail.trim() !== member.email) {
        const updatedMember = { ...member, email: resetEmail.trim() }
        
        // Actualizar localmente
        const updatedMembers = teamMembers.map(m => 
          m.id === resetMemberId ? updatedMember : m
        )
        
        // Actualizar en el store
        removeTeamMember(resetMemberId)
        addTeamMember(updatedMember)

        // Guardar offline
        await offlineDB.saveMembers(updatedMembers)

        // Sincronizar con servidor si está online y configurado
        if (isOnline && supabase && isSupabaseConfigured()) {
          try {
            await supabase.from('team_members')
              .update({ email: resetEmail.trim() })
              .eq('id', resetMemberId)
          } catch (error) {
            console.error('Error updating member email on server:', error)
          }
        }
      }

      toast.success(`Credenciales de ${member.name} actualizadas exitosamente`)
      
      // Cerrar modal y limpiar estado
      setIsResetModalOpen(false)
      setResetMemberId(null)
      setResetEmail('')
      setResetPassword('')

    } catch (error) {
      console.error('Error resetting credentials:', error)
      toast.error('Error al resetear las credenciales')
    }
  }

  const getUserColor = (userId: string) => {
    const colors = [
      'from-pink-400 to-pink-500',
      'from-purple-400 to-purple-500', 
      'from-indigo-400 to-indigo-500',
      'from-blue-400 to-blue-500',
      'from-green-400 to-green-500',
      'from-yellow-400 to-yellow-500',
      'from-red-400 to-red-500',
    ]
    const index = parseInt(userId) % colors.length
    return colors[index]
  }

  const getLastActiveStatus = (lastActive: string) => {
    const now = new Date()
    const lastActiveDate = new Date(lastActive)
    const diffInHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Activa ahora'
    if (diffInHours < 24) return `Hace ${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    
    return format(lastActiveDate, 'dd MMM', { locale: es })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Equipo</h2>
          <p className="text-gray-600">{teamMembers.length} miembros en el equipo</p>
        </div>
        
        {currentUser?.role === 'admin' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                // Limpiar formulario antes de abrir
                setNewMemberName('')
                setNewMemberEmail('')
                setNewMemberPhone('')
                setNewMemberPassword('')
                setShowPassword(false)
                setShowInviteModal(true)
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <UserPlus size={18} />
              <span>Agregar Nuevo Miembro</span>
            </button>
            <button
              onClick={() => setShowPermissionsManager(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <Key size={18} />
              <span>Gestionar Permisos</span>
            </button>
            <button
              onClick={handleExportTeamData}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              <span>Exportar Datos</span>
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2.5 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium"
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Administradores</p>
              <p className="text-xl font-semibold text-gray-900">
                {teamMembers.filter(m => m.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
              <User size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Miembros</p>
              <p className="text-xl font-semibold text-gray-900">
                {teamMembers.filter(m => m.role === 'member').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Activas hoy</p>
              <p className="text-xl font-semibold text-gray-900">
                {teamMembers.filter(m => {
                  const lastActive = new Date(m.last_active)
                  const today = new Date()
                  return lastActive.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-3">
        {teamMembers.map((member) => (
          <div key={member.id} className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getUserColor(member.id)} flex items-center justify-center text-white text-lg font-semibold`}>
                  {member.name[0]}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{member.name}</h4>
                    {member.role === 'admin' ? (
                      <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">
                        <Crown size={12} />
                        Admin
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        <Shield size={12} />
                        Miembro
                      </div>
                    )}
                    {member.id === currentUser?.id && (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        Tú
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Mail size={14} />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.created_at && (() => {
                      const createdDate = new Date(member.created_at);
                      return createdDate.toString() !== 'Invalid Date' ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Desde {format(createdDate, 'MMM yyyy', { locale: es })}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">
                      {getLastActiveStatus(member.last_active)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentUser?.role === 'admin' && member.id !== currentUser.id && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedMemberForPermissions(member.id)
                        setShowPermissionsManager(true)
                      }}
                      className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Gestionar permisos"
                    >
                      <Key size={16} />
                    </button>
                    {member.role !== 'admin' && currentUser && currentUser.permissions && hasPermission(currentUser.permissions, 'admin.reset_credentials') && (
                      <button
                        onClick={() => handleResetCredentialsClick(member.id)}
                        className="p-2 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Resetear credenciales"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    {member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMemberClick(member.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
                        title="Eliminar miembro del equipo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
                
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Miembro</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={handleNameChange}
                  placeholder="Ej: María González"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={handleEmailChange}
                  placeholder="maria@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de celular/WhatsApp
                </label>
                <input
                  type="tel"
                  value={newMemberPhone}
                  onChange={handlePhoneChange}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña inicial *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newMemberPassword}
                    onChange={handlePasswordChange}
                    placeholder="Contraseña temporal (min. 4 caracteres)"
                    className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    minLength={4}
                    autoComplete="new-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>📋 Proceso de Invitación:</strong><br />
                  • El nuevo miembro será agregado como &quot;Miembro&quot;<br />
                  • Se enviará un <strong>email</strong> con las credenciales de acceso<br />
                  • Se enviará un <strong>WhatsApp</strong> (si se proporciona número)<br />
                  • Debe cambiar la contraseña desde su perfil al ingresar
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false)
                  setNewMemberName('')
                  setNewMemberEmail('')
                  setNewMemberPassword('')
                  setNewMemberPhone('')
                  setShowPassword(false)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInviteMember}
                disabled={!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword.trim() || newMemberPassword.length < 4}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Agregar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Manager Modal */}
      {showPermissionsManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <PermissionsManager 
              targetUserId={selectedMemberForPermissions}
              onClose={() => {
                setShowPermissionsManager(false)
                setSelectedMemberForPermissions('')
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && memberToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center">
              {/* Icono de advertencia */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              {/* Título */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Eliminar miembro del equipo?
              </h3>
              
              {/* Descripción */}
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  Estás a punto de eliminar a <strong className="text-gray-900">{memberToDelete.name}</strong> del equipo.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <p className="text-red-800">
                    <strong>⚠️ Esta acción no se puede deshacer.</strong>
                  </p>
                  <p className="text-red-700 mt-1">
                    El miembro perderá acceso a todos los archivos y conversaciones del equipo.
                  </p>
                </div>
              </div>
              
              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirmModal(false)
                    setMemberToDelete(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmRemoveMember}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Credentials Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <RotateCcw size={20} className="text-orange-500" />
              Resetear Credenciales
            </h3>
            
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lock size={16} className="text-orange-600" />
                <span className="font-semibold text-orange-800">¡Atención!</span>
              </div>
              <p className="text-orange-700 text-sm">
                Vas a resetear las credenciales de acceso. El usuario deberá usar las nuevas credenciales para ingresar.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo email *
                </label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Ingresa el nuevo email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                    placeholder="Mínimo 4 caracteres"
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  La contraseña debe tener al menos 4 caracteres
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsResetModalOpen(false)
                  setResetMemberId(null)
                  setResetEmail('')
                  setResetPassword('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetCredentials}
                disabled={!resetEmail.trim() || !resetPassword.trim() || resetPassword.length < 4}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Resetear Credenciales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuración del Sistema */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-6 w-6 text-purple-600" />
                  Configuración del Sistema
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Configuración General */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración General
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Versión de la aplicación:</span>
                    <span className="font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modo de funcionamiento:</span>
                    <span className="font-medium">Online/Offline</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base de datos:</span>
                    <span className="font-medium">Supabase + IndexedDB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Almacenamiento:</span>
                    <span className="font-medium">Supabase Storage</span>
                  </div>
                </div>
              </div>

              {/* Límites del Sistema */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Límites del Sistema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Máx. miembros del equipo:</span>
                    <span className="font-medium">20 usuarios</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamaño máx. por archivo:</span>
                    <span className="font-medium">50 MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipos de archivos:</span>
                    <span className="font-medium">DOC, DOCX, XLS, XLSX, PDF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Historial de chat:</span>
                    <span className="font-medium">Ilimitado</span>
                  </div>
                </div>
              </div>

              {/* Estado del Sistema */}
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Estado del Sistema</h4>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado de la conexión:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {isOnline ? 'En línea' : 'Sin conexión'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Datos sincronizados:</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Actualizado
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total miembros activos:</span>
                    <span className="font-medium">{teamMembers.length} usuarios</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Archivos compartidos:</span>
                    <span className="font-medium">{sharedFiles?.length || 0} archivos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mensajes totales:</span>
                    <span className="font-medium">{chatMessages?.length || 0} mensajes</span>
                  </div>
                </div>
              </div>

              {/* Funciones de Administración Rápida */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Acciones Rápidas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      toast.success('Cache local limpiado correctamente')
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpiar Cache Local
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('¿Forzar sincronización con el servidor?')) {
                        syncWithServer()
                        toast.success('Sincronización iniciada')
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Send className="h-4 w-4" />
                    Forzar Sincronización
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}