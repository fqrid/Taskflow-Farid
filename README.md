# TaskFlow Pro

API REST para gestion interna de proyectos y tareas con autenticacion JWT y control de acceso basado en roles.

## Integrantes

- Toro Caicedo Angel Ivan
- Jansasoy Munoz Jeferson Andres
- Diaz Imbajoa Tatiana
- Apraez Ceballos Michael Leonardo
- Carrillo Vidales Maria Isabel
- Montana Hurtado Harrisson Estiven
- Castellanos Semanate Farid Esteban

## Tecnologias

- NestJS
- TypeORM
- MySQL
- Passport JWT y `@nestjs/jwt`
- bcrypt
- class-validator y DTOs
- Swagger
- React + Vite
- Axios
- Lucide React

## Modelo de dominio

Entidades principales:

- `User`: usuarios del sistema. Tiene email unico, nombre, contrasena encriptada, estado activo y un rol.
- `Role`: roles permitidos en el sistema: `ADMIN`, `GERENTE`, `DESARROLLADOR`.
- `Project`: proyectos con nombre, descripcion, fecha de inicio, fecha de fin y usuario creador.
- `Task`: tareas asociadas a un proyecto, con usuario asignado y estado.

Relaciones:

- Un `Role` tiene muchos `User`.
- Un `User` puede crear muchos `Project`.
- Un `Project` pertenece a un usuario creador. Si el usuario se elimina, el proyecto queda con creador nulo.
- Un `Project` tiene muchas `Task`. Si el proyecto se elimina, sus tareas se eliminan en cascada.
- Una `Task` puede tener un usuario asignado. Si el usuario se elimina, la tarea queda sin asignado.

El MER grafico esta en [Documentacion/MER-tast-flow-pro.jpeg](./Documentacion/MER-tast-flow-pro.jpeg).

## Reglas de negocio

- Ningun endpoint protegido se puede consumir sin token JWT.
- `ADMIN` puede administrar usuarios y eliminar proyectos/tareas.
- `GERENTE` puede listar usuarios, crear proyectos, crear tareas y asignarlas a desarrolladores.
- `DESARROLLADOR` puede consultar recursos autenticados y actualizar el estado de sus tareas asignadas.
- Solo el creador de un proyecto o un `ADMIN` puede actualizarlo.
- Solo `ADMIN` puede eliminar proyectos.
- Solo el usuario asignado puede cambiar el estado de una tarea.
- Solo se pueden asignar tareas a usuarios con rol `DESARROLLADOR`.

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Variables usadas:

| Variable | Descripcion |
| --- | --- |
| `NODE_ENV` | Entorno de ejecucion. En `development` TypeORM sincroniza entidades. |
| `PORT` | Puerto HTTP de la API. |
| `DB_HOST` | Host de MySQL. |
| `DB_PORT` | Puerto de MySQL. |
| `DB_USER` / `DB_USERNAME` | Usuario de MySQL. |
| `DB_PASSWORD` | Contrasena de MySQL. |
| `DB_NAME` / `DB_DATABASE` | Base de datos usada por TypeORM. |
| `JWT_SECRET` | Secreto para firmar tokens JWT. |
| `FRONTEND_ORIGIN` | Origenes permitidos para CORS del frontend, separados por coma. |

## Instalacion y ejecucion

```bash
pnpm install
pnpm --prefix frontend install
pnpm run start:dev
```

La API queda disponible en:

```text
http://localhost:3000
```

Swagger queda disponible en:

```text
http://localhost:3000/docs
```

El frontend en desarrollo queda disponible en:

```text
http://127.0.0.1:5173
```

Para levantar solo el frontend:

```bash
pnpm run frontend:dev
```

Para compilarlo:

```bash
pnpm run frontend:build
```

Vite usa un proxy local desde `/api` hacia `http://localhost:3000`, por lo que el frontend consume la API Nest sin exponer CORS durante desarrollo. Si quieres usar otra URL, crea `frontend/.env` a partir de `frontend/.env.example` y cambia `VITE_API_BASE_URL`.

Al iniciar la aplicacion se crean automaticamente los roles base `ADMIN`, `GERENTE` y `DESARROLLADOR` si no existen.

## Frontend React + Vite

La app se encuentra en `frontend/` y sigue los mockups de TaskFlow Pro con una interfaz administrativa profesional, sidebar fijo, topbar, tarjetas metricas, formularios, modales y vistas operativas.

