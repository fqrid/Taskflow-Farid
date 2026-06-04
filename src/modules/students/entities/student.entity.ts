import { ApiProperty } from '@nestjs/swagger';

export class Student {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Farid' })
  nombre: string;

  @ApiProperty({ example: 'Castellanos' })
  apellido: string;

  @ApiProperty({ example: '800123456' })
  cedula: string;
}
