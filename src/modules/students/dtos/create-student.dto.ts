import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @ApiProperty({ example: 'Farid' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Castellanos' })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({ example: '800123456' })
  @IsString()
  @IsNotEmpty()
  cedula: string;
}
