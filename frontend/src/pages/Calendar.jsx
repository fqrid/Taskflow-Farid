import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock3 } from 'lucide-react';
import { formatFullDate } from '../utils/formatters';

export default function Calendar() {
  const { session, role, tasks } = useOutletContext();
  const visibleTasks = useMemo(() => {
    if (role !== 'DESARROLLADOR') return tasks;
    return tasks.filter((task) => task.idUsuarioAsignado === session?.user?.id);
  }, [role, session?.user?.id, tasks]);
  const orderedTasks = useMemo(
    () =>
      [...visibleTasks].sort(
        (a, b) => new Date(a.fechaCreacion || 0).getTime() - new Date(b.fechaCreacion || 0).getTime(),
      ),
    [visibleTasks],
  );

  return (
    <section className="page calendar-page">
      <div className="page-heading">
        <h1>Calendario de tareas</h1>
        <p>Ordenado por fecha de creacion registrada en la API.</p>
      </div>

      <div className="upcoming-card">
        <h2>Actividad</h2>
        {orderedTasks.map((task) => (
          <article key={task.id}>
            <Clock3 size={20} />
            <div>
              <strong>{task.titulo}</strong>
              <span>{formatFullDate(task.fechaCreacion)}</span>
            </div>
          </article>
        ))}
        {!orderedTasks.length ? <p>No hay tareas para mostrar.</p> : null}
      </div>
    </section>
  );
}
