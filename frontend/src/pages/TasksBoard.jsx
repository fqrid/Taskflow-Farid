import { useMemo, useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MoreHorizontal, Trash2, X } from 'lucide-react';
import { statusColumns, formatFullDate, statusLabel } from '../utils/formatters';
import { useTaskSocket } from '../hooks/useTaskSocket';

export default function TasksBoard() {

  const { session, role, projects, tasks, onMoveTask, onDeleteTask, selectedProjectId, onSelectProject } = useOutletContext();
  const [draggedTask, setDraggedTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskScope, setTaskScope] = useState('mine');
  const token  = session?.accessToken ?? null;
  const userId = session?.user?.id    ?? null;
  const projectTasks = useMemo(
    () => {
      const byProject = selectedProjectId ? tasks.filter((t) => t.idProyecto === selectedProjectId) : [];
      if (role !== 'DESARROLLADOR') return byProject;
      if (taskScope === 'project') return byProject;
      return byProject.filter((task) => task.idUsuarioAsignado === session?.user?.id);
    },
    [role, session?.user?.id, taskScope, tasks, selectedProjectId],
  );
  const currentProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  // Copia local para aplicar cambios en tiempo real sin esperar al padre
  const [localTasks, setLocalTasks] = useState(projectTasks);

  // Sincronizar cuando el padre recarga o cambia de proyecto
  useEffect(() => {
    setLocalTasks(projectTasks);
  }, [projectTasks]);

  useEffect(() => {
    setSelectedTask((current) => {
      if (!current) return null;
      return projectTasks.find((task) => task.id === current.id) || null;
    });
  }, [projectTasks]);

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const handleRemoteTaskMoved = useCallback(({ taskId, newStatus }) => {
    setLocalTasks((prev) =>
      prev.map((t) => String(t.id) === String(taskId) ? { ...t, estado: newStatus } : t)
    );
  }, []);

  const handleMoveError = useCallback(({ taskId, previousStatus, message }) => {
    console.warn(`[Kanban] Rollback tarea ${taskId} → ${previousStatus}:`, message);
    setLocalTasks((prev) =>
      prev.map((t) => String(t.id) === String(taskId) ? { ...t, estado: previousStatus } : t)
    );
  }, []);

  const { emitTaskMoved, isConnected } = useTaskSocket({
    projectId: selectedProjectId,
    token,
    userId,
    onTaskMoved: handleRemoteTaskMoved,
    onMoveError: handleMoveError,
  });

  const canDeleteTask = role === 'ADMIN';

  const groupedTasks = useMemo(() => {
  return statusColumns.reduce((acc, column) => {
    acc[column.id] = localTasks.filter((task) => task.estado === column.id);
    return acc;
    }, {});
  }, [localTasks]);

  const canMoveTask = (task) => task.idUsuarioAsignado === session?.user?.id;

  const dropTask = (newStatus) => {
    if (!draggedTask) return;

    const previousStatus = draggedTask.estado;
    if (previousStatus === newStatus) {
      setDraggedTask(null);
      return;
    }

    setLocalTasks((prev) =>
      prev.map((t) =>
        String(t.id) === String(draggedTask.id) ? { ...t, estado: newStatus } : t
      )
    );

    const enviado = emitTaskMoved(draggedTask.id, newStatus, previousStatus);

    if (!enviado) {
      onMoveTask(draggedTask.id, newStatus);
    }

    setDraggedTask(null);
  };

  return (
    <section className="page board-page">
      <div className="page-heading page-heading--board">
        <div>
          <h1>Tablero de tareas</h1>
          <p>{role === 'DESARROLLADOR' ? 'Tareas del proyecto con filtro personal' : 'Todas las tareas del proyecto seleccionado'}</p>
        </div>
        <div className="board-controls">
          <label className="board-project-filter">
            <span>Proyecto</span>
            <select value={selectedProjectId || ''} onChange={(event) => onSelectProject(event.target.value)}>
              {(projects || []).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.nombre}
                </option>
              ))}
            </select>
          </label>
          {role === 'DESARROLLADOR' ? (
            <div className="board-scope-toggle" aria-label="Filtro de tareas">
              <button
                className={taskScope === 'mine' ? 'is-active' : ''}
                type="button"
                onClick={() => setTaskScope('mine')}
              >
                Mis tareas
              </button>
              <button
                className={taskScope === 'project' ? 'is-active' : ''}
                type="button"
                onClick={() => setTaskScope('project')}
              >
                Todas
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="board-context">
        <strong>{currentProject?.nombre || 'Sin proyecto seleccionado'}</strong>
        <span>{localTasks.length} tareas visibles</span>
      </div>

      <div className="kanban-board">
        {statusColumns.map((column) => (
          <section
            className="kanban-column"
            key={column.id}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => dropTask(column.id)}
          >
            <header>
              <strong>{column.label}</strong>
              <span>{groupedTasks[column.id]?.length || 0}</span>
            </header>
            <div className="kanban-column__body">
              {(groupedTasks[column.id] || []).map((task) => (
                <article
                  className="task-card"
                  key={task.id}
                  draggable={canMoveTask(task)}
                  onDragStart={() => setDraggedTask(task)}
                  onDragEnd={() => setDraggedTask(null)}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-card__top">
                    <span className="priority">{statusLabel[task.estado] || task.estado}</span>
                    <MoreHorizontal size={18} />
                  </div>
                  <h3>{task.titulo}</h3>
                  {task.fechaFin && (
                    <p style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px' }}>
                      Vence: {formatFullDate(task.fechaFin)}
                    </p>
                  )}
                  <footer>
                    <span>{task.usuarioAsignado?.nombre || 'Sin asignar'}</span>
                    {canDeleteTask ? (
                      <button
                        className="icon-button"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        aria-label="Eliminar tarea"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </footer>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedTask ? (
        <aside className="task-detail-float" aria-label="Detalle de tarea">
          <div className="task-detail-float__header">
            <div>
              <span className="priority">{statusLabel[selectedTask.estado] || selectedTask.estado}</span>
              <h2>{selectedTask.titulo}</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => setSelectedTask(null)} aria-label="Cerrar detalle">
              <X size={18} />
            </button>
          </div>
          <dl className="task-detail-float__list">
            <div>
              <dt>Proyecto</dt>
              <dd>{currentProject?.nombre || '-'}</dd>
            </div>
            <div>
              <dt>Asignado</dt>
              <dd>{selectedTask.usuarioAsignado?.nombre || 'Sin asignar'}</dd>
            </div>
            <div>
              <dt>Fecha fin</dt>
              <dd>{formatFullDate(selectedTask.fechaFin)}</dd>
            </div>
            <div>
              <dt>Descripcion</dt>
              <dd>{selectedTask.descripcion || 'Sin descripcion'}</dd>
            </div>
          </dl>
        </aside>
      ) : null}
    </section>
  );
}
