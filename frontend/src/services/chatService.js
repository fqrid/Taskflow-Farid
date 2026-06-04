import { api, getStoredSession } from './api';

/**
 * Cargar el historial de mensajes de un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Array>} - Array de mensajes
 */
export const getProjectMessages = async (projectId) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await api.get(`/chat/messages/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data || [];
  } catch (error) {
    console.error('Error cargando mensajes del proyecto:', error);
    throw error;
  }
};

/**
 * Obtener el historial de mensajes entre dos usuarios en un proyecto
 * @param {string} projectId - ID del proyecto
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} - Array de mensajes
 */
export const getPrivateMessages = async (projectId, userId) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await api.get(`/chat/messages/${projectId}/private/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data || [];
  } catch (error) {
    console.error('Error cargando mensajes privados:', error);
    throw error;
  }
};

/**
 * Obtener las estadísticas de chat de un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Object>} - Estadísticas del chat
 */
export const getChatStats = async (projectId) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await api.get(`/chat/stats/${projectId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error cargando estadísticas del chat:', error);
    throw error;
  }
};

/**
 * Buscar mensajes en un proyecto
 * @param {string} projectId - ID del proyecto
 * @param {string} query - Término de búsqueda
 * @returns {Promise<Array>} - Array de mensajes encontrados
 */
export const searchMessages = async (projectId, query) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await api.get(`/chat/messages/${projectId}/search`, {
      params: { q: query },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data || [];
  } catch (error) {
    console.error('Error buscando mensajes:', error);
    throw error;
  }
};

/**
 * Eliminar un mensaje (solo si es el propietario)
 * @param {string} messageId - ID del mensaje
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    await api.delete(`/chat/messages/${messageId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error eliminando mensaje:', error);
    throw error;
  }
};

/**
 * Editar un mensaje (solo si es el propietario)
 * @param {string} messageId - ID del mensaje
 * @param {string} content - Nuevo contenido
 * @returns {Promise<Object>} - Mensaje actualizado
 */
export const updateMessage = async (messageId, content) => {
  try {
    const session = getStoredSession();
    const token = session?.accessToken || session?.token;
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await api.patch(`/chat/messages/${messageId}`, { content }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error actualizando mensaje:', error);
    throw error;
  }
};
