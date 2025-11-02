'use client'

import { useState } from 'react'
import { Settings, Users, Bell, Mail, MessageSquare, Shield, Save } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import PermissionsManager from './PermissionsManager'
import NotificationSelector from './NotificationSelector'

interface NotificationSettings {
  enableTaskNotifications: boolean
  enableChatNotifications: boolean
  enableEventNotifications: boolean
  enableFileNotifications: boolean
  defaultRecipients: string[]
  autoNotifyNewMembers: boolean
}

interface TeamMember {
  id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'member'
}

export default function NotificationConfigPanel() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<'settings' | 'permissions' | 'recipients'>('settings')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  // Configuraciones de notificaciones (en producción vendrían de la BD)
  const [settings, setSettings] = useState<NotificationSettings>({
    enableTaskNotifications: true,
    enableChatNotifications: false,
    enableEventNotifications: false,
    enableFileNotifications: false,
    defaultRecipients: [],
    autoNotifyNewMembers: true
  })

  const [defaultRecipients, setDefaultRecipients] = useState<TeamMember[]>([])

  // Solo admins pueden acceder
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">Solo los administradores pueden configurar notificaciones.</p>
      </div>
    )
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setSuccess('')
    
    try {
      // Aquí se guardarían en la base de datos
      // await saveNotificationSettings(settings)
      
      console.log('💾 Guardando configuraciones:', settings)
      console.log('👥 Destinatarios por defecto:', defaultRecipients)
      
      setSuccess('✅ Configuraciones guardadas exitosamente')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error guardando configuraciones:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'settings', label: 'Configuración General', icon: Settings },
    { id: 'permissions', label: 'Permisos de Miembros', icon: Users },
    { id: 'recipients', label: 'Destinatarios por Defecto', icon: Bell }
  ] as const

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Configuración</h1>
            <p className="text-gray-600">Gestiona notificaciones y permisos del equipo</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    activeTab === tab.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        
        {/* Configuración General */}
        {activeTab === 'settings' && (
          <div className="p-6 space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">⚙️ Configuración de Notificaciones</h2>
              <p className="text-gray-600">Habilita o deshabilita tipos de notificaciones para todo el equipo</p>
            </div>

            <div className="space-y-4">
              {/* Notificaciones de Tareas */}
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Notificaciones de Tareas</h3>
                    <p className="text-sm text-gray-600">Notificar cuando se asignan o completan tareas</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableTaskNotifications}
                    onChange={(e) => setSettings({...settings, enableTaskNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              {/* Notificaciones de Chat */}
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Notificaciones de Chat</h3>
                    <p className="text-sm text-gray-600">Notificar mensajes importantes y menciones</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableChatNotifications}
                    onChange={(e) => setSettings({...settings, enableChatNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Notificaciones de Eventos */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Notificaciones de Eventos</h3>
                    <p className="text-sm text-gray-600">Recordatorios de calendario y eventos</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEventNotifications}
                    onChange={(e) => setSettings({...settings, enableEventNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Notificaciones de Archivos */}
              <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-purple-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Notificaciones de Archivos</h3>
                    <p className="text-sm text-gray-600">Notificar cuando se comparten archivos</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableFileNotifications}
                    onChange={(e) => setSettings({...settings, enableFileNotifications: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Auto-notificar nuevos miembros */}
              <div className="flex items-center justify-between p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-pink-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">Auto-notificar Nuevos Miembros</h3>
                    <p className="text-sm text-gray-600">Enviar automáticamente credenciales por email y WhatsApp</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoNotifyNewMembers}
                    onChange={(e) => setSettings({...settings, autoNotifyNewMembers: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                onClick={handleSaveSettings}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>
            </div>

            {/* Mensaje de éxito */}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}
          </div>
        )}

        {/* Gestión de Permisos */}
        {activeTab === 'permissions' && (
          <div className="p-6">
            <PermissionsManager />
          </div>
        )}

        {/* Destinatarios por Defecto */}
        {activeTab === 'recipients' && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">👥 Destinatarios por Defecto</h2>
              <p className="text-gray-600">Configura quién recibe notificaciones automáticamente</p>
            </div>

            <NotificationSelector
              isVisible={true}
              onRecipientsChange={setDefaultRecipients}
              notificationType="task"
              className="mb-6"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Estos destinatarios se seleccionarán automáticamente al crear notificaciones</li>
                <li>• Las administradoras pueden cambiar la selección en cada notificación</li>
                <li>• Los miembros sin permisos solo verán &quot;Se enviará a todo el equipo&quot;</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}