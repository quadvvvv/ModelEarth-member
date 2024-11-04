// src/server.js
import {serve} from 'bun';
import {nanoid} from 'nanoid';

import {DiscordFactory} from './services/discordFactory';

export class Server {
  constructor(config = {}) {
    this.config = {
      port: parseInt(process.env.PORT || '8080', 10),
      maxConcurrentUsers:
          parseInt(process.env.MAX_CONCURRENT_USERS || '100', 10),
      allowedOrigins: (process.env.ALLOWED_ORIGINS || '*').split(','),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
      rateLimitMaxRequests:
          parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      sessionTimeout:
          parseInt(process.env.SESSION_TIMEOUT || '1800000', 10),  // 30 minutes
      cleanupInterval:
          parseInt(process.env.CLEANUP_INTERVAL || '300000', 10),  // 5 minutes
      ...config
    };

    this.sessions = new Map();
    this.rateLimit = new Map();
    this.discordFactory = config.discordFactory || DiscordFactory;

    this.corsHeaders = {
      'Access-Control-Allow-Origin': this.config.allowedOrigins[0] === '*' ?
          '*' :
          this.config.allowedOrigins.join(', '),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers':
          'Content-Type, Authorization, X-Request-ID',
    };

    // Start cleanup interval if not in test mode
    if (!config.testMode) {
      this.startCleanupInterval();
    }
  }

  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupSessions();
    }, this.config.cleanupInterval);
  }

  stopCleanupInterval() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async cleanupSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        console.log(`Cleaning up inactive session: ${sessionId}`);
        await session.bot.destroy();
        this.sessions.delete(sessionId);
      }
    }
  }

  isRateLimited(clientIP) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    // Initialize if not exists
    if (!this.rateLimit.has(clientIP)) {
      this.rateLimit.set(clientIP, []);
    }

    // Clean up old entries
    const requests = this.rateLimit.get(clientIP);
    const validRequests = requests.filter(time => time > windowStart);

    if (validRequests.length >= this.config.rateLimitMaxRequests) {
      this.rateLimit.set(clientIP, validRequests);
      return true;
    }

    this.rateLimit.set(clientIP, [...validRequests, now]);
    return false;
  }

  authenticateSession(req) {
    const sessionId = req.headers.get('Authorization');
    if (!sessionId || !this.sessions.has(sessionId)) {
      return null;
    }
    return {sessionId, ...this.sessions.get(sessionId)};
  }

  logRequest(req, sessionId = 'Unauthenticated') {
    const requestId = req.headers.get('X-Request-ID') || nanoid();
    console.log(`[${new Date().toISOString()}] ${requestId} ${req.method} ${
        req.url} - Session: ${sessionId}`);
    return requestId;
  }

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

  async handleLogin(req, requestId) {
    // Check concurrent users limit first
    if (this.sessions.size >= this.config.maxConcurrentUsers) {
      return this.createResponse({
        error: 'Maximum number of concurrent users reached'
      }, 503);
    }

    let body;
    try {
      body = await req.clone().json();  // Clone the request before parsing JSON
    } catch (error) {
      return this.createResponse({
        error: 'Invalid JSON payload'
      }, 400);
    }

    const { token } = body;
    if (!token) {
      return this.createResponse({
        error: 'Token is required'
      }, 400);
    }

    try {
      const discord = this.discordFactory.createService();
      const guildInfo = await discord.initialize(token);
      const sessionId = nanoid();
      
      this.sessions.set(sessionId, {
        bot: discord,
        token,
        createdAt: Date.now(),
        lastActivity: Date.now()
      });

      console.log(`[${requestId}] New session created: ${sessionId}`);
      
      return this.createResponse({
        sessionId,
        message: 'Logged in successfully',
        ...guildInfo
      });
    } catch (error) {
      console.error(`[${requestId}] Login error:`, error);
      return this.createResponse({
        error: error.message
      }, 400);
    }
  }

  async handleRequest(req) {
    const requestId = this.logRequest(req);
    const clientIP =
        req.headers.get('X-Forwarded-For')?.split(',')[0] || 'unknown';
    const responseHeaders = {'X-Request-ID': requestId};

    try {
      const url = new URL(req.url);
      const method = req.method;
      const path = url.pathname;

      if (path === '/_ah/health') {
        // Add the request to rate limit tracking before responding
        if (this.isRateLimited(clientIP)) {
          return this.createResponse(
              {
                error: 'Too many requests',
                retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
              },
              429, {
                ...responseHeaders,
                'Retry-After':
                    Math.ceil(this.config.rateLimitWindow / 1000).toString()
              });
        }
        return this.createResponse({status: 'healthy'}, 200, responseHeaders);
      }

      if (method === 'OPTIONS') {
        return new Response(
            null,
            {status: 204, headers: {...this.corsHeaders, ...responseHeaders}});
      }

      // Check rate limit for all non-OPTIONS requests
      if (this.isRateLimited(clientIP)) {
        return this.createResponse(
            {
              error: 'Too many requests',
              retryAfter: Math.ceil(this.config.rateLimitWindow / 1000)
            },
            429, {
              ...responseHeaders,
              'Retry-After':
                  Math.ceil(this.config.rateLimitWindow / 1000).toString()
            });
      }

      if (method === 'POST' && path === '/api/auth/login') {
        return this.handleLogin(req, requestId);
      }

      const session = this.authenticateSession(req);
      if (!session) {
        return this.createResponse(
            {error: 'Unauthorized'}, 401, responseHeaders);
      }

      // Update last activity
      this.sessions.set(
          session.sessionId,
          {...this.sessions.get(session.sessionId), lastActivity: Date.now()});

      if (method === 'POST' && path === '/api/auth/logout') {
        await session.bot.destroy();
        this.sessions.delete(session.sessionId);
        return this.createResponse(
            {message: 'Logged out successfully'}, 200, responseHeaders);
      }

      try {
        if (method === 'GET') {
          switch (path) {
            case '/api/members':
              const members = await session.bot.getMembers();
              return this.createResponse(members, 200, responseHeaders);

            case '/api/channels':
              const channels = await session.bot.getChannels();
              return this.createResponse(channels, 200, responseHeaders);

            case '/api/messages':
              const channelId = url.searchParams.get('channelId');
              const limit =
                  parseInt(url.searchParams.get('limit') || '100', 10);

              if (!channelId) {
                return this.createResponse(
                    {error: 'Channel ID is required'}, 400, responseHeaders);
              }

              const messages = await session.bot.getMessages(channelId, limit);
              return this.createResponse(messages, 200, responseHeaders);
          }
        }

        return this.createResponse({error: 'Not Found'}, 404, responseHeaders);
      } catch (error) {
        console.error(`[${requestId}] Operation error:`, error);
        return this.createResponse(
            {error: error.message}, 500, responseHeaders);
      }
    } catch (error) {
      console.error(`[${requestId}] Unhandled error:`, error);
      return this.createResponse(
          {error: 'Internal Server Error'}, 500, responseHeaders);
    }
  }

  start() {
    serve({
      fetch: (req) => this.handleRequest(req),
      port: this.config.port,
    });
    console.log(`Server started on http://localhost:${this.config.port}`);
  }

  async stop() {
    this.stopCleanupInterval();
    // Cleanup all active sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      await session.bot.destroy();
      this.sessions.delete(sessionId);
    }
  }
}

// Only start the server if this file is being run directly
if (import.meta.url === Bun.main) {
  const server = new Server();
  server.start();
}