import { createServer } from 'http'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import { Server } from 'socket.io'
import cors from 'cors'

const __dirname = dirname(fileURLToPath(import.meta.url))
const kanaPath = join(__dirname, '..', 'data', 'kana.json')

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] },
})

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

app.get('/api/kana', (req, res) => {
  try {
    const data = JSON.parse(readFileSync(kanaPath, 'utf-8'))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load kana data' })
  }
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
