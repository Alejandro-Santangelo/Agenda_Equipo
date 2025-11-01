'use client'

import React, { useState } from 'react'
import { useStore } from '@/lib/store'
import { 
  AVAILABLE_PERMISSIONS, 
  getPermissionsByCategory, 
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  hasPermission,
  DEFAULT_MEMBER_PERMISSIONS
} from '@/types/permissions'

interface PermissionsManagerProps {
  targetUserId?: string
  onClose?: () => void
}

export default function PermissionsManager({ targetUserId, onClose }: PermissionsManagerProps) {
  const { teamMembers, currentUser, updateMemberPermissions } = useStore()
  const [selectedUser, setSelectedUser] = useState(targetUserId || '')
  const [isUpdating, setIsUpdating] = useState(false)

  // Solo Paula (admin) puede gestionar permisos
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-2">🚫</div>
        <p className="text-gray-600">Solo los administradores pueden gestionar permisos</p>
      </div>
    )
  }

  const selectedMember = teamMembers.find(m => m.id === selectedUser)
  const permissionsByCategory = getPermissionsByCategory()

  const handlePermissionToggle = async (permissionId: string, granted: boolean) => {
    if (!selectedMember) return
    
    setIsUpdating(true)
    try {
      const currentPermissions = selectedMember.permissions || DEFAULT_MEMBER_PERMISSIONS
      let newPermissions: string[]
      
      if (granted) {
        newPermissions = [...currentPermissions, permissionId]
      } else {
        newPermissions = currentPermissions.filter(p => p !== permissionId)
      }
      
      await updateMemberPermissions(selectedMember.id, newPermissions)
      
      // Mostrar feedback
      const action = granted ? 'otorgado' : 'revocado'
      const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId)
      console.log(`✅ Permiso "${permission?.name}" ${action} a ${selectedMember.name}`)
      
    } catch (error) {
      console.error('❌ Error al actualizar permisos:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApplyTemplate = async (template: 'member' | 'advanced' | 'readonly') => {
    if (!selectedMember) return
    
    let templatePermissions: string[]
    
    switch (template) {
      case 'member':
        templatePermissions = DEFAULT_MEMBER_PERMISSIONS
        break
      case 'advanced':
        templatePermissions = [
          ...DEFAULT_MEMBER_PERMISSIONS,
          'chat.priority',
          'team.view_activity',
          'team.invite',
          'files.delete_any'
        ]
        break
      case 'readonly':
        templatePermissions = [
          'files.download',
          'chat.send',
          'team.view_members'
        ]
        break
      default:
        return
    }
    
    setIsUpdating(true)
    try {
      await updateMemberPermissions(selectedMember.id, templatePermissions)
      console.log(`✅ Plantilla "${template}" aplicada a ${selectedMember.name}`)
    } catch (error) {
      console.error('❌ Error al aplicar plantilla:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            ⚙️ Gestión de Permisos
          </h2>
          <p className="text-gray-600 mt-1">Controla qué pueden hacer los miembros del equipo</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selector de Usuario */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar miembro para gestionar permisos:
        </label>
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Selecciona un miembro...</option>
          {teamMembers
            .filter(m => m.id !== currentUser?.id) // No incluir a Paula
            .map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.role === 'admin' ? 'Administrador' : 'Miembro'})
              </option>
            ))}
        </select>
      </div>

      {selectedMember && (
        <>
          {/* Info del Usuario Seleccionado */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-6 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {selectedMember.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedMember.name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedMember.role === 'admin' ? '👑 Administrador' : '👤 Miembro del equipo'}
                </p>
              </div>
            </div>
          </div>

          {/* Plantillas Rápidas */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">🚀 Plantillas Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => handleApplyTemplate('member')}
                disabled={isUpdating}
                className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-medium text-green-800">👤 Miembro Estándar</div>
                <div className="text-sm text-green-600">Permisos básicos completos</div>
              </button>
              <button
                onClick={() => handleApplyTemplate('advanced')}
                disabled={isUpdating}
                className="p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="font-medium text-purple-800">⭐ Miembro Avanzado</div>
                <div className="text-sm text-purple-600">Permisos adicionales de gestión</div>
              </button>
              <button
                onClick={() => handleApplyTemplate('readonly')}
                disabled={isUpdating}
                className="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="font-medium text-orange-800">👁️ Solo Lectura</div>
                <div className="text-sm text-orange-600">Acceso limitado y supervisado</div>
              </button>
            </div>
          </div>

          {/* Permisos Detallados por Categoría */}
          <div className="space-y-6">
            <h3 className="font-semibold text-gray-900">🔧 Permisos Detallados</h3>
            
            {Object.entries(permissionsByCategory).map(([category, permissions]) => (
              <div key={category} className={`p-4 rounded-lg border ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}`}>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map(permission => {
                    const currentPermissions = selectedMember.permissions || DEFAULT_MEMBER_PERMISSIONS
                    const isGranted = hasPermission(currentPermissions, permission.id)
                    
                    return (
                      <div key={permission.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{permission.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{permission.name}</div>
                            <div className="text-xs text-gray-500">{permission.description}</div>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={(e) => handlePermissionToggle(permission.id, e.target.checked)}
                            disabled={isUpdating}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Estado de Actualización */}
          {isUpdating && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <div className="animate-spin">⏳</div>
                <span>Actualizando permisos...</span>
              </div>
            </div>
          )}

          {/* Resumen de Permisos Activos */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">📋 Resumen de Permisos Activos</h4>
            <div className="flex flex-wrap gap-2">
              {(selectedMember.permissions || DEFAULT_MEMBER_PERMISSIONS).map(permissionId => {
                const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId)
                return permission ? (
                  <span
                    key={permissionId}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {permission.icon} {permission.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}