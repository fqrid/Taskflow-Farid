# 📖 SWAGGER - GUÍA DE USO COMPLETA

## 🚀 ACCEDER A SWAGGER

Una vez que el servidor esté ejecutándose:

```bash
pnpm run start:dev
```

Abre tu navegador en:

```
http://localhost:3000/docs
```

Verás una interfaz interactiva con toda la documentación de tu API.

---

## 🔑 AUTENTICACIÓN EN SWAGGER

### Paso 1: Registrarse
1. Expande el endpoint `🔐 auth` → `POST /auth/registro`
2. Haz clic en **"Try it out"**
3. Completa los datos:
```json
{
  "email": "usuario@example.com",
  "nombre": "Mi Nombre",
  "contraseña": "Password123"
}
```
4. Haz clic en **"Execute"**
5. Verás la respuesta (status 201)

### Paso 2: Obtener Token
1. Expande `🔐 auth` → `POST /auth/login`
2. Haz clic en **"Try it out"**
3. Completa los datos:
```json
{
  "email": "usuario@example.com",
  "contraseña": "Password123"
}
```
4. Haz clic en **"Execute"**
5. **Copia el valor del `accessToken`** de la respuesta

### Paso 3: Usar el Token
1. En la esquina **superior derecha** verás un botón **"Authorize"** 🔓
2. Haz clic en él
3. En el campo "value" pega el token en formato:
```
Bearer eyJhbGciOiJIUzI1NiIs...
```
4. Haz clic en **"Authorize"**
5. Haz clic en **"Close"**

**¡Ya estás autenticado! 🔒** Todos los endpoints protegidos funcionarán.

---

## 📚 ESTRUCTURA DE LA DOCUMENTACIÓN

### 🔐 AUTH (Autenticación)
Endpoints para registro, login y validación de tokens

| Endpoint | Método | Requiere Token | Descripción |
|----------|--------|---|---|
| `/auth/registro` | POST | ❌ No | Registrar nuevo usuario |
| `/auth/login` | POST | ❌ No | Obtener token JWT |
| `/auth/perfil` | GET | ✅ Sí | Ver perfil autenticado |
| `/auth/validar-token` | GET | ✅ Sí | Validar que el token es válido |

### 👥 USERS (Usuarios)
Endpoints para gestión de usuarios

| Endpoint | Método | Requiere Token | Quién puede usar |
|----------|--------|---|---|
| `POST /users` | POST | ✅ Sí | ADMIN |
| `GET /users` | GET | ✅ Sí | ADMIN, GERENTE |
| `GET /users/:id` | GET | ✅ Sí | ADMIN, GERENTE |
| `PATCH /users/:id` | PATCH | ✅ Sí | ADMIN |
| `DELETE /users/:id` | DELETE | ✅ Sí | ADMIN |

---

## 🎯 CASOS DE USO

### Caso 1: Crear un usuario (siendo ADMIN)

1. **Registrarse como ADMIN:**
   - Endpoint: `POST /auth/registro`
   - Datos: `{ "email": "admin@test.com", "nombre": "Admin", "contraseña": "Admin123456", "rol": "admin" }`

2. **Hacer login:**
   - Endpoint: `POST /auth/login`
   - Obtener token
   - Autorizar en Swagger (ver paso 3 anterior)

3. **Crear otro usuario:**
   - Endpoint: `POST /users`
   - Datos:
   ```json
   {
     "email": "nuevo@test.com",
     "nombre": "Nuevo Usuario",
     "password": "Password123",
     "rol": "gerente"
   }
   ```
   - Execute → ¡Usuario creado! ✅

### Caso 2: Listar usuarios (siendo GERENTE)

1. **Registrarse como GERENTE:**
   - `POST /auth/registro` con `"rol": "gerente"`

2. **Login:**
   - `POST /auth/login`
   - Autorizar token

3. **Listar usuarios:**
   - Endpoint: `GET /users`
   - Execute → ¡Verás la lista! 📋

### Caso 3: Ver perfil propio

1. **Login (con cualquier usuario)**
   - `POST /auth/login`
   - Autorizar token

2. **Ver perfil:**
   - Endpoint: `GET /auth/perfil`
   - Execute → ¡Tu información! 👤

---

## 📊 ESTRUCTURA DE RESPUESTAS

