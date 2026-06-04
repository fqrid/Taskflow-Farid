import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dtos/create-message.dto';
import { Project } from '../projects/project.entity';
import { Task } from '../task/task.entity';
import { User } from '../users/user.entity';

/**
 * Servicio de Chat
 *
 * Maneja la lógica de negocio relacionada con mensajes del chat grupal:
 * - Crear mensajes
 * - Recuperar mensajes por proyecto
 * - Validar acceso a proyectos
 * - Gestión de datos de chat
 *
 * @injectable
 */
@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Crea un nuevo mensaje en la base de datos
   *
   * @param createMessageDto - DTO con los datos del mensaje (content, projectId)
   * @param senderId - ID del usuario que envía el mensaje
   * @returns Promise<Message> - El mensaje guardado con todas sus propiedades
   *
   * @throws BadRequestException - Si el contenido está vacío o no es válido
   *
   * @example
   * const message = await chatService.createMessage(
   *   { content: 'Hello', projectId: 'uuid-123' },
   *   'user-uuid-456'
   * );
   */
  async createMessage(
    createMessageDto: CreateMessageDto,
    senderId: string,
  ): Promise<Message> {
    try {
      const { content, projectId } = createMessageDto;

      // Validación adicional de contenido
      if (!content.trim()) {
        throw new BadRequestException('El mensaje no puede contener solo espacios en blanco');
      }

      // Crear la instancia del mensaje
      const message = this.messageRepository.create({
        content: content.trim(),
        projectId,
        senderId,
      });

      // Guardar en la base de datos
      const savedMessage = await this.messageRepository.save(message);

      this.logger.debug(
        `Mensaje creado - ID: ${savedMessage.id}, Proyecto: ${projectId}, Usuario: ${senderId}`,
      );

      // Cargar las relaciones para la respuesta
      return await this.messageRepository.findOne({
        where: { id: savedMessage.id },
        relations: ['sender', 'project'],
      });
    } catch (error) {
      this.logger.error(
        `Error al crear mensaje: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Recupera los últimos mensajes de un proyecto
   *
   * @param projectId - ID del proyecto
   * @param limit - Número máximo de mensajes a recuperar (default: 50)
   * @returns Promise<Message[]> - Array de mensajes ordenados por fecha descendente
   *
   * @example
   * const messages = await chatService.getProjectMessages('project-uuid', 20);
   */
  async getProjectMessages(projectId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messages = await this.messageRepository.find({
        where: { projectId },
        relations: ['sender'],
        order: { createdAt: 'DESC' },
        take: limit,
      });

      // Invertir para que los más antiguos estén primero
      return messages.reverse();
    } catch (error) {
      this.logger.error(
        `Error al recuperar mensajes del proyecto ${projectId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Valida si un usuario tiene acceso a un proyecto
   *
   * Un usuario tiene acceso si:
   * 1. Es el creador del proyecto, O
   * 2. Tiene una tarea asignada en ese proyecto
   *
   * @param userId - ID del usuario
   * @param projectId - ID del proyecto
   * @returns Promise<boolean> - true si el usuario tiene acceso al proyecto
   * @throws NotFoundException - Si el proyecto no existe
   *
   * @example
   * const hasAccess = await chatService.validateUserProjectAccess(userId, projectId);
   */
  async validateUserProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
      // Verificar que el proyecto existe
      const project = await this.projectRepository.findOne({
        where: { id: projectId },
      });

      if (!project) {
        this.logger.warn(`Proyecto no encontrado: ${projectId}`);
        throw new NotFoundException(`Proyecto con ID ${projectId} no existe`);
      }

      // Validación 1: ¿Es el usuario el creador del proyecto?
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['rol'],
      });
      const roleName = user?.rol?.nombre?.toUpperCase();

      if (roleName === 'ADMIN' || roleName === 'GERENTE') {
        this.logger.debug(
          `Usuario ${userId} accede por rol ${roleName} al proyecto ${projectId}`,
        );
        return true;
      }

      if (project.idUsuario === userId) {
        this.logger.debug(
          `✓ Usuario ${userId} es creador del proyecto ${projectId}`,
        );
        return true;
      }

      // Validación 2: ¿Tiene una tarea asignada en este proyecto?
      const assignedTask = await this.taskRepository.findOne({
        where: {
          idProyecto: projectId,
          idUsuarioAsignado: userId,
        },
      });

      if (assignedTask) {
        this.logger.debug(
          `✓ Usuario ${userId} tiene tarea asignada en proyecto ${projectId}`,
        );
        return true;
      }

      // Si no cumple ninguna condición, no tiene acceso
      this.logger.warn(
        `✗ Usuario ${userId} no tiene acceso al proyecto ${projectId}`,
      );
      return false;
    } catch (error) {
      this.logger.error(
        `Error al validar acceso a proyecto: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Cuenta el número total de mensajes en un proyecto
   *
   * @param projectId - ID del proyecto
   * @returns Promise<number> - Cantidad de mensajes
   *
   * @example
   * const count = await chatService.getMessageCount('project-uuid');
   */
  async getMessageCount(projectId: string): Promise<number> {
    try {
      return await this.messageRepository.count({
        where: { projectId },
      });
    } catch (error) {
      this.logger.error(
        `Error al contar mensajes del proyecto ${projectId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Limpia los mensajes antiguos de un proyecto (útil para mantenimiento)
   *
   * @param projectId - ID del proyecto
   * @param daysOld - Eliminar mensajes más antiguos a estos días
   * @returns Promise<number> - Número de mensajes eliminados
   *
   * @example
   * const deleted = await chatService.cleanOldMessages('project-uuid', 30);
   */
  async cleanOldMessages(projectId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.messageRepository.delete({
        projectId,
        createdAt: cutoffDate,
      });

      this.logger.log(
        `Eliminados ${result.affected} mensajes antiguos del proyecto ${projectId}`,
      );

      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        `Error al limpiar mensajes antiguos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
