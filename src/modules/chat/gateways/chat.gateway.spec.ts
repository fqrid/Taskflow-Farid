import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ChatGateway } from './chat.gateway';
import { ChatService } from '../chat.service';
import { Message } from '../entities/message.entity';

/**
 * Ejemplos de Tests para Chat Gateway
 *
 * Proporciona casos de prueba para validar:
 * - Autenticación JWT en el handshake
 * - Eventos joinProject y sendMessage
 * - Validación de DTOs
 * - Manejo de errores
 * - Control de memoria en conexión/desconexión
 *
 * @example
 * npm test -- chat.gateway.spec.ts
 */
describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockMessageRepository = {
    create: jest.fn<any>(),
    save: jest.fn<any>(),
    find: jest.fn<any>(),
    findOne: jest.fn<any>(),
    count: jest.fn<any>(),
    delete: jest.fn<any>(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn<any>(),
    sign: jest.fn<any>(),
  };

  const mockConfigService = {
    get: jest.fn<any>((key: string) => {
      const config: Record<string, any> = {
        JWT_SECRET: 'test-secret',
        'JWT_EXPIRATION': '24h',
        CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        ChatService,
        {
          provide: getRepositoryToken(Message),
          useValue: mockMessageRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('debe aceptar conexión con token JWT válido', async () => {
      const validToken = 'valid-jwt-token';
      const mockPayload = {
        sub: 'user-uuid-123',
        email: 'user@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const mockClient = {
        id: 'socket-123',
        handshake: {
          auth: { token: validToken },
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
        userId: null,
        userEmail: null,
        projectsJoined: null,
      };

      await gateway.handleConnection(mockClient as any);

      expect(mockClient.userId).toBe('user-uuid-123');
      expect(mockClient.userEmail).toBe('user@example.com');
      expect(mockClient.emit).toHaveBeenCalledWith(
        'connected',
        expect.objectContaining({
          success: true,
          userId: 'user-uuid-123',
        }),
      );
    });

    it('debe rechazar conexión sin token JWT', async () => {
      const mockClient = {
        id: 'socket-123',
        handshake: {
          auth: {},
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
        userId: null,
      };

      await gateway.handleConnection(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: 'AUTHENTICATION_ERROR',
          }),
        }),
      );
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('debe rechazar conexión con token JWT expirado', async () => {
      const expiredToken = 'expired-jwt-token';

      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('jwt expired'),
      );

      const mockClient = {
        id: 'socket-123',
        handshake: {
          auth: { token: expiredToken },
          headers: {},
        },
        emit: jest.fn(),
        disconnect: jest.fn(),
      };

      await gateway.handleConnection(mockClient as any);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            message: expect.stringContaining('expirado'),
          }),
        }),
      );
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleJoinProject', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
        userId: 'user-uuid-123',
        userEmail: 'user@example.com',
        projectsJoined: new Set(),
        emit: jest.fn(),
        join: jest.fn(),
        to: jest.fn(() => ({ emit: jest.fn() })),
      };
    });

    it('debe unir al usuario a un proyecto válido', async () => {
      const projectId = 'project-uuid-456';

      jest
        .spyOn(chatService, 'validateUserProjectAccess')
        .mockResolvedValue(true);
      jest
        .spyOn(chatService, 'getProjectMessages')
        .mockResolvedValue([]);

      await gateway.handleJoinProject(mockClient, { projectId });

      expect(mockClient.join).toHaveBeenCalledWith(projectId);
      expect(mockClient.projectsJoined.has(projectId)).toBe(true);
      expect(mockClient.emit).toHaveBeenCalledWith(
        'joinedProject',
        expect.objectContaining({
          success: true,
          projectId,
        }),
      );
    });

    it('debe rechazar acceso a proyecto sin permisos', async () => {
      const projectId = 'project-uuid-456';

      jest
        .spyOn(chatService, 'validateUserProjectAccess')
        .mockResolvedValue(false);

      await gateway.handleJoinProject(mockClient, { projectId });

      expect(mockClient.join).not.toHaveBeenCalled();
      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: 'AUTHORIZATION_ERROR',
          }),
        }),
      );
    });

    it('debe validar que projectId sea proporcionado', async () => {
      await gateway.handleJoinProject(mockClient, {});

      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: 'VALIDATION_ERROR',
          }),
        }),
      );
    });
  });

  describe('handleSendMessage', () => {
    let mockClient: any;

    beforeEach(() => {
      mockClient = {
        id: 'socket-123',
        userId: 'user-uuid-123',
        userEmail: 'user@example.com',
        projectsJoined: new Set(['project-uuid-456']),
        emit: jest.fn(),
      };

      gateway.server = {
        to: jest.fn(() => ({
          emit: jest.fn(),
        })),
        sockets: {
          adapter: {
            rooms: new Map([
              ['project-uuid-456', new Set(['socket-123', 'socket-789'])],
            ]),
          },
        },
      } as any;
    });

    it('debe enviar un mensaje válido', async () => {
      const createMessageDto = {
        content: 'Hello team!',
        projectId: 'project-uuid-456',
      };

      const mockMessage = {
        id: 'msg-uuid-123',
        content: 'Hello team!',
        projectId: 'project-uuid-456',
        senderId: 'user-uuid-123',
        sender: {
          id: 'user-uuid-123',
          email: 'user@example.com',
        },
        createdAt: new Date(),
      };

      jest
        .spyOn(chatService, 'validateUserProjectAccess')
        .mockResolvedValue(true);
      jest
        .spyOn(chatService, 'createMessage')
        .mockResolvedValue(mockMessage as any);

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(chatService.createMessage).toHaveBeenCalledWith(
        createMessageDto,
        'user-uuid-123',
      );
      expect(gateway.server.to).toHaveBeenCalledWith('project-uuid-456');
    });

    it('debe rechazar mensaje vacío', async () => {
      const createMessageDto = {
        content: '',
        projectId: 'project-uuid-456',
      };

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: 'VALIDATION_ERROR',
          }),
        }),
      );
    });

    it('debe rechazar si usuario no está en la sala', async () => {
      const createMessageDto = {
        content: 'Hello team!',
        projectId: 'project-uuid-999',
      };

      jest
        .spyOn(chatService, 'validateUserProjectAccess')
        .mockResolvedValue(true);

      await gateway.handleSendMessage(mockClient, createMessageDto);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'error',
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: 'STATE_ERROR',
          }),
        }),
      );
    });
  });

  describe('handleDisconnect', () => {
    it('debe limpiar referencias al desconectar', () => {
      const mockClient = {
        id: 'socket-123',
        userId: 'user-uuid-123',
        userEmail: 'user@example.com',
        projectsJoined: new Set(['project-uuid-456']),
      };

      gateway.server = {
        to: jest.fn(() => ({
          emit: jest.fn(),
        })),
      } as any;

      gateway.handleDisconnect(mockClient as any);

      expect(gateway.server.to).toHaveBeenCalledWith('project-uuid-456');
    });
  });

  describe('getGatewayStats', () => {
    it('debe retornar estadísticas del gateway', () => {
      const stats = gateway.getGatewayStats();

      expect(stats).toHaveProperty('totalConnectedUsers');
      expect(stats).toHaveProperty('totalSockets');
      expect(stats).toHaveProperty('activeSessions');
      expect(typeof stats.totalConnectedUsers).toBe('number');
    });
  });
});
