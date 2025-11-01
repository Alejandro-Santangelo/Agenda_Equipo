import React from 'react';
import { Search, Filter, Flag, X } from 'lucide-react';

interface TaskFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (value: string) => void;
  selectedProject: string;
  onProjectChange: (value: string) => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  selectedProject,
  onProjectChange
}) => {
  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || selectedProject !== 'all' || searchTerm;

  const clearFilters = () => {
    onSearchChange('');
    onStatusFilterChange('all');
    onPriorityFilterChange('all');
    onProjectChange('all');
  };

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-red-600"
          >
            <X className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Estado */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completado</option>
          </select>
        </div>

        {/* Prioridad */}
        <div className="relative">
          <Flag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityFilterChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las prioridades</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>
        </div>

        {/* Proyecto */}
        <div>
          <select
            value={selectedProject}
            onChange={(e) => onProjectChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los proyectos</option>
            <option value="proyecto1">Proyecto 1</option>
            <option value="proyecto2">Proyecto 2</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {searchTerm && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Buscar: {searchTerm}
              <button onClick={() => onSearchChange('')} className="ml-1 text-blue-600 hover:text-blue-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {statusFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Estado: {statusFilter === 'pending' ? 'Pendiente' : 
                      statusFilter === 'in_progress' ? 'En progreso' : 'Completado'}
              <button onClick={() => onStatusFilterChange('all')} className="ml-1 text-green-600 hover:text-green-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {priorityFilter !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Prioridad: {priorityFilter === 'high' ? 'Alta' : 
                         priorityFilter === 'medium' ? 'Media' : 'Baja'}
              <button onClick={() => onPriorityFilterChange('all')} className="ml-1 text-yellow-600 hover:text-yellow-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          
          {selectedProject !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Proyecto: {selectedProject}
              <button onClick={() => onProjectChange('all')} className="ml-1 text-purple-600 hover:text-purple-800">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskFilters;