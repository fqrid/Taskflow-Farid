import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Nombre del proyecto',
    example: 'Sistema de Gestión de Tareas',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del proyecto',
    example:
      'Desarrollo de una aplicación web para gestión de proyectos y tareas',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({
    format: 'date',
    description: 'Fecha de inicio del proyecto',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  fechaInicio: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Fecha de fin del proyecto',
    example: '2025-06-30',
  })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}
