/**
 * GUÍA DE INTEGRACIÓN DEL MÓDULO CHAT
 *
 * Este archivo proporciona ejemplos de cómo integrar el módulo Chat
 * en la aplicación NestJS principal.
 *
 * ============================================================================
 * PASO 1: IMPORTAR EL MÓDULO EN APP.MODULE.TS
 * ============================================================================
 */

// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatModule } from './modules/chat/chat.module';
import { Message } from './modules/chat/entities/message.entity';

// ... otros módulos ...

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') || 'localhost',
        port: configService.get('DB_PORT') || 3306,
        username: configService.get('DB_USER') || 'root',
        password: configService.get('DB_PASSWORD') || '',
        database: configService.get('DB_NAME') || 'task_flow_pro',
        entities: [
          // ... entidades existentes ...
          Message, // ✓ Agregar la entidad Message
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('DB_LOGGING') === 'true',
      }),
    }),
    // ... otros módulos ...
    ChatModule, // ✓ Importar el módulo Chat
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

/**
 * ============================================================================
 * PASO 2: CONFIGURAR VARIABLES DE ENTORNO (.env)
 * ============================================================================
 */

/*
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRATION=24h

# CORS Configuration (separados por comas)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=task_flow_pro

# Environment
NODE_ENV=development
DB_LOGGING=false
*/

/**
 * ============================================================================
 * PASO 3: ACTUALIZAR PACKAGE.JSON (SI ES NECESARIO)
 * ============================================================================
 *
 * Asegúrate de que tienes las siguientes dependencias instaladas:
 */

/*
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "socket.io": "^4.6.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "mysql2": "^3.0.0"
  }
}

// Instalar si falta:
// npm install @nestjs/websockets socket.io
*/

/**
 * ============================================================================
 * PASO 4: ACTUALIZAR USER.ENTITY.TS Y PROJECT.ENTITY.TS
 * ============================================================================
 */

// src/modules/users/user.entity.ts
/*
import { Message } from '../chat/entities/message.entity';

@Entity('users')
export class User {
  // ... campos existentes ...

  // Agregar esta relación:
  @OneToMany(() => Message, (message) => message.sender, {
    cascade: true,
  })
  messages: Message[];
}
*/

// src/modules/projects/project.entity.ts
/*
import { Message } from '../chat/entities/message.entity';

@Entity('projects')
export class Project {
  // ... campos existentes ...

  // Agregar esta relación:
  @OneToMany(() => Message, (message) => message.project, {
    cascade: true,
  })
  messages: Message[];
}
*/

/**
 * ============================================================================
 * PASO 5: EJEMPLO DE USO EN EL CLIENTE (FRONTEND)
 * ============================================================================
 */

/*
// client-example.ts (TypeScript / React / Angular)

import io, { Socket } from 'socket.io-client';

class ChatClient {
  private socket: Socket;

  connect(token: string) {
    this.socket = io('http://localhost:3001/chat', {
      auth: {
        token: token, // Token JWT del usuario
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Escuchar eventos
    this.socket.on('connected', (data) => {
      console.log('✓ Conectado:', data);
    });

    this.socket.on('error', (error) => {
      console.error('✗ Error:', error);
    });

    this.socket.on('newMessage', (event) => {
      console.log('Nuevo mensaje:', event.data);
    });

    this.socket.on('userJoined', (notification) => {
      console.log('Usuario se unió:', notification.userEmail);
    });

    this.socket.on('userLeft', (notification) => {
      console.log('Usuario se fue:', notification.userEmail);
    });
  }

  // Unirse a un proyecto
  joinProject(projectId: string) {
    this.socket.emit('joinProject', { projectId }, (response) => {
      if (response.success) {
        console.log('Historial cargado:', response.messagesHistory);
      }
    });
  }

  // Enviar un mensaje
  sendMessage(content: string, projectId: string) {
    this.socket.emit('sendMessage', {
      content,
      projectId,
    });
  }

  // Cargar historial
  loadHistory(projectId: string, limit: number = 50) {
    this.socket.emit('loadHistory', { projectId, limit });
  }

  disconnect() {
    this.socket.disconnect();
  }
}

// Uso:
// const chatClient = new ChatClient();
// chatClient.connect('jwt-token-here');
// chatClient.joinProject('project-uuid');
// chatClient.sendMessage('Hello team!', 'project-uuid');
*/

/**
 * ============================================================================
 * PASO 6: CREAR MIGRACIONES TYPEORM (OPCIONAL)
 * ============================================================================
 */

/*
// src/migrations/1234567890-CreateMessagesTable.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateMessagesTable1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'sender_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'projects',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages', true);
  }
}
*/

/**
 * ============================================================================
 * PASO 7: NOTAS IMPORTANTES
 * ============================================================================
 *
 * 1. SEGURIDAD:
 *    - El token JWT es validado en el handshake
 *    - Las desconexiones no autorizadas se ejecutan inmediatamente
 *    - Cada evento valida acceso del usuario al proyecto
 *
 * 2. MANEJO DE MEMORIA:
 *    - Se mantiene un mapa de usuarios conectados
 *    - Al desconectarse, se limpian todas las referencias
 *    - Los sockets se unen a rooms por projectId
 *
 * 3. EVENTOS EMITIDOS:
 *    - 'connected': Confirmación de conexión
 *    - 'joinedProject': Usuario se unió a un proyecto
 *    - 'newMessage': Nuevo mensaje en tiempo real
 *    - 'userJoined': Notificación de usuario entrado
 *    - 'userLeft': Notificación de usuario salido
 *    - 'error': Eventos de error
 *
 * 4. VALIDACIONES:
 *    - JWT válido y no expirado en conexión
 *    - DTOs validados con class-validator
 *    - Acceso del usuario al proyecto verificado
 *    - Pertenencia a sala validada antes de enviar
 *
 * 5. ESCALABILIDAD:
 *    - Usa Socket.io adapter para sincronización entre instancias
 *    - Los mensajes se persisten en MySQL
 *    - La memoria se libera correctamente en desconexiones
 */

export default {};
