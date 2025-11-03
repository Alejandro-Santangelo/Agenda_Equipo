# 🔧 Solución: Persistencia de Datos en Supabase

## 📋 Problema Identificado

Paula pudo iniciar sesión con sus credenciales iniciales y cambiar su email y contraseña desde el perfil, pero estos cambios **solo se guardaban en la sesión local (localStorage)** y no se persistían en Supabase. Al cerrar sesión y volver a entrar, los datos volvían a los valores iniciales.

## ✅ Solución Implementada

### 1. **Actualización de Perfil con Persistencia en Supabase**

**Archivo modificado:** `src/hooks/useAuth.ts` - Función `updateProfile`

**Cambios realizados:**
- ✅ Ahora actualiza los datos en la tabla `team_members` de Supabase
- ✅ Sincroniza el email, nombre y teléfono en la base de datos
- ✅ Mantiene la sincronización con el store local (Zustand)
- ✅ Actualiza el campo `last_seen` para tracking de actividad

**Código clave:**
```typescript
// Actualizar en Supabase
const { error: updateError } = await supabase
  .from('team_members')
  .update({
    name: updates.name,
    email: updates.email,
    phone: updates.phone,
    last_seen: new Date().toISOString()
  })
  .eq('id', currentUser.id)
```

### 2. **Cambio de Contraseña con Hash Seguro**

**Archivo modificado:** `src/hooks/useAuth.ts` - Función `changePassword`

**Cambios realizados:**
- ✅ Hashea la nueva contraseña con bcrypt (12 salt rounds)
- ✅ Actualiza el `password_hash` en la tabla `team_members` de Supabase
- ✅ Mantiene la seguridad con encriptación robusta
- ✅ Actualiza el campo `last_seen`

**Código clave:**
```typescript
// Hashear la nueva contraseña
const { hashPassword } = await import('@/lib/password-utils')
const newPasswordHash = await hashPassword(newPassword)

// Actualizar en Supabase
const { error: updateError } = await supabase
  .from('team_members')
  .update({
    password_hash: newPasswordHash,
    last_seen: new Date().toISOString()
  })
  .eq('id', currentUser.id)
```

### 3. **Login Mejorado con Prioridad a Supabase**

**Archivo modificado:** `src/hooks/useAuth.ts` - Función `login`

**Cambios realizados:**
- ✅ Prioriza la búsqueda de usuarios en Supabase sobre credenciales locales
- ✅ Lee los datos actualizados de email y contraseña desde la BD
- ✅ Fallback a credenciales locales si Supabase no está disponible
- ✅ Actualiza `last_seen` en cada login

**Flujo de autenticación:**
```
1. Buscar usuario en Supabase → 
2. Si no existe, buscar en credenciales locales →
3. Verificar contraseña con bcrypt →
4. Actualizar last_seen en Supabase →
5. Iniciar sesión exitosa
```

## 🔐 Estructura de Base de Datos

