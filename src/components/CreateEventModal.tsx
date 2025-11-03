import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { Event, useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { useActivityLog } from '@/hooks/useActivityLog';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: Event;
  selectedDate?: Date;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedDate
}) => {
  const { addEvent, updateEvent } = useEvents();
  const { currentUser } = useAuth();
  const { logActivity } = useActivityLog();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    event_type: 'meeting' | 'deadline' | 'reminder' | 'personal';
  }>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    event_type: 'meeting'
  });

  // Resetear formulario cuando cambia isOpen o event
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: event?.title || '',
        description: event?.description || '',
        start_date: event?.start_date || (selectedDate ? selectedDate.toISOString().slice(0, 16) : ''),
        end_date: event?.end_date || '',
        event_type: (event?.event_type || 'meeting') as 'meeting' | 'deadline' | 'reminder' | 'personal'
      });
    }
  }, [isOpen, event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentUser?.id) {
        console.error('Error: Usuario no autenticado');
        return;
      }

      const eventData = {
        ...formData,
        created_by: event?.created_by || currentUser.id,
        all_day: false,
        priority: 'medium' as const
      };

      if (event) {
        await updateEvent(event.id, eventData);
        
        // 📝 Registrar actividad de actualización
        await logActivity({
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'update',
          entity_type: 'event',
          entity_id: event.id,
          entity_name: formData.title,
          description: `${currentUser.name} actualizó el evento "${formData.title}"`,
          metadata: {
            event_type: formData.event_type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            previous_type: event.event_type,
            previous_start: event.start_date
          }
        });
      } else {
        // Generar ID para el nuevo evento
        const newEventId = crypto.randomUUID();
        await addEvent(eventData);
        
        // 📝 Registrar actividad de creación
        await logActivity({
          user_id: currentUser.id,
          user_name: currentUser.name,
          action_type: 'create',
          entity_type: 'event',
          entity_id: newEventId,
          entity_name: formData.title,
          description: `${currentUser.name} creó el evento "${formData.title}"`,
          metadata: {
            event_type: formData.event_type,
            start_date: formData.start_date,
            end_date: formData.end_date
          }
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
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
            {event ? 'Editar evento' : 'Nuevo evento'}
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
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha y hora inicio *
              </label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Fecha y hora fin
              </label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de evento
            </label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="meeting">Reunión</option>
              <option value="deadline">Fecha límite</option>
              <option value="event">Evento</option>
              <option value="reminder">Recordatorio</option>
            </select>
          </div>

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
              {loading ? 'Guardando...' : (event ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventModal;