import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({
    example: 'ADMIN',
    description: 'Rol a asignar: ADMIN, GERENTE o DESARROLLADOR',
    enum: ['ADMIN', 'GERENTE', 'DESARROLLADOR'],
  })
  @IsIn(['ADMIN', 'GERENTE', 'DESARROLLADOR'])
  rol: string;
}
