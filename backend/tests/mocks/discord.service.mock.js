// tests/mocks/discord.service.mock.js
export class MockDiscordService {
    constructor(mockData = {}) {
      this.mockData = {
        guildInfo: {
          serverName: "Test Server",
          memberCount: 100,
          iconURL: "http://example.com/icon.png"
        },
        members: [
          { id: '1', username: 'user1', avatar: 'avatar1.jpg', roles: ['role1'] },
          { id: '2', username: 'user2', avatar: 'avatar2.jpg', roles: ['role2'] }
        ],
        channels: [
          { id: '1', name: 'channel1' },
          { id: '2', name: 'channel2' }
        ],
        messages: [
          { 
            id: '1', 
            content: 'Hello', 
            author: { id: '1', username: 'user1', avatar: 'avatar1.jpg' },
            timestamp: Date.now()
          }
        ],
        validTokens: ['valid-test-token', 'valid-test-token-1', 'valid-test-token-2'],
        ...mockData
      };
    }
  
    async initialize(token) {
      if (this.mockData.validTokens.includes(token)) {
        return this.mockData.guildInfo;
      }
      throw new Error('Invalid Discord token provided');
    }
  
    async getGuildInfo() {
      return this.mockData.guildInfo;
    }
  
    async getMembers() {
      return this.mockData.members;
    }
  
    async getChannels() {
      return this.mockData.channels;
    }
  
    async getMessages(channelId) {
      if (!channelId) throw new Error('Channel ID required');
      return this.mockData.messages;
    }
  
    async destroy() {
      return Promise.resolve();
    }
}

export const MockDiscordFactory = {
    createService: (mockData = {}) => new MockDiscordService(mockData)
};