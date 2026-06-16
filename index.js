const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ChannelType,
    ActivityType,
    Partials
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const { Shoukaku, Connectors } = require('shoukaku');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User
    ]
});

// ==========================================
// CONFIGURATION
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;

// Gemini AI configuration for the !ask command
// Add GEMINI_API_KEY in your Pella environment variables.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || '';
const GEMINI_MODELS = (process.env.GEMINI_MODELS || GEMINI_MODEL || 'gemini-2.5-flash-lite,gemini-2.5-flash')
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);

const VRCHAT_SERVER_NAME = process.env.VRCHAT_SERVER_NAME || ':sparkles: **OverFlow | 18+ VRChat Community** :sparkles:';
const VRCHAT_COMMUNITY_LINK = process.env.VRCHAT_COMMUNITY_LINK || 'Check the pinned channels for current VRChat links.';

const AUTO_ROLE_ID = '1447372762988675273';
const REACTION_ROLE_ID = '1466511922332438674';
const MASS_DELETE_PAGE_SIZE = 100;
const BULK_DELETE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MASS_DELETE_STATUS_INTERVAL_MS = 10 * 1000;
const REACTION_ROLE_STORE_FILE = path.join(process.cwd(), 'reaction-roles.json');
const TICKET_CONFIG_FILE = path.join(process.cwd(), 'ticket-config.json');
const TICKET_STORE_FILE = path.join(process.cwd(), 'tickets.json');
const TICKET_TRANSCRIPT_FETCH_LIMIT = 100;
const TICKET_CLOSE_DELETE_DELAY_MS = 5000;
const DEFAULT_TICKET_CATEGORY_ID = '1447439654159908954';

const MOD_ROLE_IDS = [
    '1447375395383935066',
    '1447375487918673941',
    '1515563517812539586',
    '1447375564955586612'
];

// LOG CHANNEL
const LOG_CHANNEL_ID = '1516259462124404827';

// VRCHAT GROUP POST BRIDGE
const VRCHAT_GROUP_ID = process.env.VRCHAT_GROUP_ID || 'grp_38f88b33-f022-40b8-8acf-5264f5e710a2';
const VRCHAT_POST_CHANNEL_ID = process.env.VRCHAT_POST_CHANNEL_ID || '1451062252974116954';
const VRCHAT_AUTH_COOKIE = process.env.VRCHAT_AUTH_COOKIE || '';
const VRCHAT_API_USER_AGENT = process.env.VRCHAT_API_USER_AGENT || 'VRChatDiscordPostBridge/1.0';
const VRCHAT_POST_POLL_INTERVAL_MS = Math.max(
    Number.parseInt(process.env.VRCHAT_POST_POLL_INTERVAL_MS || '', 10) || 5 * 60 * 1000,
    60 * 1000
);
const VRCHAT_POST_PUBLIC_ONLY = process.env.VRCHAT_POST_PUBLIC_ONLY !== 'false';

// ==========================================
// LAVALINK CONFIGURATION
// ==========================================

// Put your real Lavalink info here
const LAVALINK_URL = 'lavalinkv4.serenetia.com:443';
const LAVALINK_PASSWORD = 'https://seretia.link/discord';

// false for normal ports like 2333
// true for secure/SSL ports like 443
const LAVALINK_SECURE = true;

const LAVALINK_NODES = [
    {
        name: 'Main',
        url: LAVALINK_URL,
        auth: LAVALINK_PASSWORD,
        secure: LAVALINK_SECURE
    }
];

// ==========================================
// INVITE CACHE, STATS, MUSIC QUEUES
// ==========================================

const inviteCache = new Map();
const inviteStats = new Map();
const musicQueues = new Map();

// Warning system
const warningCounts = new Map();
const AUTO_WARN_LIMIT = 3;
const AUTO_TIMEOUT_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Temporary listener storage for !ask with no question
const pendingAskUsers = new Map();

// Reaction role messages
const reactionRoleMessages = new Map();

// Ticket system
const ticketConfigs = new Map();
const ticketRecords = new Map();

// VRChat group post watcher state
const seenVrchatPostIds = new Set();
const MAX_SEEN_VRCHAT_POST_IDS = 500;
let vrchatPostWatcherStarted = false;
let vrchatPostPollRunning = false;
let vrchatPostNextAllowedAt = 0;

// ==========================================
// LAVALINK / SHOUKAKU SETUP
// ==========================================

const shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    LAVALINK_NODES,
    {
        moveOnDisconnect: true,
        resumable: false,
        reconnectTries: 5,
        reconnectInterval: 5
    }
);

client.shoukaku = shoukaku;

shoukaku.on('ready', (name) => {
    console.log(`✅ Lavalink node connected: ${name}`);
});

shoukaku.on('error', (name, error) => {
    console.error(`❌ Lavalink node error on ${name}:`, error);
});

shoukaku.on('close', (name, code, reason) => {
    console.warn(`⚠️ Lavalink node closed: ${name} | Code: ${code} | Reason: ${reason}`);
});

shoukaku.on('disconnect', (name, count) => {
    console.warn(`⚠️ Lavalink node disconnected: ${name} | Reconnect count: ${count}`);
});

// ==========================================
// READY EVENT
// ==========================================

client.once('clientReady', async () => {

    console.log(`✅ Logged in as ${client.user.tag}`);

    loadReactionRoleMessages();
    loadTicketConfigs();
    loadTicketRecords();

    client.user.setPresence({
    activities: [
        {
            name: '!help - !vrchat',
            type: ActivityType.Watching
        }
    ],
    status: 'online'
});

    try {

        for (const guild of client.guilds.cache.values()) {

            const invites = await guild.invites.fetch();

            inviteCache.set(
                guild.id,
                new Map(invites.map(invite => [
                    invite.code,
                    invite.uses
                ]))
            );

        }

        console.log('✅ Invite cache loaded.');

    } catch (error) {

        console.error(error);

    }

    startVrchatGroupPostWatcher();

});

// ==========================================
// HELPER FUNCTIONS
// ==========================================


// ==========================================
// FUN COMMAND DATA
// ==========================================

const EIGHT_BALL_RESPONSES = [
    'It is certain.',
    'Without a doubt.',
    'Yes definitely.',
    'Most likely.',
    'Ask again later.',
    'Better not tell you now.',
    'Do not count on it.',
    'My sources say no.',
    'Very doubtful.',
    'Absolutely.'
];

const JOKES = [
    'Why did the computer go to the doctor? Because it had a virus.',
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    'I told my Wi-Fi we needed space. Now it will not connect.',
    'Why was the math book sad? It had too many problems.',
    'Why did the bot cross the server? To get to the other channel.'
];

const COMPLIMENTS = [
    'is built different.',
    'has legendary energy.',
    'makes the server better.',
    'has main character energy.',
    'is absolutely carrying the vibes.'
];

const ROASTS = [
    'is running on Internet Explorer energy.',
    'has Wi-Fi signal personality today.',
    'is proof that lag exists in real life.',
    'got ratioed by a loading screen.',
    'is still buffering.'
];

const FUN_FACTS = [
    'Honey never spoils.',
    'Octopuses have three hearts.',
    'Bananas are berries, but strawberries are not.',
    'A group of flamingos is called a flamboyance.',
    'Sharks are older than trees.'
];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function simplePercentFromText(text) {

    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash) % 101;

}

function hasModAccess(member) {

    return (
        member.permissions.has(PermissionsBitField.Flags.Administrator) ||
        member.roles.cache.some(role =>
            MOD_ROLE_IDS.includes(role.id)
        )
    );

}

function getLogChannel(guild) {
    return guild.channels.cache.get(LOG_CHANNEL_ID);
}

function getReactionRoleKey(guildId, messageId, emojiKey) {
    return `${guildId}:${messageId}:${emojiKey}`;
}

function loadReactionRoleMessages() {

    if (!fs.existsSync(REACTION_ROLE_STORE_FILE)) return;

    try {

        const savedMappings = JSON.parse(fs.readFileSync(REACTION_ROLE_STORE_FILE, 'utf8'));

        if (!Array.isArray(savedMappings)) return;

        reactionRoleMessages.clear();

        for (const mapping of savedMappings) {

            if (!mapping?.guildId || !mapping?.messageId || !mapping?.emojiKey || !mapping?.roleId) continue;

            reactionRoleMessages.set(
                getReactionRoleKey(mapping.guildId, mapping.messageId, mapping.emojiKey),
                mapping
            );

        }

        console.log(`Loaded ${reactionRoleMessages.size} reaction role mapping(s).`);

    } catch (error) {

        console.error('Failed to load reaction role mappings:', error);

    }

}

function saveReactionRoleMessages() {

    try {

        fs.writeFileSync(
            REACTION_ROLE_STORE_FILE,
            JSON.stringify([...reactionRoleMessages.values()], null, 2)
        );

    } catch (error) {

        console.error('Failed to save reaction role mappings:', error);

    }

}

function getUniqueIdList(values) {

    if (!Array.isArray(values)) return [];

    return [...new Set(
        values
            .map(value => String(value || '').trim())
            .filter(value => /^\d{17,20}$/.test(value))
    )];

}

function normalizeTicketConfig(config = {}) {

    const hasSupportRoles = Object.prototype.hasOwnProperty.call(config, 'supportRoleIds');
    const hasCategory = Object.prototype.hasOwnProperty.call(config, 'categoryId');
    const categoryId = hasCategory ? config.categoryId : DEFAULT_TICKET_CATEGORY_ID;

    return {
        supportRoleIds: getUniqueIdList(hasSupportRoles ? config.supportRoleIds : MOD_ROLE_IDS),
        adminRoleIds: getUniqueIdList(config.adminRoleIds),
        categoryId: /^\d{17,20}$/.test(String(categoryId || '')) ? String(categoryId) : null,
        logChannelId: /^\d{17,20}$/.test(String(config.logChannelId || '')) ? String(config.logChannelId) : LOG_CHANNEL_ID,
        nextTicketNumber: Math.max(1, Number.parseInt(config.nextTicketNumber || '1', 10) || 1)
    };

}

function loadTicketConfigs() {

    if (!fs.existsSync(TICKET_CONFIG_FILE)) return;

    try {

        const savedConfigs = JSON.parse(fs.readFileSync(TICKET_CONFIG_FILE, 'utf8'));

        if (!savedConfigs || typeof savedConfigs !== 'object') return;

        ticketConfigs.clear();

        for (const [guildId, config] of Object.entries(savedConfigs)) {

            if (!/^\d{17,20}$/.test(guildId)) continue;

            ticketConfigs.set(guildId, normalizeTicketConfig(config));

        }

        console.log(`Loaded ticket config for ${ticketConfigs.size} guild(s).`);

    } catch (error) {

        console.error('Failed to load ticket configs:', error);

    }

}

function saveTicketConfigs() {

    try {

        fs.writeFileSync(
            TICKET_CONFIG_FILE,
            JSON.stringify(Object.fromEntries(ticketConfigs.entries()), null, 2)
        );

    } catch (error) {

        console.error('Failed to save ticket configs:', error);

    }

}

function getTicketConfig(guildId) {

    if (!ticketConfigs.has(guildId)) {
        ticketConfigs.set(guildId, normalizeTicketConfig());
    }

    return ticketConfigs.get(guildId);

}

function setTicketConfig(guildId, updater) {

    const config = {
        ...getTicketConfig(guildId)
    };

    updater(config);

    const normalizedConfig = normalizeTicketConfig(config);
    ticketConfigs.set(guildId, normalizedConfig);
    saveTicketConfigs();

    return normalizedConfig;

}

function normalizeTicketRecord(record = {}) {

    const guildId = String(record.guildId || '');
    const channelId = String(record.channelId || '');
    const ownerId = String(record.ownerId || '');

    if (!/^\d{17,20}$/.test(guildId) ||
        !/^\d{17,20}$/.test(channelId) ||
        !/^\d{17,20}$/.test(ownerId)) {
        return null;
    }

    return {
        guildId,
        channelId,
        ownerId,
        ticketNumber: Math.max(0, Number.parseInt(record.ticketNumber || record.number || '0', 10) || 0),
        status: record.status === 'closed' ? 'closed' : 'open',
        createdAt: record.createdAt || new Date().toISOString(),
        reason: String(record.reason || 'No reason provided.'),
        claimedBy: /^\d{17,20}$/.test(String(record.claimedBy || '')) ? String(record.claimedBy) : null,
        escalated: Boolean(record.escalated),
        escalatedBy: /^\d{17,20}$/.test(String(record.escalatedBy || '')) ? String(record.escalatedBy) : null,
        escalatedAt: record.escalatedAt || null,
        escalationReason: record.escalationReason || null,
        addedUserIds: getUniqueIdList(record.addedUserIds)
    };

}

function loadTicketRecords() {

    if (!fs.existsSync(TICKET_STORE_FILE)) return;

    try {

        const savedRecords = JSON.parse(fs.readFileSync(TICKET_STORE_FILE, 'utf8'));
        const records = Array.isArray(savedRecords)
            ? savedRecords
            : Object.values(savedRecords || {});

        ticketRecords.clear();

        for (const rawRecord of records) {

            const record = normalizeTicketRecord(rawRecord);

            if (!record || record.status !== 'open') continue;

            ticketRecords.set(record.channelId, record);

        }

        console.log(`Loaded ${ticketRecords.size} open ticket record(s).`);

    } catch (error) {

        console.error('Failed to load ticket records:', error);

    }

}

function saveTicketRecords() {

    try {

        fs.writeFileSync(
            TICKET_STORE_FILE,
            JSON.stringify([...ticketRecords.values()], null, 2)
        );

    } catch (error) {

        console.error('Failed to save ticket records:', error);

    }

}

function getTicketConfigUsage() {

    return [
        'Ticket config usage:',
        '`!ticketconfig list`',
        '`!ticketconfig support add @role`',
        '`!ticketconfig support remove @role`',
        '`!ticketconfig admin add @role`',
        '`!ticketconfig admin remove @role`',
        '`!ticketconfig category category_id`',
        '`!ticketconfig category none`',
        '`!ticketconfig logs #channel`',
        '`!ticketconfig reset`'
    ].join('\n');

}

function formatTicketRoleList(roleIds) {

    return roleIds.length > 0
        ? roleIds.map(roleId => `<@&${roleId}>`).join('\n')
        : 'None configured.';

}