La tabla `team_members` en Supabase tiene la siguiente estructura relevante:

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,  -- Hash bcrypt de la contraseña
  role TEXT CHECK (role IN ('admin', 'member')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## 🧪 Cómo Verificar que Funciona

### Prueba 1: Actualización de Email

1. **Login inicial:**
   - Email: `paula@equipo.com` (o el email ficticio usado)
   - Contraseña: `1111` (o la contraseña inicial)

2. **Actualizar perfil:**
   - Ir a la sección "Mi Perfil"
   - Cambiar el email a uno real (ej: `paula.real@gmail.com`)
   - Guardar cambios
   - Verificar mensaje de éxito: ✅ "Perfil actualizado correctamente"

3. **Verificar persistencia:**
   - Cerrar sesión
   - Intentar login con el **nuevo email** y contraseña original
   - Debería funcionar ✅

4. **Verificar en Supabase:**
   - Ir a Supabase Dashboard → Table Editor → team_members
   - Buscar el registro de Paula
   - El campo `email` debe mostrar el nuevo email

### Prueba 2: Cambio de Contraseña

1. **Cambiar contraseña:**
   - En "Mi Perfil" → Sección "Cambiar Contraseña"
   - Contraseña actual: `1111` (la inicial)
   - Nueva contraseña: `paula2024` (o la que prefieras)
   - Confirmar nueva contraseña: `paula2024`
   - Guardar
   - Verificar mensaje: ✅ "Contraseña cambiada correctamente"

2. **Verificar persistencia:**
   - Cerrar sesión
   - Intentar login con email y **nueva contraseña**
   - Debería funcionar ✅

3. **Verificar en Supabase:**
   - Ir a Supabase Dashboard → Table Editor → team_members
   - El campo `password_hash` debe tener un nuevo valor (hash bcrypt)

### Prueba 3: Actualización Completa

1. **Actualizar todo:**
   - Email: cambiar a email real
   - Nombre: cambiar si es necesario
   - Teléfono: agregar o modificar
   - Contraseña: cambiar a una nueva
   - Guardar todo

2. **Logout y Login:**
   - Cerrar sesión completamente
   - Cerrar el navegador o limpiar caché
   - Volver a abrir la app
   - Hacer login con **nuevas credenciales**
   - Verificar que todos los datos persisten ✅

## 📊 Verificación en Consola del Navegador

Puedes ver logs informativos en la consola:

```javascript
// Login exitoso desde Supabase:
✅ Usuario encontrado en Supabase

// Perfil actualizado:
✅ Perfil actualizado en Supabase exitosamente

// Contraseña cambiada:
✅ Contraseña actualizada en Supabase exitosamente
✅ Contraseña cambiada para: paula@equipo.com
```

## 🚨 Posibles Problemas y Soluciones

### Problema 1: "Error al actualizar en la base de datos"

**Causa:** Problemas de conexión con Supabase

**Solución:**
1. Verificar que `.env.local` tiene las credenciales correctas
2. Verificar conexión a internet
3. Verificar que el proyecto Supabase está activo
4. Reiniciar el servidor de desarrollo: `npm run dev`

### Problema 2: "Usuario no encontrado" al intentar login con nuevo email

**Causa:** El email no se guardó en Supabase

**Solución:**
1. Verificar en Supabase Dashboard que la tabla `team_members` tiene Row Level Security (RLS) configurado correctamente
2. Ejecutar manualmente la actualización en SQL Editor de Supabase:
   ```sql
   UPDATE team_members 
   SET email = 'nuevo-email@gmail.com' 
   WHERE id = 'user-id-aqui';
   ```

### Problema 3: "Contraseña incorrecta" después de cambiarla

**Causa:** El hash no se guardó correctamente

**Solución:**
1. Verificar que `bcryptjs` está instalado: `npm list bcryptjs`
2. Verificar en consola si hay errores de bcrypt
3. Si persiste, resetear manualmente en Supabase usando un hash generado:
   ```javascript
   // En la consola del navegador:
   const bcrypt = require('bcryptjs');
   bcrypt.hash('nueva-contraseña', 12).then(hash => console.log(hash));
   ```
   Copiar el hash y actualizarlo en Supabase.

## 🔄 Sincronización con Credenciales Locales

**Nota importante:** Las credenciales en `src/lib/user-credentials.ts` son **solo para fallback** cuando Supabase no está disponible. 

- ✅ El login **siempre busca primero en Supabase**
- ✅ Los cambios **solo se persisten en Supabase**
- ✅ Las credenciales locales NO se actualizan automáticamente

Si necesitas actualizar las credenciales locales (para modo offline), debes hacerlo manualmente en ese archivo.

## 📝 Resumen de Archivos Modificados

1. ✅ `src/hooks/useAuth.ts` - Funciones de autenticación con persistencia
2. ✅ `.env.local` - Ya tenía las credenciales de Supabase correctas

## ✨ Próximos Pasos

1. **Probar todas las funcionalidades:**
   - Login con credenciales originales
   - Actualizar email
   - Actualizar contraseña
   - Verificar persistencia

2. **Verificar en producción (Vercel):**
   - Asegurarse de que las variables de entorno están configuradas en Vercel
   - Hacer deploy y probar en producción

3. **Considerar mejoras futuras:**
   - Sistema de recuperación de contraseña por email
   - Confirmación por email al cambiar datos críticos
   - Historial de cambios de perfil
   - 2FA (autenticación de dos factores)

---

## 💡 ¿Necesitas Ayuda?

Si los cambios no funcionan:

1. Revisa los logs en la consola del navegador (F12)
2. Verifica el estado de la conexión a Supabase
3. Revisa las políticas RLS en Supabase Dashboard
4. Asegúrate de que el servidor está corriendo: `npm run dev`
