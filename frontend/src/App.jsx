import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import TaskModal from './components/TaskModal.jsx';
import MailSentAlert from './components/MailSentAlert.jsx';
import ProjectModal from './components/ProjectModal.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import ProjectWorkspace from './pages/ProjectWorkspace.jsx';
import TasksBoard from './pages/TasksBoard.jsx';
import NotificationSettings from './pages/NotificationSettings.jsx';
import EmailPreview from './pages/EmailPreview.jsx';
import Calendar from './pages/Calendar.jsx';
import Reports from './pages/Reports.jsx';
import {
  authService,
  clearStoredSession,
  getStoredSession,
  projectService,
  roleService,
  storeSession,
  taskService,
  userService,
} from './services/api';
import { roleName } from './utils/formatters';

const getApiMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'No fue posible completar la operacion.';

const toRole = (user) => roleName(user?.rol).toUpperCase();

function Shell({
  session,
  role,
  projects,
  users,
  roles,
  tasks,
  selectedProjectId,
  currentProject,
  projectDetail,
  authProfile,
  userProfile,
  loadingData,
  notice,
  onDismissNotice,
  onSelectProject,
  onNewTask,
  onNewProject,
  onUpdateProject,
  onDeleteProject,
  onCreateTask,
  onCreateProject,
  onMoveTask,
  onDeleteTask,
  onCreateUser,
  onUpdateUser,
  onAssignRole,
  onDeleteUser,
  onViewUser,
  onLogout,
  taskModalOpen,
  projectModalOpen,
  closeTaskModal,
  closeProjectModal,
  mailAlert,
  setMailAlert,
}) {
  const outletContext = {
    session,
    role,
    projects,
    users,
    roles,
    tasks,
    selectedProjectId,
    currentProject,
    projectDetail,
    authProfile,
    userProfile,
    loadingData,
    onSelectProject,
    onNewTask,
    onNewProject,
    onUpdateProject,
    onDeleteProject,
    onMoveTask,
    onDeleteTask,
    onCreateUser,
    onUpdateUser,
    onAssignRole,
    onDeleteUser,
    onViewUser,
  };

  return (
    <div className="app-shell">
      <Sidebar session={session} role={role} onNewProject={onNewProject} onLogout={onLogout} />
      <main className="workspace">
        <Topbar
          user={session?.user}
          role={role}
          placeholder="Buscar proyectos, tareas o miembros..."
          onLogout={onLogout}
        />
        <Outlet context={outletContext} />
      </main>

      {notice ? (
        <button className="toast" type="button" onClick={onDismissNotice}>
          {notice}
        </button>
      ) : null}

      {mailAlert ? (
        <MailSentAlert
          email={mailAlert.email}
          taskTitle={mailAlert.taskTitle}
          onClose={() => setMailAlert(null)}
        />
      ) : null}

      <TaskModal
        open={taskModalOpen}
        users={users}
        project={currentProject}
        role={role}
        onClose={closeTaskModal}
        onSubmit={onCreateTask}
      />
      <ProjectModal open={projectModalOpen} onClose={closeProjectModal} onSubmit={onCreateProject} />
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getStoredSession());
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDetail, setProjectDetail] = useState(null);
  const [authProfile, setAuthProfile] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [notice, setNotice] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [lastAssignedTask, setLastAssignedTask] = useState(null);
  const [mailAlert, setMailAlert] = useState(null); // { email, taskTitle }

  const accessToken = session?.accessToken || '';
  const role = useMemo(() => toRole(session?.user), [session?.user]);
  const canReadUsers = role === 'ADMIN' || role === 'GERENTE';
  const canCreateProject = role === 'ADMIN' || role === 'GERENTE';
  const canCreateTask = role === 'GERENTE';
  const canDeleteProject = role === 'ADMIN';
  const canDeleteTask = role === 'ADMIN';
  const canAdminUsers = role === 'ADMIN';

  const tasks = useMemo(() => Object.values(tasksByProject).flat(), [tasksByProject]);
  const visibleProjects = useMemo(() => {
    if (role !== 'DESARROLLADOR') return projects;

    const userId = session?.user?.id;
    if (!userId) return [];

    const assignedProjectIds = new Set(
      tasks
        .filter((task) => task.idUsuarioAsignado === userId)
        .map((task) => task.idProyecto),
    );

    return projects.filter((project) => assignedProjectIds.has(project.id));
  }, [projects, role, session?.user?.id, tasks]);
  const currentProject = useMemo(
    () => visibleProjects.find((project) => project.id === selectedProjectId) || null,
    [visibleProjects, selectedProjectId],
  );

  const showNotice = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(window.taskFlowNoticeTimer);
    window.taskFlowNoticeTimer = window.setTimeout(() => setNotice(''), 4200);
  }, []);

  const loadProjectTasks = useCallback(async (projectList) => {
    const entries = await Promise.all(
      projectList.map(async (project) => {
        const taskList = await taskService.listByProject(project.id);
        return [project.id, taskList || []];
      }),
    );
    return Object.fromEntries(entries);
  }, []);

  const refreshData = useCallback(async () => {
    if (!accessToken) return;

    setLoadingData(true);
    try {
      // No actualizar session aqui: evita loops de re-render y cascadas de requests.
      await authService.validateToken();

      const [authUser, profileUser, projectList, rolesList] = await Promise.all([
        authService.profile(),
        userService.profile(),
        projectService.list(),
        roleService.list(),
      ]);

      setAuthProfile(authUser);
      setUserProfile(profileUser);
      setProjects(projectList || []);
      setRoles(rolesList || []);

      if (canReadUsers) {
        const userList = await userService.list();
        setUsers(userList || []);
      } else {
        setUsers([]);
      }

      const byProject = await loadProjectTasks(projectList || []);
      setTasksByProject(byProject);

      setSelectedProjectId((current) => {
        if (!projectList?.length) return '';
        if (current && projectList.some((project) => project.id === current)) return current;
        return projectList[0].id;
      });
    } catch (error) {
      clearStoredSession();
      setSession(null);
      showNotice(getApiMessage(error));
      navigate('/login', { replace: true });
    } finally {
      setLoadingData(false);
    }
  }, [accessToken, canReadUsers, loadProjectTasks, navigate, showNotice]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setSelectedProjectId((current) => {
      if (!visibleProjects.length) return '';
      if (current && visibleProjects.some((project) => project.id === current)) return current;
      return visibleProjects[0].id;
    });
  }, [visibleProjects]);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDetail(null);
      return;
    }

    let active = true;
    projectService
      .get(selectedProjectId)
      .then((project) => {
        if (active) setProjectDetail(project);
      })
      .catch(() => {
        if (active) setProjectDetail(null);
      });

    return () => {
      active = false;
    };
  }, [selectedProjectId]);

  const handleLogin = async (credentials) => {
    const response = await authService.login(credentials);
    const nextSession = {
      accessToken: response.accessToken,
      user: response.usuario || response.user,
    };
    storeSession(nextSession);
    setSession(nextSession);
    navigate('/dashboard', { replace: true });
  };

  const handleRegister = async (payload) => {
    await authService.register(payload);
    showNotice('Usuario registrado. Ahora inicia sesion.');
  };

  const handleLogout = () => {
    clearStoredSession();
    setSession(null);
    navigate('/login', { replace: true });
  };

  const handleCreateProject = async (payload) => {
    if (!canCreateProject) return;
    try {
      await projectService.create(payload);
      setProjectModalOpen(false);
      await refreshData();
      showNotice('Proyecto creado correctamente.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleUpdateProject = async (projectId, payload) => {
    try {
      await projectService.update(projectId, payload);
      await refreshData();
      showNotice('Proyecto actualizado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!canDeleteProject) return;
    try {
      await projectService.remove(projectId);
      await refreshData();
      showNotice('Proyecto eliminado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleCreateTask = async (payload) => {
    if (!canCreateTask || !payload?.idProyecto) return;
    try {
      const fechaFinDate = payload.fechaFin ? new Date(payload.fechaFin) : null;
      const fechaFin =
        fechaFinDate && !Number.isNaN(fechaFinDate.getTime())
          ? fechaFinDate.toISOString()
          : payload.fechaFin;
      const createdTask = await taskService.create({
        titulo: payload.titulo,
        descripcion: payload.descripcion,
        idProyecto: payload.idProyecto,
        fechaFin,
      });

      let assignedTask = createdTask;
      let assignedUser = null;
      if (payload.idUsuarioAsignado) {
        assignedUser = users.find((u) => u.id === payload.idUsuarioAsignado);
        assignedTask = await taskService.assign(createdTask.id, {
          idUsuarioAsignado: payload.idUsuarioAsignado,
        });
      }

      setLastAssignedTask(assignedTask);
      setTaskModalOpen(false);
      await refreshData();

      if (assignedUser && assignedUser.email) {
        setMailAlert({ email: assignedUser.email, taskTitle: assignedTask.titulo });
      } else {
        showNotice('Tarea creada correctamente.');
      }
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleMoveTask = async (taskId, nextStatus) => {
    try {
      await taskService.updateStatus(taskId, nextStatus);
      setTasksByProject((current) => {
        const updated = { ...current };
        Object.keys(updated).forEach((projectId) => {
          updated[projectId] = updated[projectId].map((task) =>
            task.id === taskId ? { ...task, estado: nextStatus } : task,
          );
        });
        return updated;
      });
      showNotice('Estado de tarea actualizado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!canDeleteTask) return;
    try {
      await taskService.remove(taskId);
      await refreshData();
      showNotice('Tarea eliminada.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleCreateUser = async (payload) => {
    if (!canAdminUsers) return;
    try {
      await userService.create(payload);
      await refreshData();
      showNotice('Usuario creado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleUpdateUser = async (id, payload) => {
    if (!canAdminUsers) return;
    try {
      await userService.update(id, payload);
      await refreshData();
      showNotice('Usuario actualizado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleAssignRole = async (id, rol) => {
    if (!canAdminUsers) return;
    try {
      await userService.assignRole(id, rol);
      await refreshData();
      showNotice('Rol actualizado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleDeleteUser = async (id) => {
    if (!canAdminUsers) return;
    try {
      await userService.remove(id);
      await refreshData();
      showNotice('Usuario eliminado.');
    } catch (error) {
      showNotice(getApiMessage(error));
    }
  };

  const handleViewUser = async (id) => {
    try {
      return await userService.get(id);
    } catch (error) {
      showNotice(getApiMessage(error));
      return null;
    }
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} onRegister={handleRegister} />}
      />
      <Route
        path="/email-preview"
        element={session ? <EmailPreview task={lastAssignedTask} project={currentProject} /> : <Navigate to="/login" replace />}
      />
      <Route
        element={
          session ? (
            <Shell
              session={session}
              role={role}
              projects={visibleProjects}
              users={users}
              roles={roles}
              tasks={tasks}
              selectedProjectId={selectedProjectId}
              currentProject={currentProject}
              projectDetail={projectDetail}
              authProfile={authProfile}
              userProfile={userProfile}
              loadingData={loadingData}
              notice={notice}
              onDismissNotice={() => setNotice('')}
              onSelectProject={setSelectedProjectId}
              taskModalOpen={taskModalOpen}
              projectModalOpen={projectModalOpen}
              onNewTask={() => setTaskModalOpen(true)}
              onNewProject={() => setProjectModalOpen(true)}
              closeTaskModal={() => setTaskModalOpen(false)}
              closeProjectModal={() => setProjectModalOpen(false)}
              onCreateTask={handleCreateTask}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onMoveTask={handleMoveTask}
              onDeleteTask={handleDeleteTask}
              onCreateUser={handleCreateUser}
              onUpdateUser={handleUpdateUser}
              onAssignRole={handleAssignRole}
              onDeleteUser={handleDeleteUser}
              onViewUser={handleViewUser}
              onLogout={handleLogout}
              mailAlert={mailAlert}
              setMailAlert={setMailAlert}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<ProjectWorkspace />} />
        <Route path="/tasks" element={<TasksBoard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<NotificationSettings />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