function getTicketRecordForChannel(channel) {

    if (!channel?.guild) return null;

    const existingRecord = ticketRecords.get(channel.id);

    if (existingRecord) return existingRecord;

    const ownerId = String(channel.topic || '').match(/ticket-owner:(\d{17,20})/)?.[1];

    if (!ownerId) return null;

    const ticketNumber = String(channel.topic || '').match(/Ticket #?(\d+)/i)?.[1] || 0;
    const inferredRecord = normalizeTicketRecord({
        guildId: channel.guild.id,
        channelId: channel.id,
        ownerId,
        ticketNumber,
        reason: 'Recovered from channel topic.'
    });

    if (!inferredRecord) return null;

    ticketRecords.set(channel.id, inferredRecord);
    saveTicketRecords();

    return inferredRecord;

}

function isTicketOwner(member, record) {
    return member?.id === record?.ownerId;
}

function memberHasAnyRole(member, roleIds) {
    return roleIds.some(roleId => member?.roles?.cache?.has(roleId));
}

function hasTicketSupportAccess(member, config) {

    return (
        member?.permissions?.has(PermissionsBitField.Flags.Administrator) ||
        memberHasAnyRole(member, config.supportRoleIds) ||
        memberHasAnyRole(member, config.adminRoleIds)
    );

}

function hasTicketAdminAccess(member, config) {

    return (
        member?.permissions?.has(PermissionsBitField.Flags.Administrator) ||
        memberHasAnyRole(member, config.adminRoleIds)
    );

}

function canUseTicket(member, record, config) {
    return isTicketOwner(member, record) || hasTicketSupportAccess(member, config);
}

function canManageTicket(member, config) {
    return hasTicketSupportAccess(member, config);
}

async function resolveCategoryFromArg(message, arg) {

    const categoryId = String(arg || '').match(/^<#(\d{17,20})>$/)?.[1] ||
        String(arg || '').match(/^\d{17,20}$/)?.[0];

    if (categoryId) {

        const channel = message.guild.channels.cache.get(categoryId) ||
            await message.guild.channels.fetch(categoryId).catch(() => null);

        return channel?.type === ChannelType.GuildCategory ? channel : null;

    }

    const categoryName = String(arg || '').toLowerCase().trim();

    if (!categoryName) return null;

    return message.guild.channels.cache.find(channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name.toLowerCase() === categoryName
    ) || null;

}

async function resolveTicketCategory(guild, config) {

    if (!config.categoryId) return null;

    const channel = guild.channels.cache.get(config.categoryId) ||
        await guild.channels.fetch(config.categoryId).catch(() => null);

    return channel?.type === ChannelType.GuildCategory ? channel : null;

}

async function getTicketLogChannel(guild, config = getTicketConfig(guild.id)) {

    const channelId = config.logChannelId || LOG_CHANNEL_ID;
    const channel = guild.channels.cache.get(channelId) ||
        await guild.channels.fetch(channelId).catch(() => null);

    return channel?.isTextBased?.() && channel.send ? channel : null;

}

function sanitizeTicketChannelPart(value, fallback = 'ticket') {

    const cleaned = String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 42);

    return cleaned || fallback;

}

function getTicketChannelName(member, ticketNumber) {
    return `ticket-${ticketNumber}-${sanitizeTicketChannelPart(member.user.username, 'user')}`.slice(0, 95);
}

function getTranscriptFileName(channel, record) {

    const ticketLabel = record?.ticketNumber ? `ticket-${record.ticketNumber}` : channel.id;

    return `${ticketLabel}-${sanitizeTicketChannelPart(channel.name, 'transcript')}-transcript.txt`;

}

function getTicketPermissionOverwrites(guild, ownerId, config) {

    const allowTicketMember = [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
    ];

    const allowTicketStaff = [
        ...allowTicketMember,
        PermissionsBitField.Flags.ManageMessages
    ];

    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionsBitField.Flags.ViewChannel
            ]
        },
        {
            id: ownerId,
            allow: allowTicketMember
        },
        {
            id: client.user.id,
            allow: [
                ...allowTicketStaff,
                PermissionsBitField.Flags.ManageChannels
            ]
        }
    ];

    for (const roleId of config.supportRoleIds) {

        if (!guild.roles.cache.has(roleId)) continue;

        overwrites.push({
            id: roleId,
            allow: allowTicketStaff
        });

    }

    return overwrites;

}

function createTicketOpenRow() {

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Success)
    );

}

function createTicketControlRow(record = {}) {

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('ticket_claim')
            .setLabel(record.claimedBy ? 'Claimed' : 'Claim')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(Boolean(record.claimedBy)),
        new ButtonBuilder()
            .setCustomId('ticket_escalate')
            .setLabel(record.escalated ? 'Escalated' : 'Escalate')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(Boolean(record.escalated)),
        new ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close')
            .setStyle(ButtonStyle.Secondary)
    );

}

async function findOpenTicketChannelForUser(guild, userId) {

    let removedStaleRecord = false;

    for (const record of ticketRecords.values()) {

        if (record.guildId !== guild.id || record.ownerId !== userId || record.status !== 'open') continue;

        const channel = guild.channels.cache.get(record.channelId) ||
            await guild.channels.fetch(record.channelId).catch(() => null);

        if (channel) return channel;

        ticketRecords.delete(record.channelId);
        removedStaleRecord = true;

    }

    if (removedStaleRecord) {
        saveTicketRecords();
    }

    return null;

}

async function sendTicketLog(guild, title, fields = [], color = '#5865F2', config = getTicketConfig(guild.id)) {

    const logChannel = await getTicketLogChannel(guild, config);

    if (!logChannel) return null;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields(
            fields
                .filter(field => field?.name && field?.value)
                .map(field => ({
                    name: field.name,
                    value: truncateText(String(field.value), 1000),
                    inline: Boolean(field.inline)
                }))
        )
        .setTimestamp();

    await logChannel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    }).catch(() => {});

    return logChannel;

}

async function createTicketForMember(guild, member, reason = 'No reason provided.') {

    const config = getTicketConfig(guild.id);
    const existingTicketChannel = await findOpenTicketChannelForUser(guild, member.id);

    if (existingTicketChannel) {
        return {
            ok: false,
            message: `You already have an open ticket: ${existingTicketChannel}`
        };
    }

    const botMember = await getBotMember(guild);

    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return {
            ok: false,
            message: 'I need the Manage Channels permission to create ticket channels.'
        };
    }

    const ticketNumber = config.nextTicketNumber;
    const category = await resolveTicketCategory(guild, config);
    const channelName = getTicketChannelName(member, ticketNumber);

    const ticketChannelOptions = {
        name: channelName,
        type: ChannelType.GuildText,
        topic: `Ticket #${ticketNumber} | Owner: ${member.user.tag} (${member.id}) | ticket-owner:${member.id}`,
        permissionOverwrites: getTicketPermissionOverwrites(guild, member.id, config)
    };

    if (category) {
        ticketChannelOptions.parent = category.id;
    }

    const ticketChannel = await guild.channels.create(ticketChannelOptions);

    const record = normalizeTicketRecord({
        guildId: guild.id,
        channelId: ticketChannel.id,
        ownerId: member.id,
        ticketNumber,
        createdAt: new Date().toISOString(),
        reason
    });

    ticketRecords.set(ticketChannel.id, record);
    config.nextTicketNumber = ticketNumber + 1;
    ticketConfigs.set(guild.id, config);
    saveTicketConfigs();
    saveTicketRecords();

    const welcomeEmbed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle(`Ticket #${ticketNumber}`)
        .setDescription('Support will be with you soon. Use `!close` when this is finished, or `!escalate` if you need an admin.')
        .addFields(
            {
                name: 'Opened By',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            },
            {
                name: 'Reason',
                value: truncateText(reason, 1000),
                inline: false
            }
        )
        .setTimestamp();

    await ticketChannel.send({
        content: member.toString(),
        embeds: [welcomeEmbed],
        components: [createTicketControlRow(record)],
        allowedMentions: {
            users: [member.id],
            roles: []
        }
    });

    await sendTicketLog(
        guild,
        'Ticket Opened',
        [
            {
                name: 'Ticket',
                value: `${ticketChannel} (#${ticketNumber})`,
                inline: true
            },
            {
                name: 'Opened By',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            },
            {
                name: 'Reason',
                value: reason || 'No reason provided.',
                inline: false
            }
        ],
        '#2B90D9',
        config
    );

    return {
        ok: true,
        channel: ticketChannel,
        record
    };

}

async function fetchAllTicketMessages(channel) {

    const messages = [];
    let before;

    while (true) {

        const fetchedMessages = await channel.messages.fetch({
            limit: TICKET_TRANSCRIPT_FETCH_LIMIT,
            before
        });

        if (!fetchedMessages.size) break;

        messages.push(...fetchedMessages.values());
        before = fetchedMessages.last()?.id;

        if (fetchedMessages.size < TICKET_TRANSCRIPT_FETCH_LIMIT || !before) break;

    }

    return messages.sort((left, right) => left.createdTimestamp - right.createdTimestamp);

}

function formatTranscriptEmbed(embed, index) {

    const lines = [`Embed ${index + 1}:`];

    if (embed.title) lines.push(`Title: ${embed.title}`);
    if (embed.description) lines.push(`Description: ${embed.description}`);
    if (embed.url) lines.push(`URL: ${embed.url}`);

    if (Array.isArray(embed.fields) && embed.fields.length > 0) {

        for (const field of embed.fields) {
            lines.push(`Field - ${field.name}: ${field.value}`);
        }

    }

    return lines.join('\n');

}

function formatTranscriptMessage(message) {

    const lines = [];
    const timestamp = new Date(message.createdTimestamp).toISOString();
    const author = message.author
        ? `${message.author.tag} (${message.author.id})`
        : 'Unknown User';

    lines.push(`[${timestamp}] ${author}`);

    if (message.editedTimestamp) {
        lines.push(`Edited: ${new Date(message.editedTimestamp).toISOString()}`);
    }

    if (message.reference?.messageId) {
        lines.push(`Reply To Message ID: ${message.reference.messageId}`);
    }

    lines.push(message.content?.trim() || '[No text content]');

    if (message.attachments?.size > 0) {

        lines.push('Attachments:');

        for (const attachment of message.attachments.values()) {
            lines.push(`- ${attachment.name || 'attachment'}: ${attachment.url}`);
        }

    }

    if (message.stickers?.size > 0) {

        lines.push('Stickers:');

        for (const sticker of message.stickers.values()) {
            lines.push(`- ${sticker.name || sticker.id}`);
        }

    }

    if (message.embeds?.length > 0) {

        lines.push('Embeds:');
        message.embeds.forEach((embed, index) => {
            lines.push(formatTranscriptEmbed(embed, index));
        });

    }

    if (message.components?.length > 0) {
        lines.push(`[Components: ${message.components.length}]`);
    }

    return lines.join('\n');

}

function buildTicketTranscript(channel, record, messages, actorUser, reason, actionLabel) {

    const owner = channel.guild.members.cache.get(record.ownerId)?.user;
    const header = [
        `Ticket Transcript - ${channel.guild.name}`,
        `Action: ${actionLabel}`,
        `Ticket: #${record.ticketNumber || channel.id}`,
        `Channel: #${channel.name} (${channel.id})`,
        `Opened By: ${owner ? `${owner.tag} (${owner.id})` : record.ownerId}`,
        `Created At: ${record.createdAt}`,
        `Closed/Logged By: ${actorUser.tag || actorUser.username} (${actorUser.id})`,
        `Reason: ${reason || 'No reason provided.'}`,
        `Messages: ${messages.length}`,
        ''.padEnd(60, '=')
    ];

    const separator = `\n${''.padEnd(60, '-')}\n`;
    const body = messages.map(formatTranscriptMessage).join(separator);

    return `${header.join('\n')}\n\n${body || '[No messages found.]'}\n`;

}

async function sendTicketTranscriptToLogs(channel, record, actorUser, reason, actionLabel = 'Ticket Closed') {

    const config = getTicketConfig(channel.guild.id);
    const logChannel = await getTicketLogChannel(channel.guild, config);

    if (!logChannel) {
        throw new Error('Ticket log channel not found. Set it with `!ticketconfig logs #channel` or check `LOG_CHANNEL_ID`.');
    }

    const messages = await fetchAllTicketMessages(channel);
    const transcriptText = buildTicketTranscript(channel, record, messages, actorUser, reason, actionLabel);
    const transcriptFile = new AttachmentBuilder(Buffer.from(transcriptText, 'utf8'), {
        name: getTranscriptFileName(channel, record)
    });

    const embed = new EmbedBuilder()
        .setColor(actionLabel === 'Ticket Closed' ? '#FF5555' : '#9B59B6')
        .setTitle(actionLabel)
        .addFields(
            {
                name: 'Ticket',
                value: `${channel.name} (${channel.id})`,
                inline: false
            },
            {
                name: 'Opened By',
                value: `<@${record.ownerId}> (${record.ownerId})`,
                inline: false
            },
            {
                name: 'Handled By',
                value: `${actorUser.tag || actorUser.username} (${actorUser.id})`,
                inline: false
            },
            {
                name: 'Messages Logged',
                value: `${messages.length}`,
                inline: true
            },
            {
                name: 'Reason',
                value: truncateText(reason || 'No reason provided.', 1000),
                inline: false
            }
        )
        .setTimestamp();

    await logChannel.send({
        embeds: [embed],
        files: [transcriptFile],
        allowedMentions: {
            parse: []
        }
    });

    return {
        logChannel,
        messagesLogged: messages.length
    };

}

async function closeTicketChannel(channel, actorUser, reason = 'No reason provided.') {

    const record = getTicketRecordForChannel(channel);

    if (!record) {
        throw new Error('This does not look like a ticket channel.');
    }

    await channel.send('Creating ticket transcript before closing...').catch(() => {});

    const transcriptResult = await sendTicketTranscriptToLogs(
        channel,
        record,
        actorUser,
        reason,
        'Ticket Closed'
    );

    record.status = 'closed';
    ticketRecords.delete(channel.id);
    saveTicketRecords();

    await channel.send(
        `Transcript saved to ${transcriptResult.logChannel}. Closing this ticket in ${TICKET_CLOSE_DELETE_DELAY_MS / 1000} seconds.`
    ).catch(() => {});

    setTimeout(() => {
        channel.delete(`Ticket closed by ${actorUser.tag || actorUser.username}: ${reason}`)
            .catch(error => console.error('Failed to delete closed ticket channel:', error));
    }, TICKET_CLOSE_DELETE_DELAY_MS);

    return transcriptResult;

}

async function claimTicketChannel(channel, member, shouldClaim = true) {

    const record = getTicketRecordForChannel(channel);

    if (!record) {
        return {
            ok: false,
            message: 'This command only works inside a ticket channel.'
        };
    }

    const config = getTicketConfig(channel.guild.id);

    if (!canManageTicket(member, config)) {
        return {
            ok: false,
            message: 'Only ticket support staff can claim tickets.'
        };
    }

    if (shouldClaim && record.claimedBy) {
        return {
            ok: false,
            message: `This ticket is already claimed by <@${record.claimedBy}>.`
        };
    }

    record.claimedBy = shouldClaim ? member.id : null;
    ticketRecords.set(channel.id, record);
    saveTicketRecords();

    await channel.send(shouldClaim
        ? `Ticket claimed by ${member}.`
        : `Ticket claim removed by ${member}.`
    );

    await sendTicketLog(
        channel.guild,
        shouldClaim ? 'Ticket Claimed' : 'Ticket Unclaimed',
        [
            {
                name: 'Ticket',
                value: `${channel} (#${record.ticketNumber || channel.id})`,
                inline: true
            },
            {
                name: 'Staff',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            }
        ],
        shouldClaim ? '#57F287' : '#FEE75C',
        config
    );

    return {
        ok: true,
        message: shouldClaim ? 'Ticket claimed.' : 'Ticket claim removed.'
    };

}

