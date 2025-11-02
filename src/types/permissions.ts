// types/permissions.ts
export interface Permission {
  id: string
  name: string
  description: string
  category: 'files' | 'chat' | 'team' | 'admin' | 'notifications'
  icon: string
}

export interface UserPermissions {
  userId: string
  permissions: string[]
  grantedBy: string
  grantedAt: Date
  lastModified: Date
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
  // 📁 Permisos de Archivos
  {
    id: 'files.upload',
    name: 'Subir Archivos',
    description: 'Puede subir documentos (.doc, .xlsx, .pdf)',
    category: 'files',
    icon: '📤'
  },
  {
    id: 'files.share_links',
    name: 'Compartir Enlaces',
    description: 'Puede compartir links de Google Drive, OneDrive',
    category: 'files',
    icon: '🔗'
  },
  {
    id: 'files.download',
    name: 'Descargar Archivos',
    description: 'Puede descargar archivos compartidos',
    category: 'files',
    icon: '📥'
  },
  {
    id: 'files.delete_own',
    name: 'Eliminar Archivos Propios',
    description: 'Puede eliminar archivos que haya subido',
    category: 'files',
    icon: '🗑️'
  },
  {
    id: 'files.delete_any',
    name: 'Eliminar Cualquier Archivo',
    description: 'Puede eliminar archivos de cualquier miembro',
    category: 'files',
    icon: '🛡️'
  },

  // 💬 Permisos de Chat
  {
    id: 'chat.send',
    name: 'Enviar Mensajes',
    description: 'Puede enviar mensajes en el chat grupal',
    category: 'chat',
    icon: '💬'
  },
  {
    id: 'chat.edit_own',
    name: 'Editar Mensajes Propios',
    description: 'Puede editar sus propios mensajes',
    category: 'chat',
    icon: '✏️'
  },
  {
    id: 'chat.delete_own',
    name: 'Eliminar Mensajes Propios',
    description: 'Puede eliminar sus propios mensajes',
    category: 'chat',
    icon: '🗑️'
  },
  {
    id: 'chat.delete_any',
    name: 'Moderar Chat',
    description: 'Puede eliminar mensajes de cualquier miembro',
    category: 'chat',
    icon: '🛡️'
  },
  {
    id: 'chat.priority',
    name: 'Mensajes Prioritarios',
    description: 'Puede enviar mensajes con notificación especial',
    category: 'chat',
    icon: '⚡'
  },

  // 👥 Permisos de Equipo
  {
    id: 'team.view_members',
    name: 'Ver Miembros',
    description: 'Puede ver la lista de miembros del equipo',
    category: 'team',
    icon: '👥'
  },
  {
    id: 'team.view_activity',
    name: 'Ver Actividad',
    description: 'Puede ver la actividad de otros miembros',
    category: 'team',
    icon: '📊'
  },
  {
    id: 'team.invite',
    name: 'Invitar Miembros',
    description: 'Puede invitar nuevos miembros al equipo',
    category: 'team',
    icon: '📧'
  },
  {
    id: 'team.remove',
    name: 'Remover Miembros',
    description: 'Puede eliminar miembros del equipo',
    category: 'team',
    icon: '❌'
  },

  // � Permisos de Notificaciones
  {
    id: 'notifications.send_task',
    name: 'Enviar Notificaciones de Tareas',
    description: 'Puede enviar notificaciones cuando asigna/completa tareas',
    category: 'notifications',
    icon: '📋'
  },
  {
    id: 'notifications.select_recipients',
    name: 'Seleccionar Destinatarios',
    description: 'Puede elegir quién recibe las notificaciones',
    category: 'notifications',
    icon: '🎯'
  },
  {
    id: 'notifications.send_chat',
    name: 'Notificar Mensajes Prioritarios',
    description: 'Puede enviar notificaciones por mensajes importantes',
    category: 'notifications',
    icon: '💬'
  },
  {
    id: 'notifications.send_events',
    name: 'Notificar Eventos',
    description: 'Puede enviar recordatorios de eventos y calendario',
    category: 'notifications',
    icon: '📅'
  },
  {
    id: 'notifications.manage_settings',
    name: 'Configurar Notificaciones',
    description: 'Puede cambiar configuraciones globales de notificaciones',
    category: 'notifications',
    icon: '⚙️'
  },

  // �🔧 Permisos de Administración
  {
    id: 'admin.manage_permissions',
    name: 'Gestionar Permisos',
    description: 'Puede otorgar y revocar permisos a otros miembros',
    category: 'admin',
    icon: '⚙️'
  },
  {
    id: 'admin.view_stats',
    name: 'Ver Estadísticas',
    description: 'Puede ver estadísticas del equipo y uso',
    category: 'admin',
    icon: '📈'
  },
  {
    id: 'admin.export_data',
    name: 'Exportar Datos',
    description: 'Puede exportar archivos y conversaciones',
    category: 'admin',
    icon: '💾'
  },
  {
    id: 'admin.system_settings',
    name: 'Configuración Sistema',
    description: 'Puede cambiar configuraciones generales',
    category: 'admin',
    icon: '🔧'
  },
  {
    id: 'admin.reset_credentials',
    name: 'Resetear Credenciales',
    description: 'Puede resetear usuario y contraseña de otros miembros',
    category: 'admin',
    icon: '🔑'
  }
]

export const DEFAULT_MEMBER_PERMISSIONS = [
  'files.upload',
  'files.share_links', 
  'files.download',
  'files.delete_own',
  'chat.send',
  'chat.edit_own',
  'chat.delete_own',
  'team.view_members'
]

export const ADMIN_PERMISSIONS = AVAILABLE_PERMISSIONS.map(p => p.id)

// Función para verificar si un usuario tiene un permiso específico
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}

// Función para agrupar permisos por categoría
export function getPermissionsByCategory() {
  return AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = []
    }
    acc[permission.category].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
}

export const CATEGORY_LABELS = {
  files: 'Gestión de Archivos',
  chat: 'Sistema de Chat',
  team: 'Administración de Equipo', 
  notifications: 'Sistema de Notificaciones',
  admin: 'Permisos de Administrador'
}

export const CATEGORY_COLORS = {
  files: 'bg-blue-50 border-blue-200 text-blue-800',
  chat: 'bg-green-50 border-green-200 text-green-800', 
  team: 'bg-purple-50 border-purple-200 text-purple-800',
  notifications: 'bg-orange-50 border-orange-200 text-orange-800',
  admin: 'bg-red-50 border-red-200 text-red-800'
}