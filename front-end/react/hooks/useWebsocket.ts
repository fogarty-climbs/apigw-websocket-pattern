import { useEffect, useRef, useCallback, useState } from 'react';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  messages: string[];
  send: (payload: string) => void;
  connect: (url: string) => void;
  disconnect: () => void;
}

/**
 * Raw WebSocket hook providing a thin, reusable abstraction over the
 * browser WebSocket API. Manages connection lifecycle, exposes connection
 * state and incoming messages as reactive state, and handles cleanup
 * on unmount.
 *
 * Intentionally free of business logic — knows nothing about chat,
 * presence, or message types. Those concerns belong in a higher-level
 * hook that consumes this one.
 */
export function useWebSocket(): UseWebSocketReturn {

  const socketRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [messages, setMessages] = useState<string[]>([]);

  const connect = useCallback((url: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('CONNECTED!');
      setConnectionState('connected');
    };

    socket.onmessage = (event: MessageEvent) => {
      console.log('RAW WS MESSAGE:', event.data);
      setMessages(prev => [...prev, event.data]);
    };

    socket.onerror = () => {
      setConnectionState('error');
    };

    socket.onclose = () => {
      setConnectionState('disconnected');
      socketRef.current = null;
    };
  }, []);

  const send = useCallback((payload: string) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(payload);
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  // Cleanup on unmount — equivalent to ngOnDestroy
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return { connectionState, messages, send, connect, disconnect };
}