async function escalateTicketChannel(channel, member, reason = 'Admin requested.') {

    const record = getTicketRecordForChannel(channel);

    if (!record) {
        return {
            ok: false,
            message: 'This command only works inside a ticket channel.'
        };
    }

    const config = getTicketConfig(channel.guild.id);

    if (!canUseTicket(member, record, config)) {
        return {
            ok: false,
            message: 'Only the ticket opener or support staff can escalate this ticket.'
        };
    }

    if (record.escalated) {
        return {
            ok: false,
            message: 'This ticket has already been escalated.'
        };
    }

    const adminRoleIds = config.adminRoleIds.filter(roleId => channel.guild.roles.cache.has(roleId));
    const supportRoleIdsToRemove = config.supportRoleIds.filter(roleId =>
        channel.guild.roles.cache.has(roleId) &&
        !adminRoleIds.includes(roleId)
    );
    const allowAdmin = {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
        EmbedLinks: true
    };
    const denySupport = {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false,
        AttachFiles: false,
        EmbedLinks: false,
        ManageMessages: false
    };

    for (const roleId of supportRoleIdsToRemove) {
        await channel.permissionOverwrites.edit(roleId, denySupport).catch(() => {});
    }

    for (const roleId of adminRoleIds) {
        await channel.permissionOverwrites.edit(roleId, allowAdmin).catch(() => {});
    }

    record.escalated = true;
    record.escalatedBy = member.id;
    record.escalatedAt = new Date().toISOString();
    record.escalationReason = reason;
    ticketRecords.set(channel.id, record);
    saveTicketRecords();

    const adminMentions = adminRoleIds.map(roleId => `<@&${roleId}>`).join(' ');
    const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('Ticket Escalated')
        .setDescription(adminRoleIds.length > 0
            ? 'An admin role has been requested for this ticket.'
            : 'No admin role is configured yet. The request was still logged.')
        .addFields(
            {
                name: 'Requested By',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            },
            {
                name: 'Reason',
                value: truncateText(reason || 'Admin requested.', 1000),
                inline: false
            }
        )
        .setTimestamp();

    await channel.send({
        content: adminMentions || null,
        embeds: [embed],
        allowedMentions: {
            roles: adminRoleIds
        }
    });

    await sendTicketLog(
        channel.guild,
        'Ticket Escalated',
        [
            {
                name: 'Ticket',
                value: `${channel} (#${record.ticketNumber || channel.id})`,
                inline: true
            },
            {
                name: 'Requested By',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            },
            {
                name: 'Reason',
                value: reason || 'Admin requested.',
                inline: false
            },
            {
                name: 'Admin Roles',
                value: adminRoleIds.length > 0 ? adminRoleIds.map(roleId => `<@&${roleId}>`).join(', ') : 'None configured.',
                inline: false
            }
        ],
        '#ED4245',
        config
    );

    return {
        ok: true,
        message: adminRoleIds.length > 0
            ? 'Ticket escalated and admin role notified.'
            : 'Ticket escalated, but no admin role is configured yet.'
    };

}

async function addOrRemoveTicketUser(message, args, shouldAdd) {

    const channel = message.channel;
    const member = message.member;

    const record = getTicketRecordForChannel(channel);

    if (!record) {
        return {
            ok: false,
            message: 'This command only works inside a ticket channel.'
        };
    }

    const config = getTicketConfig(channel.guild.id);

    if (!canManageTicket(member, config)) {
        return {
            ok: false,
            message: 'Only ticket support staff can add or remove ticket users.'
        };
    }

    const targetMember = await resolveMemberFromArgs(message, args);

    if (!targetMember) {
        return {
            ok: false,
            message: `Usage: \`${shouldAdd ? '!add' : '!remove'} @user/userID\``
        };
    }

    if (!shouldAdd && targetMember.id === record.ownerId) {
        return {
            ok: false,
            message: 'You cannot remove the person who opened the ticket.'
        };
    }

    if (shouldAdd) {

        await channel.permissionOverwrites.edit(targetMember.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
            AttachFiles: true,
            EmbedLinks: true
        });

        record.addedUserIds = getUniqueIdList([
            ...record.addedUserIds,
            targetMember.id
        ]);

    } else {

        await channel.permissionOverwrites.delete(targetMember.id).catch(() => {});
        record.addedUserIds = record.addedUserIds.filter(userId => userId !== targetMember.id);

    }

    ticketRecords.set(channel.id, record);
    saveTicketRecords();

    await channel.send(shouldAdd
        ? `${targetMember} was added to this ticket by ${member}.`
        : `${targetMember.user.tag} was removed from this ticket by ${member}.`
    );

    return {
        ok: true,
        message: shouldAdd ? 'User added to ticket.' : 'User removed from ticket.'
    };

}

async function sendTicketConfigSummary(message) {

    const config = getTicketConfig(message.guild.id);
    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('Ticket System Config')
        .addFields(
            {
                name: 'Support Roles',
                value: formatTicketRoleList(config.supportRoleIds),
                inline: false
            },
            {
                name: 'Admin Roles',
                value: formatTicketRoleList(config.adminRoleIds),
                inline: false
            },
            {
                name: 'Ticket Category',
                value: config.categoryId ? `<#${config.categoryId}>` : 'No category set.',
                inline: true
            },
            {
                name: 'Transcript Logs',
                value: config.logChannelId ? `<#${config.logChannelId}>` : `<#${LOG_CHANNEL_ID}>`,
                inline: true
            },
            {
                name: 'Next Ticket Number',
                value: `${config.nextTicketNumber}`,
                inline: true
            },
            {
                name: 'Commands',
                value: getTicketConfigUsage(),
                inline: false
            }
        )
        .setTimestamp();

    await message.channel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleTicketConfigCommand(message, args) {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('Administrator permission required.');
    }

    const section = args[0]?.toLowerCase();

    if (!section || section === 'list' || section === 'show') {
        await sendTicketConfigSummary(message);
        return;
    }

    if (section === 'reset') {

        ticketConfigs.set(message.guild.id, normalizeTicketConfig());
        saveTicketConfigs();

        await message.reply('Ticket config reset to defaults.');
        return;

    }

    if (section === 'support' || section === 'admin') {

        const action = args[1]?.toLowerCase();
        const roleArg = args.slice(2).join(' ').trim();

        if (!['add', 'remove'].includes(action) || !roleArg) {
            return message.reply(getTicketConfigUsage());
        }

        const role = await resolveRoleFromArg(message, roleArg);

        if (!role) {
            return message.reply('I could not find that role.');
        }

        const roleKey = section === 'support' ? 'supportRoleIds' : 'adminRoleIds';

        setTicketConfig(message.guild.id, config => {

            if (action === 'add') {
                config[roleKey] = getUniqueIdList([
                    ...config[roleKey],
                    role.id
                ]);
            } else {
                config[roleKey] = config[roleKey].filter(roleId => roleId !== role.id);
            }

        });

        await message.reply(`${role} was ${action === 'add' ? 'added to' : 'removed from'} ticket ${section} roles.`);
        return;

    }

    if (section === 'category') {

        const categoryArg = args.slice(1).join(' ').trim();

        if (!categoryArg) {
            return message.reply('Usage: `!ticketconfig category category_id` or `!ticketconfig category none`');
        }

        if (['none', 'clear', 'off', 'remove'].includes(categoryArg.toLowerCase())) {

            setTicketConfig(message.guild.id, config => {
                config.categoryId = null;
            });

            await message.reply('Ticket category cleared. New tickets will be created without a category.');
            return;

        }

        const category = await resolveCategoryFromArg(message, categoryArg);

        if (!category) {
            return message.reply('I could not find that category. Use the category ID or exact category name.');
        }

        setTicketConfig(message.guild.id, config => {
            config.categoryId = category.id;
        });

        await message.reply(`Ticket category set to **${category.name}**.`);
        return;

    }

    if (section === 'logs' || section === 'log') {

        const channelArg = args[1];

        if (!channelArg) {
            return message.reply('Usage: `!ticketconfig logs #channel`');
        }

        const channel = resolveTextChannelFromArg(message, channelArg);

        if (!channel) {
            return message.reply('I could not find that text channel.');
        }

        setTicketConfig(message.guild.id, config => {
            config.logChannelId = channel.id;
        });

        await message.reply(`Ticket transcripts will be sent to ${channel}.`);
        return;

    }

    await message.reply(getTicketConfigUsage());

}

async function handleTicketSetupCommand(message, args) {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('Administrator permission required.');
    }

    let targetChannel = message.channel;
    let promptParts = args;

    const possibleChannel = resolveTextChannelFromArg(message, args[0]);

    if (possibleChannel) {
        targetChannel = possibleChannel;
        promptParts = args.slice(1);
    }

    const prompt = promptParts.join(' ').trim() ||
        'Need help from the team? Open a ticket and describe what you need.';
    const botMember = await getBotMember(message.guild);
    const channelPermissions = targetChannel.permissionsFor(botMember);

    if (!channelPermissions?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks
    ])) {
        return message.reply('I need View Channel, Send Messages, and Embed Links in that channel.');
    }

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('Support Tickets')
        .setDescription(prompt)
        .setFooter({
            text: 'Click the button below to open a private ticket.'
        })
        .setTimestamp();

    await targetChannel.send({
        embeds: [embed],
        components: [createTicketOpenRow()],
        allowedMentions: {
            parse: []
        }
    });

    await message.reply(`Ticket panel created in ${targetChannel}.`);

}

async function handleTicketOpenCommand(message, args) {

    const reason = args.join(' ').trim() || 'No reason provided.';

    try {

        const result = await createTicketForMember(message.guild, message.member, reason);

        if (!result.ok) {
            return message.reply(result.message);
        }

        await message.reply(`Ticket created: ${result.channel}`);

    } catch (error) {

        console.error('Ticket create command error:', error);
        await message.reply('Failed to create a ticket. Check my channel permissions and ticket config.');

    }

}

async function handleTicketCloseCommand(message, args) {

    const record = getTicketRecordForChannel(message.channel);

    if (!record) {
        return message.reply('This command only works inside a ticket channel.');
    }

    const config = getTicketConfig(message.guild.id);

    if (!canUseTicket(message.member, record, config)) {
        return message.reply('Only the ticket opener or ticket support staff can close this ticket.');
    }

    const reason = args.join(' ').trim() || 'No reason provided.';

    try {

        await closeTicketChannel(message.channel, message.author, reason);

    } catch (error) {

        console.error('Ticket close command error:', error);
        await message.reply(`Failed to close ticket: ${error.message}`);

    }

}

async function handleTicketTranscriptCommand(message, args) {

    const record = getTicketRecordForChannel(message.channel);

    if (!record) {
        return message.reply('This command only works inside a ticket channel.');
    }

    const config = getTicketConfig(message.guild.id);

    if (!canUseTicket(message.member, record, config)) {
        return message.reply('Only the ticket opener or ticket support staff can create a transcript.');
    }

    const reason = args.join(' ').trim() || 'Manual transcript requested.';

    try {

        const result = await sendTicketTranscriptToLogs(
            message.channel,
            record,
            message.author,
            reason,
            'Ticket Transcript Created'
        );

        await message.reply(`Transcript sent to ${result.logChannel}.`);

    } catch (error) {

        console.error('Ticket transcript command error:', error);
        await message.reply(`Failed to create transcript: ${error.message}`);

    }

}

async function handleTicketClaimCommand(message, shouldClaim) {

    const result = await claimTicketChannel(message.channel, message.member, shouldClaim);

    if (!result.ok) {
        await message.reply(result.message);
    }

}

async function handleTicketEscalateCommand(message, args) {

    const reason = args.join(' ').trim() || 'Admin requested.';
    const result = await escalateTicketChannel(message.channel, message.member, reason);

    if (!result.ok) {
        await message.reply(result.message);
        return;
    }

    await message.reply(result.message);

}

async function handleTicketRenameCommand(message, args) {

    const record = getTicketRecordForChannel(message.channel);

    if (!record) {
        return message.reply('This command only works inside a ticket channel.');
    }

    const config = getTicketConfig(message.guild.id);

    if (!canManageTicket(message.member, config)) {
        return message.reply('Only ticket support staff can rename tickets.');
    }

    const requestedName = args.join(' ').trim();

    if (!requestedName) {
        return message.reply('Usage: `!rename new-ticket-name`');
    }

    const newNamePart = sanitizeTicketChannelPart(requestedName, 'renamed');
    const newName = record.ticketNumber
        ? `ticket-${record.ticketNumber}-${newNamePart}`
        : `ticket-${newNamePart}`;

    try {

        await message.channel.setName(newName.slice(0, 95));
        await message.reply(`Ticket renamed to **${message.channel.name}**.`);

        await sendTicketLog(
            message.guild,
            'Ticket Renamed',
            [
                {
                    name: 'Ticket',
                    value: `${message.channel} (#${record.ticketNumber || message.channel.id})`,
                    inline: true
                },
                {
                    name: 'Renamed By',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'New Name',
                    value: newName.slice(0, 95),
                    inline: false
                }
            ],
            '#FEE75C',
            config
        );

    } catch (error) {

        console.error('Ticket rename command error:', error);
        await message.reply('Failed to rename this ticket.');

    }

}

async function handleTicketButtonInteraction(interaction) {

    if (!interaction.guild) {
        return interaction.reply({
            content: 'Tickets only work in a server.',
            ephemeral: true
        });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id)
        .catch(() => interaction.member);

    if (interaction.customId === 'ticket_open') {

        await interaction.deferReply({
            ephemeral: true
        });

        try {

            const result = await createTicketForMember(
                interaction.guild,
                member,
                'Opened from the ticket panel.'
            );

            await interaction.editReply(result.ok
                ? `Ticket created: ${result.channel}`
                : result.message
            );

        } catch (error) {

            console.error('Ticket open button error:', error);
            await interaction.editReply('Failed to create a ticket. Check my channel permissions and ticket config.');

        }

        return;

    }

    const record = getTicketRecordForChannel(interaction.channel);

    if (!record) {
        return interaction.reply({
            content: 'This button only works inside a ticket channel.',
            ephemeral: true
        });
    }

    const config = getTicketConfig(interaction.guild.id);

    if (interaction.customId === 'ticket_claim') {

        const result = await claimTicketChannel(interaction.channel, member, true);

        return interaction.reply({
            content: result.message,
            ephemeral: true
        });

    }

    if (interaction.customId === 'ticket_escalate') {

        const result = await escalateTicketChannel(
            interaction.channel,
            member,
            'Escalated with the ticket button.'
        );

        return interaction.reply({
            content: result.message,
            ephemeral: true
        });

    }

    if (interaction.customId === 'ticket_close') {

        if (!canUseTicket(member, record, config)) {
            return interaction.reply({
                content: 'Only the ticket opener or ticket support staff can close this ticket.',
                ephemeral: true
            });
        }

        await interaction.deferReply({
            ephemeral: true
        });

        try {

            await interaction.editReply('Closing ticket and creating transcript...');
            await closeTicketChannel(
                interaction.channel,
                interaction.user,
                'Closed with the ticket button.'
            );

        } catch (error) {

            console.error('Ticket close button error:', error);
            await interaction.editReply(`Failed to close ticket: ${error.message}`);

        }

    }

}

function getEmojiKeyFromInput(emojiInput) {

    const customEmojiMatch = String(emojiInput || '').match(/^<a?:\w+:(\d+)>$/);

    return customEmojiMatch ? customEmojiMatch[1] : String(emojiInput || '');

}

function getEmojiKeyFromReaction(reaction) {
    return reaction.emoji.id || reaction.emoji.name;
}

