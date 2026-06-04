import { Bell, LogOut, Search, Wifi } from 'lucide-react';
import { getInitials } from '../utils/formatters';

export default function Topbar({ user, role, showSearch = true, placeholder = 'Buscar...', onLogout }) {
  return (
    <header className="topbar">
      {showSearch ? (
        <label className="topbar__search">
          <Search size={22} />
          <input type="search" placeholder={placeholder} />
        </label>
      ) : (
        <div />
      )}

      <div className="topbar__actions">
        <button className="icon-button" type="button" aria-label="Notificaciones">
          <Bell size={22} />
          <span className="notification-dot" />
        </button>
        <button className="icon-button" type="button" aria-label="Estado de conexion">
          <Wifi size={22} />
        </button>
        <div className="topbar__divider" />
        <div className="avatar avatar--photo" aria-label={user?.nombre || 'Usuario'}>
          {getInitials(user?.nombre)}
        </div>
        <div className="topbar__identity">
          <strong className="topbar__name">{user?.nombre || 'Usuario'}</strong>
          <small>{role || 'SIN ROL'}</small>
        </div>
        <button className="icon-button" type="button" aria-label="Cerrar sesion" onClick={onLogout}>
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
