// src/services/discord.service.js
import { Client, GatewayIntentBits } from 'discord.js';

export class DiscordService {
  constructor(clientConfig = {}) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
      ],
      ...clientConfig
    });
  }

  async initialize(token) {
    try {
      await this.client.login(token);
      await new Promise(resolve => this.client.once('ready', resolve));
      const guildInfo = await this.getGuildInfo();
      return guildInfo;
    } catch (error) {
      await this.destroy();
      throw new Error(`Failed to initialize Discord bot: ${error.message}`);
    }
  }

  async getGuildInfo() {
    const guild = this.getGuild();
    return {
      serverName: guild.name,
      memberCount: guild.memberCount,
      iconURL: guild.iconURL({ dynamic: true, size: 1024 })
    };
  }

  getGuild() {
    const guild = this.client.guilds.cache.first();
    if (!guild) {
      throw new Error('No guild found');
    }
    return guild;
  }

  async getMembers() {
    const guild = this.getGuild();
    await guild.members.fetch();
    
    return guild.members.cache.map(member => ({
      id: member.id,
      username: member.user.username,
      avatar: member.user.displayAvatarURL(),
      roles: member.roles.cache.map(role => role.name)
    }));
  }

  async getChannels() {
    const guild = this.getGuild();
    
    return guild.channels.cache
      .filter(channel => channel.type === 0)
      .map(channel => ({
        id: channel.id,
        name: channel.name,
      }));
  }

  async getMessages(channelId, limit = 100) {
    try {
      const channel = await this.client.channels.fetch(channelId);
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
    } catch (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }
  }

  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
    }
  }
}