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
import { User } from '../users/user.entity';
import { Task } from '../task/task.entity';
import { Message } from '../chat/entities/message.entity';

@Entity('proyectos')
export class Project {
  @ApiProperty({
    format: 'uuid',
    description: 'ID único del proyecto',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Sistema de Gestión de Tareas',
  })
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ApiProperty({
    description: 'Descripción detallada del proyecto',
    example:
      'Desarrollo de una aplicación web para gestión de proyectos y tareas',
  })
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ApiProperty({
    format: 'date',
    description: 'Fecha de inicio del proyecto',
    example: '2025-01-15',
  })
  @Column({ type: 'date' })
  fechaInicio: Date;

  @ApiProperty({
    format: 'date',
    description: 'Fecha de fin del proyecto',
    example: '2025-06-30',
  })
  @Column({ type: 'date', nullable: true })
  fechaFin: Date | null;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del usuario creador del proyecto',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  idUsuario: string | null;

  @ApiProperty({
    description: 'Usuario creador del proyecto',
    type: () => User,
  })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'idUsuario' })
  usuarioCreador: User | null;

  @ApiProperty({
    type: () => [Task],
    description: 'Tareas asociadas al proyecto',
  })
  @OneToMany(() => Task, (tarea) => tarea.proyecto)
  tareas: Task[];

  /**
   * Relación One-to-Many: Un proyecto puede tener múltiples mensajes en su chat grupal
   * Se utiliza lazy loading para evitar cargar automáticamente todos los mensajes
   */
  @ApiProperty({
    type: () => [Object],
    description: 'Mensajes del chat grupal del proyecto',
  })
  @OneToMany(() => Message, (message) => message.project, {
    cascade: true,
    eager: false,
    orphanedRowAction: 'delete',
  })
  messages: Message[];

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha y hora de creación del proyecto',
    example: '2025-04-19T10:30:00.000Z',
  })
  @CreateDateColumn()
  fechaCreacion: Date;

  @ApiProperty({
    format: 'date-time',
    description: 'Fecha y hora de la última actualización del proyecto',
    example: '2025-04-19T11:45:00.000Z',
  })
  @UpdateDateColumn()
  fechaActualizacion: Date;
}
