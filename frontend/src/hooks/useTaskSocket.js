// frontend/src/hooks/useTaskSocket.js

import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';

// Deriva la URL del servidor WS desde la misma variable que usa api.js.
// Si VITE_API_BASE_URL es relativa (/api) usamos localhost:3000 en desarrollo.
// Si es absoluta (http://servidor:3000/api) le quitamos el path /api.
function resolveWsUrl() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiUrl && apiUrl.startsWith('http')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return import.meta.env.VITE_WS_URL || 'http://localhost:3000';
}

const WS_URL = resolveWsUrl();

export function useTaskSocket({ projectId, token, userId, onTaskMoved, onMoveError }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId || !token) return;

    const socket = io(`${WS_URL}/kanban`, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    const joinRoom = () => {
      socket.emit('join_project', { projectId, token });
      setIsConnected(true);
    };

    socket.on('connect',   joinRoom);
    socket.on('reconnect', joinRoom);

    socket.on('task_updated', (payload) => {
      onTaskMoved?.(payload);
    });

    socket.on('task_move_error', (payload) => {
      onMoveError?.(payload);
    });

    socket.on('disconnect',    () => setIsConnected(false));
    socket.on('connect_error', (err) => {
      console.warn('[WS] Error de conexión:', err.message);
      setIsConnected(false);
    });

    return () => {
      if (socket.connected) socket.emit('leave_project', { projectId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [projectId, token]); 

  // Retorna true si el evento se envió, false si el socket no estaba listo
  const emitTaskMoved = useCallback(
    (taskId, newStatus, previousStatus) => {
      const socket = socketRef.current;
      if (!socket?.connected) return false;
      socket.emit('task_moved', { taskId, newStatus, previousStatus, userId, projectId });
      return true;
    },
    [projectId, userId],
  );

  return { emitTaskMoved, isConnected };
}