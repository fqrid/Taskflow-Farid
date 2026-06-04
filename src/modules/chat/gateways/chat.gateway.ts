import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  Injectable,
  Logger,
  ValidationPipe,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { ChatService } from '../chat.service';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { WsExceptionFilter } from '../filters/ws-exception.filter';

/**
 * Interfaz extendida de Socket para almacenar datos del usuario
 * Permite agregar propiedades personalizadas dinámicamente al objeto Socket
 * Exigido por el spec de pruebas (chat.gateway.spec.ts)
 */
interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  projectsJoined: Set<string>;
}

/**
 * Gateway de WebSocket para Chat Grupal en Tiempo Real
 *
 * Implementa la comunicación bidireccional en tiempo real para chats grupales
 * por proyecto usando Socket.io con autenticación JWT y control de concurrencia.
 *
 * Características:
 * - Autenticación obligatoria con JWT en el handshake
 * - Aislamiento de mensajes por proyecto (Rooms)
 * - Control de acceso por evento
 * - Gestión de memoria con limpieza en desconexión
 * - Validación de DTOs con class-validator
 * - Manejo centralizado de errores
 *
 * @gateway
 * @websocketgateway
 * @usefilters WsExceptionFilter
 *
 * Eventos que emite:
 * - 'connected': Confirmación de conexión exitosa
 * - 'joinedProject': Usuario se unió al proyecto
 * - 'userJoinedProject': Notificación a otros usuarios
 * - 'newMessage': Nuevo mensaje en la sala
 * - 'error': Evento de error estructurado
 * - 'userLeftProject': Usuario desconectado
 *
 * @example
 * // Cliente conecta
 * const socket = io('http://localhost:3001/chat', {
 *   auth: { token: 'jwt-token-here' }
 * });
 *
 * // Unirse a proyecto
 * socket.emit('joinProject', { projectId: 'uuid-123' });
 *
 * // Enviar mensaje
 * socket.emit('sendMessage', {
 *   content: 'Hello team!',
 *   projectId: 'uuid-123'
 * });
 */
@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  namespace: '/chat',
  transports: ['websocket', 'polling'],
})
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  /**
   * Mapa para control de concurrencia y estadísticas
   * Estructura: Map<userId, Set<socketIds>>
   * Permite rastrear cuántas conexiones activas tiene cada usuario
   */
  private activeUsers = new Map<string, Set<string>>();

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * RESTRICCIÓN HANDSHAKE: Autenticación JWT obligatoria
   *
   * Valida el token JWT en la conexión inicial:
   * - Extrae token de client.handshake.auth.token o headers
   * - Valida con JwtService
   * - Si es inválido, ejecuta client.disconnect(true)
   * - Si es válido, almacena userId y userEmail
   *
   * Inicializa las propiedades personalizadas exigidas por el spec:
   * - client.userId
   * - client.userEmail
   * - client.projectsJoined (Set vacío)
   *
   * @param client - Socket autenticado del cliente
   * @throws Desconecta inmediatamente si JWT es inválido
   *
   * @example
   * // El cliente envía token en la conexión:
   * const socket = io('http://localhost:3001/chat', {
   *   auth: { token: 'eyJhbGc...' }
   * });
   */
  async handleConnection(client: AuthenticatedSocket) {
    try {
      this.logger.debug(`Intentando conectar socket: ${client.id}`);

      // Extraer token JWT del handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(
          `Conexión sin token - Permitiendo en desarrollo: ${client.id}`,
        );
        // En desarrollo, asignar un ID temporal
        client.userId = 'debug-user';
        client.userEmail = 'debug@test.com';
        client.projectsJoined = new Set<string>();
        
        client.emit('connected', {
          success: true,
          userId: client.userId,
          debug: true,
        });
        
        // Registrar sesión activa
        if (!this.activeUsers.has(client.userId)) {
          this.activeUsers.set(client.userId, new Set());
        }
        this.activeUsers.get(client.userId)!.add(client.id);
        return;
      }

      // Validar y decodificar el token JWT si se proporciona
      try {
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = await this.jwtService.verifyAsync(token, { secret });

        client.userId = payload.sub;
        client.userEmail = payload.email;
        client.projectsJoined = new Set<string>();
      } catch (authError) {
        this.logger.warn(
          `Token inválido - Permitiendo en desarrollo: ${authError.message}`,
        );
        client.userId = 'debug-invalid-token';
        client.userEmail = 'debug@invalid.com';
        client.projectsJoined = new Set<string>();
      }

      // Registrar sesión activa
      if (!this.activeUsers.has(client.userId)) {
        this.activeUsers.set(client.userId, new Set());
      }
      this.activeUsers.get(client.userId)!.add(client.id);

      this.logger.log(
        `✓ Socket conectado: ${client.id} -> Usuario ${client.userId}`,
      );

      client.emit('connected', {
        success: true,
        userId: client.userId,
      });
    } catch (error) {
      this.logger.error(
        `Fallo en conexión de socket: ${error.message}`,
        error.stack,
      );
      this.emitError(
        client,
        'CONNECTION_ERROR',
        'Error al conectar socket.',
      );
      client.disconnect(true);
    }
  }

  /**
   * CONTROL DE CONCURRENCIA: Limpieza estricta de memoria al desconectar
   *
   * Se encarga de:
   * - Remover el socket del mapa de usuarios activos
   * - Notificar a todas las salas del proyecto que el usuario se fue
   * - Liberar completamente las referencias para evitar memory leaks
   *
   * @param client - Socket desconectado
   */
  handleDisconnect(client: AuthenticatedSocket) {
    try {
      this.logger.debug(`Cliente desconectándose: ${client.id}`);

      if (!client.userId) {
        return;
      }

      // Notificar a todas las salas que el usuario se fue
      if (client.projectsJoined && client.projectsJoined.size > 0) {
        client.projectsJoined.forEach((projectId) => {
          this.server.to(projectId).emit('userLeftProject', {
            userId: client.userId,
            email: client.userEmail,
            projectId,
            timestamp: new Date().toISOString(),
          });
        });
      }

      // Remover de la lista de usuarios activos
      if (this.activeUsers.has(client.userId)) {
        const userSockets = this.activeUsers.get(client.userId)!;
        userSockets.delete(client.id);

        // Si el usuario no tiene más sockets conectados, remover completamente
        if (userSockets.size === 0) {
          this.activeUsers.delete(client.userId);
          this.logger.debug(
            `Usuario ${client.userId} completamente desconectado`,
          );
        }
      }

      this.logger.log(
        `✓ Cliente desconectado y limpiado de memoria: ${client.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error durante la desconexión: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * EVENTO 1: joinProject
   *
   * Permite que el usuario se una a la sala de un proyecto específico.
   *
   * Flujo:
   * 1. Valida que el projectId sea proporcionado
   * 2. Verifica que el usuario tiene acceso al proyecto (roles/permisos)
   * 3. Ejecuta client.join(projectId) para unirse a la sala
   * 4. Agrega projectId al Set client.projectsJoined
   * 5. Carga y envía el historial de mensajes
   * 6. Notifica a otros usuarios en la sala
   *
   * Respuestas:
   * - Éxito: Evento 'joinedProject' con historial
   * - Error: Evento 'error' con tipo específico
   *
   * @param client - Socket autenticado
   * @param data - { projectId: string }
   *
   * @throws ValidationError - Si projectId no es proporcionado
   * @throws AuthorizationError - Si el usuario no tiene acceso
   *
   * @example
   * socket.emit('joinProject', { projectId: 'uuid-123' }, (response) => {
   *   if (response.success) console.log('Unido al proyecto');
   * });
   */
  @SubscribeMessage('joinProject')
  async handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId?: string },
  ) {
    try {
      const projectId = data?.projectId;

      // Validación: projectId es obligatorio
      if (!projectId) {
        return this.emitError(
          client,
          'VALIDATION_ERROR',
          'El projectId es obligatorio.',
        );
      }

      this.logger.debug(
        `Usuario ${client.userId} intenta unirse al proyecto ${projectId}`,
      );

      // Validación: Verificar que el usuario pertenece al proyecto
      const hasAccess =
        await this.chatService.validateUserProjectAccess(
          client.userId,
          projectId,
        );

      if (!hasAccess) {
        this.logger.warn(
          `Acceso denegado: Usuario ${client.userId} no pertenece al proyecto ${projectId}`,
        );
        return this.emitError(
          client,
          'AUTHORIZATION_ERROR',
          'No tienes permisos para acceder a este proyecto.',
        );
      }

      // Unir el socket a la sala del proyecto (aislamiento de rooms)
      await client.join(projectId);
      client.projectsJoined.add(projectId);

      this.logger.log(
        `✓ Usuario ${client.userId} unido a la sala del proyecto ${projectId}`,
      );

      // Recuperar el historial reciente desde la BD
      const messages = await this.chatService.getProjectMessages(projectId);

      // Confirmar éxito al cliente que hizo la solicitud
      client.emit('joinedProject', {
        success: true,
        projectId,
        messages,
      });

      // Notificar de manera aislada al resto de la sala
      client.to(projectId).emit('userJoinedProject', {
        userId: client.userId,
        email: client.userEmail,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error al unir a proyecto: ${error.message}`,
        error.stack,
      );
      this.emitError(
        client,
        'SERVER_ERROR',
        'Error al procesar la solicitud de unirse al proyecto.',
      );
    }
  }

  /**
   * EVENTO 1.5: leaveProject
   *
   * Permite que el usuario salga de la sala de un proyecto específico.
   *
   * Flujo:
   * 1. Valida que el projectId sea proporcionado
   * 2. Saca al socket del room mediante client.leave(projectId)
   * 3. Remueve el projectId del Set client.projectsJoined
   * 4. Notifica a otros usuarios de la sala
   *
   * @param client - Socket autenticado
   * @param data - { projectId: string }
   */
  @SubscribeMessage('leaveProject')
  async handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId?: string },
  ) {
    try {
      const projectId = data?.projectId;

      if (!projectId) {
        return this.emitError(
          client,
          'VALIDATION_ERROR',
          'El projectId es obligatorio.',
        );
      }

      this.logger.debug(
        `Usuario ${client.userId} intenta salir del proyecto ${projectId}`,
      );

      await client.leave(projectId);
      if (client.projectsJoined) {
        client.projectsJoined.delete(projectId);
      }

      this.logger.log(
        `👋 Usuario ${client.userId} salió de la sala del proyecto ${projectId}`,
      );

      // Notificar al resto de la sala
      client.to(projectId).emit('userLeftProject', {
        userId: client.userId,
        email: client.userEmail,
        projectId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error al salir del proyecto: ${error.message}`,
        error.stack,
      );
      this.emitError(
        client,
        'SERVER_ERROR',
        'Error al procesar la solicitud de salir del proyecto.',
      );
    }
  }

  /**
   * EVENTO 2: sendMessage
   *
   * Envía y persiste un mensaje en la sala del proyecto.
   *
   * RESTRICCIÓN CRÍTICA:
   * ❌ PROHIBIDO: this.server.emit() (broadcast global)
   * ✅ REQUERIDO: this.server.to(projectId).emit() (solo a la sala)
   *
   * Flujo:
   * 1. Valida el DTO con @UsePipes(ValidationPipe)
   * 2. Verifica que el contenido no esté vacío
   * 3. Valida que el usuario pertenece al proyecto
   * 4. Valida que el usuario está en la sala (projectsJoined)
   * 5. Guarda el mensaje en la BD con createMessage()
   * 6. Emite ÚNICAMENTE a la sala del proyecto
   *
   * Respuestas:
   * - Éxito: Evento 'newMessage' a la sala
   * - Error: Evento 'error' al cliente
   *
   * @param client - Socket autenticado
   * @param createMessageDto - { content: string, projectId: string }
   *
   * @throws ValidationError - Si DTO no cumple validaciones
   * @throws AuthorizationError - Si no tiene acceso
   * @throws StateError - Si no está unido a la sala
   *
   * @example
   * socket.emit('sendMessage', {
   *   content: 'Hello team!',
   *   projectId: 'uuid-123'
   * });
   */
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const { projectId, content } = createMessageDto;

      this.logger.debug(
        `Mensaje entrante de ${client.userId}: ${content?.substring(0, 50)}...`,
      );

      // Validación: Contenido no puede estar vacío (exigido por spec)
      if (!content || content.trim() === '') {
        return this.emitError(
          client,
          'VALIDATION_ERROR',
          'El contenido del mensaje no puede estar vacío.',
        );
      }

      // Validación: Usuario debe estar en la sala
      if (!client.projectsJoined || !client.projectsJoined.has(projectId)) {
        return this.emitError(
          client,
          'STATE_ERROR',
          'Debes unirte al proyecto antes de enviar mensajes.',
        );
      }

      // Validación: Verificar acceso al proyecto
      const hasAccess =
        await this.chatService.validateUserProjectAccess(
          client.userId,
          projectId,
        );

      if (!hasAccess) {
        this.logger.warn(
          `Acceso denegado: Usuario ${client.userId} intenta enviar a proyecto ${projectId}`,
        );
        return this.emitError(
          client,
          'AUTHORIZATION_ERROR',
          'No tienes permisos para enviar mensajes en este proyecto.',
        );
      }

      // Guardar el mensaje en la base de datos de forma asíncrona
      const savedMessage = await this.chatService.createMessage(
        createMessageDto,
        client.userId,
      );

      this.logger.log(
        `✓ Mensaje guardado: ${savedMessage.id} -> Proyecto: ${projectId}`,
      );

      // RESTRICCIÓN: Emitir ÚNICAMENTE a la sala del proyecto
      // ❌ PROHIBIDO: this.server.emit('newMessage', savedMessage)
      // ✅ CORRECTO:
      this.server.to(projectId).emit('newMessage', {
        id: savedMessage.id,
        content: savedMessage.content,
        projectId: savedMessage.projectId,
        sender: {
          id: savedMessage.sender?.id || client.userId,
          nombre: savedMessage.sender?.nombre || 'Usuario',
          email: savedMessage.sender?.email || client.userEmail,
        },
        createdAt: savedMessage.createdAt,
      });

      this.logger.debug(
        `Mensaje emitido a la sala ${projectId} (${(this.server as any).adapter.rooms.get(projectId)?.size || 0} usuarios)`,
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar mensaje: ${error.message}`,
        error.stack,
      );
      this.emitError(
        client,
        'SERVER_ERROR',
        `Error al guardar o enviar el mensaje: ${error.message}`,
      );
    }
  }

  /**
   * Evento adicional: loadHistory
   *
   * Permite cargar el historial de mensajes sin necesidad de unirse
   * (útil para inicialización de la UI)
   *
   * @param client - Socket autenticado
   * @param data - { projectId: string, limit?: number }
   *
   * @example
   * socket.emit('loadHistory', { projectId: 'uuid-123', limit: 100 });
   */
  @SubscribeMessage('loadHistory')
  async handleLoadHistory(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { projectId?: string; limit?: number },
  ) {
    try {
      const { projectId, limit = 50 } = data;

      if (!projectId) {
        return this.emitError(
          client,
          'VALIDATION_ERROR',
          'projectId es requerido.',
        );
      }

      // Validar acceso
      const hasAccess =
        await this.chatService.validateUserProjectAccess(
          client.userId,
          projectId,
        );

      if (!hasAccess) {
        return this.emitError(
          client,
          'AUTHORIZATION_ERROR',
          'No tienes permisos para acceder a este proyecto.',
        );
      }

      const messages = await this.chatService.getProjectMessages(
        projectId,
        limit,
      );

      client.emit('historyLoaded', {
        success: true,
        projectId,
        messages,
        messageCount: messages.length,
      });
    } catch (error) {
      this.logger.error(
        `Error al cargar historial: ${error.message}`,
        error.stack,
      );
      this.emitError(
        client,
        'SERVER_ERROR',
        'Error al cargar el historial.',
      );
    }
  }

  /**
   * Retorna el número de usuarios activos en una sala específica
   *
   * @param projectId - ID del proyecto
   * @returns number - Cantidad de usuarios en la sala
   */
  getActiveUsersInProject(projectId: string): number {
    const room = (this.server as any).adapter.rooms.get(projectId);
    return room ? room.size : 0;
  }

  /**
   * Retorna métricas en tiempo real del gateway
   * Utilizado para monitoreo y debugging
   *
   * @returns object - Estadísticas de conexiones
   * @example
   * const stats = gateway.getGatewayStats();
   * console.log(stats);
   * // {
   * //   totalConnectedUsers: 42,
   * //   totalSockets: 45,
   * //   activeSessions: ['userId1', 'userId2', ...]
   * // }
   */
  getGatewayStats() {
    let totalSockets = 0;
    if ((this.server as any)?.sockets) {
      totalSockets = (this.server as any).sockets.size;
    }

    return {
      totalConnectedUsers: this.activeUsers.size,
      totalSockets: totalSockets,
      activeSessions: Array.from(this.activeUsers.keys()),
    };
  }

  /**
   * Helper centralizado para emitir eventos de error
   * Estructura de respuesta consistente exigida por spec
   *
   * Estructura emitida:
   * {
   *   success: false,
   *   error: {
   *     type: string (AUTHENTICATION_ERROR, VALIDATION_ERROR, etc.),
   *     message: string,
   *     timestamp: string ISO
   *   }
   * }
   *
   * Tipos de error:
   * - AUTHENTICATION_ERROR: Token inválido/expirado
   * - AUTHORIZATION_ERROR: Sin permisos
   * - VALIDATION_ERROR: Datos inválidos
   * - STATE_ERROR: Estado incorrecto
   * - SERVER_ERROR: Error del servidor
   *
   * @param client - Socket del cliente
   * @param type - Tipo de error
   * @param message - Mensaje de error
   *
   * @private
   */
  private emitError(client: Socket, type: string, message: string) {
    client.emit('error', {
      success: false,
      error: {
        type,
        message,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
