// server.js
import { serve } from 'bun';
import { initializeBot, fetchMembers, fetchChannels, fetchMessages, logout } from './discordBot.js';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve({
    fetch: async (req) => {
        console.log(`Received ${req.method} request for ${req.url}`);

        const url = new URL(req.url);

        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Bot initialization
        if (req.method === 'POST' && url.pathname === '/api/bot/initialize') {
            const { token } = await req.json();
            try {
                const result = await initializeBot(token);
                return new Response(JSON.stringify(result), {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Fetch members
        if (req.method === 'GET' && url.pathname === '/api/members') {
            try {
                const members = await fetchMembers();
                return new Response(JSON.stringify(members), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Fetch channels
        if (req.method === 'GET' && url.pathname === '/api/channels') {
            try {
                const channels = await fetchChannels();
                return new Response(JSON.stringify(channels), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Fetch messages for a specific channel
        if (req.method === 'GET' && url.pathname.startsWith('/api/messages')) {
            const channelId = url.searchParams.get('channelId');
            const limit = parseInt(url.searchParams.get('limit') || '100', 10);
            if (!channelId) {
                return new Response(JSON.stringify({ error: 'Channel ID is required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }

            try {
                const messages = await fetchMessages(channelId, limit);
                return new Response(JSON.stringify(messages), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
        }

        // Logout
        if (req.method === 'POST' && url.pathname === '/api/bot/logout') {
            logout();
            return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
    port: 3000,
});
