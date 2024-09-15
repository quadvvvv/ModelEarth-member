import { serve } from 'bun';
import { fetchMembers } from './discordBot.js';

serve({
    fetch: async (req) => {
        console.log(`Received ${req.method} request for ${req.url}`);

        // Create a new URL object based on the request
        const url = new URL(req.url);

        // Set CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // You can restrict this to specific origins if needed
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle preflight OPTIONS requests
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        // Check if the pathname is "/members" and the method is GET
        if (req.method === 'GET' && url.pathname === '/members') {
            const guildId = process.env.MODEL_EARTH_GUILDID;

            console.log(`Guild ID: ${guildId}`);

            if (!guildId) {
                return new Response('Guild ID is required', { status: 400, headers: corsHeaders });
            }

            try {
                const members = await fetchMembers(guildId);
                return new Response(JSON.stringify(members), {
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.error(error);
                return new Response('Error fetching members', { status: 500, headers: corsHeaders });
            }
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    },
    port: 3000,
});
