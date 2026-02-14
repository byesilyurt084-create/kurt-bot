const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ChannelType,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits
} = require("discord.js");

const { joinVoiceChannel } = require("@discordjs/voice");
const express = require("express");

/* ===== WEB SERVER (PING İÇİN) ===== */
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif");
});

app.listen(3000, () => {
  console.log("🌐 Web server çalışıyor");
});

/* ===== BOT BİLGİLERİ ===== */
const TOKEN = process.env.MTQ2ODczNjYzMTQxMzQwNzc5NQ.GV5P77.Ao9IcvStO5ei4XHfGvdSpqvqBAGIeTzDb3Cmdw;
const CLIENT_ID = "1468736631413407795";
const GUILD_ID = "1467306693661819118";
const VOICE_CHANNEL_ID = "1468277776590311454";

/* ===== AYARLAR ===== */
const STAFF_ROLES = [
  "1467306755515089007",
  "1467306852978000071",
  "1467307370169237526",
  "1467307252951023820",
  "1467307306227335471"
];

const LOG_CHANNEL_ID = "1468741303985766511";
const THEME_COLOR = 0x0b1cff;
const LOGO_URL = "https://i.imgur.com/XXXXXXX.png";
const BANNER_URL = "https://i.imgur.com/YYYYYYY.png";

const activeTickets = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

/* ===== SLASH KOMUT ===== */
const commands = [
  new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Ticket paneli kurar")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log("✅ Slash komutlar yüklendi");
})();

/* ===== READY ===== */
client.once("ready", () => {
  console.log(`🐺 ${client.user.tag} aktif`);

  const guild = client.guilds.cache.get(GUILD_ID);
  const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);

  if (!channel) return console.log("❌ Ses kanalı bulunamadı!");

  joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
    selfDeaf: false
  });

  console.log("🔊 Bot ses kanalına bağlandı.");
});

/* ===== INTERACTION ===== */
client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand() && interaction.commandName === "ticket-panel") {

    const embed = new EmbedBuilder()
      .setColor(THEME_COLOR)
      .setTitle("🐺 KURT DESTEK MERKEZİ")
      .setDescription("Destek almak için aşağıdan kategori seç.")
      .setThumbnail(LOGO_URL)
      .setImage(BANNER_URL);

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("📂 Destek Kategorisi Seç")
      .addOptions([
        { label: "📌 Discord Destek", value: "discord" },
        { label: "🎮 Oyun Destek", value: "oyun" }
      ]);

    await interaction.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });

    return interaction.reply({ content: "✅ Panel kuruldu.", ephemeral: true });
  }
});

client.login(TOKEN);
