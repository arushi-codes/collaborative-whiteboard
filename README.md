# 🎨 Collaborative Whiteboard

A real-time, multi-user collaborative whiteboard built with React, Node.js, Socket.io, and the Canvas API. Draw, erase, chat, and collaborate instantly — no database required.

![whiteboard-demo](https://via.placeholder.com/800x400.png?text=Add+a+screenshot+or+GIF+here)

## 🚀 Live Demo

👉 [Try it now](https://collaborative-whiteboard-self.vercel.app/)

---

## ✨ Features

- **Real-Time Drawing Sync** — Pen, eraser, shapes (rectangle, circle, line, arrow), and text annotations sync instantly across all users via Socket.io
- **WebSocket Rooms** — Isolated collaboration rooms via shareable Room IDs
- **Late-Joiner Replay** — New users see an animated stroke-by-stroke replay of all previous drawings via a server-side event log
- **Live Cursors** — See everyone's cursor position and username in real-time
- **Tool State Sync** — Color, brush size, and active tool sync across all connected clients
- **Undo / Redo** — Snapshot-based undo system (Ctrl+Z / Ctrl+Y)
- **User Presence** — Online user list with host controls and view-only permissions
- **Group Chat** — Built-in chat panel with message history for late joiners
- **Drawing Indicators** — Shows who is actively drawing
- **Canvas Persistence** — Returning users see their saved canvas state (localStorage)
- **Zero Database** — Pure in-memory state management — no MongoDB, Firebase, or Redis needed
- **Playful UI** — Figma-inspired cartoonish design system with chunky borders and bold shadows

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React (Vite), Tailwind CSS |
| **Backend** | Node.js, Express |
| **Real-Time** | Socket.io (WebSockets) |
| **Canvas** | HTML5 Canvas API |
| **Deployment** | Vercel (Frontend), Render (Backend) |
| **Monitoring** | UptimeRobot (Keep-alive pings) |

## 🏗️ Architecture
