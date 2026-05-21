import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import JoinScreen from './JoinScreen';
import ConnectedUsers from './ConnectedUsers';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const WS_URL = 'wss://c3wj3ucjda.execute-api.us-east-1.amazonaws.com/production/';

/**
 * Chat — orchestration only. No markup, no JSX template logic.
 * All visual rendering is delegated to sub-components.
 *
 * Equivalent to chat.ts in Angular — the component class without the template.
 */
export default function Chat() {

  const { messages, connectedUsers, connectionState, connect, sendMessage } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [connected, setConnected] = useState(false);

  // Equivalent to @ViewChild('messageContainer')
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Equivalent to ngAfterViewChecked → scrollToBottom
  useEffect(() => {
    try {
      if (messageContainerRef.current) {
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      }
    } catch (e) {}
  }, [messages]);

  const join = useCallback(() => {
    if (!displayName.trim()) return;
    connect(WS_URL, displayName.trim());
    setConnected(true);
  }, [displayName, connect]);

  const onNameKeydown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') join();
  }, [join]);

  const send = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  }, [inputValue, sendMessage]);

  const onKeydown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') send();
  }, [send]);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">

      {/* Live header */}
      <div className="bg-gray-950 border-b border-gray-800 px-5 py-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
        <span className="text-xs text-gray-400 font-medium">
          Live · Open on two devices to see real-time updates
        </span>
      </div>

      <div className="flex flex-col h-[600px] bg-gray-950 rounded-b-xl overflow-hidden border border-gray-800">

        {!connected ? (
          <JoinScreen
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            onJoin={join}
            onKeydown={onNameKeydown}
          />
        ) : (
          <>
            {/* Mobile connected users strip */}
            <ConnectedUsers users={connectedUsers} />

            <div className="flex flex-1 overflow-hidden">

              {/* Message area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <MessageList
                  ref={messageContainerRef}
                  messages={messages}
                  displayName={displayName}
                />
                <ChatInput
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  onSend={send}
                  onKeydown={onKeydown}
                />
              </div>

              {/* Desktop sidebar — rendered inside ConnectedUsers */}
              <ConnectedUsers users={connectedUsers} />

            </div>
          </>
        )}

      </div>
    </div>
  );
}
