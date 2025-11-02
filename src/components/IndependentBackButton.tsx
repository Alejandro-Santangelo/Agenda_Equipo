'use client'

import React, { useState } from 'react'

export function IndependentBackButton() {
  const [currentTab, setCurrentTab] = useState('unknown')

  // Función para detectar tab actual desde la URL o localStorage
  React.useEffect(() => {
    // Intentar obtener del localStorage
    try {
      const stored = localStorage.getItem('agenda-equipo-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.state?.activeTab) {
          setCurrentTab(parsed.state.activeTab)
        }
      }
    } catch (error) {
      console.log('Error reading localStorage:', error)
    }
  }, [])

  const goToFiles = () => {
    console.log('🔴 INDEPENDENT BUTTON CLICKED')
    
    // Intentar actualizar localStorage directamente
    try {
      const stored = localStorage.getItem('agenda-equipo-storage')
      if (stored) {
        const parsed = JSON.parse(stored)
        parsed.state.activeTab = 'files'
        localStorage.setItem('agenda-equipo-storage', JSON.stringify(parsed))
      }
    } catch (error) {
      console.log('Error updating localStorage:', error)
    }
    
    // Recargar página para aplicar cambios
    window.location.reload()
  }

  return (
    <div style={{ 
      border: '4px solid #ff0000', 
      padding: '20px', 
      margin: '20px', 
      backgroundColor: '#ffebee',
      borderRadius: '10px',
      position: 'relative',
      zIndex: 9999
    }}>
      <div style={{ 
        fontSize: '14px', 
        color: '#d32f2f', 
        marginBottom: '15px',
        fontWeight: 'bold'
      }}>
        🚨 BOTÓN INDEPENDIENTE DE PRUEBA
      </div>
      
      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginBottom: '15px'
      }}>
        Tab detectada: &quot;{currentTab}&quot;<br/>
        URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}<br/>
        Fecha: {new Date().toLocaleString()}
      </div>
      
      <button 
        onClick={goToFiles}
        style={{
          width: '100%',
          padding: '20px',
          backgroundColor: '#e91e63',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#ad1457'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#e91e63'
        }}
      >
        🏠 IR A ARCHIVOS (INDEPENDIENTE)
      </button>
    </div>
  )
}

export default IndependentBackButton