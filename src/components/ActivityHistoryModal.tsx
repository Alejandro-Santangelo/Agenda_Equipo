import React, { useEffect, useMemo } from 'react';
import { X, History, Calendar, User, FileText, MessageSquare, CheckSquare, Folder } from 'lucide-react';
import { useActivityLog } from '@/hooks/useActivityLog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActivityHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType?: 'task' | 'event' | 'file' | 'message' | 'project' | 'user' | 'comment';
  entityId?: string;
  entityName?: string;
}

const ActivityHistoryModal: React.FC<ActivityHistoryModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityName
}) => {
  const { activities, fetchActivities, loading } = useActivityLog();

  useEffect(() => {
    if (isOpen) {
      fetchActivities({
        entityType,
        entityId,
        limit: 100
      });
    }
  }, [isOpen, entityType, entityId, fetchActivities]);

  const filteredActivities = useMemo(() => {
    if (entityType && entityId) {
      return activities.filter(
        (a) => a.entity_type === entityType && a.entity_id === entityId
      );
    } else if (entityType) {
      return activities.filter((a) => a.entity_type === entityType);
    }
    return activities;
  }, [activities, entityType, entityId]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'project': return <Folder className="w-4 h-4" />;
      case 'user': return <User className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': case 'edit': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'complete': return 'bg-purple-100 text-purple-800';
      case 'upload': case 'share': return 'bg-indigo-100 text-indigo-800';
      case 'send': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Creó',
      update: 'Actualizó',
      delete: 'Eliminó',
      upload: 'Subió',
      download: 'Descargó',
      share: 'Compartió',
      send: 'Envió',
      edit: 'Editó',
      complete: 'Completó',
      assign: 'Asignó',
      comment: 'Comentó'
    };
    return labels[action] || action;
  };

  const getEntityLabel = (type: string) => {
    const labels: Record<string, string> = {
      task: 'tarea',
      event: 'evento',
      file: 'archivo',
      message: 'mensaje',
      project: 'proyecto',
      user: 'usuario',
      comment: 'comentario'
    };
    return labels[type] || type;
  };

  const formatMetadata = (metadata: Record<string, unknown>, entityType: string) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;

    const formatters: Record<string, (meta: Record<string, unknown>) => React.ReactNode> = {
      event: (meta) => (
        <>
          {typeof meta.start_date === 'string' && meta.start_date && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Fecha inicio:</span>
              <span className="text-gray-600">{format(new Date(meta.start_date), "PPP 'a las' p", { locale: es })}</span>
            </div>
          )}
          {typeof meta.end_date === 'string' && meta.end_date && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Fecha fin:</span>
              <span className="text-gray-600">{format(new Date(meta.end_date), "PPP 'a las' p", { locale: es })}</span>
            </div>
          )}
          {typeof meta.event_type === 'string' && meta.event_type && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Tipo:</span>
              <span className="text-gray-600">
                {meta.event_type === 'meeting' ? 'Reunión' : 
                 meta.event_type === 'event' ? 'Evento' : 
                 meta.event_type === 'deadline' ? 'Fecha límite' : meta.event_type}
              </span>
            </div>
          )}
          {typeof meta.location === 'string' && meta.location && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Ubicación:</span>
              <span className="text-gray-600">{meta.location}</span>
            </div>
          )}
          {typeof meta.description === 'string' && meta.description && (
            <div className="flex items-start text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Descripción:</span>
              <span className="text-gray-600">{meta.description}</span>
            </div>
          )}
        </>
      ),
      task: (meta) => (
        <>
          {typeof meta.status === 'string' && meta.status && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Estado:</span>
              <span className="text-gray-600">
                {meta.status === 'pending' ? 'Pendiente' : 
                 meta.status === 'in-progress' ? 'En progreso' : 
                 meta.status === 'completed' ? 'Completada' : meta.status}
              </span>
            </div>
          )}
          {typeof meta.priority === 'string' && meta.priority && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Prioridad:</span>
              <span className="text-gray-600">
                {meta.priority === 'high' ? 'Alta' : 
                 meta.priority === 'medium' ? 'Media' : 
                 meta.priority === 'low' ? 'Baja' : meta.priority}
              </span>
            </div>
          )}
          {typeof meta.due_date === 'string' && meta.due_date && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Fecha límite:</span>
              <span className="text-gray-600">{format(new Date(meta.due_date), "PPP", { locale: es })}</span>
            </div>
          )}
          {typeof meta.assigned_to === 'string' && meta.assigned_to && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Asignado a:</span>
              <span className="text-gray-600">{meta.assigned_to}</span>
            </div>
          )}
        </>
      ),
      file: (meta) => (
        <>
          {typeof meta.file_type === 'string' && meta.file_type && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Tipo:</span>
              <span className="text-gray-600">{meta.file_type}</span>
            </div>
          )}
          {typeof meta.size === 'number' && meta.size > 0 && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Tamaño:</span>
              <span className="text-gray-600">{(meta.size / 1024).toFixed(2)} KB</span>
            </div>
          )}
          {typeof meta.shared_with === 'string' && meta.shared_with && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Compartido con:</span>
              <span className="text-gray-600">{meta.shared_with}</span>
            </div>
          )}
        </>
      ),
      project: (meta) => (
        <>
          {typeof meta.status === 'string' && meta.status && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Estado:</span>
              <span className="text-gray-600">{meta.status}</span>
            </div>
          )}
          {typeof meta.progress === 'number' && meta.progress !== undefined && (
            <div className="flex items-center text-sm mb-1">
              <span className="font-medium text-gray-700 w-32">Progreso:</span>
              <span className="text-gray-600">{meta.progress}%</span>
            </div>
          )}
        </>
      ),
    };

    const formatter = formatters[entityType];
    if (formatter) {
      return <div className="space-y-1">{formatter(metadata)}</div>;
    }

    // Fallback: mostrar campos genéricos
    return (
      <div className="space-y-1">
        {Object.entries(metadata).map(([key, value]) => (
          <div key={key} className="flex items-center text-sm">
            <span className="font-medium text-gray-700 w-32 capitalize">
              {key.replace(/_/g, ' ')}:
            </span>
            <span className="text-gray-600">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold flex items-center">
              <History className="w-5 h-5 mr-2 text-blue-600" />
              Historial de actividades
            </h2>
            {entityName && (
              <p className="text-sm text-gray-600 mt-1">
                {entityName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando historial...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sin actividades</h3>
              <p className="text-gray-500">
                No hay actividades registradas
                {entityType && ` para ${getEntityLabel(entityType)}s`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    {/* Icono de entidad */}
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-600">
                        {getEntityIcon(activity.entity_type)}
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {activity.user_name}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(activity.action_type)}`}>
                          {getActionLabel(activity.action_type)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {getEntityLabel(activity.entity_type)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        {activity.description}
                      </p>

                      {activity.entity_name && (
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">Elemento:</span> {activity.entity_name}
                        </p>
                      )}

                      {activity.created_at && (() => {
                        const activityDate = new Date(activity.created_at);
                        return activityDate.toString() !== 'Invalid Date' ? (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            <span>
                              {format(activityDate, "PPP 'a las' p", { locale: es })}
                            </span>
                          </div>
                        ) : null;
                      })()}

                      {/* Metadatos adicionales si existen */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                            Ver detalles
                          </summary>
                          <div className="mt-2 text-xs bg-white p-3 rounded border border-gray-200">
                            {formatMetadata(activity.metadata, activity.entity_type)}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {filteredActivities.length} {filteredActivities.length === 1 ? 'actividad' : 'actividades'} registradas
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistoryModal;
