'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { 
  BarChart3, 
  Users, 
  MessageCircle, 
  FolderOpen, 
  Activity,
  Download,
  TrendingUp,
  FileText,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react'
import { format, subDays, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface StatsData {
  totalMembers: number
  activeMembers: number
  totalMessages: number
  totalFiles: number
  messagesThisWeek: number
  filesThisWeek: number
  memberActivity: Array<{ name: string; lastActive: string; messageCount: number; fileCount: number }>
  dailyActivity: Array<{ date: string; messages: number; files: number }>
}

export default function StatsSection() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  
  const { 
    teamMembers, 
    chatMessages, 
    sharedFiles, 
    currentUser 
  } = useAppStore()
  
  const { isOnline } = useOfflineSync()

  const calculateStats = useCallback(() => {
    setLoading(true)

    try {
      const now = new Date()
      let startDate: Date

      switch (selectedPeriod) {
        case 'week':
          startDate = subDays(now, 7)
          break
        case 'month':
          startDate = subDays(now, 30)
          break
        default:
          startDate = new Date(0) // Desde el inicio
      }

      // Calcular estadísticas generales
      const totalMembers = teamMembers.length
      const activeMembers = teamMembers.filter(member => {
        if (!member.last_active) return false
        const lastActive = new Date(member.last_active)
        if (lastActive.toString() === 'Invalid Date') return false
        return isAfter(lastActive, subDays(now, 7))
      }).length

      // Mensajes y archivos en el período
      const messagesInPeriod = chatMessages.filter(msg => {
        if (!msg.created_at) return false
        const msgDate = new Date(msg.created_at)
        if (msgDate.toString() === 'Invalid Date') return false
        return isAfter(msgDate, startDate)
      })
      const filesInPeriod = sharedFiles.filter(file => {
        if (!file.created_at) return false
        const fileDate = new Date(file.created_at)
        if (fileDate.toString() === 'Invalid Date') return false
        return isAfter(fileDate, startDate)
      })

      // Actividad por miembro
      const memberActivity = teamMembers.map(member => {
        const memberMessages = messagesInPeriod.filter(msg => msg.user_id === member.id)
        const memberFiles = filesInPeriod.filter(file => file.uploaded_by === member.id)
        
        return {
          name: member.name,
          lastActive: member.last_active,
          messageCount: memberMessages.length,
          fileCount: memberFiles.length
        }
      }).sort((a, b) => b.messageCount + b.fileCount - (a.messageCount + a.fileCount))

      // Actividad diaria (últimos 7 días)
      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(now, i)
        const dayStart = startOfDay(date)
        const dayEnd = endOfDay(date)
        
        const messagesThisDay = chatMessages.filter(msg => {
          if (!msg.created_at) return false
          const msgDate = new Date(msg.created_at)
          if (msgDate.toString() === 'Invalid Date') return false
          return isAfter(msgDate, dayStart) && isBefore(msgDate, dayEnd)
        }).length

        const filesThisDay = sharedFiles.filter(file => {
          if (!file.created_at) return false
          const fileDate = new Date(file.created_at)
          if (fileDate.toString() === 'Invalid Date') return false
          return isAfter(fileDate, dayStart) && isBefore(fileDate, dayEnd)
        }).length

        dailyActivity.push({
          date: format(date, 'dd/MM', { locale: es }),
          messages: messagesThisDay,
          files: filesThisDay
        })
      }

      setStats({
        totalMembers,
        activeMembers,
        totalMessages: chatMessages.length,
        totalFiles: sharedFiles.length,
        messagesThisWeek: messagesInPeriod.length,
        filesThisWeek: filesInPeriod.length,
        memberActivity,
        dailyActivity
      })
    } catch (error) {
      console.error('Error calculating stats:', error)
    } finally {
      setLoading(false)
    }
  }, [teamMembers, chatMessages, sharedFiles, selectedPeriod])

  useEffect(() => {
    calculateStats()
  }, [calculateStats])

  const exportStats = () => {
    if (!stats) return

    const exportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      summary: {
        totalMembers: stats.totalMembers,
        activeMembers: stats.activeMembers,
        totalMessages: stats.totalMessages,
        totalFiles: stats.totalFiles,
        messagesInPeriod: stats.messagesThisWeek,
        filesInPeriod: stats.filesThisWeek
      },
      memberActivity: stats.memberActivity,
      dailyActivity: stats.dailyActivity,
      teamMembers: teamMembers.map(m => ({
        name: m.name,
        email: m.email,
        role: m.role,
        lastActive: m.last_active,
        createdAt: m.created_at
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `equipo-stats-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Restringido</h3>
        <p className="text-gray-600">Solo los administradores pueden ver las estadísticas del equipo</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={28} />
            Estadísticas del Equipo
          </h2>
          <p className="text-gray-600">Métricas de actividad y uso de la aplicación</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Estado de conexión */}
          <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            isOnline 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'En línea' : 'Offline'}
          </div>
          
          {/* Período selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          >
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="all">Todo el tiempo</option>
          </select>
          
          {/* Botón exportar */}
          <button
            onClick={exportStats}
            disabled={!stats || loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando estadísticas...</p>
        </div>
      ) : stats ? (
        <>
          {/* Métricas principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miembros Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Miembros Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mensajes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.messagesThisWeek}</p>
                  <p className="text-xs text-gray-500">de {stats.totalMessages} total</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <FolderOpen size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Archivos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.filesThisWeek}</p>
                  <p className="text-xs text-gray-500">de {stats.totalFiles} total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actividad diaria */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Actividad Diaria (Últimos 7 días)
            </h3>
            
            <div className="grid grid-cols-7 gap-2">
              {stats.dailyActivity.map((day, index) => {
                const maxActivity = Math.max(...stats.dailyActivity.map(d => d.messages + d.files))
                const height = maxActivity > 0 ? ((day.messages + day.files) / maxActivity) * 100 : 0
                
                return (
                  <div key={index} className="text-center">
                    <div className="h-20 flex flex-col justify-end mb-2">
                      <div 
                        className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg min-h-1"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${day.messages} mensajes, ${day.files} archivos`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600">{day.date}</p>
                    <p className="text-xs text-gray-500">{day.messages + day.files}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actividad por miembro */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Actividad por Miembro ({selectedPeriod === 'week' ? 'Esta semana' : selectedPeriod === 'month' ? 'Este mes' : 'Todo el tiempo'})
            </h3>
            
            <div className="space-y-3">
              {stats.memberActivity.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {member.name[0]}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-500">
                        {member.lastActive && (() => {
                          const lastActiveDate = new Date(member.lastActive);
                          return lastActiveDate.toString() !== 'Invalid Date' 
                            ? `Última actividad: ${format(lastActiveDate, 'dd MMM, HH:mm', { locale: es })}`
                            : 'Sin actividad reciente';
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-purple-600">
                      <MessageCircle size={14} />
                      <span>{member.messageCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <FileText size={14} />
                      <span>{member.fileCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-600">Las estadísticas aparecerán cuando haya actividad en el equipo</p>
        </div>
      )}
    </div>
  )
}