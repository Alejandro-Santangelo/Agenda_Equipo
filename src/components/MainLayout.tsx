'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useAuth } from '@/hooks/useAuth'
import { Files, MessageCircle, Users, UserCircle, Menu, X, Wifi, WifiOff, LogOut, Crown, Shield, BarChart3, Calendar, CheckSquare } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import BackToFilesButton from './BackToFilesButton'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { 
    activeTab, 
    setActiveTab, 
    isMobileMenuOpen, 
    setMobileMenuOpen
  } = useAppStore()
  
  const { isOnline, syncInProgress } = useOfflineSync()
  const { currentUser, logout } = useAuth()



  const tabs = [
    { id: 'files', label: 'Archivos', icon: Files },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'team', label: 'Equipo', icon: Users },
    ...(currentUser?.role === 'admin' ? [
      { id: 'stats' as const, label: 'Estadísticas', icon: BarChart3 },
      { id: 'notifications' as const, label: 'Configuración', icon: Shield }
    ] : []),
    { id: 'profile', label: 'Mi Perfil', icon: UserCircle },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-pink-200/50 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Agenda Equipo
            </h1>
            <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              isOnline 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              {syncInProgress ? 'Sincronizando...' : (isOnline ? 'Online' : 'Offline')}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser && (
              <>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="hidden sm:flex items-center gap-2 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  title="Ir a mi perfil"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {currentUser.name[0]}
                  </div>
                  <span className="text-gray-700 font-medium">{currentUser.name}</span>
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  {currentUser.role === 'admin' ? (
                    <div className="flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      <Crown size={10} />
                      Admin
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      <Shield size={10} />
                      Miembro
                    </div>
                  )}
                </div>
                
                {/* Botón Logout */}
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition-colors shadow-md"
            >
              {isMobileMenuOpen ? <X size={22} color="white" strokeWidth={2.5} /> : <Menu size={22} color="white" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-pink-200/50 pt-4">
            {/* User info móvil */}
            {currentUser && (
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                    {currentUser.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{currentUser.name}</div>
                    <div className="text-xs text-gray-500">
                      {currentUser.role === 'admin' ? '👑 Administradora' : '👤 Miembro'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white/50 text-gray-600 hover:bg-white/70'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-pink-200/50 bg-white/30 backdrop-blur-sm min-h-screen">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Botón para volver a Archivos cuando no estamos en files */}
          <BackToFilesButton />
          
          {/* Mobile Section Title */}
          <div className="lg:hidden mb-4">
            <h1 className="text-2xl font-bold text-gray-800 capitalize">
              {activeTab === 'files' ? 'Archivos' : 
               activeTab === 'tasks' ? 'Tareas' :
               activeTab === 'calendar' ? 'Calendario' :
               activeTab === 'chat' ? 'Chat' :
               activeTab === 'team' ? 'Equipo' :
               activeTab === 'stats' ? 'Estadísticas' :
               activeTab === 'profile' ? 'Perfil' : 'Agenda Equipo'}
            </h1>
          </div>
          
          {children}
        </main>
      </div>
    </div>
  )
}