function resolveTextChannelFromArg(message, arg) {

    const channelId = String(arg || '').match(/^<#(\d{17,20})>$/)?.[1] ||
        String(arg || '').match(/^\d{17,20}$/)?.[0];

    const channel = channelId
        ? message.guild.channels.cache.get(channelId)
        : message.mentions.channels.first();

    if (!channel?.isTextBased?.() || !channel.send) return null;

    return channel;

}

async function resolveRoleFromArg(message, arg) {

    const roleId = String(arg || '').match(/^<@&(\d{17,20})>$/)?.[1] ||
        String(arg || '').match(/^\d{17,20}$/)?.[0];

    if (roleId) {
        return message.guild.roles.cache.get(roleId) ||
            await message.guild.roles.fetch(roleId).catch(() => null);
    }

    const roleName = String(arg || '').toLowerCase();

    if (!roleName) return null;

    return message.guild.roles.cache.find(role =>
        role.name.toLowerCase() === roleName
    ) || null;

}

async function getBotMember(guild) {
    return guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
}

function formatReactionRoleUsage() {
    return formatMergedReactionRoleUsage();
}

function formatReactionRolesUsage() {
    return formatMergedReactionRoleUsage();
}

function formatMergedReactionRoleUsage() {
    return 'Usage:\nSingle: `!reactionrole #channel emoji @role message text`\nMultiple: `!reactionrole #channel message text | emoji @role | emoji @role`\nExample: `!reactionrole #roles Choose your color | 🟢 @Green | 🔴 @Red | 🔵 @Blue`';
}

function getReactionRoleOptionText(options) {

    return options
        .map(option => `${option.emoji} ${option.role}`)
        .join('\n');

}

function canBotAssignRole(botMember, guild, role) {
    return role.id !== guild.id &&
        !role.managed &&
        botMember.roles.highest.comparePositionTo(role) > 0;
}

async function parseReactionRoleOptions(message, optionSections) {

    const options = [];
    const seenEmojiKeys = new Set();

    for (const section of optionSections) {

        const [emojiArg, roleArg] = section.trim().split(/\s+/);

        if (!emojiArg || !roleArg) {
            return {
                error: `I could not read this option: \`${section}\``
            };
        }

        const role = await resolveRoleFromArg(message, roleArg);

        if (!role) {
            return {
                error: `I could not find the role for this option: \`${section}\``
            };
        }

        const emojiKey = getEmojiKeyFromInput(emojiArg);

        if (seenEmojiKeys.has(emojiKey)) {
            return {
                error: `You used the same emoji more than once: ${emojiArg}`
            };
        }

        seenEmojiKeys.add(emojiKey);

        options.push({
            emoji: emojiArg,
            emojiKey,
            role
        });

    }

    if (options.length === 0) {
        return {
            error: 'Add at least one emoji and role option.'
        };
    }

    return {
        options
    };

}

async function parseReactionRoleCommand(message, args) {

    const [channelArg, ...reactionRoleParts] = args;
    const reactionRoleText = reactionRoleParts.join(' ').trim();

    if (!channelArg || !reactionRoleText) {
        return {
            error: formatMergedReactionRoleUsage()
        };
    }

    if (reactionRoleText.includes('|')) {

        const sections = reactionRoleText
            .split('|')
            .map(section => section.trim())
            .filter(Boolean);
        const promptText = sections.shift();

        if (!promptText || sections.length === 0) {
            return {
                error: formatMergedReactionRoleUsage()
            };
        }

        const parsedOptions = await parseReactionRoleOptions(message, sections);

        if (parsedOptions.error) {
            return {
                error: `❌ ${parsedOptions.error}\n${formatMergedReactionRoleUsage()}`
            };
        }

        return {
            channelArg,
            promptText,
            options: parsedOptions.options
        };

    }

    const [emojiArg, roleArg, ...promptParts] = reactionRoleParts;
    const promptText = promptParts.join(' ').trim();

    if (!emojiArg || !roleArg || !promptText) {
        return {
            error: formatMergedReactionRoleUsage()
        };
    }

    const parsedOptions = await parseReactionRoleOptions(message, [
        `${emojiArg} ${roleArg}`
    ]);

    if (parsedOptions.error) {
        return {
            error: `❌ ${parsedOptions.error}\n${formatMergedReactionRoleUsage()}`
        };
    }

    return {
        channelArg,
        promptText,
        options: parsedOptions.options
    };

}

async function handleReactionRole(reaction, user, shouldAddRole) {

    if (user.bot) return;

    try {

        if (reaction.partial) {
            reaction = await reaction.fetch();
        }

        if (reaction.message.partial) {
            await reaction.message.fetch();
        }

        const guild = reaction.message.guild;

        if (!guild) return;

        const emojiKey = getEmojiKeyFromReaction(reaction);
        const mapping = reactionRoleMessages.get(
            getReactionRoleKey(guild.id, reaction.message.id, emojiKey)
        );

        if (!mapping) return;

        const member = await guild.members.fetch(user.id).catch(() => null);
        const role = guild.roles.cache.get(mapping.roleId) ||
            await guild.roles.fetch(mapping.roleId).catch(() => null);

        if (!member || !role) return;

        if (shouldAddRole) {
            await member.roles.add(role, 'Reaction role selected.');
        } else {
            await member.roles.remove(role, 'Reaction role removed.');
        }

    } catch (error) {

        console.error('Reaction role handler failed:', error);

    }

}

function getVrchatPostBridgeMissingSettings() {

    const missing = [];

    if (!VRCHAT_GROUP_ID) missing.push('VRCHAT_GROUP_ID');
    if (!VRCHAT_POST_CHANNEL_ID) missing.push('VRCHAT_POST_CHANNEL_ID');
    if (!VRCHAT_AUTH_COOKIE) missing.push('VRCHAT_AUTH_COOKIE');

    return missing;

}

function getVrchatAuthCookieHeader() {

    const cookie = VRCHAT_AUTH_COOKIE.trim();

    if (!cookie) return '';

    return cookie.includes('=') ? cookie : `auth=${cookie}`;

}

function rememberVrchatPostId(postId) {

    seenVrchatPostIds.add(postId);

    while (seenVrchatPostIds.size > MAX_SEEN_VRCHAT_POST_IDS) {
        const oldestPostId = seenVrchatPostIds.values().next().value;
        seenVrchatPostIds.delete(oldestPostId);
    }

}

async function fetchVrchatGroupPosts() {

    const params = new URLSearchParams({
        n: '20',
        publicOnly: String(VRCHAT_POST_PUBLIC_ONLY)
    });

    const response = await fetch(
        `https://api.vrchat.cloud/api/1/groups/${encodeURIComponent(VRCHAT_GROUP_ID)}/posts?${params.toString()}`,
        {
            headers: {
                Accept: 'application/json',
                Cookie: getVrchatAuthCookieHeader(),
                'User-Agent': VRCHAT_API_USER_AGENT
            }
        }
    );

    let payload = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (response.status === 429) {
        const retryAfterSeconds = Number.parseInt(response.headers.get('retry-after') || '', 10);

        if (retryAfterSeconds > 0) {
            vrchatPostNextAllowedAt = Date.now() + (retryAfterSeconds * 1000);
        }

        throw new Error('VRChat rate limited the group post watcher.');
    }

    if (!response.ok) {
        const errorMessage = payload?.error?.message || payload?.message || response.statusText;
        throw new Error(`VRChat API returned ${response.status}: ${errorMessage}`);
    }

    if (Array.isArray(payload?.posts)) return payload.posts;
    if (Array.isArray(payload)) return payload;

    return [];

}

async function fetchVrchatGroupInstances() {

    const response = await fetch(
        `https://api.vrchat.cloud/api/1/groups/${encodeURIComponent(VRCHAT_GROUP_ID)}/instances`,
        {
            headers: {
                Accept: 'application/json',
                Cookie: getVrchatAuthCookieHeader(),
                'User-Agent': VRCHAT_API_USER_AGENT
            }
        }
    );

    let payload = null;

    try {
        payload = await response.json();
    } catch {
        payload = null;
    }

    if (response.status === 429) {
        const retryAfterSeconds = Number.parseInt(response.headers.get('retry-after') || '', 10);

        if (retryAfterSeconds > 0) {
            vrchatPostNextAllowedAt = Date.now() + (retryAfterSeconds * 1000);
        }

        throw new Error('VRChat rate limited the group instance watcher.');
    }

    if (!response.ok) {
        const errorMessage = payload?.error?.message || payload?.message || response.statusText;
        throw new Error(`VRChat instances API returned ${response.status}: ${errorMessage}`);
    }

    return Array.isArray(payload) ? payload : [];

}

async function getVrchatPostChannel() {

    const channel = client.channels.cache.get(VRCHAT_POST_CHANNEL_ID) ||
        await client.channels.fetch(VRCHAT_POST_CHANNEL_ID).catch(() => null);

    if (!channel?.isTextBased?.() || !channel.send) return null;

    return channel;

}

function getVrchatInstanceWorldId(instance) {

    if (instance?.world?.id) return instance.world.id;
    if (typeof instance?.location === 'string' && instance.location.includes(':')) {
        return instance.location.split(':')[0];
    }

    return '';

}

function getVrchatInstanceId(instance) {

    if (instance?.instanceId) return instance.instanceId;
    if (typeof instance?.location === 'string' && instance.location.includes(':')) {
        return instance.location.slice(instance.location.indexOf(':') + 1);
    }

    return '';

}

function getVrchatInstanceLaunchUrl(instance) {

    const worldId = getVrchatInstanceWorldId(instance);
    const instanceId = getVrchatInstanceId(instance);

    if (!worldId || !instanceId) return null;

    return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(worldId)}&instanceId=${encodeURIComponent(instanceId)}`;

}

function escapeMarkdownLinkText(text) {

    return String(text || 'Open Instance')
        .replace(/\\/g, '\\\\')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]')
        .replace(/\s+/g, ' ')
        .trim();

}

function formatVrchatOpenInstances(instances) {

    const links = [];
    const seenLocations = new Set();

    for (const instance of instances) {

        if (!instance?.location || seenLocations.has(instance.location)) continue;

        const launchUrl = getVrchatInstanceLaunchUrl(instance);
        if (!launchUrl) continue;

        const name = escapeMarkdownLinkText(instance.world?.name || instance.location);
        const memberCount = Number.parseInt(instance.memberCount, 10);
        const capacity = Number.parseInt(instance.world?.capacity, 10);
        const memberText = Number.isNaN(memberCount)
            ? ''
            : Number.isNaN(capacity)
                ? ` - ${memberCount} online`
                : ` - ${memberCount}/${capacity} online`;

        links.push(`[${name}](${launchUrl})${memberText}`);
        seenLocations.add(instance.location);

        if (links.length >= 10) break;

    }

    return links.length > 0
        ? `**Open Instances**\n${links.join('\n')}`
        : '';

}

function buildVrchatPostDescription(post, openInstances = []) {

    const postText = post.text || 'No post text was provided.';
    const instanceSection = formatVrchatOpenInstances(openInstances);

    if (!instanceSection) {
        return truncateText(postText, 4096);
    }

    const availablePostTextLength = Math.max(200, 4096 - instanceSection.length - 2);

    return `${truncateText(postText, availablePostTextLength)}\n\n${instanceSection}`;

}

function createVrchatPostEmbed(post, openInstances = []) {

    const title = truncateText(post.title || 'New VRChat Group Post', 250);
    const description = buildVrchatPostDescription(post, openInstances);
    const createdAt = Date.parse(post.createdAt || post.updatedAt || '');

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle(title)
        .setDescription(description);

    if (!Number.isNaN(createdAt)) {
        embed.setTimestamp(new Date(createdAt));
    }

    return embed;

}

function getVrchatPostImageName(post, contentType = '') {

    const extensionFromType = contentType.includes('png')
        ? 'png'
        : contentType.includes('gif')
            ? 'gif'
            : contentType.includes('webp')
                ? 'webp'
                : 'jpg';

    return `vrchat-post-${post.id || Date.now()}.${extensionFromType}`;

}

async function createVrchatPostMessagePayload(post, openInstances = []) {

    const embed = createVrchatPostEmbed(post, openInstances);
    const payload = {
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    };

    if (!post.imageUrl || !/^https?:\/\//i.test(post.imageUrl)) {
        return payload;
    }

    try {

        const response = await fetch(post.imageUrl, {
            headers: {
                Accept: 'image/*',
                Cookie: getVrchatAuthCookieHeader(),
                'User-Agent': VRCHAT_API_USER_AGENT
            }
        });

        if (!response.ok) {
            throw new Error(`Image download returned ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        const imageBuffer = Buffer.from(await response.arrayBuffer());
        const imageName = getVrchatPostImageName(post, contentType);

        payload.files = [
            new AttachmentBuilder(imageBuffer, {
                name: imageName
            })
        ];

        embed.setImage(`attachment://${imageName}`);

    } catch (error) {

        console.error('Failed to upload VRChat post image:', error);
        embed.setImage(post.imageUrl);

    }

    return payload;

}

async function sendVrchatGroupPost(post, openInstances = []) {

    const channel = await getVrchatPostChannel();

    if (!channel) {
        console.warn(`VRChat post channel not found: ${VRCHAT_POST_CHANNEL_ID}`);
        return;
    }

    await channel.send(await createVrchatPostMessagePayload(post, openInstances));

}

async function checkVrchatGroupPosts(seedOnly = false) {

    if (vrchatPostPollRunning || Date.now() < vrchatPostNextAllowedAt) return;

    vrchatPostPollRunning = true;

    try {

        const posts = await fetchVrchatGroupPosts();
        const newPosts = [];

        for (const post of posts) {

            if (!post?.id) continue;

            if (!seenVrchatPostIds.has(post.id) && !seedOnly) {
                newPosts.push(post);
            }

            rememberVrchatPostId(post.id);

        }

        if (seedOnly) {
            console.log(`VRChat group post watcher seeded ${seenVrchatPostIds.size} post(s).`);
            return;
        }

        newPosts.sort((left, right) =>
            Date.parse(left.createdAt || left.updatedAt || '') -
            Date.parse(right.createdAt || right.updatedAt || '')
        );

        let openInstances = [];

        if (newPosts.length > 0) {

            try {
                openInstances = await fetchVrchatGroupInstances();
            } catch (error) {
                console.error('Failed to fetch VRChat group instances:', error);
            }

        }

        for (const post of newPosts) {
            await sendVrchatGroupPost(post, openInstances);
        }

    } catch (error) {

        console.error('VRChat group post watcher error:', error);

    } finally {

        vrchatPostPollRunning = false;

    }

}

function startVrchatGroupPostWatcher() {

    if (vrchatPostWatcherStarted) return;

    const missingSettings = getVrchatPostBridgeMissingSettings();

    if (missingSettings.length > 0) {
        console.warn(`VRChat group post watcher disabled. Missing: ${missingSettings.join(', ')}`);
        return;
    }

    vrchatPostWatcherStarted = true;

    checkVrchatGroupPosts(true);
    setInterval(() => {
        checkVrchatGroupPosts(false);
    }, VRCHAT_POST_POLL_INTERVAL_MS);

    console.log(`VRChat group post watcher started for ${VRCHAT_GROUP_ID}.`);

}

function formatLoggedMessageContent(content) {

    const safeContent = content && content.trim()
        ? content.replace(/```/g, '`\u200b``')
        : '[No text content]';

    return `\`\`\`
${truncateText(safeContent, 900)}
\`\`\``;

}

function getUserIdFromArg(arg) {

    if (!arg) return null;

    const mentionMatch = arg.match(/^<@!?(\d{17,20})>$/);
    const idMatch = arg.match(/^\d{17,20}$/);

    return mentionMatch ? mentionMatch[1] : idMatch ? idMatch[0] : null;

}

async function resolveUserFromArg(message, arg) {

    const userId = getUserIdFromArg(arg);

    if (!userId) return null;

    return await message.client.users.fetch(userId).catch(() => null);

}

async function resolveUserFromArgs(message, args) {

    if (!args[0]) return null;

    return await resolveUserFromArg(message, args[0]) || message.mentions.users.first() || null;

}

async function resolveUsersFromArgs(message, args, limit = args.length) {

    const users = [];
    const seenUserIds = new Set();

    for (const arg of args) {

        const user = await resolveUserFromArg(message, arg);

        if (user && !seenUserIds.has(user.id)) {

            users.push(user);
            seenUserIds.add(user.id);

            if (users.length >= limit) break;

        }

    }

    for (const user of message.mentions.users.values()) {

        if (!seenUserIds.has(user.id)) {

            users.push(user);
            seenUserIds.add(user.id);

            if (users.length >= limit) break;

        }

    }

    return users;

}

async function resolveMemberFromArgs(message, args) {

    if (!args[0]) return null;

    const userId = getUserIdFromArg(args[0]);

    if (!userId) {
        return message.mentions.members.first() || null;
    }

    return await message.guild.members.fetch(userId).catch(() => null);

}

function chunkArray(array, size) {

    const chunks = [];

    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }

    return chunks;

}

