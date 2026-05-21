interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onKeydown: (event: React.KeyboardEvent) => void;
}

/**
 * ChatInput — message input and send button.
 * Equivalent to the input/send block in chat.html
 */
export default function ChatInput({ inputValue, onInputChange, onSend, onKeydown }: ChatInputProps) {
  return (
    <div className="border-t border-gray-800 px-4 py-3 flex gap-3 items-center bg-gray-900">
      <input
        type="text"
        value={inputValue}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={onKeydown}
        placeholder="Type a message..."
        className="flex-1 text-sm text-gray-300 placeholder-gray-600 outline-none bg-transparent"
      />
      <button
        onClick={onSend}
        disabled={!inputValue.trim()}
        className="text-xs font-medium bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}
