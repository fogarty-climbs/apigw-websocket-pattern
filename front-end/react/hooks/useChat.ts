import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket, ConnectionState } from './useWebSocket';

/**
 * Represents a single chat message.
 */
export interface ChatMessage {
  connectionId: string;
  displayName: string;
  content: string;
  timestamp: Date;
  self: boolean;
  system?: boolean;
}

/**
 * Represents a connected user identified by their WebSocket connectionId.
 */
export interface ConnectedUser {
  connectionId: string;
  displayName: string;
}

/**
 * Enumeration of message types flowing through the WebSocket.
 */
export type ChatEventType = 'message' | 'join' | 'leave' | 'connections';

/**
 * Raw payload shape expected from the WebSocket backend.
 */
export interface ChatPayload {
  type: ChatEventType;
  connectionId?: string;
  displayName?: string;
  connections?: ConnectedUser[];
  selfConnectionId?: string;
  content?: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  connectedUsers: ConnectedUser[];
  connectionState: ConnectionState;
  connect: (url: string, displayName?: string) => void;
  sendMessage: (content: string) => void;
  disconnect: () => void;
}

/**
 * High-level chat hook built on top of useWebSocket.
 * Responsible for translating raw WebSocket events into chat-specific
 * state — messages, presence, and connected users.
 *
 * Intentionally decoupled from the WebSocket primitive so either layer
 * can be swapped independently.
 */
export function useChat(): UseChatReturn {

  const { connectionState, messages: rawMessages, send, connect: wsConnect, disconnect: wsDisconnect } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);

  const selfConnectionIdRef = useRef<string | null>(null);
  const displayNameRef = useRef<string>('Anonymous');
  const processedMessages = useRef<Set<string>>(new Set());

  /**
   * Parses and routes incoming raw WebSocket payloads to the
   * appropriate state update handler.
   */
  const handleMessage = useCallback((raw: string) => {
    try {
      const payload: ChatPayload = JSON.parse(raw);
      console.log('Incoming payload:', payload);

      switch (payload.type) {
        case 'connections':
          console.log('Connections payload:', payload.connections);
          console.log('Self connectionId:', payload.selfConnectionId);
          selfConnectionIdRef.current = payload.selfConnectionId || null;
          setConnectedUsers(payload.connections || []);
          break;

        case 'join':
          setConnectedUsers(prev => {
            if (prev.find(u => u.connectionId === payload.connectionId)) return prev;
            return [...prev, {
              connectionId: payload.connectionId!,
              displayName: payload.displayName || 'Anonymous'
            }];
          });
          setMessages(prev => [...prev, {
            connectionId: 'system',
            displayName: 'system',
            content: `${payload.displayName || 'Anonymous'} joined`,
            timestamp: new Date(),
            self: false,
            system: true
          }]);
          break;

        case 'leave':
          setConnectedUsers(prev =>
            prev.filter(u => u.connectionId !== payload.connectionId)
          );
          setMessages(prev => [...prev, {
            connectionId: 'system',
            displayName: 'system',
            content: `${payload.displayName || 'Anonymous'} left`,
            timestamp: new Date(),
            self: false,
            system: true
          }]);
          break;

        case 'message':
          setMessages(prev => [...prev, {
            connectionId: payload.connectionId || 'unknown',
            displayName: payload.displayName || 'Anonymous',
            content: payload.content || '',
            timestamp: new Date(),
            self: false
          }]);
          break;
      }
    } catch (e) {
      console.warn('useChat: failed to parse incoming message', raw);
    }
  }, []);

  // Process new raw messages as they arrive
  useEffect(() => {
    if (rawMessages.length === 0) return;
    const latest = rawMessages[rawMessages.length - 1];
    const key = `${rawMessages.length}-${latest}`;
    if (processedMessages.current.has(key)) return;
    processedMessages.current.add(key);
    handleMessage(latest);
  }, [rawMessages, handleMessage]);

  // Reset state and request connections on connect
  // Equivalent to wsService.opened$.subscribe()
  useEffect(() => {
    if (connectionState !== 'connected') return;
    setMessages([]);
    setConnectedUsers([]);
    setTimeout(() => {
      console.log('HELLO?');
      send(JSON.stringify({ type: 'connections' }));
    }, 300);
  }, [connectionState, send]);

  // Clear users on disconnect
  // Equivalent to wsService.closed$.subscribe()
  useEffect(() => {
    if (connectionState === 'disconnected') {
      setConnectedUsers([]);
    }
  }, [connectionState]);

  /**
   * Connects to the WebSocket endpoint and initializes the chat session.
   */
  const connect = useCallback((url: string, displayName: string = 'Anonymous') => {
    displayNameRef.current = displayName;
    wsConnect(`${url}?displayName=${encodeURIComponent(displayName)}`);
  }, [wsConnect]);

  /**
   * Sends a chat message over the WebSocket connection.
   * Optimistically appends the message to local state immediately.
   */
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    send(JSON.stringify({ type: 'message', content }));

    // Optimistic local append — equivalent to manual push in ChatService
    setMessages(prev => [...prev, {
      connectionId: selfConnectionIdRef.current || 'self',
      displayName: displayNameRef.current || 'You',
      content,
      timestamp: new Date(),
      self: true
    }]);
  }, [send]);

  /**
   * Gracefully disconnects from the WebSocket endpoint.
   */
  const disconnect = useCallback(() => {
    wsDisconnect();
  }, [wsDisconnect]);

  return {
    messages,
    connectedUsers,
    connectionState,
    connect,
    sendMessage,
    disconnect
  };
}