function canMassDeleteInChannel(channel, botMember) {

    if (!channel?.isTextBased?.() || !channel.messages?.fetch) return false;

    const permissions = channel.permissionsFor(botMember);

    return permissions?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.ManageMessages
    ]);

}

async function addMassDeleteChannel(channel, botMember, channels, seenChannelIds, stats) {

    if (!channel || seenChannelIds.has(channel.id)) return;

    seenChannelIds.add(channel.id);

    if (canMassDeleteInChannel(channel, botMember)) {
        channels.push(channel);
        return;
    }

    if (channel?.isTextBased?.() && channel.messages?.fetch) {
        stats.channelsSkipped++;
    }

}

async function collectMassDeleteChannels(guild, botMember, stats) {

    const channels = [];
    const seenChannelIds = new Set();
    const guildChannels = await guild.channels.fetch();

    for (const channel of guildChannels.values()) {

        await addMassDeleteChannel(channel, botMember, channels, seenChannelIds, stats);

        if (!channel?.threads?.fetchActive) continue;

        const activeThreads = await channel.threads.fetchActive().catch(() => null);

        if (!activeThreads?.threads) continue;

        for (const thread of activeThreads.threads.values()) {
            await addMassDeleteChannel(thread, botMember, channels, seenChannelIds, stats);
        }

    }

    return channels;

}

async function deleteTargetMessagesFromBatch(channel, messages, targetUserId) {

    const matchingMessages = messages.filter(
        fetchedMessage => fetchedMessage.author?.id === targetUserId
    );

    if (!matchingMessages.size) return 0;

    const cutoffTimestamp = Date.now() - BULK_DELETE_MAX_AGE_MS;
    const recentMessages = [];
    const olderMessages = [];

    for (const fetchedMessage of matchingMessages.values()) {

        if (fetchedMessage.createdTimestamp > cutoffTimestamp) {
            recentMessages.push(fetchedMessage);
        } else {
            olderMessages.push(fetchedMessage);
        }

    }

    let deletedCount = 0;

    for (const batch of chunkArray(recentMessages, MASS_DELETE_PAGE_SIZE)) {

        if (!batch.length) continue;

        if (typeof channel.bulkDelete === 'function') {

            try {

                const deletedMessages = await channel.bulkDelete(batch, true);
                deletedCount += deletedMessages.size;
                continue;

            } catch (error) {

                console.error(`Mass delete bulk delete failed in ${channel.id}:`, error);

            }

        }

        for (const fetchedMessage of batch) {
            await fetchedMessage.delete()
                .then(() => {
                    deletedCount++;
                })
                .catch(() => {});
        }

    }

    for (const fetchedMessage of olderMessages) {
        await fetchedMessage.delete()
            .then(() => {
                deletedCount++;
            })
            .catch(() => {});
    }

    return deletedCount;

}

function formatMassDeleteStatus(targetLabel, stats, isFinished = false) {

    const status = isFinished ? 'Finished' : 'Working';

    return `${status} mass delete for ${targetLabel}.\n` +
        `Channels scanned: **${stats.channelsScanned}/${stats.totalChannels}**\n` +
        `Messages checked: **${stats.messagesChecked}**\n` +
        `Messages deleted: **${stats.messagesDeleted}**\n` +
        `Skipped channels: **${stats.channelsSkipped}**\n` +
        `Channel errors: **${stats.channelErrors}**`;

}

function getWarningKey(member) {
    return `${member.guild.id}:${member.id}`;
}

function getWarningCount(member) {
    return warningCounts.get(getWarningKey(member)) || 0;
}

function addWarning(member) {
    const key = getWarningKey(member);
    const newCount = getWarningCount(member) + 1;

    warningCounts.set(key, newCount);

    return newCount;
}

function resetWarnings(member) {
    warningCounts.set(getWarningKey(member), 0);
}

async function timeoutMemberForOneHour(member, reason) {

    await member.timeout(AUTO_TIMEOUT_DURATION_MS, reason);

}

async function sendWarningLog(member, moderatorUser, reason, warningCount, wasTimedOut, sourceChannel, originalMessageContent = null) {

    const logChannel = getLogChannel(member.guild);

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor(wasTimedOut ? '#FF0000' : '#FFA500')
        .setTitle(wasTimedOut ? '⏳ User Auto-Timed Out After Warnings' : '⚠️ User Warned')
        .addFields(
            {
                name: 'User',
                value: `${member.user.tag} (${member.id})`,
                inline: false
            },
            {
                name: 'Moderator/System',
                value: `${moderatorUser.tag || moderatorUser.username}`,
                inline: true
            },
            {
                name: 'Channel',
                value: `${sourceChannel}`,
                inline: true
            },
            {
                name: 'Reason',
                value: reason || 'No reason provided.',
                inline: false
            },
            ...(originalMessageContent !== null ? [
                {
                    name: 'Flagged Message',
                    value: formatLoggedMessageContent(originalMessageContent),
                    inline: false
                }
            ] : []),
            {
                name: 'Warnings',
                value: wasTimedOut ? `${AUTO_WARN_LIMIT}/${AUTO_WARN_LIMIT} - Reset after timeout` : `${warningCount}/${AUTO_WARN_LIMIT}`,
                inline: true
            },
            {
                name: 'Action',
                value: wasTimedOut ? 'Timed out for 1 hour.' : 'Warning added.',
                inline: true
            }
        )
        .setTimestamp();

    logChannel.send({
        embeds: [embed]
    }).catch(() => {});

}

async function warnMember(member, moderatorUser, reason, sourceChannel, originalMessageContent = null) {

    const warningCount = addWarning(member);

    let wasTimedOut = false;

    if (warningCount >= AUTO_WARN_LIMIT) {

        wasTimedOut = true;

        await timeoutMemberForOneHour(
            member,
            `Reached ${AUTO_WARN_LIMIT} warnings. Reason: ${reason}`
        );

        resetWarnings(member);

    }

    const warnEmbed = new EmbedBuilder()
        .setColor(wasTimedOut ? '#FF0000' : '#FFA500')
        .setTitle(wasTimedOut ? '⏳ Auto-Timeout' : '⚠️ Warning Issued')
        .setDescription(
            wasTimedOut
                ? `${member} reached **${AUTO_WARN_LIMIT} warnings** and has been timed out for **1 hour**. Warnings have been reset.`
                : `${member} has been warned.
Warnings: **${warningCount}/${AUTO_WARN_LIMIT}**`
        )
        .addFields({
            name: 'Reason',
            value: reason || 'No reason provided.'
        })
        .setTimestamp();

    await sourceChannel.send({
        embeds: [warnEmbed]
    }).catch(() => {});

    member.send({
        embeds: [
            new EmbedBuilder()
                .setColor(wasTimedOut ? '#FF0000' : '#FFA500')
                .setTitle(wasTimedOut ? '⏳ You were timed out' : '⚠️ You were warned')
                .setDescription(
                    wasTimedOut
                        ? `You reached **${AUTO_WARN_LIMIT} warnings** in **${member.guild.name}** and were timed out for **1 hour**.`
                        : `You were warned in **${member.guild.name}**.`
                )
                .addFields({
                    name: 'Reason',
                    value: reason || 'No reason provided.'
                })
                .setTimestamp()
        ]
    }).catch(() => {});

    await sendWarningLog(
        member,
        moderatorUser,
        reason,
        warningCount,
        wasTimedOut,
        sourceChannel,
        originalMessageContent
    );

}

function isTemporaryGeminiError(status, message) {

    const lowerMessage = String(message || '').toLowerCase();

    return (
        status === 429 ||
        status === 500 ||
        status === 503 ||
        lowerMessage.includes('high demand') ||
        lowerMessage.includes('try again later') ||
        lowerMessage.includes('temporarily unavailable') ||
        lowerMessage.includes('overloaded') ||
        lowerMessage.includes('quota')
    );

}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callGeminiModel(model, question, username) {

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [
                        {
                            text: 'You are the AI assistant for an 18+ VRChat Discord community. Your tone is witty, sassy, funny, playful, and campy with a little gay/queer flair. Be concise, confident, and entertaining. Light profanity, teasing, and dramatic side-eye are fine, but do not be hateful, malicious, or genuinely abusive. Do not use slurs or target protected groups. If a user asks who created you or this Discord bot, say the creator is Bqbblz.'
                        }
                    ]
                },
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: `${username} asks: ${question}`
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 600
                }
            })
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = data?.error?.message || `Gemini API error ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.model = model;
        throw error;
    }

    const textParts = data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text)
        ?.filter(Boolean)
        ?.join('\n')
        ?.trim();

    if (!textParts) {
        const error = new Error('Gemini returned no text response.');
        error.model = model;
        throw error;
    }

    return textParts;

}

async function askGemini(question, username = 'Discord user') {

    if (!GEMINI_API_KEY) {
        throw new Error('Missing GEMINI_API_KEY environment variable.');
    }

    let lastError = null;

    for (const model of GEMINI_MODELS) {

        for (let attempt = 1; attempt <= 2; attempt++) {

            try {
                return await callGeminiModel(model, question, username);
            } catch (error) {

                lastError = error;

                const temporary = isTemporaryGeminiError(error.status, error.message);

                if (!temporary) {
                    throw error;
                }

                console.warn(`Gemini model ${model} failed temporarily on attempt ${attempt}: ${error.message}`);

                if (attempt < 2) {
                    await wait(1200);
                }

            }

        }

    }

    throw new Error(
        `Gemini is busy right now. Tried: ${GEMINI_MODELS.join(', ')}. Last error: ${lastError?.message || 'unknown error'}`
    );

}

function normalizeAskQuestion(question) {

    return String(question || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

}

function isBotCreatorQuestion(question) {

    const normalizedQuestion = normalizeAskQuestion(question);

    if (!normalizedQuestion) return false;

    const creatorTerms = [
        'created',
        'made',
        'built',
        'coded',
        'programmed',
        'developed',
        'designed',
        'creator',
        'owner',
        'owns'
    ];

    const botTerms = [
        'you',
        'your',
        'yourself',
        'bot',
        'discord bot',
        'ovf helper'
    ];

    return (
        normalizedQuestion.includes('who') &&
        creatorTerms.some(term => normalizedQuestion.includes(term)) &&
        botTerms.some(term => normalizedQuestion.includes(term))
    );

}

async function sendAskResponse(message, question) {

    if (!question || !question.trim()) {
        return message.reply('⚠️ Ask a question. Example: `!ask how do I make a Discord bot?`');
    }

    if (isBotCreatorQuestion(question)) {
        return message.reply('🤖 The creator of this Discord bot is **Bqbblz**.');
    }

    if (!GEMINI_API_KEY) {
        return message.reply('❌ AI is not set up yet. Add `GEMINI_API_KEY` to your Pella environment variables and restart the bot.');
    }

    const thinkingMessage = await message.reply('🤖 Thinking...');

    try {

        const answer = await askGemini(
            question.trim(),
            message.author.username
        );

        const chunks = chunkText(answer, 1800);

        if (chunks.length === 0) {
            return thinkingMessage.edit('❌ AI returned an empty response.');
        }

        await thinkingMessage.edit(`🤖 **AI Response:**\n${chunks[0]}`);

        for (const chunk of chunks.slice(1)) {
            await message.channel.send(chunk);
        }

    } catch (error) {

        console.error('Gemini ask command error:', error);

        await thinkingMessage.edit(
            `❌ AI request failed: ${truncateText(error.message, 300)}`
        ).catch(() => {});

    }

}

function truncateText(text, max = 1000) {

    if (!text) return 'No text content.';

    if (text.length <= max) return text;

    return `${text.slice(0, max)}...`;

}

function chunkText(text, maxLength = 3500) {

    const chunks = [];
    let current = '';

    for (const line of text.split('\n')) {

        if ((current + line + '\n').length > maxLength) {
            chunks.push(current);
            current = '';
        }

        current += line + '\n';

    }

    if (current.trim().length > 0) {
        chunks.push(current);
    }

    return chunks;

}

function parseMessageLogAmount(args) {

    const joined = args.join(' ');
    const match = joined.match(/\d+/);

    if (!match) return null;

    return parseInt(match[0]);

}

async function fetchRecentMessages(channel, amount, excludeMessageId) {

    const collected = [];
    let lastMessageId = null;

    while (collected.length < amount) {

        const remaining = amount - collected.length;

        const fetchOptions = {
            limit: Math.min(remaining + 1, 100)
        };

        if (lastMessageId) {
            fetchOptions.before = lastMessageId;
        }

        const fetched = await channel.messages.fetch(fetchOptions);

        if (fetched.size === 0) break;

        const messages = [...fetched.values()]
            .filter(msg => msg.id !== excludeMessageId);

        collected.push(...messages);

        lastMessageId = fetched.last()?.id;

        if (!lastMessageId) break;

    }

    return collected
        .slice(0, amount)
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

}

function formatDuration(ms) {

    if (!ms || isNaN(ms)) return 'Unknown';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;

}

function isUrl(text) {
    return /^https?:\/\//i.test(text);
}

function hasSearchPrefix(text) {

    const lower = text.toLowerCase();

    return (
        lower.startsWith('ytsearch:') ||
        lower.startsWith('ytmsearch:') ||
        lower.startsWith('scsearch:') ||
        lower.startsWith('spsearch:') ||
        lower.startsWith('dzsearch:') ||
        lower.startsWith('amsearch:')
    );

}

function getIdealNode() {

    const node = shoukaku.options.nodeResolver(shoukaku.nodes);

    if (!node) {
        throw new Error('No Lavalink node is currently connected.');
    }

    return node;

}

function getMusicQueue(guildId) {

    if (!musicQueues.has(guildId)) {

        musicQueues.set(guildId, {
            player: null,
            textChannel: null,
            voiceChannel: null,
            songs: [],
            currentSong: null,
            playing: false,
            stopped: false,
            volume: 50
        });

    }

    return musicQueues.get(guildId);

}

function extractTracks(result) {

    if (!result) {
        return {
            tracks: [],
            playlistName: null
        };
    }

    if (Array.isArray(result.tracks)) {
        return {
            tracks: result.tracks,
            playlistName: result.playlistInfo?.name || null
        };
    }

    if (result.loadType === 'track' && result.data) {
        return {
            tracks: [result.data],
            playlistName: null
        };
    }

    if (result.loadType === 'playlist' && result.data?.tracks) {
        return {
            tracks: result.data.tracks,
            playlistName: result.data.info?.name || 'Playlist'
        };
    }

    if (result.loadType === 'search' && Array.isArray(result.data)) {
        return {
            tracks: result.data,
            playlistName: null
        };
    }

    return {
        tracks: [],
        playlistName: null
    };

}

function makeSong(track, requestedBy) {

    const info = track.info || {};

    return {
        encoded: track.encoded || track.track,
        title: info.title || track.title || 'Unknown title',
        uri: info.uri || info.url || '',
        author: info.author || 'Unknown artist',
        length: info.length || info.duration || 0,
        requestedBy
    };

}

async function searchLavalink(query, requestedBy) {

    const node = getIdealNode();

    let searchQuery = query;

    if (!isUrl(query) && !hasSearchPrefix(query)) {
        searchQuery = `ytsearch:${query}`;
    }

    const result = await node.rest.resolve(searchQuery);

    const { tracks, playlistName } = extractTracks(result);

    if (!tracks.length) {
        throw new Error('No tracks found.');
    }

    const songs = tracks
        .map(track => makeSong(track, requestedBy))
        .filter(song => song.encoded);

    if (!songs.length) {
        throw new Error('No playable tracks found.');
    }

    return {
        songs,
        playlistName
    };

}

function setupPlayerEvents(queue, guildId) {

    if (!queue.player) return;

    queue.player.on('start', () => {
        queue.playing = true;
    });

    queue.player.on('end', async (event) => {

        if (event.reason === 'replaced') return;

        if (queue.stopped) {
            queue.stopped = false;
            queue.playing = false;
            queue.currentSong = null;
            return;
        }

        queue.playing = false;
        queue.currentSong = null;

        playNextLavalink(guildId);

    });

    queue.player.on('exception', async (event) => {

        console.error('Lavalink track exception:', event);

        if (queue.textChannel) {
            queue.textChannel.send('❌ Track failed. Skipping to the next song.').catch(() => {});
        }

        queue.playing = false;
        queue.currentSong = null;

        playNextLavalink(guildId);

    });

    queue.player.on('stuck', async (event) => {

        console.error('Lavalink track stuck:', event);

        if (queue.textChannel) {
            queue.textChannel.send('⚠️ Track got stuck. Skipping to the next song.').catch(() => {});
        }

        queue.playing = false;
        queue.currentSong = null;

        playNextLavalink(guildId);

    });

    queue.player.on('closed', async (event) => {

        console.warn('Lavalink voice websocket closed:', event);

        queue.playing = false;

    });

}

async function ensureLavalinkPlayer(message, voiceChannel) {

    const queue = getMusicQueue(message.guild.id);

    queue.textChannel = message.channel;
    queue.voiceChannel = voiceChannel;

    if (!queue.player) {

        queue.player = await shoukaku.joinVoiceChannel({
            guildId: message.guild.id,
            channelId: voiceChannel.id,
            shardId: message.guild.shardId ?? 0
        });

        setupPlayerEvents(queue, message.guild.id);

    }

    return queue;

}

async function playNextLavalink(guildId) {

    const queue = musicQueues.get(guildId);

    if (!queue || !queue.player) return;

    const nextSong = queue.songs.shift();

    if (!nextSong) {

        queue.currentSong = null;
        queue.playing = false;

        if (queue.textChannel) {
            queue.textChannel.send('✅ Music queue finished.').catch(() => {});
        }

        return;

    }

    try {

        queue.currentSong = nextSong;
        queue.playing = true;

        await queue.player.playTrack({
            track: {
                encoded: nextSong.encoded
            }
        });

        await queue.player.setGlobalVolume(queue.volume);

        if (queue.textChannel) {

            const embed = new EmbedBuilder()
                .setColor('#1DB954')
                .setTitle('🎶 Now Playing')
                .setDescription(nextSong.uri ? `[${nextSong.title}](${nextSong.uri})` : nextSong.title)
                .addFields(
                    {
                        name: 'Artist',
                        value: `${nextSong.author}`,
                        inline: true
                    },
                    {
                        name: 'Duration',
                        value: `${formatDuration(nextSong.length)}`,
                        inline: true
                    },
                    {
                        name: 'Requested By',
                        value: `${nextSong.requestedBy}`,
                        inline: true
                    }
                )
                .setTimestamp();

            queue.textChannel.send({
                embeds: [embed]
            }).catch(() => {});

        }

    } catch (error) {

        console.error('Failed to play Lavalink track:', error);

        queue.currentSong = null;
        queue.playing = false;

        if (queue.textChannel) {
            queue.textChannel.send('❌ Failed to play that track. Skipping to the next song.').catch(() => {});
        }

        playNextLavalink(guildId);

    }

}

async function logCommand(message) {

    if (!message.guild || !message.content.startsWith('!')) return;

    const logChannel = getLogChannel(message.guild);

    if (!logChannel) return;

    const commandEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⚡ Command Used')
        .addFields(
            {
                name: 'User',
                value: `${message.author.tag}`,
                inline: true
            },
            {
                name: 'User ID',
                value: `${message.author.id}`,
                inline: true
            },
            {
                name: 'Channel',
                value: `${message.channel}`,
                inline: true
            },
            {
                name: 'Command',
                value: `\`${truncateText(message.content, 1000)}\``
            }
        )
        .setTimestamp();

        logChannel.send({
        embeds: [commandEmbed]
    }).catch(() => {});

}

