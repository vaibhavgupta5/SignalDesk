# SignalDesk 🚀

A modern, dark-themed project collaboration platform inspired by Slack, built with Next.js, TypeScript, and real-time messaging.

## Features ✨

- **Project-Based Organization** - Organize work by projects with custom accent colors
- **Real-Time Chat** - Instant messaging with Socket.io
- **Channel System** - Create topic-based channels within projects
- **File Sharing** - Support for images and documents
- **Dark Theme** - Beautiful black-based UI with customizable accents
- **JWT Authentication** - Secure token-based auth
- **Typing Indicators** - See when others are typing
- **Message Virtualization** - Smooth performance with large message histories
- **🐳 Docker Ready** - Fully containerized for easy deployment

## Tech Stack 🛠️

**Frontend:**

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Socket.io Client
- Custom shadcn/ui Components

**Backend (Integrated):**

- Next.js API Routes (REST API)
- MongoDB + Mongoose
- JWT Authentication
- bcrypt (Password Hashing)
- File Upload (Local Storage)

**Backend (Separate Socket.io Server):**

- Express
- Socket.io Server
- MongoDB + Mongoose
- JWT Verification
- Real-time Messaging

## Project Structure 📁

```
signaldesk/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   └── dashboard/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   └── MessageList.tsx
│   ├── layout/
│   │   ├── SidebarWorkspace.tsx
│   │   ├── SidebarProjects.tsx
│   │   └── SidebarGroups.tsx
│   ├── modals/
│   │   ├── CreateProjectModal.tsx
│   │   └── CreateGroupModal.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       ├── avatar.tsx
│       └── scroll-area.tsx
├── store/
│   ├── authStore.ts
│   ├── projectStore.ts
│   ├── groupStore.ts
│   ├── chatStore.ts
│   └── uiStore.ts
├── lib/
│   ├── socket.ts
│   ├── api.ts
│   ├── utils.ts
│   └── format.ts
└── styles/
    └── globals.css
```

## Getting Started 🚀

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB (local or Atlas)

### Quick Start

1. **Install MongoDB**

```bash
# macOS
brew install mongodb-community

# Windows
choco install mongodb

# Start MongoDB
mongod
```

2. **Install dependencies:**

```bash
npm install
cd backend-socket && npm install && cd ..
```

3. **Configure environment:**
   Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key
