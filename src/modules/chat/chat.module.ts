import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Message } from './entities/message.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../task/task.entity';
import { User } from '../users/user.entity';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { WsExceptionFilter } from './filters/ws-exception.filter';

/**
 * Módulo de Chat Grupal
 *
 * Integra todos los componentes relacionados con el chat en tiempo real:
 * - Entidad de Mensaje (TypeORM)
 * - Servicio de Chat (lógica de negocio)
 * - Gateway de WebSocket (Socket.io)
 * - Filtro de Excepciones
 *
 * Dependencias:
 * - TypeOrmModule: Para ORM de mensajes
 * - JwtModule: Para autenticación de WebSocket
 * - ConfigModule: Para configuraciones de CORS y JWT
 *
 * @module
 *
 * @example
 * // En app.module.ts
 * import { ChatModule } from './modules/chat/chat.module';
 *
 * @Module({
 *   imports: [ChatModule, ...],
 * })
 * export class AppModule {}
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Project, Task, User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '24h') as any,
        },
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, WsExceptionFilter],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
