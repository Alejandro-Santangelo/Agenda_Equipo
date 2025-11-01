import React from 'react';
import { Bell, X, Check } from 'lucide-react';

const NotificationCenter: React.FC = () => {
  // Datos mock para el ejemplo
  const notifications = [
    {
      id: '1',
      title: 'Nueva tarea asignada',
      message: 'Se te ha asignado una nueva tarea: Revisar documentación',
      time: '2 min',
      read: false,
      type: 'task'
    },
    {
      id: '2',
      title: 'Reunión próxima',
      message: 'Tienes una reunión en 30 minutos',
      time: '30 min',
      read: false,
      type: 'event'
    },
    {
      id: '3',
      title: 'Mensaje nuevo',
      message: 'Paula ha enviado un mensaje en el chat general',
      time: '1 h',
      read: true,
      type: 'message'
    }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-lg border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className={`text-sm font-medium ${
                        !notification.read ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      hace {notification.time}
                    </p>
                  </div>
                  
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t bg-gray-50">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;