import { DiscordService } from '../services/discord.service';

export class DiscordFactory {
    static createService(config = {}) {
      return new DiscordService(config);
    }
  }