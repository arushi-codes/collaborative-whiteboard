export default function Toolbar({
  roomId,
  username,
  isHost,
  isViewOnly,
  isReplaying,
  tool,
  color,
  brushSize,
  users,
  permissions,
  otherCursors,
  drawingUser,
  showChat,
  socketId,
  onToolChange,
  onColorChange,
  onBrushSizeChange,
  onUndo,
  onRedo,
  onClearCanvas,
  onTogglePermission,
  onToggleChat,
}) {
  const tools = [
    { id: 'pen', icon: '✏️', label: 'Pen' },
    { id: 'eraser', icon: '🧹', label: 'Eraser' },
    { id: 'rectangle', icon: '▭', label: 'Rect' },
    { id: 'circle', icon: '○', label: 'Circle' },
    { id: 'line', icon: '╱', label: 'Line' },
    { id: 'arrow', icon: '→', label: 'Arrow' },
    { id: 'text', icon: 'T', label: 'Text' },
  ]

  const colorSwatches = ['#1a1a2e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

  return (
    <div className="w-56 bg-[#faf4e8] border-r-2 border-gray-800 flex flex-col h-full select-none">
      {/* Header */}
      <div className="p-4 border-b-2 border-gray-800 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-400 border-2 border-gray-800 flex items-center justify-center text-lg shadow-[2px_2px_0px_#1a1a2e]">
            🎨
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-800">CollabBoard</h2>
            <p className="text-[10px] text-gray-500 font-medium">/{roomId}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b-2 border-gray-800 bg-amber-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold shadow-[2px_2px_0px_#1a1a2e]">
            {username[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800 truncate">{username}</p>
            <p className="text-[10px] font-semibold text-gray-500">
              {isHost ? '👑 Host' : isViewOnly ? '🔒 View Only' : '✏️ Editor'}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
        {/* Status indicators */}
        {isViewOnly && (
          <div className="text-xs font-bold text-red-600 bg-red-100 border-2 border-red-300 p-2 rounded-xl text-center">
            🔒 View Only Mode
          </div>
        )}
        {isReplaying && (
          <div className="text-xs font-bold text-blue-600 bg-blue-100 border-2 border-blue-300 p-2 rounded-xl text-center animate-pulse">
            📼 Replaying...
          </div>
        )}

        {/* Tools section */}
        {!isViewOnly && !isReplaying && (
          <>
            {/* Tool selection */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Tool
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {tools.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onToolChange(t.id)}
                    className={`p-2 rounded-xl text-lg transition-all border-2 border-gray-800 ${
                      tool === t.id
                        ? 'bg-violet-400 text-white shadow-[2px_2px_0px_#1a1a2e] scale-105'
                        : 'bg-white hover:bg-amber-100 text-gray-700 shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px]'
                    }`}
                    title={t.label}
                  >
                    {t.icon}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 text-center font-semibold capitalize">{tool}</p>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-300" />

            {/* Color picker */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap gap-1.5">
                {colorSwatches.map(c => (
                  <button
                    key={c}
                    onClick={() => onColorChange(c)}
                    className={`w-7 h-7 rounded-lg border-2 transition-all ${
                      color === c
                        ? 'border-gray-800 scale-110 shadow-[2px_2px_0px_#1a1a2e]'
                        : 'border-gray-300 hover:scale-105 hover:shadow-[1px_1px_0px_#1a1a2e]'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="w-full h-7 mt-1.5 rounded-lg cursor-pointer border-2 border-gray-800 bg-white"
              />
            </div>

            {/* Brush size */}
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
                Size — <span className="text-violet-600">{brushSize}px</span>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-500 border-2 border-gray-800"
              />
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold mt-0.5">
                <span>1</span>
                <span>20</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t-2 border-dashed border-gray-300" />

            {/* Undo / Redo */}
            <div className="flex gap-2">
              <button
                onClick={onUndo}
                className="flex-1 p-2 bg-white hover:bg-amber-100 border-2 border-gray-800 rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Undo (Ctrl+Z)"
              >
                ↩
              </button>
              <button
                onClick={onRedo}
                className="flex-1 p-2 bg-white hover:bg-amber-100 border-2 border-gray-800 rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Redo (Ctrl+Y)"
              >
                ↪
              </button>
            </div>

            {/* Clear canvas */}
            <button
              onClick={onClearCanvas}
              className="w-full p-2 bg-red-400 hover:bg-red-300 border-2 border-gray-800 text-gray-800 rounded-xl text-xs font-bold shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              🗑 Clear Canvas
            </button>
          </>
        )}

        {/* Divider */}
        <div className="border-t-2 border-dashed border-gray-300" />

        {/* Online users */}
        <div>
          <h3 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-1.5">
            👥 Online ({Object.keys(users).length + 1})
          </h3>
          <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-bold text-violet-600 flex items-center gap-1.5 py-0.5 bg-violet-100 -mx-1 px-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 border border-gray-800"></span>
              {username} (You) {isHost ? '👑' : ''}
            </div>
            {Object.entries(users).map(([userId, user]) => (
              <div key={userId} className="text-xs text-gray-700 flex items-center justify-between py-0.5 font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full border border-gray-800 ${otherCursors[userId] ? 'bg-emerald-400' : 'bg-gray-300'}`}></span>
                  <span className="truncate">{user.username} {user.isHost ? '👑' : ''}</span>
                  {permissions[userId] && <span className="text-red-400 text-[10px] shrink-0">🔒</span>}
                </div>
                {isHost && userId !== socketId && (
                  <button
                    onClick={() => onTogglePermission(userId)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold border-2 border-gray-800 shrink-0 transition-all shadow-[1px_1px_0px_#1a1a2e] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${
                      permissions[userId]
                        ? 'bg-emerald-300 text-gray-800'
                        : 'bg-amber-300 text-gray-800'
                    }`}
                  >
                    {permissions[userId] ? 'Allow' : 'Lock'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Drawing indicator */}
        {drawingUser && (
          <div className="text-[10px] font-bold text-violet-600 bg-violet-100 border-2 border-violet-300 p-2 rounded-xl text-center animate-pulse">
            ✏️ {drawingUser} is drawing...
          </div>
        )}
      </div>

      {/* Chat toggle */}
      <div className="p-3 border-t-2 border-gray-800 bg-white">
        <button
          onClick={onToggleChat}
          className={`w-full p-2.5 rounded-xl text-xs font-bold border-2 border-gray-800 transition-all shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] ${
            showChat
              ? 'bg-violet-400 text-white'
              : 'bg-white hover:bg-amber-100 text-gray-700'
          }`}
        >
          💬 Chat
        </button>
      </div>
    </div>
  )
}