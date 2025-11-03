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

                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>
                          {format(new Date(activity.created_at), "PPP 'a las' p", { locale: es })}
                        </span>
                      </div>

                      {/* Metadatos adicionales si existen */}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
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
