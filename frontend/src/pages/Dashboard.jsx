import { Link, useOutletContext } from 'react-router-dom';
import { CheckCircle2, ListChecks, Timer, TrendingUp } from 'lucide-react';

const MetricIcon = ({ type }) => {
  const icons = {
    pending: ListChecks,
    progress: TrendingUp,
    done: CheckCircle2,
    total: Timer,
  };
  const Icon = icons[type] || ListChecks;
  return <Icon size={24} />;
};

export default function Dashboard() {
  const { session, role, projects, tasks, loadingData, onNewProject } = useOutletContext();
  const pending = tasks.filter((task) => task.estado === 'pendiente').length;
  const progress = tasks.filter((task) => task.estado === 'en_progreso').length;
  const done = tasks.filter((task) => task.estado === 'completada').length;
  const total = tasks.length;
  const canCreateProject = role === 'ADMIN' || role === 'GERENTE';

  const metrics = [
    { label: 'Tareas pendientes', value: pending, type: 'pending' },
    { label: 'En progreso', value: progress, type: 'progress' },
    { label: 'Completadas', value: done, type: 'done' },
    { label: 'Total tareas', value: total, type: 'total' },
  ];

  return (
    <section className="page dashboard-page">
      <div className="page-heading page-heading--split">
        <div>
          <span className="eyebrow">{role || 'USUARIO'}</span>
          <h1>Hola, {session?.user?.nombre || 'Usuario'}</h1>
          <p>Resumen en tiempo real con datos de la API.</p>
        </div>
        {canCreateProject ? (
          <button className="button button--primary" type="button" onClick={onNewProject}>
            Nuevo proyecto
          </button>
        ) : null}
      </div>

      <div className="metrics-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className="metric-card">
            <div>
              <strong>{metric.label}</strong>
              <b>{metric.value}</b>
            </div>
            <MetricIcon type={metric.type} />
          </article>
        ))}
      </div>

      <section className="content-section">
        <div className="section-title">
          <h2>Proyectos</h2>
          <Link to="/projects">Ver todos</Link>
        </div>

        <div className="project-list">
          {(projects || []).map((project) => (
            <Link className="project-row" key={project.id} to="/projects">
              <div className="project-row__title">
                <strong>{project.nombre}</strong>
                <span>{project.descripcion || 'Sin descripcion'}</span>
              </div>
              <div className="progress-cell">
                <span>{project.fechaInicio || '-'}</span>
              </div>
              <span className="status-badge status-badge--neutral">
                {project.fechaFin ? `Fin: ${project.fechaFin}` : 'Sin fecha fin'}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {loadingData ? <p className="dashboard-footnote">Actualizando datos...</p> : null}
    </section>
  );
}
