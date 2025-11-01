# � Agenda Equipo - Paula, Gabi & Caro

Una aplicación web progresiva (PWA) colaborativa para gestión de equipo con tareas, calendario, chat y archivos compartidos.

## 🚀 Características

- **📱 PWA Completa**: Se instala como app nativa en móviles y desktop
- **📋 Gestión de Tareas**: Crear, editar, filtrar y organizar tareas por estado
- **📅 Sistema de Calendario**: Eventos, recordatorios y vista de calendario
- **💬 Chat en Tiempo Real**: Comunicación instantánea del equipo
- **📁 Gestión de Archivos**: Subir, compartir y gestionar archivos
- **👥 Administración de Equipo**: Permisos y roles de miembros
- **🔄 Offline First**: Funciona sin internet, sincroniza cuando vuelve la conexión
- **📊 Estadísticas**: Dashboards y métricas de productividad
- **🎨 Interfaz Moderna**: Diseño responsive con Tailwind CSS

## 🛠️ Tecnologías

- **Next.js 16.0.1** - Framework React con App Router
- **React 19.2.0** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Framework de estilos
- **Zustand** - Gestión de estado
- **PWA** - Service Workers y Web App Manifest
- **Lucide React** - Iconos modernos

## 📦 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- npm, yarn o pnpm

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/agenda-equipo.git
cd agenda-equipo

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Scripts Disponibles

```bash
npm run dev          # Desarrollo local
npm run build        # Construir para producción
npm run start        # Ejecutar build de producción
npm run lint         # Verificar código
npm run lint:fix     # Corregir errores automáticamente
npm run type-check   # Verificar tipos TypeScript
```

## 🌐 Deploy en Vercel

### Deployment Automático

1. **Conectar con Vercel**:
   - Sube tu código a GitHub
   - Conecta el repositorio con [Vercel](https://vercel.com)
   - Los deployments se harán automáticamente

2. **Deploy Manual**:
   ```bash
   # Instalar Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

## 📱 Funcionalidades PWA

### Instalación en Móviles
- **Android**: Prompt automático de "Agregar a pantalla de inicio"
- **iOS**: Safari > Compartir > "Agregar a pantalla de inicio"

### Características PWA
- ✅ Funciona sin internet (offline-first)
- ✅ Se instala como app nativa
- ✅ Actualización automática
- ✅ Optimización móvil completa
- ✅ No aparece "Sitio para computadoras" en móviles

## 🎯 Funcionalidades Principales

### 📋 Gestión de Tareas
- Crear tareas con título, descripción y prioridad
- Filtrar por estado: Pendiente, En Progreso, Completada
- Buscar tareas por texto
- Estadísticas de productividad

### 📅 Calendario y Eventos
- Crear eventos con fecha, hora y tipo
- Vista de calendario mensual
- Lista de próximos eventos
- Diferentes tipos: Reunión, Recordatorio, Fecha límite

### 💬 Chat del Equipo
- Mensajes en tiempo real
- Editar y eliminar mensajes propios
- Diferentes tipos de mensajes
- Historial persistente

### 📁 Gestión de Archivos
- Subir archivos por drag & drop
- Generar enlaces de descarga
- Organizar por carpetas
- Control de permisos

### 👥 Administración
- Gestionar miembros del equipo (Paula, Gabi, Caro)
- Asignar roles y permisos
- Ver actividad de miembros

## 👥 Equipo

- **Paula** - Desarrollo Frontend
- **Gabi** - UI/UX Design  
- **Caro** - Product Management

---

**Desarrollado con ❤️ por Paula, Gabi & Caro**
