import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dtos/create-student.dto';
import { Student } from './entities/student.entity';

@ApiTags('Estudiantes')
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los estudiantes' })
  @ApiResponse({ status: 200, description: 'Lista de estudiantes', type: [Student] })
  findAll(): Student[] {
    return this.studentsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Crear un estudiante' })
  @ApiResponse({ status: 201, description: 'Estudiante creado', type: Student })
  create(@Body() dto: CreateStudentDto): Student {
    return this.studentsService.create(dto);
  }
}