### ✅ Respuesta Exitosa (2xx)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@example.com",
  "nombre": "Juan Pérez",
  "rol": "admin",
  "activo": true,
  "fechaCreacion": "2025-04-19T10:30:00.000Z"
}
```

### ❌ Respuesta de Error (4xx/5xx)

```json
{
  "statusCode": 401,
  "message": "Token inválido o ausente",
  "error": "Unauthorized"
}
```

---

## 🔒 ENTENDER LOS ROLES

### ADMIN 🛡️
- ✅ Crear usuarios
- ✅ Listar usuarios
- ✅ Ver usuario específico
- ✅ Actualizar usuario
- ✅ Eliminar usuario
- ✅ Ver perfil propio

### GERENTE 📊
- ❌ Crear usuarios
- ✅ Listar usuarios
- ✅ Ver usuario específico
- ❌ Actualizar usuario
- ❌ Eliminar usuario
- ✅ Ver perfil propio

### DESARROLLADOR 👨‍💻
- ❌ Crear usuarios
- ❌ Listar usuarios
- ❌ Ver usuario específico
- ❌ Actualizar usuario
- ❌ Eliminar usuario
- ✅ Ver perfil propio

---

## 💡 TIPS Y TRUCOS

### 1. Persistir Autorización
En Swagger, después de hacer clic en "Authorize", la página recordará tu token incluso después de refrescar. Es muy útil.

### 2. Ver Respuestas Anteriores
Puedes ver todas las requests y respuestas en la sección "Response".

### 3. Probar Errores
Intenta estos scenarios para ver diferentes errores:

- **Sin Token:** Intenta un endpoint protegido sin autorizar
- **Con Token Inválido:** Intenta autorizar con un token falso
- **Sin Permisos:** Usa token de DESARROLLADOR para crear usuario

### 4. Copiar cURL
Haz clic en la opción "..." y verás un botón para copiar como cURL. Perfecto para scripts.

### 5. Valores de Ejemplo
Todos los campos muestran valores de ejemplo. Síguelos como guía.

---

## 🔍 CAMPOS DE FORMULARIO EXPLICADOS

### Email
- Debe ser una dirección de email válida (ej: usuario@example.com)
- Debe ser único en el sistema
- Se valida automáticamente

### Nombre
- Mínimo 2 caracteres
- Puede contener espacios y caracteres especiales

### Contraseña
- Mínimo 6 caracteres
- Se encripta con bcrypt antes de guardarse
- **Nunca se devuelve en respuestas**

### Rol
- Enum con opciones: `admin`, `gerente`, `desarrollador`
- Por defecto: `desarrollador`
- Solo ADMIN puede asignar roles

### Activo
- Booleano (true/false)
- Por defecto: true
- Usuario inactivo no puede hacer login

---

## 📱 CÓDIGO DE EJEMPLO - cURL

Si prefieres línea de comandos, aquí están los comandos:

### Registrarse
```bash
curl -X POST http://localhost:3000/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "nombre": "Mi Nombre",
    "contraseña": "Password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "contraseña": "Password123"
  }'
```

### Ver Perfil
```bash
curl -X GET http://localhost:3000/auth/perfil \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

### Crear Usuario
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{
    "email": "nuevo@example.com",
    "nombre": "Nuevo Usuario",
    "password": "Password123",
    "rol": "gerente"
  }'
```

---

## 🐛 TROUBLESHOOTING

### "Token inválido"
- ✅ Asegúrate de incluir "Bearer " antes del token
- ✅ Copia exactamente el token sin espacios extra
- ✅ Si pasó más de 24 horas, haz login nuevamente

### "Sin permisos"
- ✅ Verifica que tu usuario tiene el rol requerido
- ✅ Algunos endpoints requieren ADMIN específicamente
- ✅ Vuelve a hacer login después de cambiar el rol

### "Usuario no encontrado"
- ✅ Verifica que el ID es correcto (UUID)
- ✅ Asegúrate de que el usuario realmente existe

### Swagger no carga
- ✅ Verifica que el servidor está corriendo: `npm run start:dev`
- ✅ Intenta acceder a: `http://localhost:3000`
- ✅ Limpia el cache del navegador (Ctrl+Shift+Del)

---

## 📝 RESUMEN RÁPIDO

1. **Ejecutar servidor:** `npm run start:dev`
2. **Abrir Swagger:** `http://localhost:3000/docs`
3. **Registrarse:** `POST /auth/registro`
4. **Login:** `POST /auth/login`
5. **Autorizar:** Clic en "Authorize" y pegar token
6. **Probar endpoints:** "Try it out" en cualquier endpoint

---

## 🎓 PRÓXIMOS PASOS

- Experimenta con todos los endpoints
- Intenta diferentes roles y ve qué puedes hacer
- Prueba el manejo de errores
- Cuando estés listo, migra a hacer requests programáticas con fetch/axios

**¡Disfruta usando la API! 🚀**
