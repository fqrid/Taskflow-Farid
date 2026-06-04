import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';

@Entity('roles')
export class Role {
  @ApiProperty({
    format: 'uuid',
    description: 'ID único del rol',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Nombre del rol',
    example: 'ADMIN',
    enum: ['ADMIN', 'GERENTE', 'DESARROLLADOR'],
  })
  @Column({ type: 'varchar', length: 50, unique: true })
  nombre: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol de administrador del sistema',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @ApiProperty({
    type: 'boolean',
    description: 'Estado del rol',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreacion: Date;

  @UpdateDateColumn()
  fechaActualizacion: Date;

  @OneToMany(() => User, (user) => user.rol, { cascade: false })
  usuarios: User[];
}
