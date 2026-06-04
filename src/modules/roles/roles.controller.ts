import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Role } from './role.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';

@ApiTags(' Roles')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @ApiOperation({
    summary: 'Listar todos los roles',
    description:
      'Obtiene la lista de todos los roles disponibles en el sistema.',
  })
  @ApiOkResponse({
    description: 'Lista de roles obtenida exitosamente',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          nombre: 'ADMIN',
          descripcion: 'Administrador del sistema con permisos completos',
          activo: true,
          fechaCreacion: '2025-04-19T10:30:00.000Z',
          fechaActualizacion: '2025-04-19T10:30:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'GERENTE',
          descripcion: 'Gerente de proyectos y equipos',
          activo: true,
          fechaCreacion: '2025-04-19T10:30:00.000Z',
          fechaActualizacion: '2025-04-19T10:30:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nombre: 'DESARROLLADOR',
          descripcion: 'Desarrollador de software',
          activo: true,
          fechaCreacion: '2025-04-19T10:30:00.000Z',
          fechaActualizacion: '2025-04-19T10:30:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado - Token inválido o expirado',
  })
  @Get()
  async obtenerTodos(): Promise<Role[]> {
    return await this.rolesService.obtenerTodos();
  }
}
