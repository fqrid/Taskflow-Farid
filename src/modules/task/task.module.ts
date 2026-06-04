import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Task } from './task.entity';
import { TasksService } from './task.service';
import { TasksController } from './task.controller';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { AssignedUserDeveloperGuard } from './guards/assigned-user-developer.guard';
import { MailModule } from '../mail/mail.module';
import { TaskCronService } from './task-cron.service';
import { KanbanGateway } from './kanban/kanban.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    ProjectsModule,
    UsersModule,
    MailModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [
    TasksService,
    AssignedUserDeveloperGuard,
    TaskCronService,
    KanbanGateway,
  ],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
