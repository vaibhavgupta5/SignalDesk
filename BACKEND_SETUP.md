# Backend Setup Guide

## ✅ Complete Backend Architecture

SignalDesk now has TWO backend components:

1. **Next.js API Routes** - REST API for CRUD operations
2. **Socket.io Server** - Real-time messaging server

## 🗄️ MongoDB Setup

### Install MongoDB

**Option 1: Local MongoDB**

```bash
# Windows (with Chocolatey)
choco install mongodb

# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Linux (Ubuntu)
sudo apt-get install mongodb

# Start MongoDB
mongod
```

**Option 2: MongoDB Atlas (Cloud)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env.local` with connection string

### Configure MongoDB URI

Edit `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/signaldesk
# Or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/signaldesk
```

## 🔧 Backend 1: Next.js API Routes

### What It Does

- User authentication (signup/login)
- Project CRUD
- Group/Channel CRUD
- Message retrieval
- File uploads

### File Structure

```
app/api/
├── auth/
│   ├── login/route.ts
│   ├── signup/route.ts
│   └── verify/route.ts
├── projects/
│   ├── route.ts
│   ├── join/route.ts
│   └── [projectId]/
│       └── groups/route.ts
├── groups/
│   └── [groupId]/
│       └── messages/route.ts
└── upload/route.ts

models/
├── User.ts
├── Project.ts
├── Group.ts
└── Message.ts

lib/
├── mongodb.ts
├── jwt.ts
├── auth.ts
└── middleware.ts
```

### API Endpoints

**Authentication**

```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/verify
```

**Projects**

```
GET  /api/projects
POST /api/projects
POST /api/projects/join
GET  /api/projects/:projectId/groups
POST /api/projects/:projectId/groups
```

**Messages**

```
GET /api/groups/:groupId/messages?page=1&limit=50
```

**Files**

```
POST /api/upload
```

### Running

The Next.js API routes run automatically with:

```bash
npm run dev
```

API available at: `http://localhost:3000/api`

## 🔌 Backend 2: Socket.io Server

### What It Does

- Real-time message broadcasting
- Typing indicators
- Room management
- JWT authentication
- User presence

### Setup

1. **Navigate to backend-socket directory:**

```bash
cd backend-socket
```

2. **Install dependencies:**

```bash
npm install
```

3. **Configure environment:**
   Edit `backend-socket/.env`:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

4. **Start server:**

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Socket.io server runs at: `http://localhost:3001`

### Socket Events

**Client → Server:**

- `join-project` - Join project room
- `leave-project` - Leave project room
- `join-group` - Join group/channel room
- `leave-group` - Leave group/channel room
- `send-message` - Send message to group
- `typing` - Broadcast typing status

**Server → Client:**

- `new-message` - New message received
- `user-typing` - User is typing notification
- `error` - Error messages

### Room Structure

```
project:{projectId}  - All project members
group:{groupId}      - All group members
```

## 🚀 Complete Startup Guide

### 1. Start MongoDB

```bash
mongod
```

### 2. Start Next.js (API + Frontend)

```bash
# In project root
npm run dev
```

### 3. Start Socket.io Server

```bash
# In new terminal
cd backend-socket
npm run dev
```

Now you have:

- Frontend: http://localhost:3000
- REST API: http://localhost:3000/api
- Socket.io: http://localhost:3001

## 📊 Database Schemas

### User

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  passwordHash: String,
  avatar: String,
  projects: [ObjectId],
  createdAt: Date
}
```

### Project

```javascript
{
  _id: ObjectId,
  name: String,
  projectId: String (unique, 10 chars),
  description: String,
  owner: ObjectId (User),
  members: [ObjectId],
  accentColor: String,
  createdAt: Date
}
```

### Group

```javascript
{
  _id: ObjectId,
  name: String,
  project: ObjectId (Project),
  description: String,
  isDefault: Boolean,
  createdAt: Date
}
```

### Message

```javascript
{
  _id: ObjectId,
  group: ObjectId (Group),
  sender: ObjectId (User),
  type: 'text' | 'image' | 'file',
  content: String,
  fileMeta: {
    name: String,
    size: Number,
    mime: String,
    url: String
  },
  createdAt: Date
}
```

## 🔐 Authentication Flow

1. User signs up/logs in via `/api/auth/signup` or `/api/auth/login`
2. Server returns JWT token
3. Frontend stores token in sessionStorage
4. All REST API requests include `Authorization: Bearer <token>` header
5. Socket.io connection authenticates with token in `auth.token`
6. Server verifies JWT on each request/socket connection

## 📤 File Upload Flow

1. User selects file
2. Frontend uploads to `/api/upload` (multipart/form-data)
3. Server saves file to `public/uploads/`
4. Server returns public URL: `/uploads/filename.ext`
5. Frontend sends message with file URL via Socket.io
6. Message saved to MongoDB with file metadata

## 🔧 Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Socket Server (backend-socket/.env)

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/signaldesk
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

⚠️ **Important:** JWT_SECRET must be the same in both!

## 🧪 Testing the Backend

### 1. Test Authentication

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Project Creation

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"My Project","description":"Test project","accentColor":"#7C3AED"}'
```

### 3. Test Socket.io

Open browser console on http://localhost:3000 and check Socket.io connection in Network tab.

## 🐛 Troubleshooting

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
mongod --version

# Restart MongoDB
# Windows
net start MongoDB

# macOS
brew services restart mongodb-community

# Linux
sudo systemctl restart mongod
```

### Socket.io Connection Failed

- Verify Socket.io server is running on port 3001
- Check CORS settings in `backend-socket/server.js`
- Ensure JWT_SECRET matches in both backends

### JWT Token Invalid

- Verify JWT_SECRET is the same in both `.env.local` and `backend-socket/.env`
- Check token expiration (default: 30 days)
- Clear sessionStorage and login again

### File Upload Failed

- Ensure `public/uploads` directory exists
- Check file permissions
- Verify file size isn't too large

## 📈 Scaling Considerations

### For Production:

1. **Use environment-specific MongoDB**
   - Development: Local MongoDB
   - Production: MongoDB Atlas

2. **Deploy Socket.io separately**
   - Use Redis adapter for multiple Socket.io instances
   - Enable sticky sessions if behind load balancer

3. **File storage**
   - Use Cloudinary/AWS S3 instead of local storage
   - Update `/api/upload/route.ts` accordingly

4. **Security**
   - Change JWT_SECRET to strong random string
   - Enable HTTPS
   - Add rate limiting
   - Validate file types and sizes
   - Sanitize user inputs

5. **Performance**
   - Add database indexes (already included in schemas)
   - Enable MongoDB connection pooling
   - Cache frequently accessed data
   - Optimize Socket.io rooms

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Next.js dev server is running (port 3000)
- [ ] Socket.io server is running (port 3001)
- [ ] Can signup new user
- [ ] Can login
- [ ] Can create project
- [ ] Can create channel
- [ ] Can send message
- [ ] Messages appear in real-time
- [ ] File upload works
- [ ] Typing indicators work

## 📚 Additional Resources

- MongoDB Docs: https://www.mongodb.com/docs/
- Mongoose Docs: https://mongoosejs.com/docs/
- Socket.io Docs: https://socket.io/docs/v4/
- JWT Docs: https://jwt.io/introduction

---

**Your backend is now complete and ready for production!** 🎉
