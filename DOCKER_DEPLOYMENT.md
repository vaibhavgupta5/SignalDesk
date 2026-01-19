# Docker Deployment Guide

## 🐳 Overview

SignalDesk is fully containerized with Docker for easy deployment. This guide covers running the application with **MongoDB Atlas** (cloud database).

## 📦 What's Dockerized

1. **Next.js App** (Frontend + REST API) - Port 3000
2. **Socket.io Server** (Real-time) - Port 3001
3. **MongoDB Atlas** (Cloud Database) - No container needed

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- MongoDB Atlas account and cluster
- Connection string from MongoDB Atlas

### Step 1: Get MongoDB Atlas Connection String

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you don't have one)
3. Click "Connect" → "Connect your application"
4. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/signaldesk
   ```

### Step 2: Configure Environment Variables

Create `.env.production` in project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/signaldesk
JWT_SECRET=your-super-secret-production-key-min-32-chars
```

Create `backend-socket/.env.production`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/signaldesk
JWT_SECRET=your-super-secret-production-key-min-32-chars
CLIENT_URL=http://localhost:3000
NODE_ENV=production
```

⚠️ **Important:** JWT_SECRET must be identical in both files!

### Step 3: Build and Run with Docker Compose

```bash
docker-compose up --build -d
```

### Step 4: Access Application

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Socket.io:** http://localhost:3001

### Step 5: View Logs

```bash
# All services
docker-compose logs -f

# Next.js only
docker-compose logs -f nextjs

# Socket.io only
docker-compose logs -f socket-server
```

### Step 6: Stop Services

```bash
docker-compose down
```

## 🔧 Manual Docker Commands

### Build Images Separately

**Next.js:**

```bash
docker build -t signaldesk-nextjs .
```

**Socket.io:**

```bash
docker build -t signaldesk-socket ./backend-socket
```

### Run Containers Individually

**Next.js:**

```bash
docker run -d \
  --name signaldesk-nextjs \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000 \
  -e NEXT_PUBLIC_SOCKET_URL=http://localhost:3001 \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your-secret \
  signaldesk-nextjs
```

**Socket.io:**

```bash
docker run -d \
  --name signaldesk-socket \
  -p 3001:3001 \
  -e PORT=3001 \
  -e MONGODB_URI=mongodb+srv://... \
  -e JWT_SECRET=your-secret \
  -e CLIENT_URL=http://localhost:3000 \
  signaldesk-socket
```

## 📋 Docker Compose Reference

### Commands

```bash
# Build and start
docker-compose up --build

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Remove everything (including volumes)
docker-compose down -v

# Scale socket servers (load balancing)
docker-compose up --scale socket-server=3
```

### Service Status

```bash
# Check running containers
docker ps

# Check all containers
docker ps -a

# Inspect a service
docker inspect signaldesk-nextjs
```

## 🌐 Production Deployment

### Environment Variables for Production

**For cloud deployment (Vercel, Railway, etc.):**

```env
# Frontend (Next.js)
NEXT_PUBLIC_API_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://socket.your-domain.com
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/signaldesk
JWT_SECRET=<strong-random-secret-min-32-chars>

# Socket.io Server
PORT=3001
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/signaldesk
JWT_SECRET=<same-as-above>
CLIENT_URL=https://your-domain.com
NODE_ENV=production
```

### Docker Hub Deployment

**1. Tag images:**

```bash
docker tag signaldesk-nextjs yourusername/signaldesk-nextjs:latest
docker tag signaldesk-socket yourusername/signaldesk-socket:latest
```

**2. Push to Docker Hub:**

```bash
docker push yourusername/signaldesk-nextjs:latest
docker push yourusername/signaldesk-socket:latest
```

**3. Pull and run on server:**

```bash
docker pull yourusername/signaldesk-nextjs:latest
docker pull yourusername/signaldesk-socket:latest

