import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CheckCircle2, Folder } from 'lucide-react';
import { formatFullDate } from '../utils/formatters';
import ChatPanel from '../components/ChatPanel';

export default function ProjectWorkspace() {
  const {
    role,
    projects,
    currentProject,
    selectedProjectId,
    projectDetail,
    onSelectProject,
    onNewTask,
    onUpdateProject,
    onDeleteProject,
  } = useOutletContext();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
  });

  const canCreateTask = role === 'GERENTE';
  const canDeleteProject = role === 'ADMIN';
  const canEditProject = role === 'ADMIN' || currentProject?.idUsuario === currentProject?.usuarioCreador?.id;
  const canManageProject = role === 'ADMIN' || role === 'GERENTE';

  const startEdit = () => {
    setForm({
      nombre: currentProject?.nombre || '',
      descripcion: currentProject?.descripcion || '',
      fechaInicio: currentProject?.fechaInicio || '',
      fechaFin: currentProject?.fechaFin || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    await onUpdateProject(selectedProjectId, form);
    setEditing(false);
  };

  return (
    <section className="page project-page">
      <div className="page-heading page-heading--split">
        <div>
          <span className="breadcrumb">
            <Folder size={18} />
            Proyectos
          </span>
          <h1>{currentProject?.nombre || 'Sin proyectos'}</h1>
        </div>
        {canCreateTask ? (
          <button className="button button--primary" type="button" onClick={onNewTask}>
            <CheckCircle2 size={20} />
            <span>Asignar tarea</span>
          </button>
        ) : null}
      </div>

      <div className="settings-layout" style={{ display: 'flex', gap: '16px', height: 'calc(100vh - 200px)' }}>
        <aside className="settings-menu">
          {(projects || []).map((project) => (
            <button
              key={project.id}
              className={project.id === selectedProjectId ? 'is-active' : ''}
              type="button"
              onClick={() => onSelectProject(project.id)}
            >
              {project.nombre}
            </button>
          ))}
        </aside>

        {canManageProject ? (
          <div className="settings-stack" style={{ flex: 1, overflowY: 'auto' }}>
            <article className="settings-card">
              <div className="settings-card__header settings-card__header--split">
                <h2>Detalle del proyecto</h2>
                {canEditProject ? (
                  <button className="button button--secondary" type="button" onClick={editing ? saveEdit : startEdit}>
                    {editing ? 'Guardar' : 'Editar'}
                  </button>
                ) : null}
              </div>

              {editing ? (
                <div className="form-grid">
                  <label className="field">
                    <span>Nombre</span>
                    <input value={form.nombre} onChange={(event) => setForm((v) => ({ ...v, nombre: event.target.value }))} />
                  </label>
                  <label className="field">
                    <span>Descripcion</span>
                    <textarea value={form.descripcion} onChange={(event) => setForm((v) => ({ ...v, descripcion: event.target.value }))} rows={4} />
                  </label>
                  <div className="form-grid form-grid--two">
                    <label className="field">
                      <span>Fecha inicio</span>
                      <input type="date" value={form.fechaInicio || ''} onChange={(event) => setForm((v) => ({ ...v, fechaInicio: event.target.value }))} />
                    </label>
                    <label className="field">
                      <span>Fecha fin</span>
                      <input type="date" value={form.fechaFin || ''} onChange={(event) => setForm((v) => ({ ...v, fechaFin: event.target.value }))} />
                    </label>
                  </div>
                </div>
              ) : (
                <dl className="detail-list">
                  <div>
                    <dt>Nombre</dt>
                    <dd>{projectDetail?.nombre || currentProject?.nombre || '-'}</dd>
                  </div>
                  <div>
                    <dt>Descripcion</dt>
                    <dd>{projectDetail?.descripcion || currentProject?.descripcion || 'Sin descripcion'}</dd>
                  </div>
                  <div>
                    <dt>Inicio</dt>
                    <dd>{formatFullDate(projectDetail?.fechaInicio || currentProject?.fechaInicio)}</dd>
                  </div>
                  <div>
                    <dt>Fin</dt>
                    <dd>{formatFullDate(projectDetail?.fechaFin || currentProject?.fechaFin)}</dd>
                  </div>
                </dl>
              )}

              {canDeleteProject && currentProject ? (
                <div className="table-actions" style={{ marginTop: '16px' }}>
                  <button className="button button--secondary" type="button" onClick={() => onDeleteProject(currentProject.id)}>
                    Eliminar proyecto
                  </button>
                </div>
              ) : null}
            </article>
          </div>
        ) : null}

        {/* Chat Panel - Columna derecha */}
        {selectedProjectId && (
          <div style={{ width: '380px', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel projectId={selectedProjectId} projectName={currentProject?.nombre || 'Proyecto'} />
          </div>
        )}
      </div>
    </section>
  );
}
