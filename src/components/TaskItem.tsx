import React from 'react';
import { CheckCircle, Clock, User, Calendar, Flag } from 'lucide-react';
import { Task } from '@/hooks/useTasks';

interface TaskItemProps {
  task: Task;
  compact?: boolean;
  onEdit?: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, compact = false }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'low': return 'Baja';
      default: return 'Normal';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 py-2 px-3 bg-white rounded-lg border hover:shadow-sm transition-shadow">
        <div className="flex-shrink-0 text-gray-400">
          {task.status === 'completed' ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Clock className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${
            task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}>
            {task.title}
          </p>
          {task.due_date && (() => {
            const dueDate = new Date(task.due_date);
            return dueDate.toString() !== 'Invalid Date' ? (
              <p className="text-xs text-gray-500">
                Vence: {dueDate.toLocaleDateString()}
              </p>
            ) : null;
          })()}
        </div>

        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1 text-gray-400">
            {task.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${
              task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}>
              {task.title}
            </h3>
            
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
              <div className="flex items-center">
                <Flag className="w-3 h-3 mr-1" />
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
              
              {task.due_date && (() => {
                const dueDate = new Date(task.due_date);
                return dueDate.toString() !== 'Invalid Date' ? (
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Vence: {dueDate.toLocaleDateString()}</span>
                  </div>
                ) : null;
              })()}
              
              {task.assigned_to && (
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  <span>Asignado</span>
                </div>
              )}
              
              <div className="flex items-center">
                <span>Estado: {task.status === 'completed' ? 'Completado' : 
                            task.status === 'in_progress' ? 'En progreso' : 'Pendiente'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;