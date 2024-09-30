// discordBot.js
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ],
});

let cachedGuild = null;
let botToken = null;

export async function initializeBot(token) {
    try {
        botToken = token;
        await client.login(token);
        console.log('Bot logged in successfully!');
        
        // Assuming the bot is only in one guild for simplicity
        cachedGuild = client.guilds.cache.first();
        
        if (!cachedGuild) {
            throw new Error('No guild found');
        }

        return { success: true, guildId: cachedGuild.id };
    } catch (error) {
        console.error('Failed to initialize bot:', error);
        throw error;
    }
}

export async function fetchMembers() {
    if (!cachedGuild) {
        throw new Error('Guild not initialized');
    }

    await cachedGuild.members.fetch();
    return cachedGuild.members.cache.map(member => ({
        id: member.id,
        username: member.user.username,
        avatar: member.user.displayAvatarURL(),
        roles: member.roles.cache.map(role => role.name)
    }));
}

export async function fetchChannels() {
    if (!cachedGuild) {
        throw new Error('Guild not initialized');
    }

    return cachedGuild.channels.cache
        .filter(channel => channel.type === 0) // Only text channels
        .map(channel => ({
            id: channel.id,
            name: channel.name,
        }));
}

export async function fetchMessages(channelId, limit = 100) {
    if (!cachedGuild) {
        throw new Error('Guild not initialized');
    }

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
        throw new Error('Channel not found');
    }

    const messages = await channel.messages.fetch({ limit });
    return messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        author: {
            id: msg.author.id,
            username: msg.author.username,
        },
        timestamp: msg.createdTimestamp,
    }));
}

export function logout() {
    cachedGuild = null;
    botToken = null;
    client.destroy();
    console.log('Logged out and session destroyed');
}