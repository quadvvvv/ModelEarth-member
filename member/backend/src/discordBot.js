import { Client, GatewayIntentBits } from 'discord.js';

export async function createBot(token) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  await client.login(token);
  console.log('Bot logged in successfully!');

  // Wait for the client to be ready
  await new Promise(resolve => client.once('ready', resolve));

  const guildInfo = await fetchGuildInfo(client);

  return { client, guildInfo };
}

async function fetchGuildInfo(client) {
  const guild = client.guilds.cache.first();
  if (!guild) {
    throw new Error('No guild found');
  }

  return {
    serverName: guild.name,
    memberCount: guild.memberCount,
    iconURL: guild.iconURL({ dynamic: true, size: 1024 }) // Returns a high-quality dynamic icon URL
  };
}

export async function fetchMembers(client) {
  const guild = client.guilds.cache.first();
  if (!guild) {
    throw new Error('No guild found');
  }

  await guild.members.fetch();
  return guild.members.cache.map(member => ({
    id: member.id,
    username: member.user.username,
    avatar: member.user.displayAvatarURL(),
    roles: member.roles.cache.map(role => role.name)
  }));
}

export async function fetchChannels(client) {
  const guild = client.guilds.cache.first();
  if (!guild) {
    throw new Error('No guild found');
  }

  return guild.channels.cache
    .filter(channel => channel.type === 0) // Only text channels
    .map(channel => ({
      id: channel.id,
      name: channel.name,
    }));
}

export async function fetchMessages(client, channelId, limit = 100) {
  const channel = await client.channels.fetch(channelId);
  const messages = await channel.messages.fetch({ limit });
  return messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    author: {
      id: msg.author.id,
      username: msg.author.username,
      avatar: msg.author.displayAvatarURL(),
    },
    timestamp: msg.createdTimestamp,
  }));
}

export async function destroyBot(client) {
  await client.destroy();
  console.log('Bot session destroyed');
}