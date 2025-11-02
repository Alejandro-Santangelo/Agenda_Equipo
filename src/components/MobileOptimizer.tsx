'use client'

import { useEffect } from 'react'

export function MobileOptimizer() {
  useEffect(() => {
    // Función para optimizar la experiencia móvil
    const optimizeMobileExperience = () => {
      // Detectar si es móvil
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          // @ts-expect-error - Safari standalone property
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://')
      
      if (isMobile) {
        // Agregar clase CSS para móvil
        document.documentElement.classList.add('mobile-device')
        
        // Configurar viewport dinámicamente
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0, viewport-fit=cover')
        }
        
        // Prevenir zoom accidental
        document.addEventListener('touchstart', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault()
          }
        }, { passive: false })
        
        let lastTouchEnd = 0
        document.addEventListener('touchend', (e) => {
          const now = new Date().getTime()
          if (now - lastTouchEnd <= 300) {
            e.preventDefault()
          }
          lastTouchEnd = now
        }, { passive: false })
        
        // Optimizar scroll en iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          // @ts-expect-error - WebKit specific property
          document.body.style.webkitOverflowScrolling = 'touch'
          
          // Prevenir rebote en iOS
          document.body.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
              const touch = e.touches[0]
              const element = touch.target as HTMLElement
              
              // Verificar si el elemento es scrollable
              const scrollableParent = element.closest('[data-scrollable], .overflow-y-auto, .overflow-auto')
              if (!scrollableParent && element.tagName !== 'INPUT' && element.tagName !== 'TEXTAREA') {
                if (document.body.scrollTop === 0) {
                  document.body.scrollTop = 1
                } else if (document.body.scrollTop + window.innerHeight >= document.body.scrollHeight) {
                  document.body.scrollTop = document.body.scrollHeight - window.innerHeight - 1
                }
              }
            }
          }, { passive: true })
        }
        
        // Configurar PWA install prompt
        let deferredPrompt: Event | null = null
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault()
          deferredPrompt = e
          
          // Mostrar botón de instalación personalizado si no está instalado
          if (!isStandalone) {
            setTimeout(() => {
              showInstallPrompt(deferredPrompt)
            }, 3000) // Esperar 3 segundos después de cargar
          }
        })
        
        // Configurar notificaciones de instalación
        window.addEventListener('appinstalled', () => {
          console.log('✅ PWA instalada exitosamente')
          deferredPrompt = null
        })
      }
      
      // Configuración específica para modo standalone
      if (isStandalone) {
        document.documentElement.classList.add('pwa-installed')
        
        // Ajustar para notch en iPhone X+
        if (/iPhone/.test(navigator.userAgent)) {
          const supportsNotch = CSS.supports('padding: constant(safe-area-inset-top)')
          if (supportsNotch) {
            document.documentElement.style.setProperty('--safe-area-top', 'constant(safe-area-inset-top)')
            document.documentElement.style.setProperty('--safe-area-bottom', 'constant(safe-area-inset-bottom)')
          }
        }
      }
    }
    
    // Función para mostrar prompt de instalación personalizado
    const showInstallPrompt = (deferredPrompt: Event | null) => {
      if (!deferredPrompt) return
      
      const installBanner = document.createElement('div')
      installBanner.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        ">
          <div style="display: flex; align-items: center;">
            <span style="margin-right: 8px;">📱</span>
            <span><strong>Instalar Agenda Equipo</strong><br>
            <small>Para una mejor experiencia móvil</small></span>
          </div>
          <div>
            <button id="install-app" style="
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 6px 12px;
              border-radius: 6px;
              margin-right: 8px;
              font-size: 12px;
              cursor: pointer;
            ">Instalar</button>
            <button id="dismiss-install" style="
              background: none;
              border: none;
              color: white;
              font-size: 18px;
              cursor: pointer;
              padding: 4px;
            ">×</button>
          </div>
        </div>
      `
      
      document.body.appendChild(installBanner)
      
      // Manejar instalación
      const installButton = installBanner.querySelector('#install-app')
      const dismissButton = installBanner.querySelector('#dismiss-install')
      
      installButton?.addEventListener('click', async () => {
        // @ts-expect-error - BeforeInstallPromptEvent properties
        if (deferredPrompt?.prompt) {
          // @ts-expect-error - BeforeInstallPromptEvent properties
          deferredPrompt.prompt()
          // @ts-expect-error - BeforeInstallPromptEvent properties
          const { outcome } = await deferredPrompt.userChoice
          console.log(`Instalación: ${outcome}`)
        }
        installBanner.remove()
      })
      
      dismissButton?.addEventListener('click', () => {
        installBanner.remove()
      })
      
      // Auto-ocultar después de 10 segundos
      setTimeout(() => {
        if (document.body.contains(installBanner)) {
          installBanner.remove()
        }
      }, 10000)
    }
    
    // Ejecutar optimizaciones
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeMobileExperience)
    } else {
      optimizeMobileExperience()
    }
    
    // Configurar service worker para PWA - TEMPORALMENTE DESHABILITADO
    // if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    //   navigator.serviceWorker.register('/sw.js')
    //     .then((registration) => {
    //       console.log('✅ Service Worker registrado:', registration)
    //     })
    //     .catch((error) => {
    //       console.log('❌ Error registrando Service Worker:', error)
    //     })
    // }
    
  }, [])

  return null
}

export default MobileOptimizer