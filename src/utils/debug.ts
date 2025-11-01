// Utilidad temporal para depurar el estado del store
export function debugStore() {
  if (typeof window === 'undefined') return
  
  console.log('=== DEBUG STORE ===')
  
  // Verificar localStorage
  const stored = localStorage.getItem('agenda-equipo-storage')
  console.log('LocalStorage data:', stored ? JSON.parse(stored) : 'No data')
  
  // Limpiar localStorage si es necesario
  console.log('Para limpiar localStorage, ejecuta: clearStorageData()')
}

export function clearStorageData() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('agenda-equipo-storage')
  console.log('✅ LocalStorage limpiado. Recarga la página.')
}

export function addCaroToStorage() {
  if (typeof window === 'undefined') return
  
  const stored = localStorage.getItem('agenda-equipo-storage')
  if (stored) {
    const data = JSON.parse(stored)
    
    // Verificar si Caro ya existe
    const caroExists = data.state?.teamMembers?.find((m: { name: string }) => m.name === 'Caro')
    
    if (!caroExists && data.state?.teamMembers) {
      // Agregar Caro
      const caro = {
        id: '3',
        name: 'Caro',
        email: 'caro@equipo.com',
        role: 'member',
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        permissions: [
          'files.upload',
          'files.share_links', 
          'files.download',
          'files.delete_own',
          'chat.send',
          'chat.edit_own',
          'chat.delete_own',
          'team.view_members'
        ]
      }
      
      data.state.teamMembers.push(caro)
      localStorage.setItem('agenda-equipo-storage', JSON.stringify(data))
      console.log('✅ Caro agregada al localStorage. Recarga la página.')
    } else if (caroExists) {
      console.log('ℹ️ Caro ya existe en el storage')
    }
  } else {
    console.log('❌ No hay datos en localStorage')
  }
}