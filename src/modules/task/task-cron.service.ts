import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Task } from './task.entity';
import { TaskStatus } from '../../common/enums/task-status.enum';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TaskCronService {
  private readonly logger = new Logger(TaskCronService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTaskDueReminders() {
    this.logger.log(
      'Iniciando proceso de verificación de tareas próximas a vencer...',
    );

    const ahora = new Date();
    const dentroDe24Horas = new Date();
    dentroDe24Horas.setHours(ahora.getHours() + 24);

    try {
      const tareasProximas = await this.tasksRepository.find({
        where: {
          estado: In([TaskStatus.PENDIENTE, TaskStatus.EN_PROGRESO]),
          recordatorioEnviado: false,
          fechaFin: Between(ahora, dentroDe24Horas),
        },
        relations: ['proyecto', 'usuarioAsignado'],
      });

      if (tareasProximas.length === 0) {
        this.logger.log(
          'No hay tareas próximas a vencer que requieran recordatorio.',
        );
        return;
      }

      this.logger.log(
        `Se encontraron ${tareasProximas.length} tareas próximas a vencer.`,
      );

      for (const tarea of tareasProximas) {
        if (!tarea.usuarioAsignado || !tarea.usuarioAsignado.email) continue;

        const projectName = tarea.proyecto
          ? tarea.proyecto.nombre
          : 'Proyecto no especificado';

        // Enviar correo de recordatorio
        await this.mailService.sendTaskDueReminderNotification(
          tarea.usuarioAsignado.email,
          projectName,
          tarea.titulo,
          tarea.fechaFin,
        );

        // Marcar como enviado para no duplicar (Criterio 5)
        tarea.recordatorioEnviado = true;
        await this.tasksRepository.save(tarea);

        this.logger.log(
          `Recordatorio enviado a ${tarea.usuarioAsignado.email} para la tarea: ${tarea.titulo}`,
        );
      }

      this.logger.log(
        'Proceso de verificación de tareas próximas a vencer finalizado.',
      );
    } catch (error) {
      this.logger.error(
        'Error durante el proceso de verificación de tareas: ' + error.message,
        error.stack,
      );
    }
  }
}