Estructura principal:

| Ruta | Modulo |
| --- | --- |
| `/login` | Pantalla de inicio de sesion con el logo oficial y visual de producto. |
| `/dashboard` | Resumen administrativo, metricas y proyectos activos. |
| `/projects` | Workspace del proyecto con Overview, Tareas, Chat y Actividad. |
| `/tasks` | Tablero Kanban de tareas con movimiento por drag and drop. |
| `/calendar` | Calendario de vencimientos y proximas entregas. |
| `/reports` | Indicadores de avance, distribucion y rendimiento. |
| `/settings` | Configuracion de notificaciones, horarios y permisos por rol. |
| `/email-preview` | Vista de correo automatico enviado al asignar una tarea. |

Assets:

- `frontend/public/brand/logo-color.png`
- `frontend/public/brand/logo-blanco-negro.png`

Cliente HTTP:

- `frontend/src/services/api.js` centraliza Axios.
- Agrega automaticamente `Authorization: Bearer <token>` si hay sesion real.
- Desempaqueta respuestas del interceptor global de Nest con forma `{ success, data, timestamp }`.
- Si la API no esta disponible, la app abre una sesion local de vista previa para validar el diseno sin bloquear la navegacion.

Acciones conectadas:

- Login: `POST /auth/login`.
- Perfil/listados: `GET /users`, `GET /projects`, `GET /tasks/proyecto/:idProyecto`.
- Crear proyecto: `POST /projects`.
- Crear tarea: `POST /tasks`.
- Asignar tarea: `PATCH /tasks/:id/asignar`.
- Mover estado de tarea: `PATCH /tasks/:id/estado`.

## Seed (roles + usuarios base)

Ejecuta:

```bash
npm run seed
```

Crea/actualiza estos usuarios (idempotente por email):

- `admin@taskflowpro.com` (ADMIN)
- `gerente@taskflowpro.com` (GERENTE)
- `dev@taskflowpro.com` (DESARROLLADOR)

Variables opcionales:

- `SEED_RESET_PASSWORDS=true` (resetea passwords)
- `SEED_SHOW_PASSWORDS=true` (imprime passwords)
- `SEED_*_EMAIL/NAME/PASSWORD` para personalizar
- En `production` está bloqueado salvo `SEED_ALLOW_PROD=true`

## Flujo de prueba en Swagger

1. Registrar usuario: `POST /auth/registro`.
2. Iniciar sesion: `POST /auth/login`.
3. Copiar `accessToken`.
4. Presionar `Authorize` en Swagger y pegar el token.
5. Probar endpoints segun el rol del usuario.

Ejemplo de registro:

```json
{
  "email": "usuario@example.com",
  "nombre": "Usuario Prueba",
  "password": "Password123"
}
```

Ejemplo de login:

```json
{
  "email": "usuario@example.com",
  "password": "Password123"
}
```

## Prueba Kanban en tiempo real (Postman)

Esta prueba valida el **WebSocket Kanban** con dos usuarios conectados al mismo proyecto y un movimiento de tarea en vivo.

1. **Levanta la API y crea usuarios base.**  
   Ejecuta `npm run start:dev` y luego `npm run seed`.

2. **Obtén 2 tokens JWT.**  
   En Postman crea 2 requests **POST**:
   - `http://localhost:3000/auth/login` (GERENTE):
     ```json
     { "email": "gerente@taskflowpro.com", "password": "Gerente123!" }
     ```
   - `http://localhost:3000/auth/login` (DEV):
     ```json
     { "email": "dev@taskflowpro.com", "password": "Dev123!" }
     ```
   Copia `accessToken` y el `usuario.id` del DEV (lo usarás como `userId`).

3. **Crea un proyecto (GERENTE).**  
   **POST** `http://localhost:3000/projects` con **Authorization: Bearer TOKEN_GERENTE** y body:
   ```json
   {
     "nombre": "Proyecto Kanban Prueba",
     "descripcion": "Proyecto para probar Kanban WS",
     "fechaInicio": "2026-05-21"
   }
   ```
   Copia el `id` del proyecto como `PROJECT_ID`.

