// Botón de emergencia que se inyecta directamente en el DOM
export function injectEmergencyButton() {
  if (typeof window === 'undefined') return;
  
  // Esperar a que el DOM esté listo
  const inject = () => {
    // Eliminar botón anterior si existe
    const existing = document.getElementById('emergency-back-button');
    if (existing) existing.remove();
    
    // Crear botón de emergencia
    const button = document.createElement('div');
    button.id = 'emergency-back-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 99999;
        background: #ff0000;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        border: 3px solid #ffffff;
        font-size: 16px;
        text-align: center;
        max-width: 200px;
      ">
        🚨 BOTÓN DE EMERGENCIA<br/>
        <small>Click para ir a Archivos</small><br/>
        <small style="font-size: 10px;">${new Date().toLocaleTimeString()}</small>
      </div>
    `;
    
    button.onclick = () => {
      console.log('🚨 EMERGENCY BUTTON CLICKED');
      
      // Intentar múltiples métodos para cambiar de tab
      try {
        // Método 1: LocalStorage directo
        const stored = localStorage.getItem('agenda-equipo-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.state.activeTab = 'files';
          localStorage.setItem('agenda-equipo-storage', JSON.stringify(parsed));
        }
        
        // Método 2: Recargar página
        window.location.href = '/';
      } catch (error) {
        console.error('Error in emergency button:', error);
        // Método 3: Recargar forzado
        window.location.reload();
      }
    };
    
    document.body.appendChild(button);
    console.log('🚨 Emergency button injected at:', new Date().toLocaleTimeString());
  };
  
  // Inyectar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
  
  // También inyectar después de un delay por si acaso
  setTimeout(inject, 1000);
  setTimeout(inject, 3000);
}