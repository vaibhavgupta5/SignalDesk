# SignalDesk Socket.io Server

Real-time messaging server for SignalDesk chat application.

## Features

- JWT-based authentication
- Room-based messaging (projects and groups)
- Real-time message broadcasting
- Typing indicators
- Automatic room management
- MongoDB integration

## Quick Start

###1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env` file:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Run server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

## Socket Events

### Client → Server

**join-project**

```javascript
socket.emit("join-project", { projectId: "..." });
```

**join-group**

```javascript
socket.emit("join-group", { groupId: "..." });
```

**send-message**

```javascript
socket.emit("send-message", {
  groupId: "...",
  content: "Hello",
  type: "text",
});
```

**typing**

```javascript
socket.emit("typing", { groupId: "...", isTyping: true });
```

### Server → Client

**new-message**

```javascript
socket.on("new-message", (message) => {
  console.log(message);
});
```

**user-typing**

```javascript
socket.on("user-typing", ({ groupId, userId, isTyping }) => {
  console.log(`User ${userId} is typing in ${groupId}`);
});
```

**error**

```javascript
socket.on("error", ({ message }) => {
  console.error(message);
});
```

## Authentication

Socket.io connections must include JWT token:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  auth: {
    token: "your-jwt-token",
  },
});
```

## Room Structure

- `project:{projectId}` - All members of a project
- `group:{groupId}` - All members of a group/channel

## API Health Check

```bash
curl http://localhost:3001/health
```

## Dependencies

- `express` - HTTP server
- `socket.io` - WebSocket library
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT verification
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

## Production Deployment

### Environment Variables

```env
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=strong-random-secret
CLIENT_URL=https://your-domain.com
NODE_ENV=production
```

### Scaling

For multiple instances, use Redis adapter:

```bash
npm install @socket.io/redis-adapter redis
```

## License

MIT
