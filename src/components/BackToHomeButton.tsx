'use client'

import { useAppStore } from '@/lib/store'
import { ArrowLeft } from 'lucide-react'
import dynamic from 'next/dynamic'

// Componente interno sin SSR para evitar problemas de hidratación
function BackToHomeButtonInner() {
  const { activeTab, setActiveTab } = useAppStore()

  // Solo mostrar si no estamos en la tab 'files'
  const shouldShow = activeTab !== 'files'
  
  console.log('🔴 BackToHomeButton - activeTab:', activeTab, 'shouldShow:', shouldShow)

  if (!shouldShow) {
    return null
  }

  return (
    <div className="mb-6 border-b border-pink-200 pb-4" data-testid="back-button-container">
      <button
        onClick={() => {
          console.log('🔴 BOTÓN VOLVER CLICKEADO - Tab actual:', activeTab)
          setActiveTab('files')
        }}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg text-lg font-bold"
        data-testid="back-button"
        style={{ 
          minHeight: '50px', 
          backgroundColor: '#ec4899',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ArrowLeft size={24} strokeWidth={3} />
        <span>← VOLVER AL INICIO</span>
      </button>
    </div>
  )
}

// Exportar como componente dinámico sin SSR
const BackToHomeButton = dynamic(() => Promise.resolve(BackToHomeButtonInner), {
  ssr: false,
  loading: () => (
    <div className="mb-6 border-b border-pink-200 pb-4" style={{ opacity: 0.3, height: '74px' }}>
      <div style={{ minHeight: '50px', backgroundColor: '#ec4899', borderRadius: '0.75rem' }}>
        {/* Placeholder mientras carga */}
      </div>
    </div>
  )
})

export { BackToHomeButton }
export default BackToHomeButton