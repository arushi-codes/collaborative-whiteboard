import { forwardRef } from 'react'

const CanvasArea = forwardRef(({
  isViewOnly,
  isReplaying,
  isShapeTool,
  tool,
  shapePreview,
  color,
  brushSize,
  textInput,
  onTextSubmit,
  setTextInput,
  otherCursors,
  users,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}, ref) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#faf4e8]">
      {/* Canvas border */}
      <div className="absolute inset-2 border-2 border-dashed border-gray-300 rounded-xl pointer-events-none" />
      
      {/* Canvas */}
      <canvas
        ref={ref}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        className={`absolute inset-0 w-full h-full ${isViewOnly || isReplaying ? 'cursor-default' : isShapeTool ? 'cursor-crosshair' : tool === 'text' ? 'cursor-text' : 'cursor-crosshair'}`}
      />

      {/* Shape preview overlay */}
      {shapePreview && (
        <svg className="absolute inset-0 pointer-events-none w-full h-full">
          {shapePreview.shapeType === 'rectangle' && (
            <rect
              x={Math.min(shapePreview.startX, shapePreview.endX)}
              y={Math.min(shapePreview.startY, shapePreview.endY)}
              width={Math.abs(shapePreview.endX - shapePreview.startX)}
              height={Math.abs(shapePreview.endY - shapePreview.startY)}
              fill={`${color}30`}
              stroke={color}
              strokeWidth={brushSize}
              strokeDasharray="6 3"
            />
          )}
          {shapePreview.shapeType === 'circle' && (
            <ellipse
              cx={(shapePreview.startX + shapePreview.endX) / 2}
              cy={(shapePreview.startY + shapePreview.endY) / 2}
              rx={Math.abs(shapePreview.endX - shapePreview.startX) / 2}
              ry={Math.abs(shapePreview.endY - shapePreview.startY) / 2}
              fill={`${color}30`}
              stroke={color}
              strokeWidth={brushSize}
              strokeDasharray="6 3"
            />
          )}
          {shapePreview.shapeType === 'line' && (
            <line
              x1={shapePreview.startX} y1={shapePreview.startY}
              x2={shapePreview.endX} y2={shapePreview.endY}
              stroke={color}
              strokeWidth={brushSize}
              strokeDasharray="6 3"
            />
          )}
          {shapePreview.shapeType === 'arrow' && (
            <line
              x1={shapePreview.startX} y1={shapePreview.startY}
              x2={shapePreview.endX} y2={shapePreview.endY}
              stroke={color}
              strokeWidth={brushSize}
              strokeDasharray="6 3"
            />
          )}
        </svg>
      )}

      {/* Text input - simple, just works */}
      {textInput && (
        <div 
          className="absolute z-30"
          style={{ left: textInput.x, top: textInput.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            autoFocus
            className="bg-white border-2 border-violet-400 rounded-lg px-2 py-1 outline-none shadow-[2px_2px_0px_#1a1a2e]"
            style={{ color, fontSize: `${brushSize * 3}px`, fontFamily: 'sans-serif' }}
            placeholder="Type then Enter"
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') {
                onTextSubmit(e.target.value, textInput.x, textInput.y)
              }
              if (e.key === 'Escape') {
                setTextInput(null)
              }
            }}
          />
        </div>
      )}

      {/* Other users' cursors */}
      {Object.entries(otherCursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute pointer-events-none z-20 transition-all duration-100"
          style={{ left: cursor.x, top: cursor.y, transform: 'translate(-50%, -50%)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="#8b5cf6" stroke="#1a1a2e" strokeWidth="2" />
          </svg>
          <div className="absolute top-4 left-3 text-[10px] bg-violet-500 text-white px-2 py-0.5 rounded-full whitespace-nowrap font-bold border-2 border-gray-800 shadow-[1px_1px_0px_#1a1a2e]">
            {users[userId]?.username || userId.slice(0, 6)}
          </div>
        </div>
      ))}
    </div>
  )
})

CanvasArea.displayName = 'CanvasArea'

export default CanvasArea