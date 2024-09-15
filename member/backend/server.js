import { serve } from 'bun';
import { fetchMembers } from './discordBot.js';

serve({
    fetch: async (req) => {
        console.log(`Received ${req.method} request for ${req.url}`);

        // Create a new URL object based on the request
        const url = new URL(req.url);

        // Check if the pathname is "/members" and the method is GET
        if (req.method === 'GET' && url.pathname === '/members') {
            const guildId = url.searchParams.get('guildId');

            console.log(`Guild ID: ${guildId}`);

            if (!guildId) {
                return new Response('Guild ID is required', { status: 400 });
            }

            try {
                const members = await fetchMembers(guildId);
                return new Response(JSON.stringify(members), {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.error(error);
                return new Response('Error fetching members', { status: 500 });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
    port: 3000,
});

