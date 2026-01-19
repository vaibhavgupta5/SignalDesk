# Quick Start Development Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Verify Installation

```bash
npm install
```

✅ Dependencies should already be installed (210 packages)

### Step 2: Start Development Server

```bash
npm run dev
```

The app will start at **http://localhost:3000**

### Step 3: Open in Browser

Navigate to `http://localhost:3000` - you'll be redirected to the login page.

## ⚠️ Important: Backend Required

This frontend app **requires a backend server** to function. The backend should:

1. **Run on port 3001** (or update `.env.local`)
2. **Support these endpoints:**
   - `POST /api/auth/login`
   - `POST /api/auth/signup`
   - `GET /api/auth/verify`
   - `GET /api/projects`
   - `POST /api/projects`
   - And more (see ARCHITECTURE.md)

3. **Run Socket.io server** on the same port

## 🔧 Quick Backend Setup Options

### Option 1: Use Mock Backend (Recommended for Testing)

Create a simple Express server:

```bash
cd ..
mkdir signaldesk-backend
cd signaldesk-backend
npm init -y
npm install express socket.io cors jsonwebtoken bcrypt mongoose dotenv
```

Create `server.js`:

```javascript
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

app.use(cors());
app.use(express.json());

// Mock auth endpoints
app.post("/api/auth/login", (req, res) => {
  res.json({
    user: { id: "1", name: "Test User", email: req.body.email },
    token: "mock-jwt-token",
  });
});

app.post("/api/auth/signup", (req, res) => {
  res.json({
    user: { id: "1", name: req.body.name, email: req.body.email },
    token: "mock-jwt-token",
  });
});

app.get("/api/auth/verify", (req, res) => {
  res.json({ user: { id: "1", name: "Test User", email: "test@example.com" } });
});

app.get("/api/projects", (req, res) => {
  res.json({ projects: [] });
});

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join-group", ({ groupId }) => {
    socket.join(groupId);
  });

  socket.on("send-message", (data) => {
    io.to(data.groupId).emit("new-message", {
      _id: Date.now().toString(),
      ...data,
      userId: "1",
      userName: "Test User",
      createdAt: new Date().toISOString(),
    });
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

server.listen(3001, () => console.log("Backend running on port 3001"));
```

Run it:

```bash
node server.js
```

### Option 2: Full MongoDB Backend

See `BACKEND_SETUP.md` (create this file) for complete backend implementation.

## 📝 Development Workflow

### 1. Make Changes

Edit files in:

- `app/` - Pages and routes
- `components/` - UI components
- `store/` - State management
- `lib/` - Utilities

### 2. Hot Reload

Next.js automatically reloads on file changes.

### 3. Check Console

- Browser console for frontend errors
- Terminal for build errors

### 4. Build for Production

```bash
npm run build
npm start
```

## 🎨 Customizing the Theme

### Change Default Accent Color

Edit `store/uiStore.ts`:

```typescript
accentColor: '#YOUR_COLOR',  // Change from #7C3AED
```

Edit `styles/globals.css`:

```css
:root {
  --accent-color: #YOUR_COLOR;
}
```

Edit `tailwind.config.ts`:

```typescript
accent: {
  DEFAULT: '#YOUR_COLOR',
}
```

### Add More Color Options

Edit `components/modals/CreateProjectModal.tsx`:

```typescript
const accentColors = [
  "#7C3AED",
  "#YOUR_COLOR_1",
  "#YOUR_COLOR_2",
  // Add more...
];
```

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Solution:** Ensure backend is running on port 3001

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
```

### Issue: "Socket connection failed"

**Solution:** Verify Socket.io server is running and CORS is configured

```javascript
const io = new Server(server, {
  cors: { origin: "http://localhost:3000" },
});
```

### Issue: "Login fails immediately"

**Solution:** Check backend `/api/auth/login` returns correct format:

```json
{
  "user": { "id": "...", "name": "...", "email": "..." },
  "token": "jwt-token-here"
}
```

### Issue: "Messages not appearing"

**Solution:** Verify Socket.io events are being emitted:

- Client emits `send-message`
- Server should emit `new-message` to room

### Issue: "白 Types errors in IDE"

**Solution:** Restart TypeScript server

- VS Code: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Issue: "Port 3000 already in use"

**Solution:** Kill process or use different port

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

## 🔍 Testing the App

### Manual Testing Flow

1. **Sign Up**
   - Go to http://localhost:3000/signup
   - Create account
   - Should redirect to dashboard

2. **Create Project**
   - Click "+ Create Project"
   - Enter name
   - Select color
   - Submit

3. **Create Channel**
   - Select project
   - Click "+ Create Channel"
   - Enter name
   - Submit

4. **Send Message**
   - Select channel
   - Type message
   - Press Enter or click Send

5. **Upload File**
   - Click paperclip icon
   - Select file
   - Add optional message
   - Send

### Verify Real-Time

1. Open app in two browser windows
2. Log in to same account
3. Send message in one window
4. Should appear instantly in other window

## 📦 Adding New Features

### Add New Component

```bash
# Create component file
touch components/MyComponent.tsx
```

```typescript
'use client'

export function MyComponent() {
  return (
    <div className="bg-base-surface p-4 rounded-lg">
      My Component
    </div>
  )
}
```

### Add New Store

```bash
touch store/myStore.ts
```

```typescript
import { create } from "zustand";

interface MyState {
  data: string[];
  addData: (item: string) => void;
}

export const useMyStore = create<MyState>((set) => ({
  data: [],
  addData: (item) =>
    set((state) => ({
      data: [...state.data, item],
    })),
}));
```

### Add New API Endpoint

Edit `lib/api.ts`:

```typescript
export const myAPI = {
  getData: () => apiClient.get("/my-endpoint"),
  postData: (data: any) => apiClient.post("/my-endpoint", data),
};
```

### Add New Socket Event

Edit `lib/socket.ts`:

```typescript
emitCustomEvent(data: any) {
  this.emit('custom-event', data)
}

listenCustomEvent(callback: (data: any) => void) {
  this.on('custom-event', callback)
}
```

## 🎯 Next Steps

1. **Set up backend** (see options above)
2. **Test authentication** flow
3. **Create test data** (projects, channels)
4. **Test real-time** messaging
5. **Customize theme** to your liking
6. **Add features** as needed

## 📚 Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint

# Package Management
npm install <package>    # Add dependency
npm uninstall <package>  # Remove dependency
npm update               # Update dependencies

# TypeScript
npx tsc --noEmit        # Check types without building

# Clear cache
rm -rf .next node_modules
npm install
```

## 🔗 Helpful Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://docs.pmnd.rs/zustand
- **Socket.io**: https://socket.io/docs/v4/
- **TypeScript**: https://www.typescriptlang.org/docs/

## 💡 Pro Tips

1. **Use browser DevTools** - Network tab shows API calls, Console shows errors
2. **Enable React DevTools** - Install browser extension for component inspection
3. **Use Zustand DevTools** - Install browser extension for state debugging
4. **Hot reload** - Save files to see instant changes
5. **TypeScript errors** - Fix in IDE before running
6. **Console logs** - Add `console.log()` for debugging
7. **Component reuse** - Build reusable components early
8. **State management** - Keep stores focused and small

## 🚨 Before Deployment

- [ ] Set up production MongoDB
- [ ] Configure environment variables
- [ ] Enable HTTPS
- [ ] Set up proper authentication
- [ ] Configure CORS properly
- [ ] Add error tracking (Sentry)
- [ ] Add analytics
- [ ] Test on multiple browsers
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Optimize images
- [ ] Add meta tags for SEO

---

Happy coding! 🚀
