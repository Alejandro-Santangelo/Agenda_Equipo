# 📋 Configuración de Base de Datos - Agenda de Equipo

## 🏃‍♀️ Pasos para implementar Supabase Auth

### 1. Configurar Supabase
```bash
# Si no tienes Supabase CLI instalado:
npm install -g supabase

# Inicializar Supabase en tu proyecto (si no lo has hecho):
supabase init

# Conectar a tu proyecto Supabase:
supabase link --project-ref TU_PROJECT_REF
```

### 2. Ejecutar Migraciones
```bash
# Aplicar la migración de autenticación:
supabase db push

# O aplicar manualmente el archivo SQL:
supabase db reset
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Verificar Configuración de RLS

En el panel de Supabase, asegúrate de que:
- ✅ RLS está habilitado en la tabla `profiles`
- ✅ Las políticas de seguridad están configuradas
- ✅ Los triggers funcionan correctamente

### 5. Crear Usuarios Iniciales

Ejecuta el siguiente SQL en tu consola de Supabase para crear los usuarios del equipo:

```sql
-- Verificar que la función create_dev_users() se ejecutó correctamente
SELECT * FROM public.profiles;

-- Si no existen usuarios, puedes crearlos manualmente:
-- (La migración ya debería haberlos creado)
```

## 🔐 Credenciales por Defecto

Una vez configurado, los usuarios pueden iniciar sesión con:

- **Paula (Admin)**: `paula@equipo.com` / `1111`
- **Gabi (Miembro)**: `gabi@equipo.com` / `3333`  
- **Caro (Miembro)**: `caro@equipo.com` / `2222`

## ✨ Funcionalidades Implementadas

### 🔑 Sistema de Autenticación
- Login con email/contraseña
- Gestión de sesiones
- Protección de rutas
- Logout seguro

### 👤 Gestión de Perfiles
- Editar información personal (nombre, email, teléfono)
- Cambiar contraseñas
- Visualizar rol y permisos

### 👥 Administración de Usuarios (Solo Paula)
- Registrar nuevos usuarios
- Gestionar permisos
- Ver estadísticas del equipo

### 🔄 Sincronización Híbrida
- Funciona offline con IndexedDB
- Sincroniza automáticamente cuando hay conexión
- Estado de conexión visible

## 🚀 Próximos Pasos

1. **Configurar Supabase**: Seguir los pasos arriba
2. **Verificar funcionamiento**: Probar login con credenciales
3. **Personalizar**: Ajustar campos de perfil según necesidades
4. **Desplegar**: Configurar variables de entorno en producción

## 🛠️ Troubleshooting

### Problema: "Error de conexión"
- Verificar variables de entorno
- Comprobar configuración de Supabase
- Revisar políticas RLS

### Problema: "Usuario no encontrado"
- Ejecutar migración de usuarios
- Verificar tabla profiles
- Comprobar triggers

### Problema: "Permisos denegados"
- Revisar políticas RLS
- Verificar rol del usuario
- Comprobar configuración de auth

---

¡Todo listo para una gestión segura y colaborativa! 🎉