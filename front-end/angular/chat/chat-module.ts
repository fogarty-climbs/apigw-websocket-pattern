import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Chat } from './components/chat/chat';
import { ChatService } from './services/chat-service';
import { WebsocketService } from './services/websocket';



@NgModule({
  declarations: [
    Chat
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    Chat
  ],
  providers: [
    ChatService,
    WebsocketService
  ]
})
export class ChatModule { }
