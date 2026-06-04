import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignTaskDto {
  @ApiProperty({
    format: 'uuid',
    description: 'ID del desarrollador al que se asigna la tarea',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  idUsuarioAsignado: string;
}