// ==========================================
// MEMBER JOIN EVENT
// ==========================================

client.on('guildMemberAdd', async (member) => {

    try {

        const role = member.guild.roles.cache.get(AUTO_ROLE_ID);

        if (role) {
            await member.roles.add(role);
        }

        const newInvites = await member.guild.invites.fetch();
        const oldInvites = inviteCache.get(member.guild.id);

        const usedInvite = newInvites.find(invite => {

            const previousUses = oldInvites?.get(invite.code) || 0;

            return invite.uses > previousUses;

        });

        inviteCache.set(
            member.guild.id,
            new Map(newInvites.map(invite => [
                invite.code,
                invite.uses
            ]))
        );

        if (usedInvite?.inviter) {

            const inviterId = usedInvite.inviter.id;

            if (!inviteStats.has(inviterId)) {
                inviteStats.set(inviterId, 0);
            }

            inviteStats.set(
                inviterId,
                inviteStats.get(inviterId) + 1
            );

        }

        const channel = member.guild.systemChannel;

        if (channel) {

            if (usedInvite?.inviter) {

                await channel.send(
                    `📨 ${member.user.tag} joined using invite \`${usedInvite.code}\` from <@${usedInvite.inviter.id}>`
                );

            } else {

                await channel.send(
                    `📨 ${member.user.tag} joined the server.`
                );

            }

        }

        const logChannel = getLogChannel(member.guild);

        if (logChannel) {

            const inviteText = usedInvite?.inviter
                ? `\nInvite: \`${usedInvite.code}\`\nInviter: <@${usedInvite.inviter.id}>`
                : '';

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📥 Member Joined')
                .setDescription(`${member.user.tag} joined the server.${inviteText}`)
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            logChannel.send({
                embeds: [embed]
            });

        }

    } catch (error) {

        console.error('Invite tracker error:', error);

    }

});

// ==========================================
// MEMBER LEAVE LOG
// ==========================================

client.on('guildMemberRemove', async (member) => {

    const logChannel = getLogChannel(member.guild);

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('📤 Member Left')
        .setDescription(`${member.user.tag} left the server.`)
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

    logChannel.send({
        embeds: [embed]
    });

});

// ==========================================
// MESSAGE DELETE LOG
// ==========================================

client.on('messageDelete', async (message) => {

    if (!message.guild) return;
    if (!message.author) return;
    if (message.author.bot) return;

    const logChannel = getLogChannel(message.guild);

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🗑️ Message Deleted')
        .addFields(
            {
                name: 'User',
                value: `${message.author.tag}`,
                inline: true
            },
            {
                name: 'Channel',
                value: `${message.channel}`,
                inline: true
            },
            {
                name: 'Content',
                value: truncateText(message.content)
            }
        )
        .setTimestamp();

    logChannel.send({
        embeds: [embed]
    });

});

// ==========================================
// MESSAGE EDIT LOG
// ==========================================

client.on('messageUpdate', async (oldMessage, newMessage) => {

    if (!oldMessage.guild) return;
    if (!oldMessage.author) return;
    if (oldMessage.author.bot) return;

    if (oldMessage.content === newMessage.content) return;

    const logChannel = getLogChannel(oldMessage.guild);

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('✏️ Message Edited')
        .addFields(
            {
                name: 'User',
                value: `${oldMessage.author.tag}`,
                inline: true
            },
            {
                name: 'Channel',
                value: `${oldMessage.channel}`,
                inline: true
            },
            {
                name: 'Before',
                value: truncateText(oldMessage.content)
            },
            {
                name: 'After',
                value: truncateText(newMessage.content)
            }
        )
        .setTimestamp();

    logChannel.send({
        embeds: [embed]
    });

});

// ==========================================
// VOICE CHANNEL LOGS
// ==========================================

client.on('voiceStateUpdate', async (oldState, newState) => {

    const member = newState.member || oldState.member;

    if (!member) return;

    const logChannel = getLogChannel(member.guild);

    if (!logChannel) return;

    if (!oldState.channel && newState.channel) {

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🔊 Voice Channel Joined')
            .setDescription(`${member.user.tag} joined ${newState.channel}`)
            .setTimestamp();

        return logChannel.send({
            embeds: [embed]
        });

    }

    if (oldState.channel && !newState.channel) {

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔇 Voice Channel Left')
            .setDescription(`${member.user.tag} left ${oldState.channel}`)
            .setTimestamp();

        return logChannel.send({
            embeds: [embed]
        });

    }

    if (
        oldState.channel &&
        newState.channel &&
        oldState.channel.id !== newState.channel.id
    ) {

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('🔄 Voice Channel Moved')
            .setDescription(`${member.user.tag} moved from ${oldState.channel} to ${newState.channel}`)
            .setTimestamp();

        return logChannel.send({
            embeds: [embed]
        });

    }

});

// ==========================================
// MESSAGE COMMANDS
// ==========================================

