import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/user.entity';
import { Project } from '../../projects/project.entity';

/**
 * Message Entity - Representa un mensaje enviado en el chat grupal de un proyecto
 *
 * Esta entidad almacena los mensajes de chat en tiempo real, manteniendo relaciones
 * con el usuario que lo envía y el proyecto al que pertenece el mensaje.
 *
 * @entity
 */
@Entity('messages')
export class Message {
  /**
   * Identificador único del mensaje
   * Se genera automáticamente usando estrategia UUID o INT
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Contenido del mensaje de texto
   * Campo de tipo TEXT para permitir mensajes largos
   */
  @Column('text')
  content: string;

  /**
   * Timestamp de creación automático
   * Se establece automáticamente al crear el registro
   */
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  /**
   * Relación Many-to-One con User (sender)
   * Un usuario puede enviar múltiples mensajes
   * El mensaje siempre debe tener un usuario asociado
   */
  @ManyToOne(() => User, (user) => user.messages, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  /**
   * ID del usuario que envió el mensaje
   * Campo desnormalizado para queries más eficientes
   */
  @Column({ type: 'uuid', name: 'sender_id' })
  senderId: string;

  /**
   * Relación Many-to-One con Project
   * Un proyecto puede tener múltiples mensajes
   * El mensaje siempre debe estar asociado a un proyecto
   */
  @ManyToOne(() => Project, (project) => project.messages, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  /**
   * ID del proyecto al que pertenece el mensaje
   * Campo desnormalizado para queries más eficientes
   */
  @Column({ type: 'uuid', name: 'project_id' })
  projectId: string;
}
