import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Título de la tarea',
    example: 'Diseñar base de datos',
  })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiPropertyOptional({ description: 'Descripción detallada de la tarea' })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'ID del proyecto al que pertenece la tarea',
  })
  @IsUUID()
  @IsNotEmpty()
  idProyecto: string;

  @ApiProperty({
    description: 'Fecha y hora de finalización o vencimiento de la tarea',
    example: '2026-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaFin: Date;
}
