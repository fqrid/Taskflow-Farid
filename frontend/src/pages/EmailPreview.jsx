import { ArrowRight, CheckCircle2, ClipboardList, Lock } from 'lucide-react';

export default function EmailPreview({ task, project }) {
  return (
    <main className="email-page">
      <header className="email-page__brand">
        <img src="/brand/logo-blanco-negro.png" alt="TaskFlow Pro" />
      </header>

      <div className="success-pill">
        <CheckCircle2 size={19} />
        NOTIFICACION ENVIADA
      </div>

      <section className="mail-window">
        <header className="mail-window__chrome">
          <div>
            <span className="chrome-dot chrome-dot--red" />
            <span className="chrome-dot chrome-dot--yellow" />
            <span className="chrome-dot chrome-dot--green" />
          </div>
          <span>
            <Lock size={16} />
            Seguro
          </span>
        </header>

        <h1>Nueva tarea asignada: {task?.titulo || 'Sin tarea reciente'}</h1>

        <div className="mail-window__body">
          <article className="email-card">
            <span className="email-card__icon">
              <ClipboardList size={28} />
            </span>
            <h2>Detalle enviado</h2>
            <dl>
              <div>
                <dt>Proyecto</dt>
                <dd>{project?.nombre || '-'}</dd>
              </div>
              <div>
                <dt>Estado</dt>
                <dd>{task?.estado || '-'}</dd>
              </div>
              <div>
                <dt>Asignado a</dt>
                <dd>{task?.usuarioAsignado?.nombre || 'Sin asignar'}</dd>
              </div>
            </dl>
            <button className="button button--primary" type="button">
              <span>Volver al tablero</span>
              <ArrowRight size={22} />
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
