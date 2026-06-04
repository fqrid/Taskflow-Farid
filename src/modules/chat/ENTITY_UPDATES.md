/**
 * ACTUALIZACIONES REQUERIDAS EN ENTIDADES EXISTENTES
 *
 * Este archivo documenta los cambios necesarios en:
 * - src/modules/users/user.entity.ts
 * - src/modules/projects/project.entity.ts
 *
 * Para establecer las relaciones bidireccionales con Message.
 */

// ============================================================================
// ACTUALIZACIÓN 1: src/modules/users/user.entity.ts
// ============================================================================

/*
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Message } from '../chat/entities/message.entity';  // ✓ AGREGAR

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================================================
  // RELACIONES EXISTENTES
  // ============================================================================

  @OneToMany(() => Project, (project) => project.owner)
  ownedProjects: Project[];

  @OneToMany(() => UserRole, (userRole) => userRole.user, { cascade: true })
  roles: UserRole[];

  // ============================================================================
  // ✓ AGREGAR: Relación One-to-Many con Message
  // ============================================================================

  /**
   * Relación One-to-Many: Un usuario puede enviar múltiples mensajes
   *
   * - cascade: true → Al eliminar usuario, se eliminan sus mensajes
   * - eager: false → No cargar automáticamente (lazy loading)
   * - orphanedRowAction: 'delete' → Eliminar mensajes huérfanos
   * /
  @OneToMany(() => Message, (message) => message.sender, {
    cascade: true,
    eager: false,
    orphanedRowAction: 'delete',
  })
  messages: Message[];  // ✓ AGREGAR ESTA PROPIEDAD
}
*/

// ============================================================================
// ACTUALIZACIÓN 2: src/modules/projects/project.entity.ts
// ============================================================================

/*
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Message } from '../chat/entities/message.entity';  // ✓ AGREGAR

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // ============================================================================
  // RELACIONES EXISTENTES
  // ============================================================================

  @ManyToOne(() => User, (user) => user.ownedProjects)
  owner: User;

  @OneToMany(() => UserRole, (userRole) => userRole.project, { cascade: true })
  userRoles: UserRole[];

  @OneToMany(() => Task, (task) => task.project, { cascade: true })
  tasks: Task[];

  // ============================================================================
  // ✓ AGREGAR: Relación One-to-Many con Message
  // ============================================================================

  /**
   * Relación One-to-Many: Un proyecto puede tener múltiples mensajes
   *
   * - cascade: true → Al eliminar proyecto, se eliminan sus mensajes
   * - eager: false → No cargar automáticamente (lazy loading)
   * - orphanedRowAction: 'delete' → Eliminar mensajes huérfanos
   * /
  @OneToMany(() => Message, (message) => message.project, {
    cascade: true,
    eager: false,
    orphanedRowAction: 'delete',
  })
  messages: Message[];  // ✓ AGREGAR ESTA PROPIEDAD
}
*/

// ============================================================================
// SCRIPT DE MIGRACIÓN (Alternativa a UPDATE manual)
// ============================================================================

/*
// src/migrations/[timestamp]-AddChatRelations.ts

import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddChatRelations[timestamp] implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la columna ya existe
    const table = await queryRunner.getTable('messages');
    
    if (!table) {
      // Crear tabla messages si no existe
      await queryRunner.query(`
        CREATE TABLE messages (
          id varchar(36) NOT NULL PRIMARY KEY,
          content longtext NOT NULL,
          sender_id varchar(36) NOT NULL,
          project_id varchar(36) NOT NULL,
          createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `);
    }

    // Crear índices para queries frecuentes
    await queryRunner.query(`
      CREATE INDEX idx_messages_project_id ON messages(project_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_messages_sender_id ON messages(sender_id);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_messages_created_at ON messages(createdAt);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS messages');
  }
}
*/

// ============================================================================
// PASOS PARA APLICAR CAMBIOS
// ============================================================================

/*
1. OPCIÓN A: UPDATE MANUAL
   - Abrir src/modules/users/user.entity.ts
   - Agregar import: import { Message } from '../chat/entities/message.entity';
   - Agregar propiedad en User:
     @OneToMany(() => Message, (message) => message.sender, { cascade: true })
     messages: Message[];

   - Abrir src/modules/projects/project.entity.ts
   - Agregar import: import { Message } from '../chat/entities/message.entity';
   - Agregar propiedad en Project:
     @OneToMany(() => Message, (message) => message.project, { cascade: true })
     messages: Message[];

2. OPCIÓN B: USAR MIGRACIONES
   - npm run typeorm migration:generate src/migrations/AddChatRelations
   - npm run typeorm migration:run

3. VERIFICAR CAMBIOS
   - npm run typeorm:sync  (en desarrollo con synchronize: true)
   - Verificar en MySQL que la tabla 'messages' tiene las columnas correctas

4. ACTUALIZAR APP.MODULE.TS
   - Agregar Message a la lista de entities en TypeOrmModule.forRoot()
   - Importar ChatModule
*/

// ============================================================================
// ESTRUCTURA SQL ESPERADA
// ============================================================================

/*
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primario',
  content LONGTEXT NOT NULL COMMENT 'Contenido del mensaje',
  sender_id VARCHAR(36) NOT NULL COMMENT 'ID del usuario que envía',
  project_id VARCHAR(36) NOT NULL COMMENT 'ID del proyecto',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp de creación',
  
  -- Restricciones de Integridad
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Índices para performance
  INDEX idx_messages_project_id (project_id),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
*/

// ============================================================================
// VERIFICACIÓN POST-INTEGRACIÓN
// ============================================================================

/*
// Query para verificar que las relaciones están correctas:

SELECT 
  m.id,
  m.content,
  u.email as sender_email,
  p.name as project_name,
  m.createdAt
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
LEFT JOIN projects p ON m.project_id = p.id
ORDER BY m.createdAt DESC
LIMIT 10;

// Verificar contadores:

SELECT 
  u.email,
  COUNT(m.id) as total_messages
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id
GROUP BY u.id
ORDER BY total_messages DESC;

SELECT 
  p.name,
  COUNT(m.id) as total_messages
FROM projects p
LEFT JOIN messages m ON p.id = m.project_id
GROUP BY p.id
ORDER BY total_messages DESC;
*/

// ============================================================================
// CONSIDERACIONES DE RENDIMIENTO
// ============================================================================

/*
1. ÍNDICES:
   - project_id: Para queries por proyecto
   - sender_id: Para queries por usuario
   - createdAt: Para ordenamiento temporal

2. LAZY LOADING:
   - Las relaciones usan eager: false para evitar cargar siempre
   - Solo cargar cuando sea necesario con .leftJoinAndSelect()

3. PAGINACIÓN:
   - Siempre usar LIMIT para queries de historial
   - Implementar cursor-based pagination para escalabilidad

4. CACHÉ:
   - Considerar Redis para últimos 50 mensajes de un proyecto
   - Invalidar caché al crear nuevo mensaje

5. ARCHIVADO:
   - Implementar soft delete o archivado de mensajes antiguos
   - Tabla separada para mensaje archivados
*/

export default {};
