import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MobileOptimizer } from "@/components/MobileOptimizer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agenda Equipo - Paula, Gabi & Caro",
  description: "Aplicación colaborativa para compartir archivos, chat y gestión de equipo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Agenda Equipo",
    startupImage: "/icon-512x512.png",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "mobile-web-app-status-bar-style": "black-translucent",
    "mobile-web-app-title": "Agenda Equipo",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Apple iOS Meta Tags */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Agenda Equipo" />
        
        {/* Android Chrome Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-title" content="Agenda Equipo" />
        
        {/* Microsoft Edge/IE Meta Tags */}
        <meta name="msapplication-TileColor" content="#ec4899" />
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        <meta name="msapplication-config" content="none" />
        
        {/* PWA y Mobile Optimizations */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <MobileOptimizer />
        {children}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Debug functions for development
                window.debugStore = function() {
                  const stored = localStorage.getItem('agenda-equipo-storage');
                  console.log('=== DEBUG STORE ===');
                  console.log('LocalStorage data:', stored ? JSON.parse(stored) : 'No data');
                  console.log('Para limpiar localStorage, ejecuta: clearStorageData()');
                  console.log('Para forzar recarga desde Supabase, ejecuta: forceReloadFromSupabase()');
                };
                
                window.clearStorageData = function() {
                  localStorage.removeItem('agenda-equipo-storage');
                  console.log('✅ LocalStorage limpiado. Recarga la página.');
                };
                
                window.forceReloadFromSupabase = function() {
                  localStorage.removeItem('agenda-equipo-storage');
                  console.log('✅ Datos locales eliminados. Los datos se cargarán desde Supabase al recargar.');
                  console.log('💡 Recarga la página para sincronizar con Supabase.');
                };
                
                console.log('🔧 Funciones de debug disponibles: debugStore(), clearStorageData(), addCaroToStorage()');
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
