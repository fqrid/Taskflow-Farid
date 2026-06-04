import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from '../../dtos/dto-projects/create-project.dto';
import { UpdateProjectDto } from '../../dtos/dto-projects/update-project.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    private usersService: UsersService,
    private dataSource: DataSource,
  ) {}

  async crear(dto: CreateProjectDto, creatorId: string): Promise<Project> {
    const usuario = await this.usersService.buscarPorId(creatorId);
    if (!usuario) {
      throw new NotFoundException('Usuario creador no encontrado');
    }

    if (dto.fechaFin) {
      const fechaInicio = new Date(dto.fechaInicio);
      const fechaFin = new Date(dto.fechaFin);
      if (fechaFin < fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio',
        );
      }
    }

    const nuevoProyecto = this.projectsRepository.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      fechaInicio: new Date(dto.fechaInicio),
      fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
      idUsuario: creatorId,
      usuarioCreador: usuario,
    });

    return await this.projectsRepository.save(nuevoProyecto);
  }

  async obtenerTodos(): Promise<Project[]> {
    const proyectos = await this.projectsRepository.find({
      relations: ['usuarioCreador'],
    });
    return proyectos.map((proyecto) => this.transformProject(proyecto));
  }

  async buscarPorId(id: string): Promise<Project | null> {
    const proyecto = await this.projectsRepository.findOne({
      where: { id },
      relations: ['usuarioCreador'],
    });
    if (!proyecto) return null;
    return this.transformProject(proyecto);
  }

  private transformProject(proyecto: Project): Project {
    if (proyecto.usuarioCreador) {
      const { contraseña: _, ...usuarioPublico } = proyecto.usuarioCreador;
      proyecto.usuarioCreador = usuarioPublico as any;
    }
    return proyecto;
  }

  async actualizar(id: string, datos: UpdateProjectDto): Promise<Project> {
    const proyecto = await this.buscarPorId(id);
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (datos.fechaInicio && datos.fechaFin) {
      const fechaInicio = new Date(datos.fechaInicio);
      const fechaFin = new Date(datos.fechaFin);
      if (fechaFin < fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio',
        );
      }
    } else if (datos.fechaInicio && proyecto.fechaFin) {
      const fechaInicio = new Date(datos.fechaInicio);
      if (proyecto.fechaFin < fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio',
        );
      }
    } else if (datos.fechaFin && proyecto.fechaInicio) {
      const fechaFin = new Date(datos.fechaFin);
      if (fechaFin < proyecto.fechaInicio) {
        throw new BadRequestException(
          'La fecha de fin no puede ser anterior a la fecha de inicio',
        );
      }
    }

    const actualizacion: Partial<Project> = {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      fechaInicio: datos.fechaInicio
        ? new Date(datos.fechaInicio)
        : proyecto.fechaInicio,
      fechaFin: datos.fechaFin ? new Date(datos.fechaFin) : proyecto.fechaFin,
    };

    Object.assign(proyecto, actualizacion);
    return await this.projectsRepository.save(proyecto);
  }

  async eliminar(id: string): Promise<void> {
    const proyecto = await this.buscarPorId(id);
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(Project, { id }, { idUsuario: null });
      await queryRunner.manager.delete(Project, { id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
