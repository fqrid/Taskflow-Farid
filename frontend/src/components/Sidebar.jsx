import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Folder,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
} from 'lucide-react';
import { getInitials } from '../utils/formatters';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Proyectos', icon: Folder },
  { to: '/tasks', label: 'Tareas', icon: ClipboardList },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
  { to: '/reports', label: 'Reportes', icon: BarChart3 },
  { to: '/settings', label: 'Configuracion', icon: Settings },
];

const menuByRole = {
  ADMIN: navItems,
  GERENTE: navItems,
  DESARROLLADOR: navItems.filter((item) => item.to !== '/reports'),
};

export default function Sidebar({ session, role, onNewProject, onLogout }) {
  const canCreateProject = role === 'ADMIN' || role === 'GERENTE';
  const menu = menuByRole[role] || navItems;

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img src="/brand/logo-blanco-negro.png" alt="TaskFlow Pro" />
        <span>Task Management</span>
      </div>

      <nav className="sidebar__nav" aria-label="Navegacion principal">
        {menu.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className="sidebar__link">
            <Icon size={22} strokeWidth={2.1} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        {canCreateProject ? (
          <button className="button button--primary button--wide" type="button" onClick={onNewProject}>
            <Plus size={18} />
            <span>Nuevo proyecto</span>
          </button>
        ) : null}

        <div className="sidebar__profile">
          <span className="avatar avatar--tiny">{getInitials(session?.user?.nombre)}</span>
          <div className="sidebar__profile-copy">
            <strong>{session?.user?.nombre || 'Usuario'}</strong>
            <small>{role || 'SIN ROL'}</small>
          </div>
        </div>

        <button className="sidebar__logout" type="button" onClick={onLogout}>
          <LogOut size={18} />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </aside>
  );
}
