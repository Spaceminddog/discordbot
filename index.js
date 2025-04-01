const { Client, GatewayIntentBits, Partials, Routes, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType } = require('discord.js');
const { REST } = require('@discordjs/rest');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

const commands = [
  {
    name: 'newcontent',
    description: 'Submit a new content you found'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands })
  .then(() => console.log('Command registered'))
  .catch(console.error);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === 'newcontent') {
    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select-source')
        .setPlaceholder('Where did you find it?')
        .addOptions([
          { label: 'Instagram', value: 'Instagram' },
          { label: 'Youtube', value: 'Youtube' },
          { label: 'X', value: 'X' },
          { label: 'Facebook', value: 'Facebook' },
          { label: 'Tiktok', value: 'Tiktok' }
        ])
    );
    await interaction.reply({ content: 'Choose the platform:', components: [row], ephemeral: true });
  }

  if (interaction.isSelectMenu() && interaction.customId === 'select-source') {
    const selectedSource = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`newcontent-modal-${selectedSource}`)
      .setTitle('Submit New Content');

    const linkInput = new TextInputBuilder()
      .setCustomId('url')
      .setLabel('Link')
      .setStyle(TextInputStyle.Short);

    const descInput = new TextInputBuilder()
      .setCustomId('description')
      .setLabel('What is it?')
      .setStyle(TextInputStyle.Paragraph);

    const row1 = new ActionRowBuilder().addComponents(linkInput);
    const row2 = new ActionRowBuilder().addComponents(descInput);

    await interaction.showModal(modal.addComponents(row1, row2));
  }

  if (interaction.type === InteractionType.ModalSubmit && interaction.customId.startsWith('newcontent-modal-')) {
    const source = interaction.customId.replace('newcontent-modal-', '');
    const url = interaction.fields.getTextInputValue('url');
    const description = interaction.fields.getTextInputValue('description');

    const channel = interaction.guild.channels.cache.get('1356627556333261004');
    const timestamp = new Date().toLocaleString('hu-HU', { timeZone: 'Europe/Budapest' });
    const creator = interaction.user.username;

    if (channel) {
      const messageContent = JSON.stringify({
        from: source,
        details: description,
        link: url,
        creator: creator,
        date: timestamp
      }, null, 2);

      await channel.send(messageContent);
    }

    await interaction.reply({ content: '✅ Submitted!', ephemeral: true });
  }
});

client.on('messageCreate', async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Define the channel ID where this rule should apply
  const targetChannelId = '1356627556333261004';

  if (message.channel.id === targetChannelId) {
    try {
      await message.delete();
      console.log(`Deleted message from ${message.author.username} in #newcontent`);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }
});


client.login(process.env.TOKEN);
