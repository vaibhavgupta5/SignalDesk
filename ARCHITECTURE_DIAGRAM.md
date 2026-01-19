# Full-Stack Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER'S BROWSER                           │
│                     http://localhost:3000                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
              ▼                            ▼
    ┌──────────────────┐        ┌──────────────────┐
    │   Next.js App    │        │  Socket.io       │
    │   (Frontend)     │        │  Client          │
    │                  │        │                  │
    │  • React UI      │        │  • Real-time     │
    │  • Zustand State │        │  • WebSocket     │
    │  • Tailwind CSS  │        │  • Events        │
    └────────┬─────────┘        └────────┬─────────┘
             │                           │
             │ HTTP Requests             │ WebSocket
             │ (REST API)                │ Connection
             │                           │
             ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │  Next.js API     │        │  Socket.io       │
    │  Routes          │        │  Server          │
    │  (Backend 1)     │        │  (Backend 2)     │
    │                  │        │                  │
    │  Port: 3000      │        │  Port: 3001      │
    │                  │        │                  │
    │  /api/auth       │        │  • JWT Auth      │
    │  /api/projects   │        │  • Rooms         │
    │  /api/groups     │        │  • Broadcasting  │
    │  /api/upload     │        │  • Typing        │
    └────────┬─────────┘        └────────┬─────────┘
             │                           │
             │                           │
             │ Mongoose                  │ Mongoose
             │ ODM                       │ ODM
             │                           │
             └─────────┬─────────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │    MongoDB       │
              │                  │
              │  Port: 27017     │
              │                  │
              │  Collections:    │
              │  • users         │
              │  • projects      │
              │  • groups        │
              │  • messages      │
              └──────────────────┘
```

## Data Flow Diagrams

### 1. Authentication Flow

```
User                 Frontend              Next.js API         MongoDB
 │                      │                      │                 │
 │ 1. Enter Email/Pwd   │                      │                 │
 ├─────────────────────>│                      │                 │
 │                      │ 2. POST /api/auth/signup              │
 │                      ├─────────────────────>│                 │
 │                      │                      │ 3. Hash Password│
 │                      │                      │                 │
 │                      │                      │ 4. Create User  │
 │                      │                      ├────────────────>│
 │                      │                      │<────────────────┤
 │                      │                      │ 5. User Doc     │
 │                      │                      │                 │
 │                      │                      │ 6. Generate JWT │
 │                      │<─────────────────────┤                 │
 │                      │ 7. { user, token }   │                 │
 │  8. Store in Session │                      │                 │
 │<─────────────────────┤                      │                 │
 │                      │                      │                 │
```

### 2. Project Creation Flow

```
User          Frontend         Next.js API        MongoDB      Socket.io
 │               │                  │                │             │
 │ Create Proj   │                  │                │             │
 ├──────────────>│                  │                │             │
 │               │ POST /api/projects                │             │
 │               ├─────────────────>│                │             │
 │               │  + JWT Token     │                │             │
 │               │                  │ Verify Token   │             │
 │               │                  │                │             │
 │               │                  │ Create Project │             │
 │               │                  ├───────────────>│             │
 │               │                  │<───────────────┤             │
 │               │                  │                │             │
 │               │                  │ Create "general" group       │
 │               │                  ├───────────────>│             │
 │               │                  │<───────────────┤             │
 │               │<─────────────────┤                │             │
 │               │ Project + Group  │                │             │
 │<──────────────┤                  │                │             │
 │  Update UI    │                  │                │             │
 │               │ join-project     │                │             │
 │               ├──────────────────────────────────────────────>│
 │               │                  │                │  Join Room  │
```

### 3. Real-Time Messaging Flow

```
User A      Frontend A    Socket.io Server    MongoDB    Frontend B     User B
  │             │               │                │            │            │
  │ Type Msg    │               │                │            │            │
  ├────────────>│               │                │            │            │
  │             │ send-message  │                │            │            │
  │             ├──────────────>│                │            │            │
  │             │               │ Verify Auth    │            │            │
  │             │               │                │            │            │
  │             │               │ Save Message   │            │            │
  │             │               ├───────────────>│            │            │
  │             │               │<───────────────┤            │            │
  │             │               │                │            │            │
  │             │               │ Broadcast to room           │            │
  │             │               ├────────────────────────────>│            │
  │             │ new-message   │                │            │  new-msg   │
  │             │<──────────────┤                │            │<───────────┤
  │ Show Msg    │               │                │            │  Show Msg  │
  │<────────────┤               │                │            │            │
```

### 4. File Upload Flow

```
User        Frontend       Next.js API      File System     Socket.io    MongoDB
 │             │                │                │              │           │
 │ Select File │                │                │              │           │
 ├────────────>│                │                │              │           │
 │             │ Show Preview   │                │              │           │
 │             │                │                │              │           │
 │ Click Send  │                │                │              │           │
 ├────────────>│                │                │              │           │
 │             │ POST /api/upload                │              │           │
 │             ├───────────────>│                │              │           │
 │             │  FormData      │                │              │           │
 │             │                │ Save to        │              │           │
 │             │                │ public/uploads │              │           │
 │             │                ├───────────────>│              │           │
 │             │<───────────────┤                │              │           │
 │             │ { url }        │                │              │           │
 │             │                │                │              │           │
 │             │ send-message { fileUrl }        │              │           │
 │             ├────────────────────────────────────────────>│  │           │
 │             │                │                │              │ Save with │
 │             │                │                │              │ fileMeta  │
 │             │                │                │              ├──────────>│
 │             │                │                │              │           │
