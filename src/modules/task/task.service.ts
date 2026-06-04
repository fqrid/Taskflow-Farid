import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from '../../dtos/dto-task/create-task.dto';
import { AssignTaskDto } from '../../dtos/dto-task/assign-task.dto';
import { ProjectsService } from '../projects/projects.service';
import { UsersService } from '../users/users.service';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private projectsService: ProjectsService,
    private usersService: UsersService,
    private mailService: MailService,
  ) {}

  async crear(dto: CreateTaskDto): Promise<Task> {
    const proyecto = await this.projectsService.buscarPorId(dto.idProyecto);
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const nuevaTarea = this.tasksRepository.create({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      idProyecto: dto.idProyecto,
      fechaFin: dto.fechaFin,
      proyecto,
    });

    return await this.tasksRepository.save(nuevaTarea);
  }

  async asignar(id: string, dto: AssignTaskDto): Promise<Task> {
    const tarea = await this.tasksRepository.findOne({
      where: { id },
      relations: ['proyecto', 'usuarioAsignado'],
    });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    const usuario = await this.usersService.buscarPorId(dto.idUsuarioAsignado);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    tarea.idUsuarioAsignado = dto.idUsuarioAsignado;
    tarea.usuarioAsignado = usuario;

    const tareaGuardada = await this.tasksRepository.save(tarea);

    if (usuario.email && usuario.email.includes('@')) {
      const proyectoNombre = tarea.proyecto ? tarea.proyecto.nombre : 'Proyecto no especificado';
      
      this.mailService.sendTaskAssignmentNotification(
        usuario.email,
        proyectoNombre,
        tarea.titulo,
        tarea.estado,
      ).catch(() => {});
    }

    return tareaGuardada;
  }

  async listarPorProyecto(idProyecto: string): Promise<Task[]> {
    const proyecto = await this.projectsService.buscarPorId(idProyecto);
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    return await this.tasksRepository.find({
      where: { idProyecto },
      relations: ['usuarioAsignado'],
    });
  }

  async actualizarEstado(
    id: string,
    estado: TaskStatus,
    idUsuario: string,
  ): Promise<Task> {
    const tarea = await this.tasksRepository.findOne({
      where: { id },
    });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    if (tarea.idUsuarioAsignado !== idUsuario) {
      throw new ForbiddenException(
        'Solo el usuario asignado a esta tarea puede actualizar su estado',
      );
    }

    tarea.estado = estado;
    return await this.tasksRepository.save(tarea);
  }

  async eliminar(id: string): Promise<void> {
    const tarea = await this.tasksRepository.findOne({
      where: { id },
    });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    await this.tasksRepository.remove(tarea);
  }

 // ── HU3: Mover tarea desde el tablero Kanban ─────────────────────
async moverTarea(
    id: string,
    nuevoEstado: TaskStatus,
    idUsuario: string,
    projectId: string,
  ): Promise<Task> {
    const tarea = await this.tasksRepository.findOne({ where: { id } });

    if (!tarea) {
      throw new NotFoundException('Tarea no encontrada');
    }

    if (tarea.idProyecto !== projectId) {
      throw new ForbiddenException('La tarea no pertenece a este proyecto.');
    }

    const esAsignado = tarea.idUsuarioAsignado === idUsuario;

    if (!esAsignado) {
      throw new ForbiddenException(
        'Solo el desarrollador asignado puede mover esta tarea.',
      );
    }

    tarea.estado = nuevoEstado;
    return await this.tasksRepository.save(tarea);
  }
}
