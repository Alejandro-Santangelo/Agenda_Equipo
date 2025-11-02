'use client'

import { useAppStore } from '@/lib/store'
import { ArrowLeft } from 'lucide-react'

export function BackToFilesButton() {
  const { activeTab, setActiveTab } = useAppStore()

  // Solo mostrar si no estamos en la tab 'files'
  if (activeTab === 'files') {
    return null
  }

  return (
    <div className="mb-6 border-b border-pink-200 pb-4">
      <button
        onClick={() => setActiveTab('files')}
        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl hover:from-pink-700 hover:to-purple-700 transition-all shadow-lg text-lg font-bold"
      >
        <ArrowLeft size={24} strokeWidth={3} />
        <span>← VOLVER AL INICIO</span>
      </button>
    </div>
  )
}

export default BackToFilesButton