import React from 'react';
import { Plus } from 'lucide-react';
import { Task } from '@/hooks/useTasks';
import TaskItem from './TaskItem';

interface KanbanBoardProps {
  tasks: Task[];
  onAddTask?: (status: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onAddTask }) => {
  const columns = [
    { id: 'pending', title: 'Pendiente', color: 'bg-yellow-100 border-yellow-200' },
    { id: 'in_progress', title: 'En progreso', color: 'bg-blue-100 border-blue-200' },
    { id: 'completed', title: 'Completado', color: 'bg-green-100 border-green-200' }
  ];

  const getTasksForStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex space-x-6 min-w-fit p-6">
        {columns.map((column) => {
          const columnTasks = getTasksForStatus(column.id);
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`rounded-lg border-2 ${column.color} h-full flex flex-col`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {column.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                        {columnTasks.length}
                      </span>
                      {onAddTask && (
                        <button
                          onClick={() => onAddTask(column.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-96">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No hay tareas</p>
                      {onAddTask && (
                        <button
                          onClick={() => onAddTask(column.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Agregar primera tarea
                        </button>
                      )}
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <div key={task.id}>
                        <TaskItem task={task} compact />
                      </div>
                    ))
                  )}
                </div>

                {/* Add task button */}
                {onAddTask && columnTasks.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => onAddTask(column.id)}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Agregar tarea
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanBoard;