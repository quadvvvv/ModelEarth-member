# Discord Bot Backend Design Document

## 1. Overview

This document outlines the design for a Discord bot backend service (MemberSense) using Bun as the runtime. The service uses Bun's native HTTP server capabilities to handle Discord bot interactions, supporting multiple users and bots simultaneously through a simple and efficient request handling system.

## 2. Technology Stack

- **Runtime**: Bun
- **Language**: JavaScript
- **Key Libraries**:
  - `discord.js`: For Discord API interactions
  - `nanoid`: For generating unique session IDs and request IDs

## 3. Architecture

The backend follows a simple, stateless architecture with in-memory session management:

```
[Client] <--> [Bun Server (fetch handler)] <--> [Discord API]
                         |
                 [In-Memory Maps]
                 - sessions
                 - rateLimit
```

### Core Components

- `server.js`: Main server class containing:
  - Single fetch handler for all requests
  - URL-based routing
  - Session management via Map
  - Rate limiting via Map
  - Request logging
  - Health check handling
- `index.js`: Application entry point, initializes and starts the server
- `services/discordFactory.js`: Factory for Discord service instances
- `services/discord.service.js`: Core Discord API integration

## 4. Server Configuration

The server uses environment variables with sensible defaults:

```javascript
{
  port: parseInt(process.env.PORT || '8080', 10),
  maxConcurrentUsers: parseInt(process.env.MAX_CONCURRENT_USERS || '100', 10),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(','),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10),  // 30 minutes
  cleanupInterval: parseInt(process.env.CLEANUP_INTERVAL || '300000', 10)  // 5 minutes
}
```

## 5. Request Handling

### URL-Based Routing

The server uses a simple URL-based routing system in the handleRequest method:

```javascript
const url = new URL(req.url);
const method = req.method;
const path = url.pathname;

// Health check
if (path === '/_ah/health') { ... }

// Auth endpoints
if (method === 'POST' && path === '/api/auth/login') { ... }
if (method === 'POST' && path === '/api/auth/logout') { ... }

// Data endpoints
if (method === 'GET') {
  switch (path) {
    case '/api/members': ...
    case '/api/channels': ...
    case '/api/messages': ...
  }
}
```

### Endpoints

- **GET /_ah/health**
  - Health check endpoint
  - Not rate-limited
  - Returns: `{ status: 'healthy' }`

- **POST /api/auth/login**
  - Accepts Discord bot token
  - Creates new session
  - Returns session ID

- **POST /api/auth/logout**
  - Requires session ID in Authorization header
  - Destroys bot instance
  - Cleans up session

- **GET /api/members**
  - Requires session ID
  - Returns guild members

- **GET /api/channels**
  - Requires session ID
  - Returns guild channels

- **GET /api/messages**
  - Requires session ID
  - Accepts channelId and limit params
  - Returns channel messages

## 6. Session Management

### Session Storage
```javascript
this.sessions = new Map();
// Session structure:
{
  bot: DiscordService,
  token: string,
  createdAt: timestamp,
  lastActivity: timestamp
}
```

### Session Cleanup
```javascript
cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of this.sessions.entries()) {
    if (now - session.lastActivity > this.config.sessionTimeout) {
      session.bot.destroy();
      this.sessions.delete(sessionId);
    }
  }
}
```

## 7. Rate Limiting

### Implementation
```javascript
this.rateLimit = new Map();

isRateLimited(clientIP) {
  const now = Date.now();
  const windowStart = now - this.config.rateLimitWindow;
  
  if (!this.rateLimit.has(clientIP)) {
    this.rateLimit.set(clientIP, []);
  }
  
  const requests = this.rateLimit.get(clientIP);
  const validRequests = requests.filter(time => time > windowStart);
  
  if (validRequests.length >= this.config.rateLimitMaxRequests) {
    return true;
  }
  
  this.rateLimit.set(clientIP, [...validRequests, now]);
  return false;
}
```

## 8. Error Handling

### Response Creation
```javascript
createResponse(body, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...this.corsHeaders,
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}
```

### Error Status Codes
- 400: Bad Request (invalid JSON, missing token)
- 401: Unauthorized (invalid session)
- 429: Too Many Requests (rate limit)
- 500: Internal Server Error
- 503: Service Unavailable (max users reached)

## 9. Testing Strategy

Tests should focus on:
- Session management
- Rate limiting logic
- Request handling
- Error scenarios
- Configuration loading
- Cleanup processes

## 10. Deployment

- The server can be deployed using Bun's built-in server capabilities.
- The server also support containerized deployment on Google Cloud Run deployment.

## 11. Future Enhancements

- Implement webhook support for real-time Discord events.
- Add support for sending messages and performing other Discord actions.
- Develop a companion frontend application for easier bot management.
  