```

Edit `backend-socket/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
```

4. **Start all services:**

Terminal 1 - MongoDB:

```bash
mongod
```

Terminal 2 - Next.js (Frontend + REST API):

```bash
npm run dev
```

Terminal 3 - Socket.io Server:

```bash
cd backend-socket
npm run dev
```

5. **Open application:**

```
http://localhost:3000
```

For detailed setup instructions, see **[BACKEND_SETUP.md](./BACKEND_SETUP.md)**

### 🐳 Docker Deployment (Recommended for Production)

**Prerequisites:** Docker Desktop + MongoDB Atlas account

1. **Get MongoDB Atlas connection string** from https://mongodb.com/atlas

2. **Configure environment:**

```bash
cp .env.production.example .env.production
cp backend-socket/.env.production.example backend-socket/.env.production
# Edit both files with your MongoDB URI and JWT secret
```

3. **Run with Docker Compose:**

```bash
docker-compose up --build -d
```

4. **Access at http://localhost:3000**

For complete Docker guide, see **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)**

## State Management Architecture 🧠

### Zustand Stores

**authStore** - User authentication and session

- User data
- JWT token
- Login/logout actions

**projectStore** - Project management

- Project list
- Active project
- CRUD operations

**groupStore** - Channel/group management

- Groups per project
- Active channel
- CRUD operations

**chatStore** - Message handling

- Messages by group
- Typing indicators
- Real-time updates

**uiStore** - UI customization

- Theme accent color
- CSS variable updates

## Real-Time Features ⚡

### Socket.io Events

**Client → Server**

- `join-group` - Join a channel
- `leave-group` - Leave a channel
- `send-message` - Send a message
- `typing` - Broadcast typing status

**Server → Client**

- `new-message` - Receive new message
- `user-typing` - User typing notification
- `error` - Error handling

## Component Overview 🧩

### Layout Components

**SidebarWorkspace** - App branding and logout
**SidebarProjects** - Project list with color indicators
**SidebarGroups** - Channel list for active project

### Chat Components

**ChatHeader** - Channel name and member count
**MessageList** - Virtualized message feed
**ChatMessage** - Individual message with avatar, text, files
**ChatInput** - Message input with file upload and typing detection

### Modal Components

**CreateProjectModal** - Create new project with accent color picker
**CreateGroupModal** - Create new channel within project

## API Integration 🔌

### Endpoints Used

```
POST /api/auth/login
POST /api/auth/signup
GET  /api/auth/verify
GET  /api/projects
POST /api/projects
GET  /api/projects/:id/groups
POST /api/projects/:id/groups
GET  /api/groups/:id/messages
POST /api/upload
```

## Styling Guidelines 🎨

### Color System

Base colors defined in `tailwind.config.ts`:

- `base-bg`: #0B0B0F (main background)
- `base-surface`: #1A1A1F (elevated surfaces)
- `base-border`: #27272F (borders)
- `base-hover`: #2E2E38 (hover states)

Text colors:

- `text-primary`: #FFFFFF
- `text-secondary`: #B4B4B8
- `text-muted`: #6E6E73

Accent color:

- Configurable per project
- Default: #7C3AED (purple)
- Applied via CSS variables

### Design Principles

1. **Minimal & Clean** - No clutter, spacing-first design
2. **Dark Theme Only** - Pure black base for focus
3. **Smooth Transitions** - All interactive elements animated
4. **Accessible** - Proper contrast and focus states
5. **Consistent** - Reusable components throughout

## Security 🔒

- JWT tokens stored in sessionStorage (not localStorage)
- Automatic token refresh on API calls
- Protected routes with auth verification
- Axios interceptors for auth headers
- Redirect on 401 responses

## Performance Optimizations ⚡

- **Message Virtualization** - Only render visible messages
- **Smart Avatar Grouping** - Hide avatars for consecutive messages
- **Debounced Typing** - Reduce socket events
- **Lazy Loading** - Components loaded on demand
- **Optimized Re-renders** - Zustand selective subscriptions

## Future Enhancements 🔮

- [ ] User mentions (@username)
- [ ] Message reactions
- [ ] Thread replies
- [ ] Search functionality
- [ ] Direct messages
- [ ] Voice/video calls
- [ ] Message editing/deletion
- [ ] Rich text formatting
- [ ] Emoji picker
- [ ] Notification system
- [ ] Mobile responsive improvements
- [ ] PWA support

## Backend Implementation ✅

**Fully implemented! See [BACKEND_SETUP.md](./BACKEND_SETUP.md)**

The backend includes:

**REST API (Next.js API Routes):**

- ✅ User authentication (JWT)
- ✅ Project CRUD operations
- ✅ Group/Channel CRUD operations
- ✅ Message storage and retrieval
- ✅ File upload handling
- ✅ MongoDB integration

**Socket.io Server (`backend-socket/`):**

- ✅ Real-time message broadcasting
- ✅ Typing indicators
- ✅ Room management
- ✅ JWT authentication
- ✅ User presence tracking

### API Endpoints

All endpoints documented in [BACKEND_SETUP.md](./BACKEND_SETUP.md)

### Database Schemas

- User, Project, Group, Message models
- MongoDB + Mongoose ODM
- Optimized indexes for performance

## Documentation 📚

- **[README.md](./README.md)** - This file (overview)
- **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** - Complete backend setup guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture details
- **[QUICKSTART.md](./QUICKSTART.md)** - Development quickstart
- **[VISUAL_GUIDE.md](./VISUAL_GUIDE.md)** - UI component layouts
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Feature checklist
- **[FULLSTACK_COMPLETE.md](./FULLSTACK_COMPLETE.md)** - Complete implementation summary

## Contributing 🤝

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License 📄

MIT License - feel free to use this project for learning or production.

## Support 💬

For questions or issues, please open a GitHub issue.

---

Built with ❤️ using Next.js and TypeScript
