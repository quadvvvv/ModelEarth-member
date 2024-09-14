import { serve } from 'bun';
import { Client } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({ intents: ["GUILDS", "GUILD_MEMBERS"] });

// Fetch members from a Discord server
async function fetchMembers(guildId) {
    const guild = await client.guilds.fetch(guildId);
    await guild.members.fetch(); // Fetch all members

    return guild.members.cache.map(member => ({
        id: member.id,
        username: member.user.username,
        avatar: member.user.displayAvatarURL(),
        email: member.user.email || null, // Discord users may not have an email available
        roles: member.roles.cache.map(role => role.name) // Optional: For future implementation
    }));
}

// Start the Discord client
client.login(process.env.DISCORD_BOT_TOKEN)
    .then(() => {
        console.log('Bot logged in successfully!');
    })
    .catch(console.error);

// Create the HTTP server
serve({
    fetch: async (req) => {
        if (req.method === 'GET' && req.url.startsWith('/members')) {
            const url = new URL(req.url);
            const guildId = url.searchParams.get('guildId');

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
