import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

/**
 * Represents the possible states of a WebSocket connection.
 */
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Raw WebSocket service providing a thin, reusable abstraction over the
 * browser WebSocket API. Manages connection lifecycle, exposes connection
 * state, incoming messages, and discrete connection events as observables,
 * and handles cleanup on destroy.
 *
 * This service is intentionally free of business logic — it knows nothing
 * about chat, presence, or message types. Those concerns belong in a
 * higher-level service that consumes this one.
 */
@Injectable()
export class WebsocketService implements OnDestroy {

  private socket: WebSocket | null = null;

  private connectionState = new BehaviorSubject<ConnectionState>('disconnected');
  private messages = new Subject<string>();
  private opened = new Subject<Event>();
  private closed = new Subject<CloseEvent>();
  private errored = new Subject<Event>();

  /** Observable stream of raw incoming message payloads. */
  messages$: Observable<string> = this.messages.asObservable();

  /** Observable stream of the current WebSocket connection state. */
  connectionState$: Observable<ConnectionState> = this.connectionState.asObservable();

  /** Emits once when the connection is successfully opened. */
  opened$: Observable<Event> = this.opened.asObservable();

  /** Emits once when the connection is closed, with the CloseEvent. */
  closed$: Observable<CloseEvent> = this.closed.asObservable();

  /** Emits when the connection encounters an error. */
  errored$: Observable<Event> = this.errored.asObservable();

  /**
   * Establishes a WebSocket connection to the provided URL.
   * Noop if a connection is already open.
   *
   * @param url - The WebSocket endpoint URL (wss://...)
   */
  connect(url: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    this.connectionState.next('connecting');
    this.socket = new WebSocket(url);

    this.socket.onopen = (event: Event) => {
      console.log("CONNECTED!");
      this.connectionState.next('connected');
      this.opened.next(event);
    };

    this.socket.onmessage = (event: MessageEvent) => {
      console.log('RAW WS MESSAGE:', event.data);

      this.messages.next(event.data);
    };

    this.socket.onerror = (event: Event) => {
      this.connectionState.next('error');
      this.errored.next(event);
    };

    this.socket.onclose = (event: CloseEvent) => {
      this.connectionState.next('disconnected');
      this.closed.next(event);
      this.socket = null;
    };
  }

  /**
   * Sends a raw string payload over the open WebSocket connection.
   * Noop if the connection is not currently open.
   *
   * @param payload - Raw string payload to send
   */
  send(payload: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(payload);
  }

  /**
   * Gracefully closes the WebSocket connection.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}