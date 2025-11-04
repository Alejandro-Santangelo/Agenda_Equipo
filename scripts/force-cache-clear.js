/**
 * Script para forzar limpieza de cache en el próximo inicio
 * Ejecutar en la consola del navegador (F12)
 */

console.log('🧹 Marcando para limpieza de cache...')
localStorage.setItem('agenda-needs-cache-clear', 'true')
console.log('✅ Cache se limpiará en el próximo inicio')
console.log('💡 Recarga la página (F5) para aplicar cambios')
