import React from 'react';
import { Filter, X, Search, Calendar, Flag, Clock } from 'lucide-react';
import { Event } from '@/hooks/useEvents';

interface EventFiltersProps {
  filters: {
    search: string;
    eventTypes: Event['event_type'][];
    dateRange: {
      start: string;
      end: string;
    };
    showCompleted: boolean;
  };
  onFiltersChange: (filters: EventFiltersProps['filters']) => void;
  onClearFilters: () => void;
}

const EventFilters: React.FC<EventFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const eventTypes = [
    { value: 'meeting', label: 'Reunión', icon: '👥', color: 'bg-blue-100 text-blue-800' },
    { value: 'deadline', label: 'Fecha límite', icon: '⚠️', color: 'bg-red-100 text-red-800' },
    { value: 'reminder', label: 'Recordatorio', icon: '🔔', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'personal', label: 'Personal', icon: '👤', color: 'bg-purple-100 text-purple-800' },
    { value: 'team', label: 'Equipo', icon: '🎯', color: 'bg-green-100 text-green-800' }
  ];

  const hasActiveFilters = 
    filters.search || 
    filters.eventTypes.length > 0 || 
    filters.dateRange.start || 
    filters.dateRange.end ||
    !filters.showCompleted;

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleEventTypeToggle = (eventType: Event['event_type']) => {
    const currentTypes = filters.eventTypes;
    const newTypes = currentTypes.includes(eventType)
      ? currentTypes.filter(type => type !== eventType)
      : [...currentTypes, eventType];
    
    onFiltersChange({ ...filters, eventTypes: newTypes });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const handleShowCompletedToggle = () => {
    onFiltersChange({
      ...filters,
      showCompleted: !filters.showCompleted
    });
  };

  const getQuickDateRanges = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() + (7 - today.getDay()));
    
    const nextWeek = new Date(thisWeek);
    nextWeek.setDate(thisWeek.getDate() + 7);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    return [
      {
        label: 'Hoy',
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Mañana',
        start: tomorrow.toISOString().split('T')[0],
        end: tomorrow.toISOString().split('T')[0]
      },
      {
        label: 'Esta semana',
        start: today.toISOString().split('T')[0],
        end: thisWeek.toISOString().split('T')[0]
      },
      {
        label: 'Próxima semana',
        start: thisWeek.toISOString().split('T')[0],
        end: nextWeek.toISOString().split('T')[0]
      },
      {
        label: 'Este mes',
        start: today.toISOString().split('T')[0],
        end: thisMonth.toISOString().split('T')[0]
      },
      {
        label: 'Próximo mes',
        start: thisMonth.toISOString().split('T')[0],
        end: nextMonth.toISOString().split('T')[0]
      }
    ];
  };

  const applyQuickDateRange = (quickRange: { start: string; end: string }) => {
    onFiltersChange({
      ...filters,
      dateRange: quickRange
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
              Activos
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Search className="w-4 h-4 inline mr-1" />
          Buscar eventos
        </label>
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por título, descripción o ubicación..."
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Tipos de evento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Flag className="w-4 h-4 inline mr-1" />
          Tipos de evento
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {eventTypes.map((type) => {
            const isSelected = filters.eventTypes.includes(type.value as Event['event_type']);
            return (
              <button
                key={type.value}
                onClick={() => handleEventTypeToggle(type.value as Event['event_type'])}
                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all text-sm ${
                  isSelected
                    ? `${type.color} border-current`
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{type.icon}</span>
                <span className="font-medium">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de fechas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Calendar className="w-4 h-4 inline mr-1" />
          Rango de fechas
        </label>
        
        {/* Fechas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
          {getQuickDateRanges().map((range) => (
            <button
              key={range.label}
              onClick={() => applyQuickDateRange({ start: range.start, end: range.end })}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {range.label}
            </button>
          ))}
        </div>
        
        {/* Fechas personalizadas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Opciones adicionales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Clock className="w-4 h-4 inline mr-1" />
          Estado del evento
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.showCompleted}
              onChange={handleShowCompletedToggle}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">Mostrar eventos pasados</span>
          </label>
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {hasActiveFilters && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Filtros activos:</p>
          <div className="flex flex-wrap gap-1">
            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Búsqueda: &quot;{filters.search}&quot;
                <button
                  onClick={() => handleSearchChange('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.eventTypes.map((type) => {
              const typeInfo = eventTypes.find(t => t.value === type);
              return typeInfo ? (
                <span key={type} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  {typeInfo.icon} {typeInfo.label}
                  <button
                    onClick={() => handleEventTypeToggle(type)}
                    className="text-purple-600 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ) : null;
            })}
            
            {(filters.dateRange.start || filters.dateRange.end) && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Fechas: {filters.dateRange.start} - {filters.dateRange.end}
                <button
                  onClick={() => onFiltersChange({ ...filters, dateRange: { start: '', end: '' } })}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {!filters.showCompleted && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                Solo eventos futuros
                <button
                  onClick={handleShowCompletedToggle}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventFilters;