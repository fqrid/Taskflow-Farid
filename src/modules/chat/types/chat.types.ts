/**
 * Tipos y Interfaces para el módulo de Chat
 *
 * Define las estructuras de datos y contratos para la comunicación
 * por WebSocket del chat grupal en tiempo real
 */

/**
 * Respuesta genérica de eventos WebSocket
 */
export interface WebSocketResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: WebSocketError;
  timestamp?: Date;
}

/**
 * Estructura de error en WebSocket
 */
export interface WebSocketError {
  type: string;
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Objeto de mensaje emitido en tiempo real
 */
export interface ChatMessage {
  id: string;
  content: string;
  projectId: string;
  sender: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: Date;
}

/**
 * Payload del evento 'joinProject'
 */
export interface JoinProjectPayload {
  projectId: string;
}

/**
 * Respuesta al evento 'joinProject'
 */
export interface JoinProjectResponse extends WebSocketResponse {
  data?: {
    projectId: string;
    messagesHistory: ChatMessage[];
    messageCount: number;
  };
}

/**
 * Evento de notificación cuando un usuario se une
 */
export interface UserJoinedNotification {
  userId: string;
  userEmail: string;
  projectId: string;
  timestamp: Date;
}

/**
 * Evento de notificación cuando un usuario se va
 */
export interface UserLeftNotification {
  userId: string;
  userEmail: string;
  projectId: string;
  timestamp: Date;
}

/**
 * Evento 'newMessage' emitido a la sala
 */
export interface NewMessageEvent extends WebSocketResponse {
  data?: ChatMessage;
}

/**
 * Estadísticas del gateway
 */
export interface GatewayStats {
  totalConnectedUsers: number;
  totalSockets: number;
  activeSessions: number;
}

/**
 * Payload de carga de historial
 */
export interface LoadHistoryPayload {
  projectId: string;
  limit?: number;
}

/**
 * Respuesta de historial cargado
 */
export interface HistoryLoadedResponse extends WebSocketResponse {
  data?: {
    projectId: string;
    messages: ChatMessage[];
    messageCount: number;
  };
}