client.on('messageCreate', async (message) => {

    if (message.author.bot || message.webhookId) return;
    if (!message.guild) return;

    await logCommand(message);

    const args = message.content.trim().split(/ +/);
    const command = args.shift()?.toLowerCase();
    // ==========================================
    // VRCHAT COMMUNITY INFO COMMAND
    // ==========================================

    if (command === '!vrchat' || command === '!vrc') {

        await message.channel.send(
`# ${VRCHAT_SERVER_NAME}
# Welcome!

Looking for a chill VRChat group where you can relax, meet new people, and enjoy events without pressure or strict roleplay expectations? OverFlow might be the place for you!

OverFlow is an 18+ VRChat community focused on socializing, entertainment, events, and creative expression. Whether you enjoy hanging out in voice chat, attending community events, sharing your creativity, or simply making new friends, we aim to provide a welcoming space where everyone can feel comfortable being themselves.

## What we offer:

- A relaxed and friendly 18+ community
- VRChat hangouts and social events
- Entertainment and creative spaces
- No roleplay jobs or strict activity requirements
- A place to meet people and be yourself

## Come join OverFlow and be part of a community built around comfort, creativity, and connection.

## Join us today!
[Discord](https://discord.gg/N5WvpFuYNF)
[VRC Group](https://vrchat.com/home/group/grp_38f88b33-f022-40b8-8acf-5264f5e710a2)`
        );

        return;
    }

    const askKey = `${message.guild.id}:${message.channel.id}:${message.author.id}`;

    if (pendingAskUsers.has(askKey) && command !== '!ask') {

        const pendingAsk = pendingAskUsers.get(askKey);
        pendingAskUsers.delete(askKey);

        if (!message.content.startsWith('!') && Date.now() - pendingAsk.createdAt <= 60 * 1000) {
            await sendAskResponse(message, message.content);
            return;
        }

    }

    // ==========================================
    // AI ASK COMMAND
    // ==========================================

    if (command === '!ask') {

        const question = args.join(' ').trim();

        if (!question) {

            pendingAskUsers.set(askKey, {
                createdAt: Date.now()
            });

            setTimeout(() => {
                const pendingAsk = pendingAskUsers.get(askKey);

                if (pendingAsk && Date.now() - pendingAsk.createdAt >= 60 * 1000) {
                    pendingAskUsers.delete(askKey);
                }
            }, 60 * 1000);

            await message.reply('🤖 I am listening. Send your question in your next message within **60 seconds**.');
            return;
        }

        await sendAskResponse(message, question);
        return;
    }

    // ==========================================
    // PING COMMAND
    // ==========================================

    if (command === '!ping') {

        const sentMessage = await message.reply('Pong!');
        const messageLatency = sentMessage.createdTimestamp - message.createdTimestamp;
        const websocketLatency = Math.round(client.ws.ping);

        await sentMessage.edit(`Pong! Bot ping: **${messageLatency}ms** | WebSocket: **${websocketLatency}ms**`);
        return;

    }

    // ==========================================
    // HELP COMMAND
    // ==========================================

    if (command === '!help') {

        const helpEmbed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('VRChat Community Command Directory')
            .setDescription('Commands for community info, invites, music, and moderation.')
            .addFields(
                {
                    name: '📘 Public Commands',
                    value:
`🔹 \`!help\` - Shows this command menu.
🔹 \`!ping\` - Shows bot ping.
🔹 \`!ask [question]\` - Ask the VRChat community bot a question.
🔹 \`!myinvites\` - Shows your invite count.
🔹 \`!invites [@user/userID]\` - Shows a user's invite count.
🔹 \`!leaderboard\` - Shows invite leaderboard.
🔹 \`!inviteinfo CODE\` - Shows invite code info.
🔹 \`!reactionrole #channel emoji @role message\` - Creates a reaction role message.
🔹 \`!reactionrole #channel message | emoji @role | emoji @role\` - Creates one message with multiple reaction roles.
🔹 \`!vrchat\` / \`!vrc\` - Shows VRChat community info.
🎫 \`!ticket [reason]\` - Opens a private support ticket.`
                },
                {
                    name: '🎫 Ticket Commands',
                    value:
`\`!ticketsetup [#channel]\` - Creates the open-ticket button panel.
\`!ticketconfig\` - Shows and edits ticket support/admin roles.
\`!close [reason]\` - Saves a transcript and closes the ticket.
\`!transcript [reason]\` - Sends a ticket transcript to logs.
\`!claim\` / \`!unclaim\` - Claims or releases a ticket.
\`!add @user\` / \`!remove @user\` - Adds or removes a user.
\`!rename name\` - Renames the ticket.
\`!escalate [reason]\` - Requests an admin.`
                },
                {
                    name: '🎉 Fun Commands',
                    value:
`🪙 \`!coinflip\` - Flips a coin.
🎲 \`!roll [sides]\` - Rolls dice.
🎱 \`!8ball [question]\` - Magic 8-ball.
✊ \`!rps rock/paper/scissors\` - Play RPS.
😂 \`!joke\` - Sends a random joke.
⭐ \`!compliment [@user/userID]\` - Compliments someone.
🔥 \`!roast [@user/userID]\` - Light friendly roast.
💯 \`!rate [thing]\` - Rates anything.
💖 \`!ship @user/userID @user/userID\` - Compatibility score.
🎯 \`!choose a | b | c\` - Picks an option.
🖼️ \`!avatar [@user/userID]\` - Shows avatar.
ℹ️ \`!userinfo [@user/userID]\` / \`!serverinfo\` - Info commands.`
                },
                {
                    name: '🛡️ Moderation Commands',
                    value:
`🔨 \`!ban @user/userID [reason]\` - Bans a member.
👢 \`!kick @user/userID [reason]\` - Kicks a member.
⏳ \`!timeout @user/userID [minutes]\` - Times out a member.
:key:  \`!setup-roles\` - Creates the verification button.
✅ \`!untimeout @user/userID\` - Removes timeout.
🔇 \`!mute @user/userID\` - Adds Muted role.
🔊 \`!unmute @user/userID\` - Removes Muted role.
🧹 \`!purge [amount]\` - Deletes messages.
🧹 \`!massdelete user_id\` - Deletes a user's messages across accessible channels.
⚠️ \`!warn @user/userID [reason]\` - Warns a member. 3 warnings = 1 hour timeout.
♻️ \`!resetwarns @user/userID\` - Resets a member's warning count.
📜 \`!log [amount] messages\` - Sends a chosen amount of recent messages to the bot logs channel.`
                },
                {
                    name: '🎵 Lavalink Music Commands',
                    value:
`▶️ \`!play song/link\` - Plays or queues music.
🔎 \`!play scsearch:song name\` - Searches SoundCloud/YouTube.
⏭️ \`!skip\` - Skips current song.
⏹️ \`!stop\` - Stops music and clears queue.
⏸️ \`!pause\` - Pauses music.
▶️ \`!resume\` - Resumes music.
📜 \`!queue\` - Shows music queue.
🎶 \`!nowplaying\` / \`!np\` - Shows current song.
🔊 \`!volume 1-100\` - Changes music volume.
🚪 \`!leave\` - Makes bot leave VC.`
                },
                {
                    name: '⚙️ Systems',
                    value:
`🤖 Invite Link Guard
🎭 Auto Roles
📨 Invite Tracking
🎉 Public Fun Commands
🎵 Lavalink Music Player
✅ Verification System`
                }
            )
            .setFooter({
                text: 'VRChat Community Bot made by Bqbblz',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [helpEmbed]
        });

        return;
    }

    // ==========================================
    // TICKET SYSTEM COMMANDS
    // ==========================================

    if (command === '!ticketsetup' || command === '!ticketpanel' || command === '!setup-ticket') {
        await handleTicketSetupCommand(message, args);
        return;
    }

    if (command === '!ticketconfig' || command === '!ticketsconfig') {
        await handleTicketConfigCommand(message, args);
        return;
    }

    if (command === '!ticket' || command === '!new' || command === '!openticket') {
        await handleTicketOpenCommand(message, args);
        return;
    }

    if (command === '!close' || command === '!ticketclose' || command === '!closeticket') {
        await handleTicketCloseCommand(message, args);
        return;
    }

    if (command === '!transcript' || command === '!tickettranscript') {
        await handleTicketTranscriptCommand(message, args);
        return;
    }

    if (command === '!claim') {
        await handleTicketClaimCommand(message, true);
        return;
    }

    if (command === '!unclaim') {
        await handleTicketClaimCommand(message, false);
        return;
    }

    if (command === '!add' || command === '!ticketadd') {
        const result = await addOrRemoveTicketUser(message, args, true);

        if (!result.ok) {
            await message.reply(result.message);
        }

        return;
    }

    if (command === '!remove' || command === '!ticketremove') {
        const result = await addOrRemoveTicketUser(message, args, false);

        if (!result.ok) {
            await message.reply(result.message);
        }

        return;
    }

    if (command === '!rename' || command === '!ticketrename') {
        await handleTicketRenameCommand(message, args);
        return;
    }

    if (command === '!escalate' || command === '!admin') {
        await handleTicketEscalateCommand(message, args);
        return;
    }

    // ==========================================
    // SETUP ROLES
    // ==========================================

    if (command === '!setup-roles') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Administrator permission required.');
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Verify!')
            .setDescription('Click the button below to verify and gain access.');

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('verify_role_button')
                .setLabel('Verify')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });

        return;
    }

    // ==========================================
    // REACTION ROLE COMMAND
    // ==========================================

    if (command === '!reactionrole' || command === '!rr' || command === '!reactionroles' || command === '!rrmulti') {

        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('❌ Administrator permission required.');
        }

        const parsedCommand = await parseReactionRoleCommand(message, args);

        if (parsedCommand.error) {
            return message.reply(parsedCommand.error);
        }

        const {
            channelArg,
            promptText,
            options
        } = parsedCommand;

        const targetChannel = resolveTextChannelFromArg(message, channelArg);

        if (!targetChannel) {
            return message.reply('❌ I could not find that text channel.');
        }

        const botMember = await getBotMember(message.guild);

        if (!botMember) {
            return message.reply('❌ I could not check my server permissions.');
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('❌ I need the **Manage Roles** permission to assign reaction roles.');
        }

        const unassignableRole = options.find(option =>
            !canBotAssignRole(botMember, message.guild, option.role)
        );

        if (unassignableRole) {
            return message.reply(`❌ I cannot assign ${unassignableRole.role.name}. Move my bot role above it in the role list.`);
        }

        const channelPermissions = targetChannel.permissionsFor(botMember);

        if (!channelPermissions?.has([
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.AddReactions,
            PermissionsBitField.Flags.ReadMessageHistory
        ])) {
            return message.reply('❌ I need View Channel, Send Messages, Add Reactions, and Read Message History in that channel.');
        }

        const hasMultipleOptions = options.length > 1;

        const reactionRoleEmbed = new EmbedBuilder()
            .setColor(hasMultipleOptions ? '#2B90D9' : options[0].role.color || '#2B90D9')
            .setTitle(hasMultipleOptions ? 'Choose Your Roles' : 'Choose Your Role')
            .setDescription(promptText)
            .setFooter({
                text: `Reaction role${hasMultipleOptions ? 's' : ''} created by ${message.author.tag}`
            })
            .setTimestamp();

        const roleMessage = await targetChannel.send({
            embeds: [reactionRoleEmbed],
            allowedMentions: {
                parse: []
            }
        });

        try {

            for (const option of options) {
                await roleMessage.react(option.emoji);
            }

        } catch (error) {

            await roleMessage.delete().catch(() => {});
            console.error('Failed to add reaction role emoji:', error);
            return message.reply('❌ I could not react with one of those emojis. Use normal emojis or custom emojis from this server.');

        }

        for (const option of options) {

            const mapping = {
                guildId: message.guild.id,
                channelId: targetChannel.id,
                messageId: roleMessage.id,
                emojiKey: option.emojiKey,
                emoji: option.emoji,
                roleId: option.role.id,
                prompt: promptText,
                createdBy: message.author.id,
                createdAt: new Date().toISOString()
            };

            reactionRoleMessages.set(
                getReactionRoleKey(mapping.guildId, mapping.messageId, mapping.emojiKey),
                mapping
            );

        }

        saveReactionRoleMessages();

        await message.reply(`✅ Reaction role message created in ${targetChannel} with **${options.length}** role option${hasMultipleOptions ? 's' : ''}.`);
        return;

    }

    // ==========================================
    // INVITE COMMANDS
    // ==========================================

    if (command === '!myinvites') {

        const invites = inviteStats.get(message.author.id) || 0;

        await message.channel.send(
            `📨 ${message.author.tag} has invited **${invites}** users.`
        );

        return;
    }

    if (command === '!invites') {

        const target = await resolveUserFromArgs(message, args) || message.author;

        const invites = inviteStats.get(target.id) || 0;

        await message.channel.send(
            `📨 ${target.tag} has invited **${invites}** users.`
        );

        return;
    }

    if (command === '!leaderboard') {

        const sorted = [...inviteStats.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (sorted.length === 0) {
            return message.channel.send('❌ No invite data yet.');
        }

        const leaderboard = sorted.map((entry, index) => {

            const user = client.users.cache.get(entry[0]);

            return `#${index + 1} - ${user ? user.tag : 'Unknown'} → ${entry[1]} invites`;

        }).join('\n');

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Invite Leaderboard')
            .setDescription(leaderboard);

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!inviteinfo') {

        const code = args[0];

        if (!code) {
            return message.reply('⚠️ Provide an invite code.');
        }

        try {

            const invite = await message.guild.invites.fetch(code);

            const embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setTitle('📨 Invite Information')
                .addFields(
                    {
                        name: 'Code',
                        value: invite.code,
                        inline: true
                    },
                    {
                        name: 'Uses',
                        value: `${invite.uses}`,
                        inline: true
                    },
                    {
                        name: 'Inviter',
                        value: invite.inviter ? `<@${invite.inviter.id}>` : 'Unknown',
                        inline: true
                    }
                );

            await message.channel.send({
                embeds: [embed]
            });

        } catch {

            message.reply('❌ Invalid invite code.');

        }

        return;
    }


    // ==========================================
    // FUN PUBLIC COMMANDS
    // ==========================================

    if (command === '!coinflip') {

        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';

        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🪙 Coin Flip')
            .setDescription(`The coin landed on **${result}**!`)
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!roll') {

        const sides = parseInt(args[0]) || 6;

        if (isNaN(sides) || sides < 2 || sides > 1000000) {
            return message.reply('⚠️ Usage: `!roll 6`. Choose sides between 2 and 1,000,000.');
        }

        const result = Math.floor(Math.random() * sides) + 1;

        await message.channel.send(`🎲 ${message.author} rolled **${result}** out of **${sides}**.`);

        return;
    }

    if (command === '!8ball') {

        const question = args.join(' ');

        if (!question) {
            return message.reply('⚠️ Ask a question. Example: `!8ball will I win?`');
        }

        const embed = new EmbedBuilder()
            .setColor('#8E44AD')
            .setTitle('🎱 Magic 8-Ball')
            .addFields(
                {
                    name: 'Question',
                    value: question
                },
                {
                    name: 'Answer',
                    value: getRandomItem(EIGHT_BALL_RESPONSES)
                }
            )
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!rps') {

        const userChoice = args[0]?.toLowerCase();
        const choices = ['rock', 'paper', 'scissors'];

        if (!choices.includes(userChoice)) {
            return message.reply('⚠️ Usage: `!rps rock`, `!rps paper`, or `!rps scissors`.');
        }

        const botChoice = getRandomItem(choices);

        let result = 'It is a tie!';

        if (
            (userChoice === 'rock' && botChoice === 'scissors') ||
            (userChoice === 'paper' && botChoice === 'rock') ||
            (userChoice === 'scissors' && botChoice === 'paper')
        ) {
            result = 'You win!';
        } else if (userChoice !== botChoice) {
            result = 'I win!';
        }

        await message.channel.send(
            `✊ **Rock Paper Scissors**\nYou picked **${userChoice}**.\nI picked **${botChoice}**.\n**${result}**`
        );

        return;
    }

    if (command === '!joke') {

        await message.channel.send(`😂 ${getRandomItem(JOKES)}`);

        return;
    }

    if (command === '!fact') {

        await message.channel.send(`🧠 Fun fact: **${getRandomItem(FUN_FACTS)}**`);

        return;
    }

    if (command === '!compliment') {

        const target = await resolveUserFromArgs(message, args) || message.author;

        await message.channel.send(`⭐ ${target} ${getRandomItem(COMPLIMENTS)}`);

        return;
    }

    if (command === '!roast') {

        const target = await resolveUserFromArgs(message, args) || message.author;

        await message.channel.send(`🔥 ${target} ${getRandomItem(ROASTS)}`);

        return;
    }

    if (command === '!rate') {

        const thing = args.join(' ') || message.author.username;
        const rating = Math.floor(Math.random() * 101);

        await message.channel.send(`💯 I rate **${thing}** a **${rating}/100**.`);

        return;
    }

    if (command === '!ship') {

        const mentionedUsers = await resolveUsersFromArgs(message, args, 2);

        let firstName;
        let secondName;

        if (mentionedUsers.length >= 2) {
            firstName = mentionedUsers[0].username;
            secondName = mentionedUsers[1].username;
        } else {

            const shipText = args.join(' ');
            const parts = shipText.split(/\s+/).filter(Boolean);

            if (parts.length < 2) {
                return message.reply('⚠️ Usage: `!ship @user/userID @user/userID` or `!ship name1 name2`.');
            }

            firstName = parts[0];
            secondName = parts.slice(1).join(' ');

        }

        const percent = simplePercentFromText(`${firstName.toLowerCase()}-${secondName.toLowerCase()}`);

        let ratingText = 'Could be interesting.';

        if (percent >= 80) {
            ratingText = 'Legendary match.';
        } else if (percent >= 60) {
            ratingText = 'Pretty good match.';
        } else if (percent >= 40) {
            ratingText = 'Maybe with some effort.';
        } else if (percent >= 20) {
            ratingText = 'The vibes are questionable.';
        } else {
            ratingText = 'Absolutely cursed combo.';
        }

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle('💖 Ship Meter')
            .setDescription(`**${firstName}** + **${secondName}** = **${percent}%**\n${ratingText}`)
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!choose') {

        const options = args.join(' ')
            .split('|')
            .map(option => option.trim())
            .filter(Boolean);

        if (options.length < 2) {
            return message.reply('⚠️ Usage: `!choose pizza | burgers | tacos`.');
        }

        await message.channel.send(`🎯 I choose: **${getRandomItem(options)}**`);

        return;
    }

    if (command === '!avatar') {

        const target = await resolveUserFromArgs(message, args) || message.author;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`🖼️ ${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({
                dynamic: true,
                size: 1024
            }))
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!userinfo') {

        const targetMember = await resolveMemberFromArgs(message, args) || message.member;

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('ℹ️ User Information')
            .setThumbnail(targetMember.user.displayAvatarURL({
                dynamic: true
            }))
            .addFields(
                {
                    name: 'User',
                    value: `${targetMember.user.tag}`,
                    inline: true
                },
                {
                    name: 'User ID',
                    value: `${targetMember.user.id}`,
                    inline: true
                },
                {
                    name: 'Account Created',
                    value: `<t:${Math.floor(targetMember.user.createdTimestamp / 1000)}:R>`,
                    inline: true
                },
                {
                    name: 'Joined Server',
                    value: targetMember.joinedTimestamp
                        ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`
                        : 'Unknown',
                    inline: true
                }
            )
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!serverinfo') {

        const guild = message.guild;

        const owner = await guild.fetchOwner().catch(() => null);

        const embed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('🌐 Server Information')
            .setThumbnail(guild.iconURL({
                dynamic: true
            }))
            .addFields(
                {
                    name: 'Server Name',
                    value: guild.name,
                    inline: true
                },
                {
                    name: 'Server ID',
                    value: guild.id,
                    inline: true
                },
                {
                    name: 'Owner',
                    value: owner ? `${owner.user.tag}` : 'Unknown',
                    inline: true
                },
                {
                    name: 'Members',
                    value: `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: 'Channels',
                    value: `${guild.channels.cache.size}`,
                    inline: true
                },
                {
                    name: 'Roles',
                    value: `${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: 'Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                    inline: true
                }
            )
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    // ==========================================
    // MANUAL MESSAGE LOG COMMAND
    // ==========================================

    if (command === '!log') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const amount = parseMessageLogAmount(args);

        if (!amount || amount < 1 || amount > 500) {
            return message.reply('⚠️ Usage: `!log 25 messages` or `!log 25`. Choose between 1 and 500.');
        }

        const logChannel = getLogChannel(message.guild);

        if (!logChannel) {
            return message.reply('❌ Log channel not found. Check `LOG_CHANNEL_ID` in your config.');
        }

        try {

            const messagesToLog = await fetchRecentMessages(
                message.channel,
                amount,
                message.id
            );

            if (messagesToLog.length === 0) {
                return message.reply('❌ No messages found to log.');
            }

            const logText = messagesToLog.map(msg => {

                const time = new Date(msg.createdTimestamp).toLocaleString();
                const content = msg.content || '[No text content]';

                const attachments = msg.attachments.size > 0
                    ? ` | Attachments: ${msg.attachments.map(att => att.url).join(', ')}`
                    : '';

                return `[${time}] #${message.channel.name} | ${msg.author.tag}: ${content}${attachments}`;

            }).join('\n');

            const chunks = chunkText(logText, 3500);

            for (let i = 0; i < chunks.length; i++) {

                const embed = new EmbedBuilder()
                    .setColor('#9B59B6')
                    .setTitle(`📜 Manual Message Log ${chunks.length > 1 ? `Part ${i + 1}/${chunks.length}` : ''}`)
                    .setDescription(
                        `Logged by ${message.author} from ${message.channel}\nRequested amount: **${amount}**\nLogged amount: **${messagesToLog.length}**\n\n\`\`\`\n${chunks[i]}\n\`\`\``
                    )
                    .setTimestamp();

                await logChannel.send({
                    embeds: [embed]
                });

            }

            await message.reply(
                `✅ Sent **${messagesToLog.length}** message(s) from ${message.channel} to the logs channel.`
            );

        } catch (error) {

            console.error('Manual log command error:', error);

            message.reply('❌ Failed to create message log.');

        }

        return;
    }

    // ==========================================
    // LAVALINK MUSIC COMMANDS
    // ==========================================

    if (command === '!play') {

        const query = args.join(' ');

        if (!query) {
            return message.reply('⚠️ Usage: `!play song name or link`');
        }

        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ You need to be in a voice channel first.');
        }

        const permissions = voiceChannel.permissionsFor(message.client.user);

        if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
            return message.reply('❌ I need permission to join and speak in your voice channel.');
        }

        try {

            const queue = await ensureLavalinkPlayer(message, voiceChannel);

            const search = await searchLavalink(query, message.author.toString());

            if (search.playlistName && search.songs.length > 1) {

                queue.songs.push(...search.songs);

                const embed = new EmbedBuilder()
                    .setColor('#1DB954')
                    .setTitle('📜 Playlist Added')
                    .setDescription(`Added **${search.songs.length}** tracks from **${search.playlistName}**.`)
                    .setTimestamp();

                await message.channel.send({
                    embeds: [embed]
                });

            } else {

                const song = search.songs[0];

                queue.songs.push(song);

                const embed = new EmbedBuilder()
                    .setColor('#1DB954')
                    .setTitle('🎵 Added to Queue')
                    .setDescription(song.uri ? `[${song.title}](${song.uri})` : song.title)
                    .addFields(
                        {
                            name: 'Artist',
                            value: `${song.author}`,
                            inline: true
                        },
                        {
                            name: 'Duration',
                            value: `${formatDuration(song.length)}`,
                            inline: true
                        },
                        {
                            name: 'Position',
                            value: `${queue.songs.length}`,
                            inline: true
                        }
                    )
                    .setTimestamp();

                await message.channel.send({
                    embeds: [embed]
                });

            }

            if (!queue.playing && !queue.currentSong) {
                playNextLavalink(message.guild.id);
            }

        } catch (error) {

            console.error('Lavalink play error:', error);

            message.reply(
                '❌ I could not play that. Check your Lavalink host/password, or try `!play scsearch:song name` if your Lavalink supports SoundCloud.'
            );

        }

        return;
    }

    if (command === '!skip') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.player || !queue.currentSong) {
            return message.reply('❌ Nothing is currently playing.');
        }

        try {

            await queue.player.stopTrack();

            await message.channel.send('⏭️ Skipped the current song.');

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to skip.');

        }

        return;
    }

    if (command === '!stop') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.player) {
            return message.reply('❌ Nothing is currently playing.');
        }

        try {

            queue.stopped = true;
            queue.songs = [];
            queue.currentSong = null;
            queue.playing = false;

            await queue.player.stopTrack();

            await message.channel.send('⏹️ Music stopped and queue cleared.');

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to stop music.');

        }

        return;
    }

    if (command === '!pause') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.player || !queue.currentSong) {
            return message.reply('❌ Nothing is currently playing.');
        }

        try {

            await queue.player.setPaused(true);

            await message.channel.send('⏸️ Music paused.');

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to pause music.');

        }

        return;
    }

    if (command === '!resume') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.player || !queue.currentSong) {
            return message.reply('❌ Nothing is currently playing.');
        }

        try {

            await queue.player.setPaused(false);

            await message.channel.send('▶️ Music resumed.');

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to resume music.');

        }

        return;
    }

    if (command === '!queue') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
            return message.reply('❌ The queue is empty.');
        }

        const current = queue.currentSong
            ? `🎶 Now Playing: ${queue.currentSong.uri ? `[${queue.currentSong.title}](${queue.currentSong.uri})` : queue.currentSong.title}`
            : 'Nothing currently playing.';

        const upcoming = queue.songs.length > 0
            ? queue.songs
                .slice(0, 10)
                .map((song, index) => `${index + 1}. ${song.uri ? `[${song.title}](${song.uri})` : song.title}`)
                .join('\n')
            : 'No upcoming songs.';

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('📜 Music Queue')
            .setDescription(`${current}\n\n**Upcoming:**\n${upcoming}`)
            .setFooter({
                text: `Total upcoming songs: ${queue.songs.length}`
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!nowplaying' || command === '!np') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.currentSong) {
            return message.reply('❌ Nothing is currently playing.');
        }

        const song = queue.currentSong;

        const embed = new EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('🎶 Now Playing')
            .setDescription(song.uri ? `[${song.title}](${song.uri})` : song.title)
            .addFields(
                {
                    name: 'Artist',
                    value: `${song.author}`,
                    inline: true
                },
                {
                    name: 'Duration',
                    value: `${formatDuration(song.length)}`,
                    inline: true
                },
                {
                    name: 'Requested By',
                    value: `${song.requestedBy}`,
                    inline: true
                }
            )
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        return;
    }

    if (command === '!volume') {

        const queue = musicQueues.get(message.guild.id);

        if (!queue || !queue.player) {
            return message.reply('❌ Nothing is currently playing.');
        }

        const volume = parseInt(args[0]);

        if (isNaN(volume) || volume < 1 || volume > 100) {
            return message.reply('⚠️ Usage: `!volume 1-100`');
        }

        try {

            queue.volume = volume;

            await queue.player.setGlobalVolume(volume);

            await message.channel.send(`🔊 Volume set to **${volume}%**.`);

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to change volume.');

        }

        return;
    }

    if (command === '!leave') {

        const queue = musicQueues.get(message.guild.id);

        try {

            if (queue) {
                queue.stopped = true;
                queue.songs = [];
                queue.currentSong = null;
                queue.playing = false;
            }

            await shoukaku.leaveVoiceChannel(message.guild.id);

            musicQueues.delete(message.guild.id);

            await message.channel.send('🚪 Left the voice channel.');

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to leave the voice channel.');

        }

        return;
    }

    // ==========================================
    // MODERATION COMMANDS
    // ==========================================

    if (command === '!warn') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Usage: `!warn @user/userID [reason]`');
        }

        if (target.user.bot) {
            return message.reply('⚠️ You cannot warn bots.');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided.';

        try {

            await message.delete().catch(() => {});

            await warnMember(
                target,
                message.author,
                reason,
                message.channel
            );

        } catch (error) {

            console.error('Warn command error:', error);

            message.reply('❌ Failed to warn user.');

        }

        return;
    }

    if (command === '!resetwarns' || command === '!resetwarnings') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Usage: `!resetwarns @user/userID`');
        }

        resetWarnings(target);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('♻️ Warnings Reset')
            .setDescription(`${target} now has **0/${AUTO_WARN_LIMIT}** warnings.`)
            .addFields(
                {
                    name: 'Reset By',
                    value: `${message.author.tag}`,
                    inline: true
                },
                {
                    name: 'User',
                    value: `${target.user.tag} (${target.id})`,
                    inline: true
                }
            )
            .setTimestamp();

        await message.channel.send({
            embeds: [embed]
        });

        const logChannel = getLogChannel(message.guild);

        if (logChannel) {

            const logEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('♻️ Warnings Reset')
                .addFields(
                    {
                        name: 'User',
                        value: `${target.user.tag} (${target.id})`,
                        inline: false
                    },
                    {
                        name: 'Reset By',
                        value: `${message.author.tag} (${message.author.id})`,
                        inline: false
                    },
                    {
                        name: 'Channel',
                        value: `${message.channel}`,
                        inline: true
                    }
                )
                .setTimestamp();

            logChannel.send({
                embeds: [logEmbed]
            }).catch(() => {});

        }

        return;
    }

    if (command === '!ban') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);
        const targetUserId = target?.id || getUserIdFromArg(args[0]);
        const targetUser = target?.user || await resolveUserFromArgs(message, args);

        if (!targetUserId) {
            return message.reply('⚠️ Mention a user or provide a user ID.');
        }

        if (target && !target.bannable) {
            return message.reply('❌ I cannot ban this user. They may have a higher role than me.');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {

            if (target) {

                await target.ban({
                    reason
                });

            } else {

                await message.guild.bans.create(targetUserId, {
                    reason
                });

            }

            await message.channel.send(
                `🔨 ${targetUser?.tag || targetUserId} was banned.\nReason: ${reason}`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to ban user.');

        }

        return;
    }

    if (command === '!kick') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Mention a user or provide a user ID.');
        }

        if (!target.kickable) {
            return message.reply('❌ I cannot kick this user. They may have a higher role than me.');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {

            await target.kick(reason);

            await message.channel.send(
                `👢 ${target.user.tag} was kicked.\nReason: ${reason}`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to kick user.');

        }

        return;
    }

    if (command === '!timeout') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);
        const minutes = parseInt(args[1]);

        if (!target || isNaN(minutes)) {
            return message.reply('⚠️ Usage: `!timeout @user/userID 10`');
        }

        try {

            await target.timeout(minutes * 60 * 1000);

            await message.channel.send(
                `⏳ ${target.user.tag} timed out for ${minutes} minute(s).`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to timeout user.');

        }

        return;
    }

    if (command === '!untimeout') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Mention a user or provide a user ID.');
        }

        try {

            await target.timeout(null);

            await message.channel.send(
                `✅ Removed timeout from ${target.user.tag}`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to remove timeout.');

        }

        return;
    }

    if (command === '!mute') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Mention a user or provide a user ID.');
        }

        let muteRole = message.guild.roles.cache.find(
            role => role.name.toLowerCase() === 'muted'
        );

        try {

            if (!muteRole) {

                muteRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#555555'
                });

                message.guild.channels.cache.forEach(async (channel) => {

                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false
                    }).catch(() => {});

                });

            }

            await target.roles.add(muteRole);

            await message.channel.send(
                `🔇 ${target.user.tag} has been muted.`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to mute user.');

        }

        return;
    }

    if (command === '!unmute') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const target = await resolveMemberFromArgs(message, args);

        if (!target) {
            return message.reply('⚠️ Mention a user or provide a user ID.');
        }

        const muteRole = message.guild.roles.cache.find(
            role => role.name.toLowerCase() === 'muted'
        );

        if (!muteRole) {
            return message.reply('⚠️ No muted role exists.');
        }

        try {

            await target.roles.remove(muteRole);

            await message.channel.send(
                `🔊 ${target.user.tag} has been unmuted.`
            );

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to unmute user.');

        }

        return;
    }

    if (command === '!purge') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const amount = parseInt(args[0]);

        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('⚠️ Choose a number between 1-100.');
        }

        try {

            await message.channel.bulkDelete(amount, true);

            const msg = await message.channel.send(
                `🧹 Deleted ${amount} messages.`
            );

            setTimeout(() => {
                msg.delete().catch(() => {});
            }, 3000);

        } catch (error) {

            console.error(error);

            message.reply('❌ Failed to purge messages.');

        }

        return;
    }

    if (command === '!massdelete') {

        if (!hasModAccess(message.member)) {
            return message.reply('❌ No permission.');
        }

        const targetUserId = getUserIdFromArg(args[0]);

        if (!targetUserId) {
            return message.reply('⚠️ Usage: `!massdelete user_id`');
        }

        const targetUser = await resolveUserFromArg(message, args[0]);
        const targetLabel = targetUser
            ? `${targetUser.tag} (${targetUser.id})`
            : targetUserId;
        const botMember = message.guild.members.me ||
            await message.guild.members.fetchMe().catch(() => null);

        if (!botMember) {
            return message.reply('❌ I could not check my server permissions.');
        }

        const stats = {
            totalChannels: 0,
            channelsScanned: 0,
            channelsSkipped: 0,
            channelErrors: 0,
            messagesChecked: 0,
            messagesDeleted: 0
        };

        const statusMessage = await message.channel.send(
            `Starting mass delete for ${targetLabel}. This may take a while.`
        );

        try {

            const channels = await collectMassDeleteChannels(message.guild, botMember, stats);
            stats.totalChannels = channels.length;

            if (!channels.length) {

                await statusMessage.edit(
                    '⚠️ I could not access any text channels with Manage Messages and Read Message History.'
                );

                return;

            }

            let lastStatusUpdate = Date.now();

            for (const channel of channels) {

                stats.channelsScanned++;

                try {

                    let before;

                    while (true) {

                        const fetchedMessages = await channel.messages.fetch({
                            limit: MASS_DELETE_PAGE_SIZE,
                            before
                        });

                        if (!fetchedMessages.size) break;

                        before = fetchedMessages.last()?.id;
                        stats.messagesChecked += fetchedMessages.size;
                        stats.messagesDeleted += await deleteTargetMessagesFromBatch(
                            channel,
                            fetchedMessages,
                            targetUserId
                        );

                        if (Date.now() - lastStatusUpdate >= MASS_DELETE_STATUS_INTERVAL_MS) {

                            lastStatusUpdate = Date.now();

                            await statusMessage.edit(
                                formatMassDeleteStatus(targetLabel, stats)
                            ).catch(() => {});

                        }

                        if (fetchedMessages.size < MASS_DELETE_PAGE_SIZE || !before) break;

                    }

                } catch (error) {

                    stats.channelErrors++;
                    console.error(`Mass delete failed in ${channel.id}:`, error);

                }

            }

            await statusMessage.edit(
                formatMassDeleteStatus(targetLabel, stats, true)
            ).catch(() => {});

            const logChannel = getLogChannel(message.guild);

            if (logChannel) {

                const logEmbed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('Mass Delete Completed')
                    .addFields(
                        {
                            name: 'Target',
                            value: targetLabel,
                            inline: false
                        },
                        {
                            name: 'Deleted',
                            value: `${stats.messagesDeleted} messages`,
                            inline: true
                        },
                        {
                            name: 'Moderator',
                            value: `${message.author.tag} (${message.author.id})`,
                            inline: false
                        }
                    )
                    .setTimestamp();

                logChannel.send({
                    embeds: [logEmbed]
                }).catch(() => {});

            }

        } catch (error) {

            console.error('Mass delete command failed:', error);

            await statusMessage.edit('❌ Mass delete failed. Check the console for details.')
                .catch(() => {});

        }

        return;
    }
    // ==========================================
    // INVITE LINK GUARD
    // ==========================================

    if (message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

    const contentLower = message.content.toLowerCase();
    const hasDiscordInvite =
        contentLower.includes('discord.gg/') ||
        contentLower.includes('://discord.com');

    if (hasDiscordInvite) {

        try {

            await message.delete();

            await warnMember(
                message.member,
                client.user,
                'Unauthorized Discord invite link.',
                message.channel,
                message.content
            );

        } catch (error) {

            console.error('Invite guard warn error:', error);

        }

    }

});

