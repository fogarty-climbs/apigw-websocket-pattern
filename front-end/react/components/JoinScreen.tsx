interface JoinScreenProps {
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  onJoin: () => void;
  onKeydown: (event: React.KeyboardEvent) => void;
}

/**
 * JoinScreen — shown before connecting.
 * Equivalent to the *ngIf="!connected" block in chat.html
 */
export default function JoinScreen({ displayName, onDisplayNameChange, onJoin, onKeydown }: JoinScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <h3 className="text-sm font-medium text-gray-200">Join the chat</h3>
        <p className="text-xs text-gray-500">Enter a display name to connect</p>
      </div>
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <input
          type="text"
          value={displayName}
          onChange={e => onDisplayNameChange(e.target.value)}
          onKeyDown={onKeydown}
          placeholder="Your name..."
          maxLength={20}
          className="flex-1 text-sm text-gray-300 placeholder-gray-600 outline-none bg-gray-800 border border-gray-700 rounded-lg px-4 py-2"
        />
        <button
          onClick={onJoin}
          disabled={!displayName.trim()}
          className="text-xs font-medium bg-green-500 text-white px-4 py-3 mt-2 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Join
        </button>
      </div>
    </div>
  );
}
