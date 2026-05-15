import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { WebsocketService, ConnectionState } from './websocket';

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

/**
 * High-level chat service built on top of WebsocketService.
 * Responsible for translating raw WebSocket events into chat-specific
 * state — messages, presence, and connected users.
 *
 * Intentionally decoupled from the WebSocket primitive so either layer
 * can be swapped independently.
 */
@Injectable()
export class ChatService implements OnDestroy {

  private destroy$ = new Subject<void>();

  private messages = new BehaviorSubject<ChatMessage[]>([]);
  private connectedUsers = new BehaviorSubject<ConnectedUser[]>([]);
  private selfConnectionId: string | null = null;

  private displayName!: string;

  /** Observable stream of chat messages. */
  messages$: Observable<ChatMessage[]> = this.messages.asObservable();

  /** Observable stream of currently connected users. */
  connectedUsers$: Observable<ConnectedUser[]> = this.connectedUsers.asObservable();

  constructor(private wsService: WebsocketService) {
  this.messages$ = this.messages.asObservable();
  this.connectedUsers$ = this.connectedUsers.asObservable();

  this.wsService.messages$
    .pipe(takeUntil(this.destroy$))
    .subscribe(raw => this.handleMessage(raw));

  this.wsService.opened$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.messages.next([]);
      this.connectedUsers.next([]);
      // Request current connections list
      setTimeout(() => {
        console.log("HELLO?");
        this.wsService.send(JSON.stringify({ type: 'connections' }));
      }, 300);
    });

  this.wsService.closed$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.connectedUsers.next([]);
    });
}

  /**
   * Connects to the WebSocket endpoint and initializes the chat session.
   *
   * @param url - The WebSocket endpoint URL (wss://...)
   */
  connect(url: string, displayName: string = 'Anonymous'): void {
    this.displayName = displayName;
    this.wsService.connect(`${url}?displayName=${encodeURIComponent(displayName)}`);
  }

  /**
   * Sends a chat message over the WebSocket connection.
   *
   * @param content - The message text to send
   */
  sendMessage(content: string): void {
    if (!content.trim()) return;

    const payload: ChatPayload = {
      type: 'message',
      content
    };

    this.wsService.send(JSON.stringify(payload));

    const current = this.messages.getValue();
    this.messages.next([
      ...current,
      {
        connectionId: this.selfConnectionId || 'self',
        displayName: this.displayName || 'You',
        content,
        timestamp: new Date(),
        self: true
      }
    ]);
  }

  /**
   * Gracefully disconnects from the WebSocket endpoint.
   */
  disconnect(): void {
    this.wsService.disconnect();
  }

  /**
   * Parses and routes incoming raw WebSocket payloads to the
   * appropriate state update handler.
   *
   * @param raw - Raw JSON string from the WebSocket
   */
  private handleMessage(raw: string): void {
  try {
    const payload: ChatPayload = JSON.parse(raw);
    console.log('Incoming payload:', payload);
    switch (payload.type) {
      case 'connections':
        console.log('Connections payload:', payload.connections);
        console.log('Self connectionId:', payload.selfConnectionId);
        this.handleConnections(payload);
        break;
      case 'join':
        this.handleJoin(payload);
        break;
      case 'leave':
        this.handleLeave(payload);
        break;
      case 'message':
        this.handleIncomingMessage(payload);
        break;
    }
  } catch (e) {
    console.warn('ChatService: failed to parse incoming message', raw);
  }
}

  /**
   * Handles the initial connections list sent on connect.
   * The last connectionId in the list is assumed to be self.
   */
  private handleConnections(payload: ChatPayload): void {
    this.selfConnectionId = payload.selfConnectionId || null;
    this.connectedUsers.next(payload.connections || []);
  }

  /**
   * Handles a join event — adds the new user to the connected users list.
   */
  private handleJoin(payload: ChatPayload): void {
    const current = this.connectedUsers.getValue();
    if (current.find(u => u.connectionId === payload.connectionId)) return;
    this.connectedUsers.next([
      ...current,
      {
        connectionId: payload.connectionId!,
        displayName: payload.displayName || 'Anonymous'
      }
    ]);

    this.messages.next([
      ...this.messages.getValue(),
      {
        connectionId: 'system',
        displayName: 'system',
        content: `${payload.displayName || 'Anonymous'} joined`,
        timestamp: new Date(),
        self: false,
        system: true
      }
    ]);
  }

  /**
   * Handles a leave event — removes the user from the connected users list.
   */
  private handleLeave(payload: ChatPayload): void {
    const current = this.connectedUsers.getValue();
    this.connectedUsers.next(
      current.filter(u => u.connectionId !== payload.connectionId)
    );

    this.messages.next([
      ...this.messages.getValue(),
      {
        connectionId: 'system',
        displayName: 'system',
        content: `${payload.displayName || 'Anonymous'} left`,
        timestamp: new Date(),
        self: false,
        system: true
      }
    ]);
  }

    /**
   * Handles an incoming message from another connected user.
   */
  private handleIncomingMessage(payload: ChatPayload): void {
    const current = this.messages.getValue();
    this.messages.next([
      ...current,
      {
        connectionId: payload.connectionId || 'unknown',
        displayName: payload.displayName || 'Anonymous',
        content: payload.content || '',
        timestamp: new Date(),
        self: false
      }
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }
}