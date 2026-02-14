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

/* ===== BOT BİLGİLERİ ===== */
const TOKEN = "MTQ2ODczNjYzMTQxMzQwNzc5NQ.GV5P77.Ao9IcvStO5ei4XHfGvdSpqvqBAGIeTzDb3Cmdw";
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

/* ===== TICKET TAKİP ===== */
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

/* ===== INTERACTION ===== */
client.on("interactionCreate", async interaction => {

  if (interaction.isChatInputCommand() && interaction.commandName === "ticket-panel") {

    const embed = new EmbedBuilder()
      .setColor(THEME_COLOR)
      .setTitle("🐺 KURT DESTEK MERKEZİ")
      .setDescription(
        "Destek almak için aşağıdan kategori seç.\n" +
        "Yetkililer en kısa sürede seninle ilgilenecek."
      )
      .setThumbnail(LOGO_URL)
      .setImage(BANNER_URL)
      .setFooter({ text: "Kurt Bot • Ticket Sistemi" });

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

    return interaction.reply({ content: "✅ Ticket paneli kuruldu.", ephemeral: true });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_menu") {

    await interaction.deferReply({ ephemeral: true });

    if (activeTickets.has(interaction.user.id)) {
      return interaction.editReply("❌ Zaten açık bir ticketin var.");
    }

    const kategori = interaction.values[0];

    const overwrites = [
      { id: interaction.guild.id, deny: ["ViewChannel"] },
      { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] }
    ];

    STAFF_ROLES.forEach(r =>
      overwrites.push({ id: r, allow: ["ViewChannel", "SendMessages"] })
    );

    const channel = await interaction.guild.channels.create({
      name: `ticket-${kategori}-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: overwrites
    });

    activeTickets.set(interaction.user.id, channel.id);

    const closeBtn = new ButtonBuilder()
      .setCustomId("ticket_close")
      .setLabel("🔒 Ticket Kapat")
      .setStyle(ButtonStyle.Danger);

    const embed = new EmbedBuilder()
      .setColor(THEME_COLOR)
      .setTitle("🎟️ Ticket Açıldı")
      .setDescription(
        `👤 Kullanıcı: ${interaction.user}\n` +
        `📂 Kategori: **${kategori.toUpperCase()}**\n\n` +
        "Sorununu detaylı şekilde yazabilirsin."
      );

    await channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(closeBtn)]
    });

    await interaction.editReply(`✅ Ticket açıldı: ${channel}`);

    const log = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (log) log.send(`📥 Ticket açıldı | ${channel} | ${interaction.user}`);
  }

  if (interaction.isButton() && interaction.customId === "ticket_close") {

    await interaction.deferReply({ ephemeral: true });

    const isStaff = STAFF_ROLES.some(r =>
      interaction.member.roles.cache.has(r)
    );

    if (!isStaff) {
      return interaction.editReply("❌ Bu ticketi kapatma yetkin yok.");
    }

    const entry = [...activeTickets.entries()]
      .find(e => e[1] === interaction.channel.id);

    if (entry) activeTickets.delete(entry[0]);

    const log = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (log) log.send(`📤 Ticket kapatıldı | ${interaction.channel.name}`);

    await interaction.editReply("⏳ Ticket kapatılıyor...");

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

/* ===== BOT READY ===== */
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

client.login(TOKEN);