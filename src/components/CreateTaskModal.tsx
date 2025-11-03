import React, { useState } from 'react';
import { X, Calendar, Flag, Bell } from 'lucide-react';
import { Task, useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/useAuth';
import NotificationSelector from './NotificationSelector';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  projectId?: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  projectId
}) => {
  const { addTask, updateTask } = useTasks();
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
    status: task?.status || 'pending'
  });

  // Estados para notificaciones
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationRecipients, setNotificationRecipients] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'admin' | 'member';
  }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentUser?.id) {
        console.error('Error: Usuario no autenticado');
        return;
      }

      const taskData = {
        ...formData,
        project_id: projectId,
        assigned_to: task?.assigned_to || currentUser.id,
        created_by: task?.created_by || currentUser.id,
        due_date: formData.due_date || undefined
      };

      if (task) {
        await updateTask(task.id, taskData);
      } else {
        await addTask(taskData);
        
        // 🔔 Enviar notificaciones solo para tareas nuevas
        if (showNotifications && notificationRecipients.length > 0 && currentUser) {
          try {
            const { notifyTaskAssignedNative } = await import('@/lib/notifications-native');
            
            const results = notifyTaskAssignedNative({
              recipients: notificationRecipients.map(recipient => ({
                name: recipient.name,
                email: recipient.email,
                phone: recipient.phone
              })),
              taskTitle: formData.title,
              taskDescription: formData.description,
              assignedBy: currentUser.name,
              dueDate: formData.due_date || undefined
            });

            console.log('📋 Notificaciones de tarea enviadas:', results);
          } catch (notificationError) {
            console.error('❌ Error enviando notificaciones:', notificationError);
          }
        }
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">
            {task ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Flag className="w-4 h-4 inline mr-1" />
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En progreso</option>
                <option value="completed">Completado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Fecha límite
            </label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 🔔 Selector de Notificaciones */}
          {!task && isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enableNotifications"
                  checked={showNotifications}
                  onChange={(e) => setShowNotifications(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="enableNotifications" className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>Notificar asignación de tarea</span>
                </label>
              </div>
              
              <NotificationSelector
                isVisible={showNotifications}
                onRecipientsChange={setNotificationRecipients}
                notificationType="task"
                className="ml-6"
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (task ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskModal;