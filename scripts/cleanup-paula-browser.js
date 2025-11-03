// Script para limpiar completamente a Paula del sistema
// Ejecutar en la consola del navegador (F12)

(async function cleanupPaula() {
  console.log('🧹 Iniciando limpieza completa de Paula...')
  
  // 1. Limpiar localStorage
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value && value.includes('paula@equipo.com')) {
        console.log(`🗑️  Limpiando key: ${key}`)
        // Si es el store completo, parsear y filtrar
        if (key === 'team-management-store') {
          const store = JSON.parse(value)
          if (store.state && store.state.teamMembers) {
            store.state.teamMembers = store.state.teamMembers.filter(
              m => m.email !== 'paula@equipo.com'
            )
            localStorage.setItem(key, JSON.stringify(store))
            console.log('✅ Paula eliminada del store')
          }
        }
      }
    } catch (e) {
      // Ignorar errores de parsing
    }
  })
  
  // 2. Limpiar IndexedDB (offline storage)
  try {
    const dbName = 'TeamManagementOfflineDB'
    const request = indexedDB.open(dbName)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['members'], 'readwrite')
      const store = transaction.objectStore('members')
      
      const getAllRequest = store.getAll()
      getAllRequest.onsuccess = () => {
        const members = getAllRequest.result
        const paula = members.find(m => m.email === 'paula@equipo.com')
        
        if (paula) {
          const deleteRequest = store.delete(paula.id)
          deleteRequest.onsuccess = () => {
            console.log('✅ Paula eliminada de IndexedDB')
          }
        } else {
          console.log('ℹ️  Paula no encontrada en IndexedDB')
        }
      }
    }
  } catch (error) {
    console.log('ℹ️  IndexedDB no disponible o no contiene datos')
  }
  
  console.log('\n✅ Limpieza completa. Recargando página...')
  setTimeout(() => {
    window.location.reload()
  }, 1000)
})()
