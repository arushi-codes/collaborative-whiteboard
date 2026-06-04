import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import Toolbar from './Toolbar'
import ChatPanel from './ChatPanel'
import CanvasArea from './CanvasArea'

const SOCKET_URL = 'http://localhost:3001'

export default function Whiteboard({ roomId, username }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const ctxRef = useRef(null)
  const socketRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef(null)
  const startPointRef = useRef(null)
  const replayingRef = useRef(false)
  const liveEventsDuringReplayRef = useRef([])
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const snapshotRef = useRef(null)
  const isReturningUserRef = useRef(false)

  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(5)
  const [users, setUsers] = useState({})
  const [otherCursors, setOtherCursors] = useState({})
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [drawingUser, setDrawingUser] = useState(null)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [hostId, setHostId] = useState(null)
  const [permissions, setPermissions] = useState({})
  const [isReplaying, setIsReplaying] = useState(false)
  const [textInput, setTextInput] = useState(null)
  const [shapePreview, setShapePreview] = useState(null)

  // ─── Canvas Init & Resize ───
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return

    const drawBackground = (ctx, w, h) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#e5e7eb'
      for (let x = 0; x < w; x += 20) {
        for (let y = 0; y < h; y += 20) {
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const resizeCanvas = () => {
      const rect = containerRef.current.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      drawBackground(ctx, rect.width, rect.height)
      ctxRef.current = ctx
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const savedCanvas = localStorage.getItem(`canvas-${roomId}`)
    if (savedCanvas) {
      isReturningUserRef.current = true
      const img = new Image()
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)
        saveSnapshot()
      }
      img.src = savedCanvas
    } else {
      isReturningUserRef.current = false
      saveSnapshot()
    }

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [roomId])

  // Save canvas on leave
  useEffect(() => {
    const saveCanvas = () => {
      const canvas = canvasRef.current
      if (canvas) {
        localStorage.setItem(`canvas-${roomId}`, canvas.toDataURL())
      }
    }
    window.addEventListener('beforeunload', saveCanvas)
    const interval = setInterval(saveCanvas, 5000)
    return () => {
      saveCanvas()
      window.removeEventListener('beforeunload', saveCanvas)
      clearInterval(interval)
    }
  }, [roomId])

  // ─── Snapshot helpers ───
  const saveSnapshot = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    snapshotRef.current = canvas.toDataURL()
  }

  const restoreSnapshot = (snapshot) => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx || !snapshot) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground(ctx, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
    }
    img.src = snapshot
  }

  const drawBackground = (ctx, w, h) => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#e5e7eb'
    for (let x = 0; x < w; x += 20) {
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath()
        ctx.arc(x, y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  const pushUndoState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const currentSnapshot = canvas.toDataURL()
    undoStackRef.current.push(snapshotRef.current)
    snapshotRef.current = currentSnapshot
    redoStackRef.current = []
  }

  // ─── Undo/Redo ───
  const performUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const prevSnapshot = undoStackRef.current.pop()
    redoStackRef.current.push(snapshotRef.current)
    restoreSnapshot(prevSnapshot)
    snapshotRef.current = prevSnapshot
    socketRef.current?.emit('undo-event', { roomId, eventData: { type: 'undo' } })
  }, [roomId])

  const performRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const nextSnapshot = redoStackRef.current.pop()
    undoStackRef.current.push(snapshotRef.current)
    restoreSnapshot(nextSnapshot)
    snapshotRef.current = nextSnapshot
    socketRef.current?.emit('undo-event', { roomId, eventData: { type: 'redo' } })
  }, [roomId])

  const handleRemoteUndo = useCallback(() => {
    if (undoStackRef.current.length === 0) return
    const prevSnapshot = undoStackRef.current.pop()
    redoStackRef.current.push(snapshotRef.current)
    restoreSnapshot(prevSnapshot)
    snapshotRef.current = prevSnapshot
  }, [])

  const handleRemoteRedo = useCallback(() => {
    if (redoStackRef.current.length === 0) return
    const nextSnapshot = redoStackRef.current.pop()
    undoStackRef.current.push(snapshotRef.current)
    restoreSnapshot(nextSnapshot)
    snapshotRef.current = nextSnapshot
  }, [])

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) { e.preventDefault(); performUndo() }
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) { e.preventDefault(); performRedo() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [performUndo, performRedo])

  // ─── Socket Connection ───
  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket
    socket.emit('join-room', { roomId, username })

    socket.on('replay-events', (events) => {
      const ctx = ctxRef.current
      if (!events || events.length === 0) return
      if (isReturningUserRef.current) {
        isReturningUserRef.current = false
        return
      }

      replayingRef.current = true
      setIsReplaying(true)
      liveEventsDuringReplayRef.current = []
      socket.emit('replay-started', roomId)

      let i = 0
      const replayNext = () => {
        if (i >= events.length) {
          liveEventsDuringReplayRef.current.forEach(event => {
            if (event.type === 'text') handleTextEvent(ctx, event)
            else if (event.type === 'shape') handleShapeEvent(ctx, event)
            else if (event.type === 'undo') handleRemoteUndo()
            else if (event.type === 'redo') handleRemoteRedo()
            else drawFromEvent(ctx, event)
          })
          liveEventsDuringReplayRef.current = []
          replayingRef.current = false
          setIsReplaying(false)
          saveSnapshot()
          socket.emit('replay-complete', roomId)
          return
        }
        const event = events[i]
        if (event.type === 'text') handleTextEvent(ctx, event)
        else if (event.type === 'shape') handleShapeEvent(ctx, event)
        else if (event.type === 'undo') handleRemoteUndo()
        else if (event.type === 'redo') handleRemoteRedo()
        else drawFromEvent(ctx, event)
        i++
        setTimeout(replayNext, 20)
      }
      replayNext()
    })

    socket.on('draw-event', (eventData) => {
      if (replayingRef.current) liveEventsDuringReplayRef.current.push(eventData)
      else drawFromEvent(ctxRef.current, eventData)
    })

    socket.on('shape-event', (eventData) => {
      if (replayingRef.current) liveEventsDuringReplayRef.current.push(eventData)
      else handleShapeEvent(ctxRef.current, eventData)
    })

    socket.on('text-event', (eventData) => {
      if (replayingRef.current) liveEventsDuringReplayRef.current.push(eventData)
      else handleTextEvent(ctxRef.current, eventData)
    })

    socket.on('undo-event', (eventData) => {
      if (replayingRef.current) liveEventsDuringReplayRef.current.push(eventData)
      else if (eventData.type === 'undo') handleRemoteUndo()
      else if (eventData.type === 'redo') handleRemoteRedo()
    })

    socket.on('clear-canvas', () => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawBackground(ctx, canvas.width, canvas.height)
      saveSnapshot()
      localStorage.removeItem(`canvas-${roomId}`)
    })

    socket.on('user-list', (userList) => setUsers(userList || {}))
    socket.on('cursor-update', ({ userId, x, y }) => setOtherCursors(prev => ({ ...prev, [userId]: { x, y } })))
    socket.on('cursor-remove', (userId) => setOtherCursors(prev => { const u = { ...prev }; delete u[userId]; return u }))
    socket.on('existing-cursors', (cursors) => setOtherCursors(cursors || {}))
    socket.on('drawing-indicator', ({ username: drawingUsername }) => { setDrawingUser(drawingUsername); setTimeout(() => setDrawingUser(null), 2000) })
    socket.on('chat-history', (chatLog) => { if (chatLog?.length) setMessages(chatLog.map(m => ({ ...m, username: m.userId === socket.id ? 'You' : m.username }))) })
    socket.on('chat-message', ({ userId, username: msgUser, message, timestamp }) => setMessages(prev => [...prev, { userId, username: userId === socket.id ? 'You' : msgUser, message, timestamp }]))
    socket.on('permission-state', ({ permissions: perms, hostId: host, isViewOnly: viewOnly }) => { setPermissions(perms || {}); setHostId(host); setIsViewOnly(viewOnly) })
    socket.on('permissions-update', (perms) => setPermissions(perms || {}))

    return () => socket.disconnect()
  }, [roomId, username, handleRemoteUndo, handleRemoteRedo])

  // ─── Drawing functions ───
  const drawFromEvent = (ctx, eventData) => {
    ctx.save()
    if (eventData.tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(eventData.x, eventData.y, eventData.brushSize, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = eventData.color
      ctx.lineWidth = eventData.brushSize
      ctx.beginPath()
      ctx.moveTo(eventData.startX, eventData.startY)
      ctx.lineTo(eventData.endX, eventData.endY)
      ctx.stroke()
    }
    ctx.restore()
  }

  const handleShapeEvent = (ctx, eventData) => {
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = eventData.color
    ctx.lineWidth = eventData.brushSize
    const { startX, startY, endX, endY, shapeType } = eventData
    const x = Math.min(startX, endX), y = Math.min(startY, endY)
    const w = Math.abs(endX - startX), h = Math.abs(endY - startY)
    switch (shapeType) {
      case 'rectangle': ctx.strokeRect(x, y, w, h); break
      case 'circle': ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.stroke(); break
      case 'line': ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke(); break
      case 'arrow': drawArrow(ctx, startX, startY, endX, endY); break
    }
    ctx.restore()
  }

  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 15, angle = Math.atan2(toY - fromY, toX - fromX)
    ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(toX, toY)
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()
  }

  const handleTextEvent = (ctx, eventData) => {
    ctx.save()
    ctx.fillStyle = eventData.color
    ctx.font = `bold ${eventData.fontSize}px sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillText(eventData.text, eventData.x, eventData.y)
    ctx.restore()
  }

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // ─── Mouse handlers ───
  const startDrawing = (e) => {
    if (isViewOnly || replayingRef.current) return
    const { x, y } = getCanvasCoordinates(e)
    if (tool === 'text') {
      setTextInput({ x, y })
      return
    }
    saveSnapshot()
    isDrawingRef.current = true
    lastPointRef.current = { x, y }
    startPointRef.current = { x, y }
    socketRef.current?.emit('drawing-indicator', { roomId, username })
  }

  const draw = (e) => {
    if (!isDrawingRef.current || isViewOnly || replayingRef.current) return
    const { x, y } = getCanvasCoordinates(e)
    const ctx = ctxRef.current
    const socket = socketRef.current
    if (tool === 'eraser') {
      const eventData = { tool, color, brushSize, x, y }
      drawFromEvent(ctx, eventData)
      socket.emit('draw-event', { roomId, eventData })
    } else if (tool === 'pen') {
      const eventData = { tool, color, brushSize, startX: lastPointRef.current.x, startY: lastPointRef.current.y, endX: x, endY: y }
      drawFromEvent(ctx, eventData)
      socket.emit('draw-event', { roomId, eventData })
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(tool)) {
      setShapePreview({ startX: startPointRef.current.x, startY: startPointRef.current.y, endX: x, endY: y, shapeType: tool })
    }
    lastPointRef.current = { x, y }
  }

  const stopDrawing = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const socket = socketRef.current
    if (['rectangle', 'circle', 'line', 'arrow'].includes(tool) && startPointRef.current && lastPointRef.current) {
      const eventData = { type: 'shape', shapeType: tool, startX: startPointRef.current.x, startY: startPointRef.current.y, endX: lastPointRef.current.x, endY: lastPointRef.current.y, color, brushSize }
      handleShapeEvent(ctxRef.current, eventData)
      socket.emit('shape-event', { roomId, eventData })
      setShapePreview(null)
      pushUndoState()
    } else if (tool === 'pen' || tool === 'eraser') {
      pushUndoState()
    }
    lastPointRef.current = null
    startPointRef.current = null
  }

  const handleMouseMove = (e) => {
    const { x, y } = getCanvasCoordinates(e)
    socketRef.current?.emit('cursor-move', { roomId, cursorData: { x, y } })
  }

  const handleTextSubmit = (text, x, y) => {
    if (!text || !text.trim()) return
    const eventData = { type: 'text', x, y, text: text.trim(), color, fontSize: brushSize * 3 }
    handleTextEvent(ctxRef.current, eventData)
    socketRef.current?.emit('text-event', { roomId, eventData })
    setTextInput(null)
    pushUndoState()
  }

  const clearCanvas = () => {
    if (isViewOnly || replayingRef.current) return
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawBackground(ctx, canvas.width, canvas.height)
    socketRef.current?.emit('clear-canvas', roomId)
    localStorage.removeItem(`canvas-${roomId}`)
    pushUndoState()
  }

  // ─── Tool handlers ───
  const handleToolChange = (newTool) => { setTool(newTool); socketRef.current?.emit('tool-change', { roomId, toolState: { tool: newTool } }) }
  const handleColorChange = (newColor) => { setColor(newColor); socketRef.current?.emit('tool-change', { roomId, toolState: { color: newColor } }) }
  const handleBrushSizeChange = (newSize) => { setBrushSize(newSize); socketRef.current?.emit('tool-change', { roomId, toolState: { brushSize: newSize } }) }
  const toggleUserPermission = (userId) => { socketRef.current?.emit('toggle-permission', { roomId, targetUserId: userId }) }
  const sendMessage = (e) => { e.preventDefault(); if (!chatInput.trim()) return; socketRef.current?.emit('chat-message', { roomId, message: chatInput.trim() }); setChatInput('') }

  const isHost = socketRef.current?.id === hostId
  const isShapeTool = ['rectangle', 'circle', 'line', 'arrow'].includes(tool)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Toolbar
        roomId={roomId}
        username={username}
        isHost={isHost}
        isViewOnly={isViewOnly}
        isReplaying={isReplaying}
        tool={tool}
        color={color}
        brushSize={brushSize}
        users={users}
        permissions={permissions}
        otherCursors={otherCursors}
        drawingUser={drawingUser}
        showChat={showChat}
        socketId={socketRef.current?.id}
        onToolChange={handleToolChange}
        onColorChange={handleColorChange}
        onBrushSizeChange={handleBrushSizeChange}
        onUndo={performUndo}
        onRedo={performRedo}
        onClearCanvas={clearCanvas}
        onTogglePermission={toggleUserPermission}
        onToggleChat={() => setShowChat(!showChat)}
      />

      <div ref={containerRef} className="flex-1 relative">
        <CanvasArea
          ref={canvasRef}
          isViewOnly={isViewOnly}
          isReplaying={isReplaying}
          isShapeTool={isShapeTool}
          tool={tool}
          shapePreview={shapePreview}
          color={color}
          brushSize={brushSize}
          textInput={textInput}
          onTextSubmit={handleTextSubmit}
          setTextInput={setTextInput}
          otherCursors={otherCursors}
          users={users}
          onMouseDown={startDrawing}
          onMouseMove={(e) => { draw(e); handleMouseMove(e) }}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {showChat && (
        <ChatPanel
          messages={messages}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          onSendMessage={sendMessage}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}