docker-compose up -d
```

### AWS ECS / Google Cloud Run

Both services are container-ready. Use the Dockerfiles to deploy to:

- AWS Elastic Container Service (ECS)
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

## 🔒 Security Best Practices

### 1. Use Strong Secrets

```bash
# Generate strong JWT secret
openssl rand -base64 32
```

### 2. Environment Variables

- Never commit `.env.production` files
- Use secrets management (AWS Secrets Manager, etc.)
- Rotate JWT secrets periodically

### 3. Network Security

```yaml
# In docker-compose.yml, use internal network
networks:
  signaldesk-network:
    driver: bridge
    internal: true # No external access
```

### 4. MongoDB Atlas Security

- Enable IP Whitelist
- Use strong passwords
- Enable audit logs
- Use VPC peering in production

### 5. HTTPS/SSL

- Use reverse proxy (Nginx, Caddy)
- Enable SSL certificates
- Redirect HTTP to HTTPS

## 🐛 Troubleshooting

### Container Won't Start

**Check logs:**

```bash
docker logs signaldesk-nextjs
docker logs signaldesk-socket
```

**Common issues:**

- Missing environment variables
- MongoDB connection string incorrect
- JWT_SECRET mismatch
- Port already in use

### MongoDB Connection Failed

**Checklist:**

- ✅ Connection string format correct
- ✅ Username/password correct
- ✅ IP whitelist includes your IP (0.0.0.0/0 for testing)
- ✅ Network access configured in Atlas
- ✅ Database user has read/write permissions

### Socket.io Not Connecting

**Check:**

- Socket server is running: `docker ps`
- Port 3001 is exposed
- CLIENT_URL matches frontend URL
- CORS configuration allows your domain

### Build Fails

```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## 📊 Monitoring

### Health Checks

**Add to docker-compose.yml:**

```yaml
services:
  nextjs:
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:3000",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  socket-server:
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:3001/health",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Resource Limits

```yaml
services:
  nextjs:
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: 1G
        reservations:
          cpus: "0.5"
          memory: 512M
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Next.js
        run: docker build -t signaldesk-nextjs .

      - name: Build Socket.io
        run: docker build -t signaldesk-socket ./backend-socket

      - name: Push to Registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push signaldesk-nextjs
          docker push signaldesk-socket
```

## 📁 File Structure

```
signaldesk/
├── Dockerfile                      # Next.js container
├── .dockerignore                   # Next.js ignore
├── docker-compose.yml              # Orchestration
├── .env.production.example         # Production env template
│
└── backend-socket/
    ├── Dockerfile                  # Socket.io container
    ├── .dockerignore              # Socket.io ignore
    └── .env.production.example    # Socket env template
```

## ✅ Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Connection string obtained
- [ ] Strong JWT secret generated (32+ chars)
- [ ] Environment files configured
- [ ] Docker images built successfully
- [ ] Both containers running
- [ ] Can access frontend (port 3000)
- [ ] Can access API (/api/auth/login)
- [ ] Socket.io connection works
- [ ] Database writes working
- [ ] File uploads working
- [ ] HTTPS configured (production)
- [ ] Domain/DNS configured
- [ ] Monitoring set up
- [ ] Backups configured

## 🚀 Quick Commands Reference

```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up -d

# Rebuild single service
docker-compose build nextjs
docker-compose up -d nextjs

# View resource usage
docker stats

# Clean everything
docker-compose down -v
docker system prune -a

# Export images
docker save signaldesk-nextjs > nextjs.tar
docker save signaldesk-socket > socket.tar

# Import images
docker load < nextjs.tar
docker load < socket.tar
```

## 📞 Support

For deployment issues:

1. Check logs: `docker-compose logs -f`
2. Verify MongoDB Atlas connectivity
3. Ensure environment variables are correct
4. Check BACKEND_SETUP.md for MongoDB configuration

---

**Your app is now containerized and ready for deployment!** 🎉
