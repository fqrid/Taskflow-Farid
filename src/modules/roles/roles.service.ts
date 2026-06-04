import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService {
  private readonly rolesBase = ['ADMIN', 'GERENTE', 'DESARROLLADOR'];

  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async inicializarRoles(): Promise<void> {
    for (const nombreRol of this.rolesBase) {
      const rolExistente = await this.rolesRepository.findOne({
        where: { nombre: nombreRol },
      });

      if (!rolExistente) {
        const nuevoRol = this.rolesRepository.create({
          nombre: nombreRol,
          descripcion: this.obtenerDescripcion(nombreRol),
          activo: true,
        });
        await this.rolesRepository.save(nuevoRol);
      }
    }
  }

  async obtenerTodos(): Promise<Role[]> {
    return await this.rolesRepository.find({ where: { activo: true } });
  }

  async obtenerPorId(id: string): Promise<Role> {
    const rol = await this.rolesRepository.findOne({
      where: { id, activo: true },
    });

    if (!rol) {
      throw new NotFoundException(`Rol con ID ${id} no encontrado`);
    }

    return rol;
  }

  async obtenerPorNombre(nombre: string): Promise<Role> {
    const rol = await this.rolesRepository.findOne({
      where: { nombre, activo: true },
    });

    if (!rol) {
      throw new NotFoundException(`Rol ${nombre} no encontrado`);
    }

    return rol;
  }

  async crear(nombre: string, descripcion?: string): Promise<Role> {
    if (!this.rolesBase.includes(nombre)) {
      throw new BadRequestException(
        `El rol debe ser uno de: ${this.rolesBase.join(', ')}`,
      );
    }

    const rolExistente = await this.rolesRepository.findOne({
      where: { nombre },
    });

    if (rolExistente) {
      throw new ConflictException(`El rol ${nombre} ya existe`);
    }

    const nuevoRol = this.rolesRepository.create({
      nombre,
      descripcion: descripcion || this.obtenerDescripcion(nombre),
      activo: true,
    });

    return await this.rolesRepository.save(nuevoRol);
  }

  private obtenerDescripcion(nombre: string): string {
    const descripciones = {
      ADMIN: 'Administrador del sistema con permisos completos',
      GERENTE: 'Gerente de proyectos y equipos',
      DESARROLLADOR: 'Desarrollador de software',
    };
    return descripciones[nombre] || '';
  }
}
