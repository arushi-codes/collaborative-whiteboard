import { useState } from 'react'
import Whiteboard from './Whiteboard'

function App() {
  const [roomId, setRoomId] = useState('')
  const [joined, setJoined] = useState(false)
  const [username, setUsername] = useState('')

  const handleJoin = () => {
    if (roomId.trim() && username.trim()) {
      setJoined(true)
    }
  }

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf4e8] relative overflow-hidden">
        {/* Playful background shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 rounded-3xl bg-amber-300/30 rotate-12" />
        <div className="absolute top-20 right-20 w-24 h-24 rounded-full bg-pink-300/30" />
        <div className="absolute bottom-20 left-[20%] w-40 h-40 rounded-2xl bg-violet-300/20 -rotate-6" />
        <div className="absolute bottom-10 right-10 w-28 h-28 rounded-full bg-emerald-300/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-cyan-300/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-2xl bg-white border-2 border-gray-800 shadow-[4px_4px_0px_#1a1a2e] flex items-center justify-center text-4xl hover:shadow-[2px_2px_0px_#1a1a2e] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
              🎨
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              Collab<span className="text-violet-500">Board</span>
            </h1>
            <p className="text-gray-500 text-sm font-medium">draw together • real-time • fun</p>
          </div>

          {/* Join card */}
          <div className="w-80 bg-white border-2 border-gray-800 rounded-3xl p-6 shadow-[6px_6px_0px_#1a1a2e] flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Your Name</label>
                <input
                  type="text"
                  placeholder="Alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 bg-[#fefce8] border-2 border-gray-800 rounded-xl text-gray-800 text-sm font-medium placeholder-gray-400 focus:border-violet-500 focus:ring-0 outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Room ID</label>
                <input
                  type="text"
                  placeholder="my-room-123"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  className="w-full p-3 bg-[#fefce8] border-2 border-gray-800 rounded-xl text-gray-800 text-sm font-medium placeholder-gray-400 focus:border-violet-500 focus:ring-0 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              onClick={handleJoin}
              className="w-full p-3 bg-violet-400 border-2 border-gray-800 text-gray-800 rounded-xl text-sm font-bold shadow-[4px_4px_0px_#1a1a2e] hover:shadow-[2px_2px_0px_#1a1a2e] hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
            >
              Join Room ✨
            </button>

            <p className="text-[10px] text-gray-400 text-center font-medium">
              Share the Room ID with friends 🚀
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <Whiteboard roomId={roomId} username={username} />
}

export default App