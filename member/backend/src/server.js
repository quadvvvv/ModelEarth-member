// server.js
import { serve } from 'bun';
import { nanoid } from 'nanoid';
import { createBot, fetchMembers, fetchChannels, fetchMessages, destroyBot } from './discordBot.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// In-memory store for user sessions and bot clients
const sessions = new Map();

const authenticateSession = (req) => {
  const sessionId = req.headers.get('Authorization');
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }
  return { sessionId, ...sessions.get(sessionId) };
};

const logRequest = (req, sessionId = 'Unauthenticated') => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Session: ${sessionId}`);
};

const handleRequest = async (req) => {
  const url = new URL(req.url);
  const method = req.method;
  const path = url.pathname;

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    logRequest(req);
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Login
  // In server.js, update the login route:
  if (method === 'POST' && path === '/api/auth/login') {
    logRequest(req);
    const { token } = await req.json();
    try {
      const { client, guildInfo } = await createBot(token);
      const sessionId = nanoid();
      sessions.set(sessionId, { bot: client, token });
      console.log(`New session created: ${sessionId}`);
      return new Response(JSON.stringify({ 
        sessionId, 
        message: 'Logged in successfully',
        ...guildInfo // This spreads serverName, memberCount, and iconURL into the response
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Login error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Authenticate all other routes
  const session = authenticateSession(req);
  if (!session) {
    logRequest(req);
    console.log('Unauthorized access attempt');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  logRequest(req, session.sessionId);

  // Logout
  if (method === 'POST' && path === '/api/auth/logout') {
    await destroyBot(session.bot);
    sessions.delete(session.sessionId);
    console.log(`Session destroyed: ${session.sessionId}`);
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Fetch members
  if (method === 'GET' && path === '/api/members') {
    try {
      const members = await fetchMembers(session.bot);
      return new Response(JSON.stringify(members), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching members:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Fetch channels
  if (method === 'GET' && path === '/api/channels') {
    try {
      const channels = await fetchChannels(session.bot);
      return new Response(JSON.stringify(channels), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching channels:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Fetch messages
  if (method === 'GET' && path.startsWith('/api/messages')) {
    const channelId = url.searchParams.get('channelId');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    if (!channelId) {
      console.log('Missing channelId in messages request');
      return new Response(JSON.stringify({ error: 'Channel ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    try {
      const messages = await fetchMessages(session.bot, channelId, limit);
      return new Response(JSON.stringify(messages), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error fetching messages:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  console.log(`Not Found: ${path}`);
  return new Response('Not Found', { status: 404, headers: corsHeaders });
};

serve({
  fetch: handleRequest,
  port: 3000,
});

console.log('Server started on http://localhost:3000');