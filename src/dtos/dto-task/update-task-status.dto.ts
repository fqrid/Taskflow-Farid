import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TaskStatus } from '../../common/enums/task-status.enum';

export class UpdateTaskStatusDto {
  @ApiProperty({
    enum: TaskStatus,
    description: 'Nuevo estado de la tarea',
    example: TaskStatus.EN_PROGRESO,
  })
  @IsEnum(TaskStatus, {
    message: 'El estado debe ser: pendiente, en_progreso o completada',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado: TaskStatus;
}
