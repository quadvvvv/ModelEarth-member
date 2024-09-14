const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

// Fetch all members from a given server
client.on('messageCreate', async (message) => {
  if (message.content === '!fetchMembers') {
    const guild = message.guild; // Access the guild (server) the message was sent in
    const members = await guild.members.fetch(); // Fetch all members

    const memberData = members.map(member => ({
      name: member.user.username,          // Member name
      avatar: member.user.displayAvatarURL(), // Avatar URL
      email: member.user.email || 'No email available', // Discord doesn't always have emails available
      roles: [] // Leave a placeholder for roles for future implementation
    }));

    console.log(memberData); // Output fetched data
    message.channel.send('Fetched all members, check console for details.');
  }
});

// Log into Discord using the bot token
client.login(process.env.DISCORD_BOT_TOKEN);
