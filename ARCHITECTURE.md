# Architecture Documentation

## System Overview

SignalDesk is a project-based team collaboration platform with real-time messaging capabilities. The architecture follows a modern client-server model with WebSocket support for real-time features.

## Frontend Architecture

### Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios

### Directory Structure

```
app/
  (auth)/          - Authentication pages (login, signup)
  (dashboard)/     - Protected dashboard routes
  layout.tsx       - Root layout
  page.tsx         - Landing page

components/
  chat/            - Chat-related components
  layout/          - Sidebar and layout components
  modals/          - Modal dialogs
  ui/              - Reusable UI primitives

store/             - Zustand state stores
lib/               - Utilities and services
styles/            - Global CSS
```

### State Management

Zustand stores provide global state with minimal boilerplate:

1. **authStore** - Authentication state
   - User session
   - JWT token
   - Login/logout logic

2. **projectStore** - Project data
   - Project list
   - Active project selection
   - CRUD operations

3. **groupStore** - Channel/group data
   - Groups per project
   - Active channel selection
   - CRUD operations

4. **chatStore** - Message data
   - Messages by channel
   - Typing indicators
   - Real-time message updates

5. **uiStore** - UI customization
   - Theme accent color
   - Dynamic CSS variables

### Real-Time Communication

Socket.io client manages WebSocket connections:

- Single socket instance per session
- Automatic reconnection
- Room-based messaging (channels)
- Typing indicator broadcasts
- Event listeners for real-time updates

### Authentication Flow

1. User submits credentials
2. Frontend receives JWT token
3. Token stored in sessionStorage
4. Token attached to all API requests via Axios interceptor
5. Socket.io connection authenticated with token
6. 401 responses trigger automatic logout and redirect

### Routing Strategy

Next.js App Router with route groups:

- `(auth)` - Public authentication routes
- `(dashboard)` - Protected application routes
- Layout-based authentication guard
- Automatic redirection for unauthenticated users

## Component Architecture

### Design System

Custom components follow shadcn/ui patterns:

- Composable primitives (Button, Input, Avatar)
- Variant-based styling with class-variance-authority
- Consistent dark theme
- Tailwind utility classes

### Chat Components

**MessageList**

- Virtualized rendering with react-virtuoso
- Efficient for large message histories
- Smart avatar grouping
- Auto-scroll to latest message

**ChatInput**

- Multi-line textarea with auto-resize
- File upload with preview
- Typing indicator broadcasts
- Keyboard shortcuts (Enter to send, Shift+Enter for newline)

**ChatMessage**

- Supports text, images, files
- Conditional avatar display
- Timestamp formatting
- Hover effects

### Layout Components

**Three-Column Slack-Style Layout**

1. Workspace sidebar (80px) - Logo and logout
2. Project sidebar (256px) - Project list
3. Channel sidebar (256px) - Channel list for active project
4. Main area (flex) - Chat interface

## API Integration

### Axios Configuration

- Base URL from environment variables
- Request interceptor adds JWT token
- Response interceptor handles 401 errors
- Organized by resource (auth, projects, groups, messages)

### API Modules

```typescript
authAPI.login(email, password);
authAPI.signup(name, email, password);
authAPI.verifyToken();

projectAPI.getAll();
projectAPI.create(data);
projectAPI.update(id, data);
projectAPI.delete(id);

groupAPI.getByProject(projectId);
groupAPI.create(projectId, data);
groupAPI.update(groupId, data);
groupAPI.delete(groupId);

messageAPI.getByGroup(groupId, page, limit);
messageAPI.uploadFile(file);
```

## Styling Architecture

### Tailwind Configuration

Custom design tokens:

- Base colors (bg, surface, border, hover)
- Text colors (primary, secondary, muted)
- Accent color (CSS variable for runtime changes)

### CSS Variables

Dynamic accent colors via CSS variables:

- `--accent-color`
- `--accent-hover`
- `--accent-light`

Updated programmatically when switching projects.

### Global Styles

- Body overflow hidden (full-height layout)
- Custom scrollbar styling
- Smooth transitions utility class
- Dark theme defaults

## Performance Considerations

### Optimizations

1. **Message Virtualization**
   - Only render visible messages
   - Smooth scrolling with react-virtuoso

2. **Zustand Selectors**
   - Subscribe to specific state slices
   - Prevent unnecessary re-renders

3. **Memoization**
   - Compute intensive operations cached
   - React.memo for pure components

4. **Code Splitting**
   - Next.js automatic code splitting
   - Lazy loading for modals

5. **Image Optimization**
   - Next.js Image component where applicable
   - Lazy loading for chat images

## Security Architecture

### Authentication

- JWT tokens in sessionStorage (cleared on logout)
- Automatic token refresh via API calls
- Protected routes with layout-based guards

### Authorization

- Backend validates all requests
- Frontend assumes user has access (backend enforces)
- 401 responses trigger logout

### Input Validation

- Client-side validation for UX
- Server-side validation for security
- XSS protection via React's built-in escaping

## Deployment Considerations

### Environment Variables

Required variables:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket server URL

### Build Process

```bash
npm run build    # Production build
npm start        # Start production server
```

### Hosting Recommendations

- **Vercel** - Optimized for Next.js
- **Netlify** - Good Next.js support
- **AWS Amplify** - Scalable option
- **Docker** - Containerized deployment

## Scalability

### Frontend Scalability

- Stateless frontend (JWT auth)
- CDN-friendly static assets
- Serverless-compatible
- Horizontal scaling possible

### State Management Scalability

- Zustand is lightweight and performant
- No context re-render issues
- Easy to add new stores
- TypeScript ensures type safety

## Testing Strategy (Future)

### Recommended Tests

1. **Unit Tests**
   - Zustand store logic
   - Utility functions
   - Component logic

2. **Integration Tests**
   - API integration
   - Socket.io integration
   - User flows

3. **E2E Tests**
   - Authentication flow
   - Project creation
   - Messaging flow

### Tools

- Jest for unit tests
- React Testing Library
- Playwright for E2E
- MSW for API mocking

## Future Architecture Improvements

1. **Redux Toolkit** - For more complex state if needed
2. **React Query** - For server state management
3. **Offline Support** - Service workers and local storage
4. **WebRTC** - For voice/video calls
5. **GraphQL** - Alternative to REST API
6. **Micro-frontends** - Split into smaller apps if scale requires

## Conclusion

The architecture is designed to be:

- **Maintainable** - Clear separation of concerns
- **Scalable** - Modular and extensible
- **Performant** - Optimized rendering and state
- **Secure** - JWT auth and protected routes
- **Developer-friendly** - TypeScript and good DX