// ==========================================
// REACTION ROLE HANDLERS
// ==========================================

client.on('messageReactionAdd', async (reaction, user) => {
    await handleReactionRole(reaction, user, true);
});

client.on('messageReactionRemove', async (reaction, user) => {
    await handleReactionRole(reaction, user, false);
});

// ==========================================
// BUTTON ROLE HANDLER
// ==========================================

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('ticket_')) {
        await handleTicketButtonInteraction(interaction);
        return;
    }

    if (interaction.customId === 'verify_role_button') {

        const role = interaction.guild.roles.cache.get(REACTION_ROLE_ID);
        const defaultRole = interaction.guild.roles.cache.get(AUTO_ROLE_ID);

        if (!role) {
            return interaction.reply({
                content: '❌ Role configuration issue.',
                ephemeral: true
            });
        }

        const member = interaction.member;

        try {

            if (member.roles.cache.has(REACTION_ROLE_ID)) {

                await member.roles.remove(role);

                await interaction.reply({
                    content: `Removed ${role.name} role.`,
                    ephemeral: true
                });

            } else {

                const hadDefaultRole = member.roles.cache.has(AUTO_ROLE_ID);

                await member.roles.add(role);

                if (hadDefaultRole) {
                    await member.roles.remove(defaultRole || AUTO_ROLE_ID);
                }

                await interaction.reply({
                    content: hadDefaultRole
                        ? `Granted ${role.name} role and removed ${defaultRole?.name || 'default'} role.`
                        : `Granted ${role.name} role.`,
                    ephemeral: true
                });

            }

        } catch {

            await interaction.reply({
                content: '❌ Role assignment failed.',
                ephemeral: true
            });

        }

    }

});

// ==========================================
// LOGIN
// ==========================================

client.login(TOKEN);
