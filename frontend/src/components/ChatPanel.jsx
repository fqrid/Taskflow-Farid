import { useEffect, useRef, useState } from 'react';
import { Send, AlertCircle, Loader } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { getStoredSession } from '../services/api';

export default function ChatPanel({ projectId, projectName }) {
  const {
    isConnected,
    messages,
    error,
    joinProject,
    leaveProject,
    sendMessage,
    setMessages,
    setError,
    clearError,
  } = useSocket();

  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const projectMessages = messages[projectId] || [];

  useEffect(() => {
    const session = getStoredSession();
    if (session?.user) {
      setCurrentUser(session.user);
    }
  }, []);

  useEffect(() => {
    if (isConnected && projectId) {
      joinProject(projectId);
    }

    return () => {
      if (projectId) {
        leaveProject(projectId);
      }
    };
  }, [projectId, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) {
      setError('El mensaje no puede estar vacío');
      return;
    }

    sendMessage(projectId, messageInput.trim());
    setMessageInput('');
    clearError();
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel__header">
        <div>
          <h3>{projectName}</h3>
          <p className={`chat-panel__status ${isConnected ? 'chat-panel__status--online' : 'chat-panel__status--offline'}`}>
            {isConnected ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </div>

      <div className="chat-panel__body">
        {projectMessages.length === 0 && (
          <div className="chat-panel__empty">
            <p>No hay mensajes aún. ¡Comienza la conversación!</p>
          </div>
        )}

        {projectMessages.map((message, index) => {
          const sender = message.sender || message.usuario || {};
          const content = message.content || message.contenido || '';
          const createdAt = message.createdAt || message.fechaCreacion || message.created_at;
          const timestamp = createdAt ? new Date(createdAt) : null;
          const isValidTimestamp = timestamp instanceof Date && !Number.isNaN(timestamp.valueOf());
          const isOwn =
            currentUser?.id === sender?.id ||
            currentUser?.id === message.idUsuario ||
            currentUser?.email === sender?.email;
          const senderName = sender?.nombre || sender?.name || sender?.email || 'Usuario';

          return (
            <div
              key={message.id || index}
              className={`chat-message ${isOwn ? 'chat-message--own' : 'chat-message--other'}`}
            >
              {!isOwn && <div className="chat-message__author">{senderName}</div>}
              <div className="chat-message__bubble">
                <p>{content}</p>
                {isValidTimestamp && (
                  <span className="chat-message__time">
                    {timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="chat-panel__error">
          <AlertCircle className="chat-panel__error-icon" />
          <span>{error}</span>
        </div>
      )}

      <div className="chat-panel__footer">
        <div className="chat-panel__form">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              clearError();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSendMessage();
              }
            }}
            placeholder={isConnected ? 'Escribe un mensaje...' : 'Conectando...'}
            disabled={!isConnected}
            className="chat-panel__input"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSendMessage();
            }}
            disabled={!isConnected || !messageInput.trim()}
            className="chat-panel__send-button"
          >
            <Send className="chat-panel__send-icon" />
          </button>
        </div>
        <p className="chat-panel__footer-note">
          {isConnected ? '✅ Conectado al servidor' : '⏳ Conectando al servidor...'}
        </p>
      </div>
    </div>
  );
}
