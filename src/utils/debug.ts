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

export function forceReloadFromSupabase() {
  if (typeof window === 'undefined') return
  
  localStorage.removeItem('agenda-equipo-storage')
  console.log('✅ Datos locales eliminados. Los datos se cargarán desde Supabase al recargar.')
  console.log('💡 Recarga la página para sincronizar con Supabase.')
}