```

## Technology Stack Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  Framework:       Next.js 14 (App Router)                   │
│  Language:        TypeScript                                │
│  Styling:         Tailwind CSS                              │
│  State:           Zustand                                   │
│  Components:      Custom shadcn/ui style                    │
│  Icons:           Lucide React                              │
│  Virtualization:  React Virtuoso                            │
│  Date/Time:       date-fns                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    BACKEND LAYER 1 (REST)                    │
├─────────────────────────────────────────────────────────────┤
│  Runtime:         Node.js                                   │
│  Framework:       Next.js API Routes                        │
│  Database:        MongoDB                                   │
│  ODM:             Mongoose                                  │
│  Auth:            JWT (jsonwebtoken)                        │
│  Password:        bcrypt                                    │
│  IDs:             nanoid                                    │
│  File Upload:     Node fs (local storage)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 BACKEND LAYER 2 (REAL-TIME)                  │
├─────────────────────────────────────────────────────────────┤
│  Runtime:         Node.js                                   │
│  Framework:       Express                                   │
│  WebSocket:       Socket.io 4.x                             │
│  Database:        MongoDB                                   │
│  ODM:             Mongoose                                  │
│  Auth:            JWT Verification                          │
│  CORS:            cors middleware                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Database:        MongoDB 6.0+                              │
│  Collections:     users, projects, groups, messages         │
│  Indexes:         Optimized for queries                     │
│  Relations:       ObjectId references                       │
└─────────────────────────────────────────────────────────────┘
```

## Port Allocation

```
┌──────────┬────────────────────────┬─────────────────────┐
│   Port   │       Service          │     Protocol        │
├──────────┼────────────────────────┼─────────────────────┤
│   3000   │  Next.js App + API     │   HTTP/HTTPS        │
│   3001   │  Socket.io Server      │   WebSocket/HTTP    │
│  27017   │  MongoDB               │   MongoDB Protocol  │
└──────────┴────────────────────────┴─────────────────────┘
```

## Environment Variables Map

```
┌─────────────────────────────────────────────────────────────┐
│                    .env.local (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  NEXT_PUBLIC_API_URL       → Frontend API calls            │
│  NEXT_PUBLIC_SOCKET_URL    → Socket.io connection          │
│  MONGODB_URI               → Database connection           │
│  JWT_SECRET                → Token signing ⚠️ MUST MATCH    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              backend-socket/.env (Socket.io)                 │
├─────────────────────────────────────────────────────────────┤
│  PORT                      → Server port (3001)             │
│  MONGODB_URI               → Database connection           │
│  JWT_SECRET                → Token verification ⚠️ MUST MATCH│
│  CLIENT_URL                → CORS allowed origin            │
│  NODE_ENV                  → development/production         │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PASSWORD LAYER                                          │
│     • bcrypt hashing (10 rounds)                           │
│     • Never store plain text                               │
│                                                              │
│  2. AUTHENTICATION LAYER                                    │
│     • JWT tokens (30 day expiry)                           │
│     • Stored in sessionStorage                             │
│     • Sent via Authorization header                        │
│                                                              │
│  3. API PROTECTION LAYER                                    │
│     • Middleware token verification                        │
│     • 401 on invalid/missing token                         │
│     • Auto-redirect to login                               │
│                                                              │
│  4. SOCKET PROTECTION LAYER                                 │
│     • JWT verification on connection                       │
│     • Permission checks for rooms                          │
│     • Disconnect on auth failure                           │
│                                                              │
│  5. DATA ACCESS LAYER                                       │
│     • MongoDB user references                              │
│     • Project membership checks                            │
│     • Group access control                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture (Production)

```
┌──────────────────────────────────────────────────────────────┐
│                         PRODUCTION                            │
└──────────────────────────────────────────────────────────────┘

    ┌─────────────┐         ┌──────────────┐        ┌───────────┐
    │   Vercel    │         │   Railway    │        │  MongoDB  │
    │             │         │   / Heroku   │        │   Atlas   │
    │  Next.js    │         │              │        │           │
    │  App + API  │         │  Socket.io   │        │  Database │
    │             │         │   Server     │        │           │
    └──────┬──────┘         └──────┬───────┘        └─────┬─────┘
           │                       │                      │
           │                       │                      │
           └───────────────┬───────┴──────────────────────┘
                           │
                   ┌───────▼────────┐
                   │   CloudFlare   │
                   │   CDN + SSL    │
                   └────────────────┘
```

---

## Quick Reference

### Start Development Environment

```bash
# Terminal 1
mongod

# Terminal 2
npm run dev

# Terminal 3
cd backend-socket && npm run dev
```

### Access Points

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api/\*
- **Socket:** http://localhost:3001
- **MongoDB:** mongodb://localhost:27017

### Key Files

- Frontend Entry: `app/page.tsx`
- API Routes: `app/api/*/route.ts`
- Socket Server: `backend-socket/server.js`
- Models: `models/*.ts`
- Stores: `store/*.ts`

---

Built with ❤️ by SignalDesk Team