4. **Crea una tarea (GERENTE).**  
   **POST** `http://localhost:3000/tasks` con **Authorization: Bearer TOKEN_GERENTE** y body:
   ```json
   {
     "titulo": "Mover tarea en Kanban",
     "descripcion": "Prueba WS Kanban",
     "idProyecto": "PROJECT_ID",
     "fechaFin": "2026-12-31T23:59:59Z"
   }
   ```
   Copia el `id` de la tarea como `TASK_ID`.

5. **Asigna la tarea al DEV (GERENTE).**  
   **PATCH** `http://localhost:3000/tasks/TASK_ID/asignar`  
   Body:
   ```json
   { "idUsuarioAsignado": "DEV_USER_ID" }
   ```

6. **Abre 2 conexiones Socket.IO en Postman.**  
   En dos pestañas distintas:
   - URL: `http://localhost:3000/kanban`
   - Headers: `Authorization: Bearer TOKEN_DEV` (pestaña 1) y `Authorization: Bearer TOKEN_GERENTE` (pestaña 2)
   - Click **Connect**

7. **Agrega listeners en ambas pestañas (Events).**  
   Registra: `joined`, `task_updated`, `task_move_error`, `error`.

8. **Une a ambos al proyecto.**  
   En cada pestaña (Message):
   - Event name: `join_project`
   - Body:
     ```json
     { "projectId": "PROJECT_ID" }
     ```
   Debes recibir `joined` con `room: project:PROJECT_ID`.

9. **Mueve la tarea desde el DEV.**  
   En la pestaña del DEV:
   - Event name: `task_moved`
   - Body:
     ```json
     {
       "taskId": "TASK_ID",
       "newStatus": "en_progreso",
       "previousStatus": "pendiente",
       "userId": "DEV_USER_ID",
       "projectId": "PROJECT_ID"
     }
     ```
   En ambas pestañas debe llegar `task_updated`.

**Notas:**  
- `newStatus` y `previousStatus` solo aceptan `pendiente`, `en_progreso`, `completada`.  
- Si el `userId` no coincide con el token, o el DEV no está asignado, llega `task_move_error`.

## Endpoints principales

### Auth

| Metodo | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/auth/registro` | Publico |
| `POST` | `/auth/login` | Publico |
| `GET` | `/auth/perfil` | Autenticado |
| `GET` | `/auth/validar-token` | Autenticado |

### Usuarios

| Metodo | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/users` | `ADMIN` |
| `GET` | `/users` | `ADMIN`, `GERENTE` |
| `GET` | `/users/perfil` | Autenticado |
| `GET` | `/users/:id` | `ADMIN`, `GERENTE` |
| `PATCH` | `/users/:id/rol` | `ADMIN` |
| `PATCH` | `/users/:id` | `ADMIN` |
| `DELETE` | `/users/:id` | `ADMIN` |

### Proyectos

| Metodo | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/projects` | `ADMIN`, `GERENTE` |
| `GET` | `/projects` | Autenticado |
| `GET` | `/projects/:id` | Autenticado |
| `PATCH` | `/projects/:id` | Creador o `ADMIN` |
| `DELETE` | `/projects/:id` | `ADMIN` |

### Tareas

| Metodo | Ruta | Acceso |
| --- | --- | --- |
| `POST` | `/tasks` | `GERENTE` |
| `PATCH` | `/tasks/:id/asignar` | `GERENTE` |
| `GET` | `/tasks/proyecto/:idProyecto` | Autenticado |
| `PATCH` | `/tasks/:id/estado` | Usuario asignado |
| `DELETE` | `/tasks/:id` | `ADMIN` |

## Verificacion local

```bash
npm run build
npm run frontend:build
npm run test
```

## Cumplimiento de requisitos

| Requisito | Estado |
| --- | --- |
| NestJS API REST por modulos | Cumplido |
| JWT con `@nestjs/jwt` y `@nestjs/passport` | Cumplido |
| bcrypt para contrasenas | Cumplido |
| MySQL con TypeORM | Cumplido |
| DTOs y validaciones con `class-validator` | Cumplido |
| Guards y decorador `@Roles()` | Cumplido |
| Roles `ADMIN`, `GERENTE`, `DESARROLLADOR` | Cumplido |
| Swagger en `/docs` | Cumplido |
| `.env.example` | Cumplido |
| MER documentado | Cumplido en carpeta `Documentacion` |
| Frontend React + Vite con Axios | Cumplido en carpeta `frontend` |
| Mockups de TaskFlow Pro implementados | Cumplido |
