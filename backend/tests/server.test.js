import { afterEach, beforeEach, describe, expect, test, mock } from 'bun:test';
import { Server } from '../src/server.js';
import { MockDiscordFactory } from './mocks/discord.service.mock.js';

describe('Discord Server Tests', () => {
  let server;
  let mockSession;
  const originalNow = Date.now;

  // Helper function to create test requests
  const createTestRequest = (path, options = {}) => {
    const defaults = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '127.0.0.1',
        'X-Request-ID': 'test-request-id'
      }
    };

    const merged = { ...defaults, ...options };
    
    if (mockSession?.sessionId && !path.includes('/auth/login')) {
      merged.headers.Authorization = mockSession.sessionId;
    }

    // Properly stringify the body if it's an object
    if (merged.body && typeof merged.body === 'object') {
      merged.body = JSON.stringify(merged.body);
    }

    // Create the request with the correct URL and options
    const url = new URL(path, 'http://localhost');
    return new Request(url, merged);
  };

  beforeEach(() => {
    // Reset the server before each test
    server = new Server({
      testMode: true,
      discordFactory: MockDiscordFactory,
      maxConcurrentUsers: 2,
      rateLimitWindow: 1000,
      rateLimitMaxRequests: 5,
      sessionTimeout: 1000,
      cleanupInterval: 500
    });
    mockSession = undefined;
  });

  afterEach(async () => {
    Date.now = originalNow;
    if (server) {
      await server.stop();
      server = null;
    }
    mockSession = undefined;
  });

  describe('Server Configuration', () => {
    test('should initialize with default config from environment variables', () => {
      const defaultServer = new Server();
      expect(defaultServer.config.port).toBe(8080);
      expect(defaultServer.config.maxConcurrentUsers).toBe(100);
      expect(defaultServer.config.allowedOrigins).toEqual(['*']);
      expect(defaultServer.config.rateLimitWindow).toBe(60000);
      expect(defaultServer.config.rateLimitMaxRequests).toBe(100);
      expect(defaultServer.config.sessionTimeout).toBe(1800000);
      expect(defaultServer.config.cleanupInterval).toBe(300000);
      defaultServer.stop();
    });

    test('should override config with provided values', () => {
      const customServer = new Server({
        port: 3000,
        maxConcurrentUsers: 5,
        allowedOrigins: ['http://localhost:3000'],
        rateLimitWindow: 5000,
        sessionTimeout: 2000,
        cleanupInterval: 1000
      });
      expect(customServer.config.port).toBe(3000);
      expect(customServer.config.maxConcurrentUsers).toBe(5);
      expect(customServer.config.allowedOrigins).toEqual(['http://localhost:3000']);
      expect(customServer.config.rateLimitWindow).toBe(5000);
      expect(customServer.config.sessionTimeout).toBe(2000);
      expect(customServer.config.cleanupInterval).toBe(1000);
      customServer.stop();
    });

    test('should set up correct CORS headers', () => {
      const customServer = new Server({
        allowedOrigins: ['http://localhost:3000', 'https://example.com']
      });
      expect(customServer.corsHeaders['Access-Control-Allow-Origin'])
        .toBe('http://localhost:3000, https://example.com');
      customServer.stop();
    });
  });

  describe('Health Check', () => {
    test('should respond to health check with request ID', async () => {
      const req = createTestRequest('/_ah/health');
      const res = await server.handleRequest(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(res.headers.get('X-Request-ID')).toBe('test-request-id');
    });
  });

  describe('Authentication', () => {
    test('should handle successful login and return guild info', async () => {
      const req = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'valid-test-token' }
      });

      const res = await server.handleRequest(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.sessionId).toBeDefined();
      expect(data.serverName).toBe('Test Server');
      expect(data.message).toBe('Logged in successfully');
      mockSession = { sessionId: data.sessionId };

      // Verify session was created
      expect(server.sessions.has(data.sessionId)).toBe(true);
      const session = server.sessions.get(data.sessionId);
      expect(session.token).toBe('valid-test-token');
      expect(session.createdAt).toBeDefined();
      expect(session.lastActivity).toBeDefined();
    });

    test('should reject when maximum concurrent users reached', async () => {
      // Create first user
      await server.handleRequest(createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'valid-test-token' }
      }));

      // Create second user
      await server.handleRequest(createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'valid-test-token-1' }
      }));

      // Try to create third user (should fail)
      const res = await server.handleRequest(createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'one-too-many' }
      }));

      expect(res.status).toBe(503);
      const data = await res.json();
      expect(data.error).toBe('Maximum number of concurrent users reached');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      const loginRes = await server.handleRequest(createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'valid-test-token' }
      }));
      const data = await loginRes.json();
      mockSession = { sessionId: data.sessionId };
    });

    test('should update lastActivity on authenticated requests', async () => {
      const initialSession = server.sessions.get(mockSession.sessionId);
      const initialActivity = initialSession.lastActivity;
      
      // Wait a bit then make a request
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await server.handleRequest(createTestRequest('/api/members'));
      
      const updatedSession = server.sessions.get(mockSession.sessionId);
      expect(updatedSession.lastActivity).toBeGreaterThan(initialActivity);
    });

    test('should cleanup sessions after timeout', async () => {
      // Mock time to be after session timeout
      Date.now = () => originalNow() + server.config.sessionTimeout + 1000;
      
      await server.cleanupSessions();
      
      // Verify session was cleaned up
      expect(server.sessions.has(mockSession.sessionId)).toBe(false);
    });

    test('should destroy bot on session cleanup', async () => {
      let destroyCalled = false;
      const session = server.sessions.get(mockSession.sessionId);
      session.bot.destroy = () => { destroyCalled = true; };
      
      Date.now = () => originalNow() + server.config.sessionTimeout + 1000;
      await server.cleanupSessions();
      
      expect(destroyCalled).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should track requests per client IP', async () => {
      const clientIP = '192.168.1.1';
      const req = createTestRequest('/_ah/health', {
        headers: { 'X-Forwarded-For': clientIP }
      });

      await server.handleRequest(req);
      
      expect(server.rateLimit.has(clientIP)).toBe(true);
      expect(server.rateLimit.get(clientIP).length).toBe(1);
    });

    test('should clean up old rate limit entries', async () => {
      const clientIP = '192.168.1.1';
      // Add an old request
      server.rateLimit.set(clientIP, [Date.now() - server.config.rateLimitWindow - 1000]);
      
      // Make a new request
      await server.handleRequest(createTestRequest('/_ah/health', {
        headers: { 'X-Forwarded-For': clientIP }
      }));
      
      // Verify old request was cleaned up
      expect(server.rateLimit.get(clientIP).length).toBe(1);
    });

    test('should include retry-after header when rate limited', async () => {
      const clientIP = '192.168.1.1';
      // Fill up rate limit
      server.rateLimit.set(clientIP, Array(server.config.rateLimitMaxRequests)
        .fill(Date.now()));
      
      const res = await server.handleRequest(createTestRequest('/_ah/health', {
        headers: { 'X-Forwarded-For': clientIP }
      }));
      
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBe('1');
    });
  });

  describe('API Error Handling', () => {
    beforeEach(async () => {
      const loginRes = await server.handleRequest(createTestRequest('/api/auth/login', {
        method: 'POST',
        body: { token: 'valid-test-token' }
      }));
      const data = await loginRes.json();
      mockSession = { sessionId: data.sessionId };
    });

    test('should handle malformed JSON in request body', async () => {
      const req = createTestRequest('/api/auth/login', {
        method: 'POST',
        body: 'invalid json{',  // Deliberately malformed JSON
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const res = await server.handleRequest(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid JSON payload');
    });

    test('should handle missing channel ID for messages', async () => {
      const res = await server.handleRequest(createTestRequest('/api/messages'));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Channel ID is required');
    });

    test('should handle Discord API errors gracefully', async () => {
      const session = server.sessions.get(mockSession.sessionId);
      session.bot.getMembers = () => {
        throw new Error('Discord API Error');
      };

      const res = await server.handleRequest(createTestRequest('/api/members'));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).toBe('Discord API Error');
    });
  });
});