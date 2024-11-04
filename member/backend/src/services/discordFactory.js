export class DiscordFactory {
    static createService(config = {}) {
      return new DiscordService(config);
    }
  }