import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../roles/role.entity';
import { Message } from '../chat/entities/message.entity';

@Entity('usuarios')
export class User {
  @ApiProperty({
    format: 'uuid',
    description: 'ID único del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    format: 'email',
    description: 'Email único del usuario',
    example: 'usuario@example.com',
  })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255 })
  contraseña: string;

  @ApiProperty({
    description: 'Rol asignado al usuario',
    type: () => Role,
  })
  @ManyToOne(() => Role, (role) => role.usuarios, {
    eager: true,
    nullable: true,
  })
  @JoinColumn({ name: 'rol_id' })
  rol: Role;

  @ApiProperty({
    type: 'boolean',
    description: 'Estado del usuario (activo o inactivo)',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha y hora de creación del usuario',
    example: '2025-04-19T10:30:00.000Z',
  })
  @CreateDateColumn()
  fechaCreacion: Date;

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha y hora de la última actualización del usuario',
    example: '2025-04-19T11:45:00.000Z',
  })
  @UpdateDateColumn()
  fechaActualizacion: Date;

  /**
   * Relación One-to-Many: Un usuario puede enviar múltiples mensajes en chats de proyectos
   * Se utiliza lazy loading para evitar cargar automáticamente todos los mensajes
   */
  @ApiProperty({
    type: () => [Object],
    description: 'Mensajes enviados por el usuario en chats de proyectos',
  })
  @OneToMany(() => Message, (message) => message.sender, {
    cascade: true,
    eager: false,
    orphanedRowAction: 'delete',
  })
  messages: Message[];
}
