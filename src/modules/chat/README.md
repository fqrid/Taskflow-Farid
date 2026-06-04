# 🚀 Módulo Chat Grupal en Tiempo Real - TaskFlowPro

## 📋 Descripción General

Implementación de un sistema de chat grupal en tiempo real para proyectos usando **NestJS**, **TypeORM**, **Socket.io** y **MySQL**. Proporciona comunicación bidireccional en vivo con validación JWT, control de acceso y persistencia de datos.

---

## 📁 Estructura del Módulo

```
src/modules/chat/
├── entities/
│   └── message.entity.ts          # Entidad TypeORM
├── dtos/
│   └── create-message.dto.ts      # Validación de datos
├── filters/
│   └── ws-exception.filter.ts     # Manejo de excepciones
├── gateways/
│   └── chat.gateway.ts             # WebSocket Gateway
├── types/
│   └── chat.types.ts               # Interfaces TypeScript
├── chat.service.ts                 # Lógica de negocio
├── chat.module.ts                  # Módulo principal
├── INTEGRATION_GUIDE.md            # Guía de integración
└── README.md                       # Este archivo
```

---

## 🔧 Componentes Detallados

### 1. **Message Entity** (`message.entity.ts`)

Entidad TypeORM que representa un mensaje en el chat.

**Estructura:**
```typescript
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => Project, (project) => project.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
```

**Características:**
- UUID como PK generado automáticamente
- Relación Many-to-One con User (sender)
- Relación Many-to-One con Project
- Timestamp automático de creación
- Desnormalización de IDs para queries eficientes
- Cascada ON DELETE para integridad referencial

---

### 2. **Create Message DTO** (`create-message.dto.ts`)

DTO con validaciones usando `class-validator`.

**Campos validados:**
- `content` (string, no vacío, mínimo 1 carácter)
- `projectId` (UUID válido)

**Ejemplo de uso:**
```typescript
const dto = new CreateMessageDto();
dto.content = "Hello team!";
dto.projectId = "550e8400-e29b-41d4-a716-446655440000";

const errors = await validate(dto);
```

---

### 3. **WebSocket Exception Filter** (`ws-exception.filter.ts`)

Filtro centralizado para manejo de excepciones en eventos WebSocket.

**Excepciones capturadas:**
- `WsException` - Excepciones nativas de WebSocket
- `HttpException` - Excepciones HTTP
- `BadRequestException` - Errores de validación
- Errores genéricos

**Estructura de respuesta:**
```json
{
  "success": false,
  "error": {
    "type": "VALIDATION_ERROR",
    "message": "El contenido del mensaje no puede estar vacío",
    "statusCode": 400,
    "details": "..."
  }
}
```

---

### 4. **Chat Gateway** (`chat.gateway.ts`)

Implementa la lógica principal de WebSocket.

#### 4.1 **Eventos de Ciclo de Vida**

**`handleConnection`** - Validación JWT en handshake
```typescript
// El cliente conecta con token:
const socket = io('http://localhost:3001/chat', {
  auth: { token: 'jwt-token-here' }
});

// Server valida el token:
// ✓ Token válido → Almacena userId y userEmail en socket
// ✗ Token inválido → Desconecta inmediatamente
```

**`handleDisconnect`** - Limpieza y notificaciones
- Remueve del mapa de conectados
- Notifica a todas las salas
- Libera memoria

#### 4.2 **Evento: joinProject**

Une al usuario a la sala de un proyecto.

**Flujo:**
1. Recibe `projectId`
2. Valida acceso del usuario (simula consulta a BD)
3. Ejecuta `client.join(projectId)`
4. Carga historial de mensajes
5. Notifica a otros usuarios

**Payload:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Respuesta:**
```json
{
  "success": true,
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "messagesHistory": [...],
  "messageCount": 42
}
```

#### 4.3 **Evento: sendMessage**

Envía y persiste un mensaje en el proyecto.

**Restricción CRÍTICA:** 
❌ **PROHIBIDO** usar `this.server.emit()` (broadcast global)
✅ **OBLIGATORIO** usar `this.server.to(projectId).emit()`

**Flujo:**
1. Valida DTO
2. Verifica acceso a proyecto
3. Guarda en BD (async)
4. Emite **SOLO** a la sala del proyecto

