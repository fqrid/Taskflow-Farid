import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  NotFoundException,
  Patch,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { UsersService } from './users.service';
import { User } from './user.entity';

import { CreateUserDto } from '../../dtos/dto-users/create-user.dto';
import { UpdateUserDto } from '../../dtos/dto-users/update-user.dto';
import { AssignRoleDto } from '../../dtos/dto-roles/assign-role.dto';

@ApiTags('👥 Users')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/perfil  →  Consultar perfil propio (cualquier rol autenticado)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '👤 Consultar perfil propio',
    description:
      'Retorna la información del usuario autenticado actualmente. ' +
      'Accesible por cualquier usuario autenticado (ADMIN, GERENTE, DESARROLLADOR).',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'usuario@example.com',
        nombre: 'Juan Pérez',
        rol: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'DESARROLLADOR',
          descripcion: 'Desarrollador de software',
          activo: true,
        },
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
        fechaActualizacion: '2025-04-19T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @Get('perfil')
  async obtenerPerfil(@Request() req: any): Promise<Partial<User>> {
    const { contraseña: _, ...perfil } = req.user as User;
    return perfil;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /users  →  Crear usuario (solo ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '✨ Crear nuevo usuario',
    description:
      'Crea un nuevo usuario en el sistema. Solo accesible por ADMIN.\n\n' +
      'La contraseña se encripta automáticamente.\n' +
      'Si no se proporciona `rolId`, se asigna el rol **DESARROLLADOR** por defecto.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'nuevo@example.com',
        nombre: 'Nuevo Usuario',
        rol: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          nombre: 'DESARROLLADOR',
          descripcion: 'Desarrollador de software',
          activo: true,
        },
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
        fechaActualizacion: '2025-04-19T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear usuarios' })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  @Roles('ADMIN')
  @Post()
  @HttpCode(201)
  async crear(@Body() dto: CreateUserDto): Promise<Partial<User>> {
    const usuario = await this.usersService.crear(dto);
    const { contraseña: _, ...usuarioSinContraseña } = usuario;
    return usuarioSinContraseña;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users  →  Listar todos los usuarios (ADMIN y GERENTE)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '📋 Listar todos los usuarios',
    description:
      'Retorna la lista de todos los usuarios del sistema. ' +
      'Accesible por **ADMIN** y **GERENTE**.',
  })
  @ApiOkResponse({
    description: 'Listado de usuarios obtenido correctamente',
    schema: {
      example: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'admin@example.com',
          nombre: 'Admin User',
          rol: {
            id: '...',
            nombre: 'ADMIN',
            descripcion: 'Administrador del sistema con permisos completos',
            activo: true,
          },
          activo: true,
          fechaCreacion: '2025-04-19T10:30:00.000Z',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          email: 'gerente@example.com',
          nombre: 'Gerente User',
          rol: {
            id: '...',
            nombre: 'GERENTE',
            descripcion: 'Gerente de proyectos y equipos',
            activo: true,
          },
          activo: true,
          fechaCreacion: '2025-04-19T10:35:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN y GERENTE pueden listar usuarios',
  })
  @Roles('ADMIN', 'GERENTE')
  @Get()
  async obtenerTodos(): Promise<Partial<User>[]> {
    const usuarios = await this.usersService.obtenerTodos();
    return usuarios.map(({ contraseña: _, ...usuario }) => usuario);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /users/:id  →  Obtener usuario por ID (ADMIN y GERENTE)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '🔍 Obtener usuario por ID',
    description:
      'Obtiene la información detallada de un usuario específico. ' +
      'Accesible por **ADMIN** y **GERENTE**.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del usuario (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Usuario encontrado',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'usuario@example.com',
        nombre: 'Juan Pérez',
        rol: {
          id: '...',
          nombre: 'GERENTE',
          descripcion: 'Gerente de proyectos y equipos',
          activo: true,
        },
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
        fechaActualizacion: '2025-04-19T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN y GERENTE pueden consultar usuarios',
  })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @Roles('ADMIN', 'GERENTE')
  @Get(':id')
  async obtenerPorId(@Param('id') id: string): Promise<Partial<User>> {
    const usuario = await this.usersService.buscarPorId(id);
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const { contraseña: _, ...usuarioSinContraseña } = usuario;
    return usuarioSinContraseña;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/:id/rol  →  Asignar rol a usuario (solo ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '🔑 Asignar rol a usuario',
    description:
      'Asigna un rol específico a un usuario existente. Solo accesible por **ADMIN**.\n\n' +
      'Roles disponibles: **ADMIN**, **GERENTE**, **DESARROLLADOR**.\n\n' +
      'El `rolId` debe ser el UUID del rol obtenido desde `GET /roles`.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del usuario (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Rol asignado exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'usuario@example.com',
        nombre: 'Juan Pérez',
        rol: {
          id: '550e8400-e29b-41d4-a716-446655440001',
          nombre: 'GERENTE',
          descripcion: 'Gerente de proyectos y equipos',
          activo: true,
        },
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
        fechaActualizacion: '2025-04-19T11:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede asignar roles' })
  @ApiNotFoundResponse({ description: 'Usuario o rol no encontrado' })
  @Roles('ADMIN')
  @Patch(':id/rol')
  async asignarRol(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ): Promise<Partial<User>> {
    const usuario = await this.usersService.asignarRol(id, dto.rol);
    const { contraseña: _, ...usuarioSinContraseña } = usuario;
    return usuarioSinContraseña;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PATCH /users/:id  →  Actualizar datos de usuario (solo ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '✏️ Actualizar usuario',
    description:
      'Actualiza la información de un usuario existente. Solo accesible por **ADMIN**.\n\n' +
      'Todos los campos son opcionales. Si se envía contraseña, se encripta automáticamente.\n\n' +
      'Para cambiar el rol, usar `PATCH /users/:id/rol`.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del usuario (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Usuario actualizado exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'nuevoemail@example.com',
        nombre: 'Nombre Actualizado',
        rol: {
          id: '...',
          nombre: 'GERENTE',
          descripcion: 'Gerente de proyectos y equipos',
          activo: true,
        },
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
        fechaActualizacion: '2025-04-19T11:45:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede actualizar usuarios' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiConflictResponse({
    description: 'El email ya está en uso por otro usuario',
  })
  @Roles('ADMIN')
  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<Partial<User>> {
    const usuario = await this.usersService.actualizar(id, dto);
    const { contraseña: _, ...usuarioSinContraseña } = usuario;
    return usuarioSinContraseña;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE /users/:id  →  Eliminar usuario (solo ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  @ApiOperation({
    summary: '🗑️ Eliminar usuario',
    description:
      'Elimina un usuario del sistema permanentemente. Solo accesible por **ADMIN**.\n\n' +
      '⚠️ Esta acción no puede ser revertida.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del usuario (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({ description: 'Usuario eliminado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar usuarios' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @Roles('ADMIN')
  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string): Promise<void> {
    await this.usersService.eliminar(id);
  }
}
