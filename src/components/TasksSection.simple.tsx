// NOTA: Este componente está temporalmente deshabilitado mientras se actualiza 
// para trabajar con los nuevos hooks offline-first. 
// La funcionalidad básica de la aplicación sigue funcionando perfectamente.

export default function TasksSection() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Tareas</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          🚧 Sección de tareas en desarrollo. 
          La funcionalidad principal de la aplicación (chat, archivos, equipo) está disponible.
        </p>
      </div>
    </div>
  )
}