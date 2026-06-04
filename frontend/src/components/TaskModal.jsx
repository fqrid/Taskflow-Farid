import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, X } from 'lucide-react';

const initialForm = {
  titulo: '',
  descripcion: '',
  idUsuarioAsignado: '',
  fechaFin: '',
};

export default function TaskModal({ open, users, onClose, onSubmit, project, role }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const assignees = useMemo(
    () => users.filter((user) => user.rol?.nombre === 'DESARROLLADOR'),
    [users],
  );

  if (!open || role !== 'GERENTE') return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        ...form,
        idProyecto: project?.id,
      });
      setForm(initialForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
      <form className="task-modal" onSubmit={submit}>
        <header className="task-modal__header">
          <h2 id="new-task-title">Nueva tarea</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar modal">
            <X size={25} />
          </button>
        </header>

        <section className="task-modal__body">
          <label className="field">
            <span>Titulo de la tarea</span>
            <input
              required
              value={form.titulo}
              onChange={(event) => updateField('titulo', event.target.value)}
              placeholder="Ej: Implementar endpoint"
            />
          </label>

          <label className="field">
            <span>Descripcion</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => updateField('descripcion', event.target.value)}
              placeholder="Detalle tecnico"
              rows={4}
            />
          </label>

          <label className="field">
            <span>Fecha de Vencimiento</span>
            <input
              type="datetime-local"
              required
              value={form.fechaFin}
              onChange={(event) => updateField('fechaFin', event.target.value)}
            />
          </label>

          <label className="field field--select">
            <span>Asignar a desarrollador</span>
            <select
              value={form.idUsuarioAsignado}
              onChange={(event) => updateField('idUsuarioAsignado', event.target.value)}
            >
              <option value="">Seleccionar usuario...</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.nombre}
                </option>
              ))}
            </select>
            <ChevronDown size={21} />
          </label>
        </section>

        <footer className="task-modal__footer">
          <button className="button button--secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button--primary" type="submit" disabled={saving}>
            <CheckCircle2 size={20} />
            <span>{saving ? 'Creando...' : 'Crear tarea'}</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
