'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar as CalendarIcon, Clock, Edit2, Trash2, History } from 'lucide-react'
import { useEvents, Event } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { useActivityLog } from '@/hooks/useActivityLog'
import CreateEventModal from './CreateEventModal'
import ActivityHistoryModal from './ActivityHistoryModal'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function CalendarSection() {
  const { events, fetchEvents, deleteEvent } = useEvents()
  const { currentUser } = useAuth()
  const { logActivity } = useActivityLog()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedDate] = useState(new Date())
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined)

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAddEvent = () => {
    setShowCreateModal(true)
  }

  // Filtrar eventos por fecha próxima
  const upcomingEvents = events
    .filter(event => event.start_date && new Date(event.start_date).toString() !== 'Invalid Date')
    .filter(event => new Date(event.start_date) >= new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 10)

  const getEventStats = () => {
    const today = new Date()
    const todayEvents = events.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      if (eventDate.toString() === 'Invalid Date') return false
      return eventDate.toDateString() === today.toDateString()
    })
    
    const thisWeekEvents = events.filter(event => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      if (eventDate.toString() === 'Invalid Date') return false
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return eventDate >= today && eventDate <= weekFromNow
    })

    return {
      total: events.length,
      today: todayEvents.length,
      thisWeek: thisWeekEvents.length,
      upcoming: upcomingEvents.length
    }
  }

  const stats = getEventStats()

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800'
      case 'deadline': return 'bg-red-100 text-red-800'
      case 'reminder': return 'bg-yellow-100 text-yellow-800'
      case 'personal': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'Reunión'
      case 'deadline': return 'Fecha límite'
      case 'reminder': return 'Recordatorio'
      case 'personal': return 'Personal'
      default: return 'Evento'
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-sm text-gray-600">Gestiona eventos y recordatorios</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <History className="w-4 h-4 mr-2" />
              Historial
            </button>
            <button
              onClick={handleAddEvent}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo evento
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total eventos</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-sm text-gray-600">Hoy</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">{stats.thisWeek}</div>
            <div className="text-sm text-gray-600">Esta semana</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Próximos</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos eventos</h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos próximos</h3>
              <p className="text-gray-500 mb-4">Comienza agregando tu primer evento</p>
              <button
                onClick={handleAddEvent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2 inline" />
                Crear primer evento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div key={event.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {event.start_date && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            <span>
                              {format(new Date(event.start_date), 'PPP p', { locale: es })}
                            </span>
                          </div>
                        )}
                        
                        {event.end_date && (
                          <div className="flex items-center">
                            <span>hasta {format(new Date(event.end_date), 'p', { locale: es })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingEvent(event)
                          setShowCreateModal(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar evento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('¿Estás seguro de eliminar este evento?')) {
                            await deleteEvent(event.id)
                            
                            // 📝 Registrar actividad de eliminación
                            if (currentUser) {
                              await logActivity({
                                user_id: currentUser.id,
                                user_name: currentUser.name,
                                action_type: 'delete',
                                entity_type: 'event',
                                entity_id: event.id,
                                entity_name: event.title,
                                description: `${currentUser.name} eliminó el evento "${event.title}"`,
                                metadata: {
                                  event_type: event.event_type,
                                  start_date: event.start_date
                                }
                              })
                            }
                          }
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vista simple del calendario del mes */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {format(selectedDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <div className="bg-white rounded-lg border p-4">
              <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-gray-500 mb-2">
                <div>Dom</div>
                <div>Lun</div>
                <div>Mar</div>
                <div>Mié</div>
                <div>Jue</div>
                <div>Vie</div>
                <div>Sáb</div>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  // Calcular el primer día del mes y su día de la semana
                  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
                  const firstDayWeekday = firstDayOfMonth.getDay() // 0 = Domingo, 6 = Sábado
                  
                  // Calcular cuántos días tiene el mes
                  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate()
                  
                  // Días del mes anterior que se muestran
                  const prevMonthDays = firstDayWeekday
                  const prevMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0)
                  const daysInPrevMonth = prevMonth.getDate()
                  
                  // Total de celdas
                  const totalCells = 35
                  
                  return Array.from({ length: totalCells }, (_, index) => {
                    let date: Date
                    let isCurrentMonth = false
                    
                    if (index < prevMonthDays) {
                      // Días del mes anterior
                      const day = daysInPrevMonth - prevMonthDays + index + 1
                      date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, day)
                    } else if (index < prevMonthDays + daysInMonth) {
                      // Días del mes actual
                      const day = index - prevMonthDays + 1
                      date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
                      isCurrentMonth = true
                    } else {
                      // Días del mes siguiente
                      const day = index - prevMonthDays - daysInMonth + 1
                      date = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, day)
                    }
                    
                    const isToday = date.toDateString() === new Date().toDateString()
                    const hasEvents = events.some(event => {
                      if (!event.start_date) return false
                      const eventDate = new Date(event.start_date)
                      if (eventDate.toString() === 'Invalid Date') return false
                      return eventDate.toDateString() === date.toDateString()
                    })
                    
                    return (
                      <div
                        key={index}
                        className={`
                          h-10 flex items-center justify-center text-sm rounded cursor-pointer
                          ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                          ${isToday ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                          ${hasEvents && !isToday ? 'bg-blue-100 text-blue-900' : ''}
                        `}
                      >
                        {date.getDate()}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar eventos */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingEvent(undefined)
        }}
        selectedDate={selectedDate}
        event={editingEvent}
      />

      {/* Modal de historial de actividades */}
      <ActivityHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        entityType="event"
        entityName="Eventos"
      />
    </div>
  )
}