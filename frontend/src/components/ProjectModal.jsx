import { useState } from 'react';
import { CalendarDays, CheckCircle2, X } from 'lucide-react';

const initialForm = {
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
};

export default function ProjectModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      setForm(initialForm);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-project-title">
      <form className="task-modal task-modal--compact" onSubmit={submit}>
        <header className="task-modal__header">
          <h2 id="new-project-title">Nuevo Proyecto</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar modal">
            <X size={25} />
          </button>
        </header>

        <section className="task-modal__body">
          <label className="field">
            <span>Nombre del proyecto</span>
            <input
              required
              value={form.nombre}
              onChange={(event) => updateField('nombre', event.target.value)}
              placeholder="Ej: Plataforma Omega"
            />
          </label>

          <label className="field">
            <span>Descripción</span>
            <textarea
              value={form.descripcion}
              onChange={(event) => updateField('descripcion', event.target.value)}
              placeholder="Describe el alcance principal del proyecto..."
              rows={4}
            />
          </label>

          <div className="form-grid form-grid--two">
            <label className="field field--date">
              <span>Fecha inicio</span>
              <input
                required
                type="date"
                value={form.fechaInicio}
                onChange={(event) => updateField('fechaInicio', event.target.value)}
              />
              <CalendarDays size={19} />
            </label>

            <label className="field field--date">
              <span>Fecha fin</span>
              <input
                type="date"
                value={form.fechaFin}
                onChange={(event) => updateField('fechaFin', event.target.value)}
              />
              <CalendarDays size={19} />
            </label>
          </div>
        </section>

        <footer className="task-modal__footer">
          <button className="button button--secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button--primary" type="submit" disabled={saving}>
            <CheckCircle2 size={20} />
            <span>{saving ? 'Creando...' : 'Crear proyecto'}</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
