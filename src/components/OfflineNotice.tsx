'use client'

import { useEffect, useState } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { Info } from 'lucide-react'

export default function OfflineNotice() {
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    const configured = isSupabaseConfigured()
    
    if (!configured) {
      // Mostrar aviso después de 2 segundos para no ser intrusivo
      const timer = setTimeout(() => setShowNotice(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!showNotice) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm shadow-lg">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 text-sm">
            Modo Offline
          </h4>
          <p className="text-blue-700 text-xs mt-1 leading-relaxed">
            Trabajando en modo local. Todos los datos se guardan automáticamente y estarán disponibles cuando configures Supabase.
          </p>
        </div>
        <button
          onClick={() => setShowNotice(false)}
          className="text-blue-400 hover:text-blue-600 text-lg font-bold leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}