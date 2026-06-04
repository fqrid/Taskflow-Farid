import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const smtpPort = this.configService.get<number>('SMTP_PORT') || 587;
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: smtpPort,
      secure: smtpPort === 465,
      requireTLS: true,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendTaskAssignmentNotification(
    email: string,
    projectName: string,
    taskTitle: string,
    estado: string,
  ): Promise<void> {
    try {
      const logoPath = path.join(
        process.cwd(),
        'frontend',
        'public',
        'brand',
        'logo-color.png',
      );

      await this.transporter.sendMail({
        from: `"Task Flow Pro" <${this.configService.get<string>('SMTP_USER')}>`,
        to: email,
        subject: `Nueva Tarea Asignada: ${taskTitle}`,
        text: `Hola,\n\nSe te ha asignado una nueva tarea en el proyecto "${projectName}".\n\nDetalles:\n- Tarea: ${taskTitle}\n- Estado inicial: ${estado}\n\nPor favor, revisa el sistema para más detalles.\n\nSaludos,\nEl equipo de Task Flow Pro`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
              body {
                font-family: 'Inter', Helvetica, Arial, sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 40px 15px;
                color: #1f2937;
                -webkit-font-smoothing: antialiased;
              }
              .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #f3f4f6;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              }
              .header {
                background-color: #f9fafb;
                padding: 60px 0 50px 0;
                text-align: center;
                border-bottom: 1px solid #e5e7eb;
              }
              .header img {
                max-width: 240px;
                height: auto;
                display: block;
                margin: 0 auto;
              }
              .content {
                padding: 40px;
              }
              .sub-title {
                font-size: 13px;
                font-weight: 600;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-top: 0;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                line-height: 1.6;
                color: #374151;
                margin-bottom: 35px;
              }
              .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                overflow: hidden;
              }
              .data-row {
                border-bottom: 1px solid #e5e7eb;
              }
              .data-row:last-child {
                border-bottom: none;
              }
              .data-label {
                padding: 16px 20px;
                background-color: #f9fafb;
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
                width: 35%;
                vertical-align: middle;
              }
              .data-value {
                padding: 16px 20px;
                font-size: 15px;
                color: #111827;
                font-weight: 600;
                vertical-align: middle;
              }
              .status-badge {
                display: inline-block;
                background-color: #ecfdf5;
                color: #047857;
                border: 1px solid #a7f3d0;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
              }
              .cta-container {
                text-align: center;
              }
              .cta-button {
                display: inline-block;
                background-color: #111827;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 15px;
              }
              .footer {
                padding: 25px 40px;
                text-align: center;
                background-color: #f9fafb;
                border-top: 1px solid #e5e7eb;
              }
              .footer p {
                margin: 0 0 5px 0;
                font-size: 13px;
                color: #9ca3af;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="cid:logo_brand" alt="Task Flow Pro">
                </div>
                <div class="content">
                  <p class="sub-title">Notificación de asignación</p>
                  <p class="message">Hola, se te ha asignado una nueva tarea en la plataforma. Por favor, revisa los detalles de la misma a continuación:</p>
                  
                  <table class="data-table">
                    <tr class="data-row">
                      <td class="data-label">Proyecto</td>
                      <td class="data-value">${projectName}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="data-label">Tarea</td>
                      <td class="data-value">${taskTitle}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="data-label">Estado</td>
                      <td class="data-value">
                        <span class="status-badge">${estado}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <div class="cta-container">
                    <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}" class="cta-button">Ver en la plataforma</a>
                  </div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Task Flow Pro. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: 'logo-color.png',
            path: logoPath,
            cid: 'logo_brand',
          },
        ],
      });
      this.logger.log(`Correo de notificación enviado exitosamente a ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando correo a ${email}: ${error.message}`,
        error.stack,
      );
    }
  }

  async sendTaskDueReminderNotification(
    email: string,
    projectName: string,
    taskTitle: string,
    fechaFin: Date,
  ): Promise<void> {
    try {
      const logoPath = path.join(
        process.cwd(),
        'frontend',
        'public',
        'brand',
        'logo-color.png',
      );

      // Formatear la fecha para mostrar la hora exacta de vencimiento
      const formatter = new Intl.DateTimeFormat('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      });
      const fechaVencimientoFormateada = formatter.format(new Date(fechaFin));

      await this.transporter.sendMail({
        from: `"Task Flow Pro" <${this.configService.get<string>('SMTP_USER')}>`,
        to: email,
        subject: `⚠️ Alerta de Vencimiento: ${taskTitle}`,
        text: `Hola,\n\nEste es un recordatorio de que tu tarea "${taskTitle}" en el proyecto "${projectName}" vencerá en menos de 24 horas.\n\nHora exacta de vencimiento: ${fechaVencimientoFormateada}\n\nPor favor, asegúrate de completarla a tiempo.\n\nSaludos,\nEl equipo de Task Flow Pro`,
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
              body {
                font-family: 'Inter', Helvetica, Arial, sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 40px 15px;
                color: #1f2937;
                -webkit-font-smoothing: antialiased;
              }
              .wrapper {
                width: 100%;
                table-layout: fixed;
                background-color: #f3f4f6;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
              }
              .header {
                background-color: #f9fafb;
                padding: 60px 0 50px 0;
                text-align: center;
                border-bottom: 1px solid #e5e7eb;
              }
              .header img {
                max-width: 240px;
                height: auto;
                display: block;
                margin: 0 auto;
              }
              .content {
                padding: 40px;
              }
              .sub-title {
                font-size: 13px;
                font-weight: 600;
                color: #ef4444;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                margin-top: 0;
                margin-bottom: 20px;
              }
              .message {
                font-size: 16px;
                line-height: 1.6;
                color: #374151;
                margin-bottom: 35px;
              }
              .data-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 40px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                overflow: hidden;
              }
              .data-row {
                border-bottom: 1px solid #e5e7eb;
              }
              .data-row:last-child {
                border-bottom: none;
              }
              .data-label {
                padding: 16px 20px;
                background-color: #f9fafb;
                font-size: 14px;
                color: #6b7280;
                font-weight: 500;
                width: 35%;
                vertical-align: middle;
              }
              .data-value {
                padding: 16px 20px;
                font-size: 15px;
                color: #111827;
                font-weight: 600;
                vertical-align: middle;
              }
              .alert-badge {
                display: inline-block;
                background-color: #fef2f2;
                color: #b91c1c;
                border: 1px solid #fecaca;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 600;
              }
              .cta-container {
                text-align: center;
              }
              .cta-button {
                display: inline-block;
                background-color: #ef4444;
                color: #ffffff;
                text-decoration: none;
                padding: 14px 32px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 15px;
              }
              .footer {
                padding: 25px 40px;
                text-align: center;
                background-color: #f9fafb;
                border-top: 1px solid #e5e7eb;
              }
              .footer p {
                margin: 0 0 5px 0;
                font-size: 13px;
                color: #9ca3af;
              }
            </style>
          </head>
          <body>
            <div class="wrapper">
              <div class="container">
                <div class="header">
                  <img src="cid:logo_brand" alt="Task Flow Pro">
                </div>
                <div class="content">
                  <p class="sub-title">Alerta de Vencimiento de Tarea</p>
                  <p class="message">Hola, este es un recordatorio automático. Tienes una tarea que expira en menos de 24 horas.</p>
                  
                  <table class="data-table">
                    <tr class="data-row">
                      <td class="data-label">Proyecto</td>
                      <td class="data-value">${projectName}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="data-label">Tarea</td>
                      <td class="data-value">${taskTitle}</td>
                    </tr>
                    <tr class="data-row">
                      <td class="data-label">Vencimiento</td>
                      <td class="data-value">
                        <span class="alert-badge">${fechaVencimientoFormateada}</span>
                      </td>
                    </tr>
                  </table>
                  
                  <div class="cta-container">
                    <a href="${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173'}" class="cta-button">Ir a la plataforma</a>
                  </div>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} Task Flow Pro. Todos los derechos reservados.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: 'logo-color.png',
            path: logoPath,
            cid: 'logo_brand',
          },
        ],
      });
      this.logger.log(
        `Correo de alerta de vencimiento enviado exitosamente a ${email}`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando correo de alerta a ${email}: ${error.message}`,
        error.stack,
      );
    }
  }
}
