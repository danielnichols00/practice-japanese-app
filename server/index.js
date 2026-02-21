import { createServer } from 'http'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
const kanaPath = join(dataDir, 'kana.json')
const dbPath = join(dataDir, 'leaderboard.db')

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

let db = null
try {
  const Database = (await import('better-sqlite3')).default
  db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      time_ms INTEGER NOT NULL,
      kana_set TEXT NOT NULL DEFAULT 'hiragana',
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS idx_leaderboard_time ON leaderboard(time_ms);
  `)
  console.log('SQLite leaderboard ready')
} catch (err) {
  console.warn('SQLite unavailable, leaderboard disabled:', err.message)
}

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { 
    origin: true, // Allow all origins for external connections
    credentials: true 
  },
})

app.use(cors({ 
  origin: true, // Allow all origins for external connections
  credentials: true 
}))
app.use(express.json())

app.get('/api/kana', (req, res) => {
  try {
    const data = JSON.parse(readFileSync(kanaPath, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load kana data' })
  }
})

app.get('/api/leaderboard', (req, res) => {
  if (!db) return res.json([])
  try {
    const kanaSet = req.query.kana_set || 'hiragana'
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100)
    const rows = db.prepare(`
      SELECT id, player_name, time_ms, kana_set, created_at
      FROM leaderboard
      WHERE kana_set = ?
      ORDER BY time_ms ASC
      LIMIT ?
    `).all(kanaSet, limit)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard' })
  }
})

app.post('/api/leaderboard', (req, res) => {
  if (!db) return res.status(503).json({ error: 'Leaderboard unavailable' })
  try {
    const { player_name, time_ms, kana_set = 'hiragana' } = req.body
    if (player_name == null || time_ms == null || typeof time_ms !== 'number') {
      return res.status(400).json({ error: 'player_name and time_ms required' })
    }
    const name = String(player_name).trim().slice(0, 32) || 'Anonymous'
    const stmt = db.prepare(`
      INSERT INTO leaderboard (player_name, time_ms, kana_set) VALUES (?, ?, ?)
    `)
    stmt.run(name, time_ms, kana_set)
    console.log('Leaderboard saved:', { name, time_ms, kana_set })
    res.status(201).json({ ok: true })
  } catch (err) {
    console.error('Leaderboard save error:', err)
    res.status(500).json({ error: 'Failed to save score' })
  }
})

app.get('/api/leaderboard/status', (req, res) => {
  res.json({ db: db !== null })
})

const rooms = new Map() // roomId -> { players: Set, ready: Map<socketId, boolean>, countdown: null/boolean, countdownInterval: null/Interval }

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-versus', () => {
    let roomId = null
    
    // Find a room with only 1 player, or create new
    for (const [id, room] of rooms.entries()) {
      if (room.players.size === 1) {
        roomId = id
        break
      }
    }
    
    if (!roomId) {
      roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      rooms.set(roomId, {
        players: new Set(),
        ready: new Map(),
        countdown: null,
        countdownInterval: null
      })
    }
    
    const room = rooms.get(roomId)
    room.players.add(socket.id)
    room.ready.set(socket.id, false)
    socket.join(roomId)
    
    socket.emit('room-joined', roomId)
    console.log(`Player ${socket.id} joined room ${roomId}`)
    
    // If room is full (2 players), notify both
    if (room.players.size === 2) {
      io.to(roomId).emit('room-full')
    }
  })

  socket.on('ready-up', ({ ready }) => {
    const roomId = Array.from(socket.rooms).find(r => r.startsWith('room-'))
    if (!roomId) return
    
    const room = rooms.get(roomId)
    if (!room) return
    
    room.ready.set(socket.id, ready)
    
    // Notify other players
    socket.to(roomId).emit('player-ready', { socketId: socket.id, ready })
    
    // Check if both ready
    if (room.players.size === 2) {
      const allReady = Array.from(room.ready.values()).every(r => r === true)
      
      if (allReady && !room.countdown) {
        // Start countdown
        room.countdown = true
        io.to(roomId).emit('countdown-start')
        
        let count = 3
        const countdownInterval = setInterval(() => {
          io.to(roomId).emit('countdown-tick', count)
          count--
          
          if (count < 0) {
            clearInterval(countdownInterval)
            io.to(roomId).emit('game-start')
            room.countdown = null
            // Reset ready states for next round
            room.ready.forEach((_, id) => room.ready.set(id, false))
          }
        }, 1000)
        
        // Store interval ID for cleanup if needed
        room.countdownInterval = countdownInterval
      }
    }
  })

  socket.on('progress-update', ({ index, total }) => {
    const roomId = Array.from(socket.rooms).find(r => r.startsWith('room-'))
    if (roomId) {
      socket.to(roomId).emit('opponent-progress', { index, total, socketId: socket.id })
    }
  })

  socket.on('leave-room', () => {
    const roomId = Array.from(socket.rooms).find(r => r.startsWith('room-'))
    if (roomId) {
      socket.leave(roomId)
      const room = rooms.get(roomId)
      if (room) {
        room.players.delete(socket.id)
        room.ready.delete(socket.id)
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval)
          }
          rooms.delete(roomId)
        } else {
          // Notify remaining player
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval)
            room.countdown = null
            room.countdownInterval = null
          }
          io.to(roomId).emit('player-left')
        }
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
    
    // Clean up rooms
    const roomId = Array.from(socket.rooms).find(r => r.startsWith('room-'))
    if (roomId) {
      const room = rooms.get(roomId)
      if (room) {
        room.players.delete(socket.id)
        room.ready.delete(socket.id)
        
        if (room.players.size === 0) {
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval)
          }
          rooms.delete(roomId)
        } else {
          if (room.countdownInterval) {
            clearInterval(room.countdownInterval)
            room.countdown = null
            room.countdownInterval = null
          }
          io.to(roomId).emit('player-left')
        }
      }
    }
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`External access: http://YOUR_IP:${PORT}`)
})
