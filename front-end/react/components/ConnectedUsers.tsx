import { ConnectedUser } from '../hooks/useChat';

interface ConnectedUsersProps {
  users: ConnectedUser[];
}

/**
 * ConnectedUsers — renders both mobile horizontal strip and desktop sidebar.
 * Equivalent to the connected users sections in chat.html
 */
export default function ConnectedUsers({ users }: ConnectedUsersProps) {
  return (
    <>
      {/* Mobile — horizontal strip */}
      <div className="flex md:hidden items-center gap-2 px-4 py-2 border-b border-gray-800 overflow-x-auto">
        <span className="text-xs text-gray-500 uppercase tracking-widest flex-shrink-0">
          Connected
          <span className="text-green-400 ml-1">({users.length})</span>
        </span>
        {users.map(user => (
          <div
            key={user.connectionId}
            className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded-full flex-shrink-0"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs font-mono text-gray-400">{user.displayName}</span>
          </div>
        ))}
      </div>

      {/* Desktop — sidebar */}
      <div className="hidden md:flex w-44 flex-shrink-0 border-l border-gray-800 bg-gray-900 flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-xs font-medium tracking-widest uppercase text-gray-500">Connected</span>
          <span className="text-xs font-medium text-green-400">({users.length})</span>
        </div>
        <div className="flex flex-col gap-1 p-3">
          {users.map(user => (
            <div key={user.connectionId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 truncate">{user.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
