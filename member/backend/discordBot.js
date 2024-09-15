import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
    ],
});

// Fetch members from a Discord server
export async function fetchMembers(guildId) {
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

// Export the client for usage in other files
export default client;
