import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Project } from '../projects/project.entity';
import { Task } from '../task/task.entity';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from '../../dtos/dto-users/create-user.dto';
import { UpdateUserDto } from '../../dtos/dto-users/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private rolesService: RolesService,
    private dataSource: DataSource,
  ) {}

  async crear(dto: CreateUserDto): Promise<User> {
    const { email, nombre, password, rol, activo } = dto;

    // Validar que el email no exista
    const usuarioExistente = await this.usersRepository.findOne({
      where: { email },
    });
    if (usuarioExistente) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    // Validar contraseña
    if (!password || password.length < 6) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 6 caracteres',
      );
    }

    // Resolver rol: si no se pasa rol, asignar DESARROLLADOR por defecto
    const rolNombre = rol?.toUpperCase() || 'DESARROLLADOR';
    const rolEntity = await this.rolesService.obtenerPorNombre(rolNombre);

    // Encriptar la contraseña
    const contraseñaEncriptada = await bcrypt.hash(password, 10);

    const nuevoUsuario = this.usersRepository.create({
      email,
      nombre,
      contraseña: contraseñaEncriptada,
      rol: rolEntity,
      activo: activo ?? true,
    });

    return await this.usersRepository.save(nuevoUsuario);
  }

  async buscarPorEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
      relations: ['rol'],
    });
  }

  async buscarPorId(id: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { id },
      relations: ['rol'],
    });
  }

  async verificarContraseña(
    contraseña: string,
    contraseñaEncriptada: string,
  ): Promise<boolean> {
    return await bcrypt.compare(contraseña, contraseñaEncriptada);
  }

  async obtenerTodos(): Promise<User[]> {
    return await this.usersRepository.find({ relations: ['rol'] });
  }

  async actualizar(id: string, datos: UpdateUserDto): Promise<User> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (datos.email && datos.email !== usuario.email) {
      const usuarioExistente = await this.usersRepository.findOne({
        where: { email: datos.email },
      });
      if (usuarioExistente) {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
    }

    if (datos.email !== undefined) usuario.email = datos.email;
    if (datos.nombre !== undefined) usuario.nombre = datos.nombre;
    if (datos.activo !== undefined) usuario.activo = datos.activo;
    if (datos.password) {
      usuario.contraseña = await bcrypt.hash(datos.password, 10);
    }
    if (datos.rol) {
      const rolNombre = datos.rol.toUpperCase();
      usuario.rol = await this.rolesService.obtenerPorNombre(rolNombre);
    }

    return await this.usersRepository.save(usuario);
  }

  async asignarRol(id: string, rolNombre: string): Promise<User> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const rol = await this.rolesService.obtenerPorNombre(
      rolNombre.toUpperCase(),
    );
    usuario.rol = rol;

    return await this.usersRepository.save(usuario);
  }

  async eliminar(id: string): Promise<void> {
    const usuario = await this.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.update(
        Task,
        { idUsuarioAsignado: id },
        { idUsuarioAsignado: null },
      );
      await queryRunner.manager.update(
        Project,
        { idUsuario: id },
        { idUsuario: null },
      );

      await queryRunner.manager.delete(User, { id });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
