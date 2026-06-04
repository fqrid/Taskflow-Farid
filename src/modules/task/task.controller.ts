import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  Req,
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
  ApiBadRequestResponse,
  ApiParam,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { TasksService } from './task.service';
import { Task } from './task.entity';
import { CreateTaskDto } from '../../dtos/dto-task/create-task.dto';
import { AssignTaskDto } from '../../dtos/dto-task/assign-task.dto';
import { UpdateTaskStatusDto } from '../../dtos/dto-task/update-task-status.dto';
import { AssignedUserDeveloperGuard } from './guards/assigned-user-developer.guard';

@ApiTags('✅ Tasks')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @ApiOperation({
    summary: '✨ Crear nueva tarea',
    description:
      'Crea una nueva tarea asociada a un proyecto. Solo GERENTE puede crear tareas.',
  })
  @ApiCreatedResponse({ description: 'Tarea creada exitosamente', type: Task })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo GERENTE puede crear tareas' })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @Roles(Role.GERENTE)
  @Post()
  @HttpCode(201)
  async crear(@Body() dto: CreateTaskDto): Promise<Task> {
    return await this.tasksService.crear(dto);
  }

  @ApiOperation({
    summary: '👤 Asignar tarea a desarrollador',
    description:
      'Asigna una tarea existente a un usuario con rol DESARROLLADOR. Solo GERENTE puede asignar tareas.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID único de la tarea',
  })
  @ApiOkResponse({ description: 'Tarea asignada exitosamente', type: Task })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo GERENTE puede asignar tareas' })
  @ApiNotFoundResponse({ description: 'Tarea o usuario no encontrado' })
  @ApiBadRequestResponse({
    description: 'El usuario no tiene rol DESARROLLADOR',
  })
  @Roles(Role.GERENTE)
  @UseGuards(JwtAuthGuard, RolesGuard, AssignedUserDeveloperGuard)
  @Patch(':id/asignar')
  async asignar(
    @Param('id') id: string,
    @Body() dto: AssignTaskDto,
  ): Promise<Task> {
    return await this.tasksService.asignar(id, dto);
  }

  @ApiOperation({
    summary: '📁 Listar tareas por proyecto',
    description: 'Retorna todas las tareas asociadas a un proyecto específico.',
  })
  @ApiParam({
    name: 'idProyecto',
    type: 'string',
    format: 'uuid',
    description: 'ID del proyecto',
  })
  @ApiOkResponse({ description: 'Lista de tareas del proyecto', type: [Task] })
  @ApiNotFoundResponse({ description: 'Proyecto no encontrado' })
  @Get('proyecto/:idProyecto')
  async listarPorProyecto(
    @Param('idProyecto') idProyecto: string,
  ): Promise<Task[]> {
    return await this.tasksService.listarPorProyecto(idProyecto);
  }

  @ApiOperation({
    summary: '🔄 Actualizar estado de tarea',
    description:
      'Permite al usuario asignado actualizar el estado de su tarea (pendiente, en_progreso, completada).',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID de la tarea',
  })
  @ApiOkResponse({ description: 'Estado actualizado exitosamente', type: Task })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({
    description: 'Solo el usuario asignado puede cambiar el estado',
  })
  @ApiNotFoundResponse({ description: 'Tarea no encontrada' })
  @Patch(':id/estado')
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: any,
  ): Promise<Task> {
    const userId = req.user.id;
    return await this.tasksService.actualizarEstado(id, dto.estado, userId);
  }

  @ApiOperation({
    summary: '🗑️ Eliminar tarea',
    description:
      'Elimina una tarea de forma permanente. Solo accesible por ADMIN.',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID de la tarea a eliminar',
  })
  @ApiNoContentResponse({ description: 'Tarea eliminada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede eliminar tareas' })
  @ApiNotFoundResponse({ description: 'Tarea no encontrada' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string): Promise<void> {
    return await this.tasksService.eliminar(id);
  }
}