**Payload:**
```json
{
  "content": "Hello team!",
  "projectId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Evento emitido a sala:**
```json
{
  "success": true,
  "message": {
    "id": "msg-uuid",
    "content": "Hello team!",
    "projectId": "550e8400-e29b-41d4-a716-446655440000",
    "sender": {
      "id": "user-uuid",
      "email": "user@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### 4.4 **Evento: loadHistory**

Carga el historial sin necesidad de unirse.

**Payload:**
```json
{
  "projectId": "550e8400-e29b-41d4-a716-446655440000",
  "limit": 50
}
```

---

## 🔐 Seguridad

### Validación JWT en Handshake
```typescript
// Extrae del handshake:
client.handshake.auth.token        // Opción 1
client.handshake.headers.authorization  // Opción 2

// Valida con JwtService
const payload = await this.jwtService.verifyAsync(token, {
  secret: configService.get<string>('JWT_SECRET')
});

// Si falla → client.disconnect(true)
```

### Control de Acceso
Cada evento valida que el usuario pertenezca al proyecto:
```typescript
const hasAccess = await this.chatService.validateUserProjectAccess(
  userId,
  projectId
);
```

### Validación de DTOs
```typescript
const messageDto = plainToInstance(CreateMessageDto, createMessageDto);
const validationErrors = await validate(messageDto);
```

---

## 🗄️ Chat Service (`chat.service.ts`)

**Métodos principales:**

### `createMessage(dto, senderId): Promise<Message>`
Crea y persiste un nuevo mensaje.

### `getProjectMessages(projectId, limit): Promise<Message[]>`
Recupera los últimos N mensajes de un proyecto.

### `validateUserProjectAccess(userId, projectId): Promise<boolean>`
Valida si el usuario puede acceder al proyecto.

### `getMessageCount(projectId): Promise<number>`
Cuenta mensajes totales de un proyecto.

### `cleanOldMessages(projectId, daysOld): Promise<number>`
Limpia mensajes antiguos (utilidad de mantenimiento).

---

## 📦 Integración en App.Module

```typescript
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      entities: [Message], // Agregar entidad
      // ...
    }),
    ChatModule, // Importar módulo
    // ...
  ],
})
export class AppModule {}
```

---

## 🌍 Configuración de CORS

En `chat.gateway.ts`:
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
```

En `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
```

---

## 👥 Ejemplo de Cliente (Frontend)

### Conexión
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3001/chat', {
  auth: {
    token: userToken // JWT del usuario
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Evento de conexión
socket.on('connected', (data) => {
  console.log('✓ Conectado:', data.userId);
});
```

### Unirse a Proyecto
```typescript
socket.emit('joinProject', {
  projectId: 'project-uuid-123'
}, (response) => {
  if (response.success) {
    console.log('Historial:', response.messagesHistory);
    // Renderizar mensajes...
  }
});
```

### Enviar Mensaje
```typescript
socket.emit('sendMessage', {
  content: 'Hello team!',
  projectId: 'project-uuid-123'
});

// Escuchar nuevos mensajes
socket.on('newMessage', (event) => {
  console.log('Nuevo mensaje:', event.message);
  // Agregar a UI...
});
```

### Escuchar Notificaciones
```typescript
// Usuario se unió
socket.on('userJoined', (notification) => {
  console.log(`${notification.userEmail} se unió`);
});

// Usuario se fue
socket.on('userLeft', (notification) => {
  console.log(`${notification.userEmail} se fue`);
});

// Errores
socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## ✅ Prueba en tiempo real con 2 usuarios (Postman)

Esta guía prueba el chat en vivo con **dos usuarios distintos** conectados al mismo proyecto.

1. **Arranca la API y crea usuarios base.**  
   Ejecuta `npm run start:dev` y luego `npm run seed` para tener usuarios ADMIN/GERENTE/DESARROLLADOR.

2. **Obtén 2 tokens JWT (HTTP).**  
   En Postman crea 2 requests HTTP `POST http://localhost:3000/auth/login`.  
   Usuario A (ADMIN):
   ```json
   { "email": "admin@taskflowpro.com", "password": "Admin123!" }
   ```
   Usuario B (GERENTE o DEV):
   ```json
   { "email": "gerente@taskflowpro.com", "password": "Gerente123!" }
   ```
   Copia `accessToken` de cada respuesta.

3. **Crea un proyecto (con el admin).**  
   `POST http://localhost:3000/projects` con **Authorization: Bearer TOKEN_A** y body:
   ```json
   {
     "nombre": "Proyecto Chat Prueba",
     "descripcion": "Proyecto para pruebas WebSocket",
     "fechaInicio": "2026-05-21"
   }
   ```
   Copia el `id` del proyecto (lo usarás como `projectId`).

4. **Abre 2 conexiones Socket.IO en Postman (dos pestañas).**  
   En cada pestaña:
   - URL: `http://localhost:3000/chat`
   - Headers: `Authorization: Bearer <TOKEN_A>` en la pestaña 1, y `Authorization: Bearer <TOKEN_B>` en la pestaña 2
   - Click **Connect**

5. **Agrega listeners en ambas pestañas (Events).**  
   Registra: `connected`, `joinedProject`, `newMessage`, `userJoinedProject`, `userLeftProject`, `error`.

6. **Une a ambos usuarios al mismo proyecto.**  
   En cada pestaña (Message):
   - Event name: `joinProject`
   - Body (JSON):
     ```json
     { "projectId": "TU_PROJECT_ID" }
     ```
   Debes recibir `joinedProject` en cada cliente. En la otra pestaña verás `userJoinedProject`.

7. **Intercambia mensajes en tiempo real.**  
   En pestaña A:
   - Event name: `sendMessage`
   - Body (JSON):
     ```json
     { "content": "Hola desde A", "projectId": "TU_PROJECT_ID" }
     ```
   En pestaña B debe aparecer `newMessage`. Repite desde B para ver el mensaje en A.

> Si el usuario B es DEV y no tiene acceso, usa ADMIN/GERENTE o asigna una tarea al DEV en ese proyecto para que pase la validación.

---

## 🧪 Testing

### Test de Conexión
```bash
npm test -- chat.gateway.spec.ts
```

### Test de Servicio
```bash
npm test -- chat.service.spec.ts
```

### Test E2E
```bash
npm run test:e2e
```

---

## 📊 Estadísticas del Gateway

Método para obtener estadísticas:
```typescript
gateway.getGatewayStats()
// {
//   totalConnectedUsers: 42,
//   totalSockets: 45,
//   activeSessions: 50
// }
```

Usuarios activos en un proyecto:
```typescript
gateway.getActiveUsersInProject('project-uuid')
// 8
```

---

## 📝 Convenciones de Código

- **Tipado fuerte:** Todas las propiedades tienen tipos explícitos
- **Comentarios:** Cada método incluye JSDoc
- **Logs:** Usa Logger de NestJS para debugging
- **Errores:** Excepciones con mensajes claros
- **DTOs:** Validación con class-validator
- **Relaciones:** Lazy-loading para evitar N+1 queries

---

## ⚠️ Consideraciones de Producción

1. **Scaling:** Usar Socket.io Redis Adapter para múltiples instancias
```typescript
const redisAdapter = createAdapter(pubClient, subClient);
io.adapter(redisAdapter);
```

2. **Rate Limiting:** Implementar limitador en los eventos

3. **Compresión:** Habilitar compresión en Socket.io

4. **Logs:** Usar servicio de logging externo (Winston, Sentry)

5. **Monitores:** Alertas para conexiones rechazadas

6. **Backup:** Política de retención de mensajes

---

## 🔄 Flujo Completo de Ejemplo

```
1. Usuario se autentica y obtiene JWT
   ↓
2. Cliente conecta con token → Gateway valida JWT
   ↓
3. Client emite 'joinProject' → Gateway valida acceso
   ↓
4. Gateway ejecuta client.join() → Carga historial
   ↓
5. Client emite 'sendMessage' → Gateway persiste en BD
   ↓
6. Gateway emite 'newMessage' → Todos en sala reciben
   ↓
7. Cliente desconecta → Gateway limpia referencias
```

---

## 🚨 Manejo de Errores

Todos los errores siguen esta estructura:
```json
{
  "success": false,
  "error": {
    "type": "ERROR_TYPE",
    "message": "Descripción del error",
    "statusCode": 400,
    "details": {}
  }
}
```

**Tipos de errores:**
- `AUTHENTICATION_ERROR` - Token inválido/expirado
- `AUTHORIZATION_ERROR` - Sin permisos
- `VALIDATION_ERROR` - Datos inválidos
- `STATE_ERROR` - Estado incorrecto
- `INTERNAL_SERVER_ERROR` - Error del servidor

---

## 📚 Dependencias Requeridas

```json
{
  "@nestjs/websockets": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "@nestjs/jwt": "^11.0.0",
  "socket.io": "^4.6.0",
  "typeorm": "^0.3.0",
  "class-validator": "^0.14.0",
  "class-transformer": "^0.5.0",
  "mysql2": "^3.0.0"
}
```

---

## 📞 Soporte

Para preguntas o problemas, consulta la `INTEGRATION_GUIDE.md` o contacta al equipo de arquitectura.

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2024  
**Estado:** ✅ Producción Ready
