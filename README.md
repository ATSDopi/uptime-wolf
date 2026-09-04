# UptimeWolf

> Lightweight Uptime Monitor with Notifications — Monitor your services and get alerted when they go down

[![CI](https://github.com/user/uptime-wolf/actions/workflows/ci.yml/badge.svg)](https://github.com/user/uptime-wolf/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

## Features

- **Multi-type monitoring** — HTTP, TCP, and ping checks
- **Real-time dashboard** — See uptime status, response times, and trends
- **Incident tracking** — Automatic incident creation and resolution with history
- **Notification channels** — Email, webhook, and Slack alerts
- **Configurable intervals** — Set check frequency per monitor
- **Retry logic** — Configurable retries before marking a service as down
- **Uptime percentages** — Rolling uptime calculation from check history
- **Response time charts** — Visualize response time trends
- **SQLite storage** — Lightweight, file-based database — no external deps
- **Docker-ready** — Full containerized deployment with docker-compose

## Architecture

```
Browser (React + Vite)
  │
  ▼
UptimeWolf API (Express + SQLite)
  │
  ├── MonitorService → Periodic checks (HTTP/TCP/Ping)
  │     ├── Success → Resolve incident, notify "up"
  │     └── Failure → Create incident, notify "down"
  │
  ├── NotificationService
  │     ├── Email (SMTP via Nodemailer)
  │     ├── Webhook (HTTP POST)
  │     └── Slack (Incoming Webhook)
  │
  └── SQLite Database
        ├── monitors
        ├── checks
        ├── incidents
        └── channels
```

## Quick Start

### Development

```bash
npm install
npm run dev          # Frontend on :5176
npm run dev:server   # API server on :3003
```

### Docker

```bash
docker-compose up
```

- Web UI: http://localhost:5176
- API: http://localhost:3003

### Environment Variables

```env
PORT=3003
DB_PATH=./data/uptime-wolf.db

# SMTP for email notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=UptimeWolf <alerts@example.com>
```

## Usage

1. **Add a monitor** — Click "Add Monitor", enter a name, URL, type (HTTP/TCP/Ping), and interval
2. **Configure notifications** — Go to Settings, add an email/webhook/Slack channel
3. **Monitor your dashboard** — View real-time status, response times, and uptime
4. **Track incidents** — Check the Incidents page for downtime history
5. **Pause/resume** — Pause monitors during maintenance windows

## Project Structure

```
uptime-wolf/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── StatCard.tsx
│   │   ├── UptimeChart.tsx
│   │   ├── MonitorList.tsx
│   │   ├── MonitorForm.tsx
│   │   ├── IncidentsView.tsx
│   │   └── Settings.tsx
│   ├── types.ts
│   ├── api.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/
│   ├── db.ts
│   ├── monitorService.ts
│   ├── notifications.ts
│   └── index.ts
├── tests/
│   └── db.test.ts
├── Dockerfile
├── Dockerfile.api
├── docker-compose.yml
├── nginx.conf
└── package.json
```

## Development

```bash
npm install
npm run dev          # Start frontend dev server
npm run dev:server   # Start API server
npm test             # Run tests
npm run typecheck    # Type checking
npm run lint         # Lint
npm run build        # Build for production
```

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Recharts, Lucide icons, date-fns
- **Backend**: Express, TypeScript, better-sqlite3, Nodemailer
- **Testing**: Vitest
- **Deployment**: Docker, Nginx

## License

MIT
