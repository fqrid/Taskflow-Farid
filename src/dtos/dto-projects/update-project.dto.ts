import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    description: 'Nombre del proyecto',
    example: 'Sistema de Gestion de Tareas',
  })
  @IsString()
  @IsOptional()
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripcion detallada del proyecto',
    example:
      'Desarrollo de una aplicacion web para gestion de proyectos y tareas',
  })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Fecha de inicio del proyecto',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsOptional()
  fechaInicio?: string;

  @ApiPropertyOptional({
    format: 'date',
    description: 'Fecha de fin del proyecto',
    example: '2025-06-30',
  })
  @IsDateString()
  @IsOptional()
  fechaFin?: string;
}
