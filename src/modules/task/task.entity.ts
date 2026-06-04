import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { TaskStatus } from '../../common/enums/task-status.enum';

@Entity('tareas')
export class Task {
  @ApiProperty({ format: 'uuid', description: 'ID único de la tarea' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Título de la tarea',
    example: 'Diseñar base de datos',
  })
  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @ApiProperty({ description: 'Descripción de la tarea', required: false })
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @ApiProperty({ enum: TaskStatus, description: 'Estado actual de la tarea' })
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDIENTE })
  estado: TaskStatus;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del proyecto al que pertenece',
  })
  @Column({ type: 'uuid' })
  idProyecto: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'idProyecto' })
  proyecto: Project;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del usuario asignado',
    nullable: true,
  })
  @Column({ type: 'uuid', nullable: true })
  idUsuarioAsignado: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'idUsuarioAsignado' })
  usuarioAsignado: User | null;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @ApiProperty({
    description: 'Fecha y hora de finalización o vencimiento de la tarea',
    required: true,
  })
  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaFin: Date;

  @ApiProperty({
    description: 'Indica si ya se envió el recordatorio de 24h',
    default: false,
  })
  @Column({ type: 'boolean', default: false })
  recordatorioEnviado: boolean;
}
