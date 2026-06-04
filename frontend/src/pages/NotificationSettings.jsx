import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const emptyUserForm = {
  email: '',
  nombre: '',
  password: '',
  rol: 'DESARROLLADOR',
  activo: true,
};

export default function NotificationSettings() {
  const {
    role,
    authProfile,
    userProfile,
    users,
    roles,
    onCreateUser,
    onUpdateUser,
    onAssignRole,
    onDeleteUser,
    onViewUser,
  } = useOutletContext();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', activo: true });
  const isAdmin = role === 'ADMIN';

  const loadUserDetail = async (id) => {
    setSelectedUserId(id);
    const detail = await onViewUser(id);
    if (!detail) return;
    setEditForm({
      nombre: detail.nombre || '',
      email: detail.email || '',
      activo: detail.activo ?? true,
    });
  };

  return (
    <section className="page settings-page">
      <div className="page-heading">
        <h1>Perfil y permisos</h1>
        <p>Datos reales del usuario autenticado y herramientas segun rol.</p>
      </div>

      <div className="settings-stack">
        <article className="settings-card">
          <div className="settings-card__header">
            <h2>Perfil actual</h2>
          </div>
          <dl className="detail-list">
            <div>
              <dt>Nombre</dt>
              <dd>{authProfile?.nombre || '-'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{authProfile?.email || '-'}</dd>
            </div>
            <div>
              <dt>Rol</dt>
              <dd>{authProfile?.rol?.nombre || role}</dd>
            </div>
            <div>
              <dt>Estado</dt>
              <dd>{userProfile?.activo ? 'Activo' : 'Inactivo'}</dd>
            </div>
          </dl>
        </article>

        {(role === 'ADMIN' || role === 'GERENTE') ? (
          <article className="settings-card">
            <div className="settings-card__header">
              <h2>Usuarios</h2>
            </div>
            <div className="mini-task-list">
              {users.map((user) => (
                <article key={user.id} className="mini-task">
                  <div>
                    <strong>{user.nombre}</strong>
                    <p>{user.email}</p>
                  </div>
                  <div className="table-actions">
                    <span className="status-badge status-badge--neutral">{user.rol?.nombre || '-'}</span>
                    <button className="button button--secondary" type="button" onClick={() => loadUserDetail(user.id)}>
                      Ver
                    </button>
                    {isAdmin ? (
                      <button className="button button--secondary" type="button" onClick={() => onDeleteUser(user.id)}>
                        Eliminar
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>
        ) : null}

        {isAdmin ? (
          <article className="settings-card">
            <div className="settings-card__header">
              <h2>Crear usuario</h2>
            </div>
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Nombre</span>
                <input value={userForm.nombre} onChange={(event) => setUserForm((v) => ({ ...v, nombre: event.target.value }))} />
              </label>
              <label className="field">
                <span>Email</span>
                <input value={userForm.email} onChange={(event) => setUserForm((v) => ({ ...v, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Password</span>
                <input type="password" value={userForm.password} onChange={(event) => setUserForm((v) => ({ ...v, password: event.target.value }))} />
              </label>
              <label className="field">
                <span>Rol</span>
                <select value={userForm.rol} onChange={(event) => setUserForm((v) => ({ ...v, rol: event.target.value }))}>
                  {(roles || []).map((item) => (
                    <option key={item.id} value={item.nombre}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table-actions" style={{ marginTop: '16px' }}>
              <button className="button button--primary" type="button" onClick={() => onCreateUser(userForm)}>
                Crear usuario
              </button>
            </div>
          </article>
        ) : null}

        {isAdmin && selectedUserId ? (
          <article className="settings-card">
            <div className="settings-card__header">
              <h2>Editar usuario</h2>
            </div>
            <div className="form-grid form-grid--two">
              <label className="field">
                <span>Nombre</span>
                <input value={editForm.nombre} onChange={(event) => setEditForm((v) => ({ ...v, nombre: event.target.value }))} />
              </label>
              <label className="field">
                <span>Email</span>
                <input value={editForm.email} onChange={(event) => setEditForm((v) => ({ ...v, email: event.target.value }))} />
              </label>
              <label className="field">
                <span>Activo</span>
                <select value={String(editForm.activo)} onChange={(event) => setEditForm((v) => ({ ...v, activo: event.target.value === 'true' }))}>
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </label>
              <label className="field">
                <span>Rol</span>
                <select defaultValue="" onChange={(event) => event.target.value && onAssignRole(selectedUserId, event.target.value)}>
                  <option value="">Seleccionar rol...</option>
                  {(roles || []).map((item) => (
                    <option key={item.id} value={item.nombre}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table-actions" style={{ marginTop: '16px' }}>
              <button className="button button--primary" type="button" onClick={() => onUpdateUser(selectedUserId, editForm)}>
                Guardar cambios
              </button>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
