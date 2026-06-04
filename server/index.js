const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// In-memory storage
const roomEventLogs = {};
const roomToolStates = {};
const roomUserCursors = {};
const roomUsers = {};
const roomChatLogs = {};
const roomHosts = {};
const roomPermissions = {};
const roomReplayingUsers = {};

const PORT = 3001;

app.get('/', (req, res) => {
  res.send('Collaborative Whiteboard Server is running');
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-room', ({ roomId, username }) => {
    socket.join(roomId);
    console.log(`${username} (${socket.id}) joined room: ${roomId}`);

    if (!roomEventLogs[roomId]) roomEventLogs[roomId] = [];
    if (!roomToolStates[roomId]) {
      roomToolStates[roomId] = { color: '#000000', brushSize: 5, tool: 'pen' };
    }
    if (!roomUserCursors[roomId]) roomUserCursors[roomId] = {};
    if (!roomUsers[roomId]) roomUsers[roomId] = {};
    if (!roomChatLogs[roomId]) roomChatLogs[roomId] = [];
    if (!roomPermissions[roomId]) roomPermissions[roomId] = {};
    if (!roomReplayingUsers[roomId]) roomReplayingUsers[roomId] = {};

    const userCount = Object.keys(roomUsers[roomId]).length;
    if (userCount === 0) {
      roomHosts[roomId] = socket.id;
    }

    roomUsers[roomId][socket.id] = {
      username,
      joinedAt: Date.now(),
      isHost: roomHosts[roomId] === socket.id
    };

    socket.emit('replay-events', roomEventLogs[roomId]);
    socket.emit('tool-state-update', roomToolStates[roomId]);
    socket.emit('existing-cursors', roomUserCursors[roomId]);
    socket.emit('chat-history', roomChatLogs[roomId]);
    socket.emit('permission-state', {
      permissions: roomPermissions[roomId],
      hostId: roomHosts[roomId],
      isViewOnly: roomPermissions[roomId][socket.id] || false
    });

    io.to(roomId).emit('user-list', roomUsers[roomId]);
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('replay-started', (roomId) => {
    if (!roomReplayingUsers[roomId]) roomReplayingUsers[roomId] = {};
    roomReplayingUsers[roomId][socket.id] = true;
  });

  socket.on('replay-complete', (roomId) => {
    if (!roomReplayingUsers[roomId]) return;
    delete roomReplayingUsers[roomId][socket.id];
  });

  const isAnyoneReplaying = (roomId) => {
    if (!roomReplayingUsers[roomId]) return false;
    return Object.keys(roomReplayingUsers[roomId]).length > 0;
  };

  socket.on('draw-event', ({ roomId, eventData }) => {
    if (!roomEventLogs[roomId]) return;
    if (roomPermissions[roomId]?.[socket.id]) return;

    roomEventLogs[roomId].push(eventData);
    socket.to(roomId).emit('draw-event', eventData);
  });

  socket.on('shape-event', ({ roomId, eventData }) => {
    if (!roomEventLogs[roomId]) return;
    if (roomPermissions[roomId]?.[socket.id]) return;

    roomEventLogs[roomId].push(eventData);
    socket.to(roomId).emit('shape-event', eventData);
  });

  socket.on('text-event', ({ roomId, eventData }) => {
    if (!roomEventLogs[roomId]) return;
    if (roomPermissions[roomId]?.[socket.id]) return;

    roomEventLogs[roomId].push(eventData);
    socket.to(roomId).emit('text-event', eventData);
  });

  socket.on('undo-event', ({ roomId, eventData }) => {
    if (!roomEventLogs[roomId]) return;
    if (roomPermissions[roomId]?.[socket.id]) return;

    roomEventLogs[roomId].push(eventData);
    socket.to(roomId).emit('undo-event', eventData);
  });

  socket.on('clear-canvas', (roomId) => {
    if (!roomEventLogs[roomId]) return;
    if (roomPermissions[roomId]?.[socket.id]) return;
    if (isAnyoneReplaying(roomId)) return;

    roomEventLogs[roomId] = [];
    io.to(roomId).emit('clear-canvas');
  });

  socket.on('tool-change', ({ roomId, toolState }) => {
    if (!roomToolStates[roomId]) return;
    roomToolStates[roomId] = { ...roomToolStates[roomId], ...toolState };
    socket.to(roomId).emit('tool-state-update', toolState);
  });

  socket.on('cursor-move', ({ roomId, cursorData }) => {
    if (!roomUserCursors[roomId]) return;
    roomUserCursors[roomId][socket.id] = {
      ...cursorData,
      userId: socket.id,
      lastUpdated: Date.now()
    };
    socket.to(roomId).emit('cursor-update', {
      userId: socket.id,
      ...cursorData
    });
  });

  socket.on('chat-message', ({ roomId, message }) => {
    const user = roomUsers[roomId]?.[socket.id];
    if (!user) return;

    const chatMessage = {
      userId: socket.id,
      username: user.username,
      message,
      timestamp: Date.now()
    };

    if (!roomChatLogs[roomId]) roomChatLogs[roomId] = [];
    roomChatLogs[roomId].push(chatMessage);

    io.to(roomId).emit('chat-message', chatMessage);
  });

  socket.on('drawing-indicator', ({ roomId, username }) => {
    socket.to(roomId).emit('drawing-indicator', { userId: socket.id, username });
  });

  socket.on('toggle-permission', ({ roomId, targetUserId }) => {
    if (roomHosts[roomId] !== socket.id) return;
    if (!roomPermissions[roomId]) roomPermissions[roomId] = {};
    
    roomPermissions[roomId][targetUserId] = !roomPermissions[roomId][targetUserId];

    io.to(targetUserId).emit('permission-state', {
      permissions: roomPermissions[roomId],
      hostId: roomHosts[roomId],
      isViewOnly: roomPermissions[roomId][targetUserId] || false
    });

    io.to(roomId).emit('user-list', roomUsers[roomId]);
    io.to(roomId).emit('permissions-update', roomPermissions[roomId]);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    Object.keys(roomUserCursors).forEach(roomId => {
      if (roomUserCursors[roomId][socket.id]) {
        delete roomUserCursors[roomId][socket.id];
        io.to(roomId).emit('cursor-remove', socket.id);
      }
      if (roomReplayingUsers[roomId] && roomReplayingUsers[roomId][socket.id]) {
        delete roomReplayingUsers[roomId][socket.id];
      }
      if (roomUsers[roomId] && roomUsers[roomId][socket.id]) {
        const wasHost = roomUsers[roomId][socket.id].isHost;
        delete roomUsers[roomId][socket.id];
        io.to(roomId).emit('user-list', roomUsers[roomId]);

        if (wasHost && Object.keys(roomUsers[roomId]).length > 0) {
          const newHostId = Object.keys(roomUsers[roomId])[0];
          roomHosts[roomId] = newHostId;
          roomUsers[roomId][newHostId].isHost = true;
          io.to(roomId).emit('user-list', roomUsers[roomId]);
          io.to(newHostId).emit('permission-state', {
            permissions: roomPermissions[roomId] || {},
            hostId: newHostId,
            isViewOnly: false
          });
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});