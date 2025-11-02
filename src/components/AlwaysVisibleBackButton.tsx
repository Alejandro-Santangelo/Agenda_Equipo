'use client'

import { useAppStore } from '@/lib/store'
import { ArrowLeft, Home } from 'lucide-react'

export function AlwaysVisibleBackButton() {
  const { activeTab, setActiveTab } = useAppStore()

  return (
    <div className="mb-6 border-2 border-red-500 p-4 bg-red-50">
      <div className="text-xs text-red-600 mb-2">
        🚨 BOTÓN DE DEBUG - SIEMPRE VISIBLE
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Estado actual: activeTab = &quot;{activeTab}&quot;
      </div>
      
      <button
        onClick={() => {
          console.log('🔴 DEBUG BUTTON CLICKED - activeTab:', activeTab)
          setActiveTab('files')
        }}
        className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-bold"
      >
        <Home size={16} />
        <span>IR A ARCHIVOS (DEBUG)</span>
      </button>
      
      {activeTab !== 'files' && (
        <div className="mt-2">
          <button
            onClick={() => setActiveTab('files')}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg text-lg font-bold"
          >
            <ArrowLeft size={24} strokeWidth={3} />
            <span>← VOLVER AL INICIO</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default AlwaysVisibleBackButton