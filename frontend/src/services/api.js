import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const SESSION_KEY = 'taskflowpro.session';

export const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const storeSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

api.interceptors.response.use((response) => {
  const payload = response.data;
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data')
    ? payload.data
    : payload;
});

export const authService = {
  register: (payload) => api.post('/auth/registro', payload),
  login: (credentials) => api.post('/auth/login', credentials),
  profile: () => api.get('/auth/perfil'),
  validateToken: () => api.get('/auth/validar-token'),
};

export const userService = {
  profile: () => api.get('/users/perfil'),
  list: () => api.get('/users'),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.patch(`/users/${id}`, payload),
  assignRole: (id, rol) => api.patch(`/users/${id}/rol`, { rol }),
  remove: (id) => api.delete(`/users/${id}`),
};

export const projectService = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (payload) => api.post('/projects', payload),
  update: (id, payload) => api.patch(`/projects/${id}`, payload),
  remove: (id) => api.delete(`/projects/${id}`),
};

export const taskService = {
  listByProject: (projectId) => api.get(`/tasks/proyecto/${projectId}`),
  create: (payload) => api.post('/tasks', payload),
  assign: (taskId, payload) => api.patch(`/tasks/${taskId}/asignar`, payload),
  updateStatus: (taskId, estado) => api.patch(`/tasks/${taskId}/estado`, { estado }),
  remove: (taskId) => api.delete(`/tasks/${taskId}`),
};

export const roleService = {
  list: () => api.get('/roles'),
};
