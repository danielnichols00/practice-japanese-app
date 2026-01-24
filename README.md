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

## Hosting from your machine

Run `npm run build` then `npm start`. Serve the built app from Express (configure later) and use your local IP so your friend can connect (e.g. `http://YOUR_IP:3000`). Port forwarding or ngrok required if they’re on another network.
