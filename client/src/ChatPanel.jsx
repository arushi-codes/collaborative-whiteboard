export default function ChatPanel({ messages, chatInput, onChatInputChange, onSendMessage, onClose }) {
  return (
    <div className="w-72 bg-[#faf4e8] border-l-2 border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b-2 border-gray-800 bg-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-400 border-2 border-gray-800 flex items-center justify-center text-sm shadow-[1px_1px_0px_#1a1a2e]">
            💬
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-800">Chat</h3>
            <p className="text-[10px] text-gray-500 font-semibold">{messages.length} msgs</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-red-100 border-2 border-gray-800 flex items-center justify-center text-xs font-bold transition-colors shadow-[1px_1px_0px_#1a1a2e] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl">
              💬
            </div>
            <p className="text-sm font-semibold">No messages yet</p>
            <p className="text-[10px] font-medium">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isYou = msg.username === 'You'
            return (
              <div key={i} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                {/* Username + time */}
                <div className={`flex items-center gap-1.5 mb-0.5 ${isYou ? 'flex-row-reverse' : ''}`}>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 border-2 border-gray-800 flex items-center justify-center text-white text-[10px] font-bold">
                    {msg.username[0]?.toUpperCase()}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">{msg.username}</span>
                  <span className="text-[10px] text-gray-300 font-medium">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {/* Message bubble */}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words border-2 border-gray-800 ${
                    isYou
                      ? 'bg-violet-400 text-white rounded-br-md shadow-[2px_2px_0px_#1a1a2e]'
                      : 'bg-white text-gray-800 rounded-bl-md shadow-[2px_2px_0px_#1a1a2e]'
                  } font-medium`}
                >
                  {msg.message}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={onSendMessage} className="p-3 border-t-2 border-gray-800 bg-white flex gap-2">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2.5 bg-[#faf4e8] border-2 border-gray-800 rounded-xl text-sm font-medium outline-none focus:border-violet-400 placeholder-gray-400 transition-all"
          autoFocus
        />
        <button
          type="submit"
          className="bg-violet-400 hover:bg-violet-300 border-2 border-gray-800 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-bold shadow-[2px_2px_0px_#1a1a2e] hover:shadow-[1px_1px_0px_#1a1a2e] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          ➤
        </button>
      </form>
    </div>
  )
}