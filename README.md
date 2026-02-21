# Practice Japanese App

A locally hosted web app for practicing and quizzing hiragana and katakana. Built for multiplayer races (friend connects to your machine). Real-time updates via Socket.io.

**Stack:** React (Vite), Node.js + Express, Socket.io. SQLite later.

## Setup

1. Clone the repo and `cd` into it.
2. Run `npm install`.
3. Run `npm run dev` to start both the API server (port 3000) and the React dev server (port 5173).
4. Open **http://localhost:5173** in your browser.

## Scripts

- `npm run dev` – Run server + React dev server (with proxy)
- `npm run server` – Run Express + Socket.io only
- `npm run client` – Run Vite dev server only
- `npm run build` – Build React for production
- `npm run preview` – Preview production build
- `npm start` – Run server only (for production-style local hosting)

## Project structure

- `client/` – React (Vite) frontend
- `server/` – Express API + Socket.io
- `data/kana.json` – Hiragana & katakana data

## Hosting from your machine (for Versus mode)

To allow another user to connect for Versus mode:

### Option 1: Same local network (Wi-Fi)
1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. Start the server: `npm run dev`
3. Friend connects to: `http://YOUR_LOCAL_IP:5173` (e.g., `http://192.168.1.100:5173`)

### Option 2: Different networks (Internet)
1. **Port forwarding** (router setup):
   - Forward port 3000 (and 5173 for dev) to your machine's local IP
   - Friend connects to: `http://YOUR_PUBLIC_IP:5173`
2. **ngrok** (easiest for testing):
   - Install: `npm install -g ngrok`
   - Run: `ngrok http 5173`
   - Share the ngrok URL with your friend

### Option 3: Production build
1. Build: `npm run build`
2. Update server to serve static files (configure Express to serve `client/dist`)
3. Friend connects to your server IP/domain

**Note:** The server CORS is configured to allow all origins, so external connections work.
