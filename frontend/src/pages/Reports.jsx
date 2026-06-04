import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, Folder, ListChecks } from 'lucide-react';

export default function Reports() {
  const { tasks, projects } = useOutletContext();

  const completionRate = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.estado === 'completada').length / tasks.length) * 100);
  }, [tasks]);

  return (
    <section className="page reports-page">
      <div className="page-heading">
        <h1>Reportes</h1>
        <p>Indicadores calculados con informacion real.</p>
      </div>

      <div className="report-grid">
        <article className="metric-card metric-card--report">
          <div>
            <strong>Proyectos</strong>
            <b>{projects.length}</b>
          </div>
          <Folder size={24} />
        </article>
        <article className="metric-card metric-card--report">
          <div>
            <strong>Tareas</strong>
            <b>{tasks.length}</b>
          </div>
          <ListChecks size={24} />
        </article>
        <article className="metric-card metric-card--report">
          <div>
            <strong>Completadas</strong>
            <b>{completionRate}%</b>
          </div>
          <CheckCircle2 size={24} />
        </article>
      </div>
    </section>
  );
}
