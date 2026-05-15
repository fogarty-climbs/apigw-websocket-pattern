import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatMessage, ChatService, ConnectedUser } from '../../services/chat-service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.html',
})
export class Chat {
@ViewChild('messageContainer') messageContainer!: ElementRef;

  messages$: Observable<ChatMessage[]>;
  connectedUsers$: Observable<ConnectedUser[]>;
  inputValue = '';
  displayName = '';
  connected = false;

  constructor(private chatService: ChatService) {
    this.messages$ = this.chatService.messages$;
    this.connectedUsers$ = this.chatService.connectedUsers$;
  }

  ngOnInit(): void {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop =
        this.messageContainer.nativeElement.scrollHeight;
    } catch (e) {}
  }

  join(): void {
    if (!this.displayName.trim()) return;
    this.chatService.connect(
      'wss://c3wj3ucjda.execute-api.us-east-1.amazonaws.com/production/',
      this.displayName.trim()
    );
    this.connected = true;
  }

  onNameKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.join();
  }

  send(): void {
    if (!this.inputValue.trim()) return;
    this.chatService.sendMessage(this.inputValue.trim());
    this.inputValue = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.send();
  }

  truncate(connectionId: string): string {
    return connectionId.substring(0, 8) + '...';
  }

  timeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
