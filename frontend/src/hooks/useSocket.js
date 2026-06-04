import { useEffect } from 'react';
import { useSocketStore } from '../stores/socketStore';

export function useSocket() {
  const {
    socket,
    isConnected,
    messages,
    currentProject,
    loading,
    error,
    initializeSocket,
    joinProject,
    leaveProject,
    sendMessage,
    setMessages,
    clearProjectMessages,
    disconnectSocket,
    setError,
    clearError,
  } = useSocketStore();

  // Inicializar socket cuando se monta el componente
  useEffect(() => {
    initializeSocket();
  }, []);

  return {
    socket,
    isConnected,
    messages,
    currentProject,
    loading,
    error,
    joinProject,
    leaveProject,
    sendMessage,
    setMessages,
    clearProjectMessages,
    disconnectSocket,
    setError,
    clearError,
  };
}
