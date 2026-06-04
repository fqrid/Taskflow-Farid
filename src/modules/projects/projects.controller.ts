import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  Request,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { Role } from '../../common/enums/role.enum';
import { CreateProjectDto } from '../../dtos/dto-projects/create-project.dto';
import { UpdateProjectDto } from '../../dtos/dto-projects/update-project.dto';
import { ProjectOwnerOrAdminGuard } from './guards/project-owner-or-admin.guard';

@ApiTags('📁 Projects')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @ApiOperation({
    summary: '✨ Crear nuevo proyecto',
    description:
      'Crea un nuevo proyecto en el sistema. Solo ADMIN y GERENTE pueden crear proyectos.',
  })
  @ApiCreatedResponse({
    description: 'Proyecto creado exitosamente',
    type: Project,
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({
    description: 'Solo ADMIN y GERENTE pueden crear proyectos',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @Roles(Role.ADMIN, Role.GERENTE)
  @Post()
  @HttpCode(201)
  async crear(
    @Body() dto: CreateProjectDto,
    @Request() req: any,
  ): Promise<Project> {
    const creatorId = req.user.id;
    return await this.projectsService.crear(dto, creatorId);
  }

  @ApiOperation({
    summary: '📋 Listar todos los proyectos',
    description: 'Retorna una lista de todos los proyectos del sistema.',
  })
  @ApiOkResponse({
    description: 'Listado de proyectos obtenido correctamente',
    type: [Project],
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @Get()
  async obtenerTodos(): Promise<Project[]> {
    return await this.projectsService.obtenerTodos();
  }

  @ApiOperation({
    summary: '🔍 Obtener proyecto por ID',
    description: 'Obtiene la información detallada de un proyecto específico.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del proyecto (UUID)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Proyecto encontrado',
    type: Project,
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @Get(':id')
  async obtenerPorId(@Param('id') id: string): Promise<Project> {
    const proyecto = await this.projectsService.buscarPorId(id);
    if (!proyecto) {
      throw new NotFoundException('Proyecto no encontrado');
    }
    return proyecto;
  }

  @ApiOperation({
    summary: '✏️ Actualizar proyecto',
    description:
      'Actualiza la información de un proyecto existente. Solo el usuario creador del proyecto o un ADMIN pueden actualizarlo.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del proyecto (UUID)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Proyecto actualizado exitosamente',
    type: Project,
  })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({
    description:
      'Solo el usuario creador del proyecto o un ADMIN pueden actualizarlo',
  })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @ApiBadRequestResponse({ description: 'Fechas inválidas' })
  @UseGuards(JwtAuthGuard, RolesGuard, ProjectOwnerOrAdminGuard)
  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<Project> {
    return await this.projectsService.actualizar(id, dto);
  }

  @ApiOperation({
    summary: '🗑️ Eliminar proyecto',
    description:
      'Elimina un proyecto del sistema permanentemente. Solo ADMIN puede eliminar proyectos.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único del proyecto (UUID)',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @ApiNoContentResponse({ description: 'Proyecto eliminado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar proyectos' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string): Promise<void> {
    await this.projectsService.eliminar(id);
  }
}
