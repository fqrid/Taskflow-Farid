import { CheckCircle2, Mail, X } from 'lucide-react';

/**
 * MailSentAlert – modal informativo que se muestra al GERENTE
 * cuando una tarea es asignada y se dispara la notificación por correo.
 *
 * Props:
 *   email    {string}   – dirección a la que se envió el correo
 *   taskTitle {string}  – título de la tarea asignada
 *   onClose  {()=>void} – callback para cerrar el modal
 */
export default function MailSentAlert({ email, taskTitle, onClose }) {
  if (!email) return null;

  return (
    <div className="mail-alert-backdrop" role="dialog" aria-modal="true" aria-labelledby="mail-alert-title" onClick={onClose}>
      <div className="mail-alert" onClick={(e) => e.stopPropagation()}>

        {/* Botón cerrar */}
        <button className="mail-alert__close icon-button" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        {/* Icono de éxito */}
        <div className="mail-alert__icon-wrap">
          <CheckCircle2 size={38} strokeWidth={2} />
        </div>

        {/* Cuerpo */}
        <div className="mail-alert__body">
          <h2 id="mail-alert-title">¡Tarea asignada!</h2>
          <p className="mail-alert__sub">
            Se ha enviado una notificación al correo del desarrollador asignado.
          </p>

          {taskTitle && (
            <p className="mail-alert__task-label">
              <strong>Tarea:</strong> {taskTitle}
            </p>
          )}

          {/* Chip de correo */}
          <div className="mail-alert__email-chip">
            <Mail size={16} />
            <span>{email}</span>
          </div>
        </div>

        {/* Pie */}
        <footer className="mail-alert__footer">
          <button className="button button--primary" type="button" onClick={onClose}>
            Entendido
          </button>
        </footer>
      </div>
    </div>
  );
}
