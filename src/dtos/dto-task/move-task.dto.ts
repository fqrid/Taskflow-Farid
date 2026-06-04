import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class MoveTaskDto {
  @ApiProperty({ format: 'uuid', description: 'ID de la tarea a mover' })
  @IsUUID('4', { message: 'taskId debe ser un UUID válido' })
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ enum: TaskStatus, description: 'Nuevo estado de la tarea' })
  @IsEnum(TaskStatus, {
    message: 'newStatus debe ser: pendiente, en_progreso o completada',
  })
  @IsNotEmpty()
  newStatus: TaskStatus;

  @ApiProperty({ enum: TaskStatus, description: 'Estado anterior de la tarea' })
  @IsEnum(TaskStatus, {
    message: 'previousStatus debe ser: pendiente, en_progreso o completada',
  })
  @IsNotEmpty()
  previousStatus: TaskStatus;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del usuario que mueve la tarea',
  })
  @IsUUID('4', { message: 'userId debe ser un UUID válido' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del proyecto (sala WebSocket)',
  })
  @IsUUID('4', { message: 'projectId debe ser un UUID válido' })
  @IsNotEmpty()
  projectId: string;
}
