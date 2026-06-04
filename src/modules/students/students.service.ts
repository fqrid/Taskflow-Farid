import { Injectable } from '@nestjs/common';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dtos/create-student.dto';

@Injectable()
export class StudentsService {
  private students: Student[] = [
    {
      id: 1,
      nombre: 'Farid',
      apellido: 'Castellanos',
      cedula: '800123456',
    },
  ];
  private nextId = 2;

  findAll(): Student[] {
    return this.students;
  }

  create(dto: CreateStudentDto): Student {
    const student: Student = {
      id: this.nextId++,
      nombre: dto.nombre,
      apellido: dto.apellido,
      cedula: dto.cedula,
    };
    this.students.push(student);
    return student;
  }
}
