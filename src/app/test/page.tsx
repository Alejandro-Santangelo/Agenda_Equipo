'use client'

export default function TestPage() {
  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      margin: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1>🧪 Página de Prueba - Vercel Deploy</h1>
        
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '15px',
          borderRadius: '8px',
          margin: '20px 0',
          fontSize: '14px'
        }}>
          <strong>📊 Info de Debug:</strong><br/>
          Fecha: {new Date().toLocaleString()}<br/>
          URL: {typeof window !== 'undefined' ? window.location.href : 'SERVER_SIDE'}<br/>
          User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 100) + '...' : 'N/A'}
        </div>

        <h2>🎯 Pruebas de Botones:</h2>
        
        <button 
          onClick={() => {
            alert('✅ Botón 1 funciona!')
            console.log('🔴 Test Button 1 clicked')
          }}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#e91e63',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            margin: '10px 0'
          }}
        >
          🔴 BOTÓN DE PRUEBA 1 - CLICK ME
        </button>

        <button 
          onClick={() => {
            console.log('🔴 Test Button 2 clicked - Redirecting...')
            window.location.href = '/?tab=files'
          }}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            margin: '10px 0'
          }}
        >
          � BOTÓN DE PRUEBA 2 - IR A ARCHIVOS
        </button>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px'
        }}>
          <h3>📝 Instrucciones:</h3>
          <ol>
            <li>Si puedes ver esta página → <strong>Vercel funciona ✅</strong></li>
            <li>Si los botones funcionan → <strong>JavaScript funciona ✅</strong></li>
            <li>Si no ves esta página → <strong>Problema de deploy ❌</strong></li>
          </ol>
        </div>
      </div>
    </div>
  )
}