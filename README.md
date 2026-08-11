# Taskflow

Local-first kanban board built with **React + TypeScript + Vite**.

Add tasks, move them across **To do / Doing / Done**, search, and clear finished work. Everything is saved in `localStorage` — no backend, no login.

## Features

- Three-column board
- Create tasks with optional notes
- Move tasks between columns
- Search / filter
- Persistent browser storage
- Responsive layout

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint |

## Why this exists

A small, readable frontend project that demonstrates:

- React state modeling
- `localStorage` persistence
- Clean UI structure
- TypeScript discipline

Useful as a portfolio demo or starting point for a larger productivity app.

## License

MIT
