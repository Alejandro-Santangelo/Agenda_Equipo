# 🚀 Guía de Deploy - Agenda Equipo

## Orden de Ejecución

### 1️⃣ ACTUALIZAR SUPABASE (Primero)
```powershell
.\scripts\update-supabase.ps1
```

**O manualmente:**
1. Ve a https://supabase.com/dashboard
2. SQL Editor → New Query
3. Copia TODO el contenido de `SUPABASE_COMPLETO.sql`
4. Pega y ejecuta (RUN)
5. Verifica que las 7 tablas se crearon en Table Editor

---

### 2️⃣ COMMIT Y PUSH A GITHUB
```powershell
.\scripts\deploy.ps1
```

**O manualmente:**
```powershell
git add .
git commit -m "feat: Sincronización completa con Supabase"
git push origin main
```

---

### 3️⃣ DEPLOY A VERCEL (Automático o Manual)

**Opción A - Automático:**
- Vercel detectará el push y desplegará automáticamente
- Ve a: https://vercel.com/dashboard/deployments

**Opción B - Forzar deploy:**
```powershell
vercel --prod
```

**Opción C - Desde Dashboard:**
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Deployments → ... → Redeploy

---

## ✅ Verificaciones Post-Deploy

### En Supabase Dashboard:
- [ ] Table Editor → Verificar 7 tablas existen
- [ ] Table Editor → team_members → Verificar 3 usuarios (Paula, Gabi, Caro)
- [ ] Authentication → Verificar RLS habilitado

### En Vercel Dashboard:
- [ ] Settings → Environment Variables → Verificar:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deployments → Ver que el último deploy fue exitoso

### En la App (Producción):
1. [ ] Login con Paula (paula@equipo.com / 1111)
2. [ ] Crear una tarea → F12 Console → Ver "✅ Task guardada en Supabase"
3. [ ] Logout y login con Gabi (gabi@equipo.com / 3333)
4. [ ] Ver que la tarea de Paula está visible
5. [ ] Enviar mensaje en chat → Ver que se guarda
6. [ ] Logout y login con Paula → Ver mensaje de Gabi

---

## 🔍 Troubleshooting

### Si algo falla:

**Problema: "Error al sincronizar desde Supabase"**
- Verificar que ejecutaste el script SQL en Supabase
- Verificar variables de entorno en Vercel
- Ver consola del navegador (F12) para más detalles

**Problema: "Usuario no encontrado"**
- Ejecutar el script SQL nuevamente (tiene INSERT con ON CONFLICT)
- Verificar en Table Editor que los usuarios existen

**Problema: "Vercel no despliega"**
- Verificar en GitHub que el push fue exitoso
- Forzar redeploy desde Vercel Dashboard
- Verificar logs en Vercel → Deployments → Ver logs

---

## 📞 Resumen Rápido

```powershell
# 1. Actualizar Supabase (manual en dashboard)
.\scripts\update-supabase.ps1

# 2. Deploy a GitHub y Vercel
.\scripts\deploy.ps1

# 3. Verificar en producción
# Abrir la URL de Vercel y probar login
```

🎉 ¡Listo!
