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
    ApplicationCommandOptionType,
    ActivityType,
    Partials
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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
const VRC_VERIFY_CONFIG_FILE = path.join(process.cwd(), 'vrc-verifier-config.json');
const VRC_VERIFY_STORE_FILE = path.join(process.cwd(), 'vrc-verifications.json');
const VRC_VERIFY_CODE_TTL_MS = 30 * 60 * 1000;
const VRC_VERIFY_CODE_PREFIX = 'OVF-';
const DEFAULT_VRC_VERIFIED_ROLE_ID = process.env.VRC_VERIFIED_ROLE_ID || REACTION_ROLE_ID;
const APP_CONFIG_FILE = path.join(process.cwd(), 'community-config.json');
const STAFF_NOTES_FILE = path.join(process.cwd(), 'staff-notes.json');
const VRCHAT_EVENTS_FILE = path.join(process.cwd(), 'vrchat-events.json');
const CASES_FILE = path.join(process.cwd(), 'cases.json');
const TEMP_ROLES_FILE = path.join(process.cwd(), 'temp-roles.json');
const GIVEAWAYS_FILE = path.join(process.cwd(), 'giveaways.json');
const POLLS_FILE = path.join(process.cwd(), 'polls.json');
const XP_FILE = path.join(process.cwd(), 'xp.json');
const SUGGESTIONS_FILE = path.join(process.cwd(), 'suggestions.json');
const WAIFU_GAME_FILE = path.join(process.cwd(), 'waifu-game.json');
const WAIFU_IMAGE_DIR = path.join(process.cwd(), 'waifu-images');
const WAIFU_SOURCE_IMAGE_DIR = process.env.WAIFU_SOURCE_IMAGE_DIR ||
    process.env.WAIFU_PULL_IMAGE_DIR ||
    path.join(process.cwd(), 'waifu-pull-images');
const WAIFU_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const XP_PER_TRACKED_MESSAGE = Math.max(
    1,
    Number.parseInt(process.env.XP_PER_TRACKED_MESSAGE || '20', 10) || 20
);
const XP_HISTORY_PAGE_SIZE = 100;
const XP_HISTORY_STATUS_INTERVAL_MS = 10 * 1000;
const TOP_LEVELS_PAGE_SIZE = 10;
const WAIFU_DAILY_AMOUNT = 500;
const WAIFU_DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const WAIFU_PULL_COST = 100;
const WAIFU_COLLECTION_PAGE_SIZE = 10;
const WAIFU_IMAGE_PROVIDER = (process.env.WAIFU_IMAGE_PROVIDER || 'folder').toLowerCase();
const WAIFU_SHINY_CHANCE_PERCENT = Math.max(
    0,
    Number.parseFloat(process.env.WAIFU_SHINY_CHANCE_PERCENT || '2') || 2
);
const WAIFU_SHINY_VALUE_MULTIPLIER = Math.max(
    1,
    Number.parseFloat(process.env.WAIFU_SHINY_VALUE_MULTIPLIER || '5') || 5
);
const WAIFU_TRADE_TTL_MS = 5 * 60 * 1000;
const POLLINATIONS_IMAGE_MODEL = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
const POLLINATIONS_IMAGE_WIDTH = Number.parseInt(process.env.POLLINATIONS_IMAGE_WIDTH || '768', 10) || 768;
const POLLINATIONS_IMAGE_HEIGHT = Number.parseInt(process.env.POLLINATIONS_IMAGE_HEIGHT || '1024', 10) || 1024;
const POLLINATIONS_IMAGE_ENHANCE = process.env.POLLINATIONS_IMAGE_ENHANCE === 'true';
const ENABLE_SLASH_COMMAND_REGISTRATION = process.env.ENABLE_SLASH_COMMAND_REGISTRATION === 'true';
const WAIFU_IMAGE_MODELS = (
    process.env.WAIFU_IMAGE_MODELS ||
    process.env.WAIFU_IMAGE_MODEL ||
    process.env.GEMINI_IMAGE_MODEL ||
    'gemini-3.1-flash-image,gemini-3-pro-image,gemini-2.5-flash-image'
)
    .split(',')
    .map(model => model.trim())
    .filter(Boolean);
const ANTI_RAID_JOIN_WINDOW_MS = 60 * 1000;
const ANTI_RAID_JOIN_LIMIT = 5;
const ANTI_RAID_MESSAGE_WINDOW_MS = 10 * 1000;
const ANTI_RAID_MESSAGE_LIMIT = 6;
const ANTI_RAID_REPEAT_LIMIT = 3;
const EVENT_REMINDER_INTERVAL_MS = 60 * 1000;
const EVENT_REMINDER_BEFORE_MS = 60 * 60 * 1000;

const DEFAULT_TICKET_TYPES = [
    {
        id: 'general',
        label: 'General Support',
        style: ButtonStyle.Primary,
        adminOnly: false,
        description: 'General support ticket'
    },
    {
        id: 'report',
        label: 'Report User',
        style: ButtonStyle.Danger,
        adminOnly: false,
        description: 'Report a member or issue'
    },
    {
        id: 'partnership',
        label: 'Partnership',
        style: ButtonStyle.Secondary,
        adminOnly: false,
        description: 'Partnership request'
    },
    {
        id: 'appeal',
        label: 'Appeal',
        style: ButtonStyle.Secondary,
        adminOnly: false,
        description: 'Appeal a moderation action'
    },
    {
        id: 'admin',
        label: 'Admin Only',
        style: ButtonStyle.Danger,
        adminOnly: true,
        description: 'Private admin-only ticket'
    }
];

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

// VRChat verifier
const vrcVerifyConfigs = new Map();
const vrcVerificationRecords = new Map();
const pendingVrcVerifications = new Map();

// Community systems
const appConfigs = new Map();
const staffNotes = new Map();
const vrchatEvents = new Map();
const caseStores = new Map();
const tempRoles = new Map();
const giveaways = new Map();
const polls = new Map();
const xpRecords = new Map();
const suggestions = new Map();
const waifuPlayers = new Map();
const pendingWaifuTrades = new Map();
const antiRaidJoinTimestamps = new Map();
const antiRaidMessageTimestamps = new Map();
let eventReminderInterval = null;

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
    loadVrcVerifyConfigs();
    loadVrcVerificationRecords();
    loadAppConfigs();
    loadStaffNotes();
    loadVrchatEvents();
    loadCases();
    loadTempRoles();
    loadGiveaways();
    loadPolls();
    loadXpRecords();
    loadSuggestions();
    loadWaifuPlayers();

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
    scheduleTempRoleRemovals();
    scheduleGiveawayEnds();
    startEventReminderWorker();

    if (ENABLE_SLASH_COMMAND_REGISTRATION) {
        registerSlashCommandsForGuilds();
    } else {
        removeRestrictedSlashCommandsForGuilds();
    }

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

const WAIFU_RARITIES = [
    {
        id: 'common',
        label: 'Common',
        weight: 55,
        color: '#95A5A6',
        value: 25
    },
    {
        id: 'rare',
        label: 'Rare',
        weight: 28,
        color: '#3498DB',
        value: 75
    },
    {
        id: 'epic',
        label: 'Epic',
        weight: 12,
        color: '#9B59B6',
        value: 200
    },
    {
        id: 'legendary',
        label: 'Legendary',
        weight: 4,
        color: '#F1C40F',
        value: 600
    },
    {
        id: 'mythic',
        label: 'Mythic',
        weight: 1,
        color: '#FF5FA2',
        value: 1500
    }
];

const WAIFU_FIRST_NAMES = [
    'Airi',
    'Mika',
    'Rin',
    'Sora',
    'Yuna',
    'Nami',
    'Kira',
    'Aya',
    'Luna',
    'Emi',
    'Nova',
    'Mira',
    'Reina',
    'Akari',
    'Selene'
];

const WAIFU_TITLES = [
    'Starlit DJ',
    'Cyber Shrine Keeper',
    'Moonlit Duelist',
    'Arcade Idol',
    'Velvet Mage',
    'Neon Florist',
    'Crystal Mechanic',
    'Dream Librarian',
    'Astral Dancer',
    'Prism Guardian',
    'Retro Streamer',
    'Skyline Witch'
];

const WAIFU_AESTHETICS = [
    'neon city lights',
    'soft pastel arcade',
    'VRChat club fashion',
    'celestial streetwear',
    'glowing crystal accessories',
    'retro-futuristic headphones',
    'holographic jacket',
    'moon garden background',
    'starry cyberpunk skyline',
    'cozy gaming room'
];

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

function hasServerAdminOrOwnerAccess(member) {

    return (
        member?.id === member?.guild?.ownerId ||
        member?.permissions?.has(PermissionsBitField.Flags.Administrator)
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
        ticketType: String(record.ticketType || 'general'),
        status: record.status === 'closed' ? 'closed' : 'open',
        createdAt: record.createdAt || new Date().toISOString(),
        reason: String(record.reason || 'No reason provided.'),
        closeReason: record.closeReason || null,
        rating: record.rating || null,
        ratingComment: record.ratingComment || null,
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

function getTicketTypeById(ticketTypeId) {
    return DEFAULT_TICKET_TYPES.find(type => type.id === ticketTypeId) || DEFAULT_TICKET_TYPES[0];
}

function getTicketTypeIdFromArgs(args) {

    const firstArg = String(args[0] || '').toLowerCase();

    if (!firstArg) return null;

    return DEFAULT_TICKET_TYPES.some(type => type.id === firstArg) ? firstArg : null;

}

function getTicketPermissionOverwrites(guild, ownerId, config, ticketType = getTicketTypeById('general')) {

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

    const staffRoleIds = ticketType.adminOnly ? config.adminRoleIds : config.supportRoleIds;

    for (const roleId of staffRoleIds) {

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
        ...DEFAULT_TICKET_TYPES.map(ticketType =>
            new ButtonBuilder()
                .setCustomId(`ticket_open:${ticketType.id}`)
                .setLabel(ticketType.label)
                .setStyle(ticketType.style)
        )
    );

}

function createTicketOpenRows() {
    return [createTicketOpenRow()];
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

async function createTicketForMember(guild, member, reason = 'No reason provided.', ticketTypeId = 'general') {

    const config = getTicketConfig(guild.id);
    const ticketType = getTicketTypeById(ticketTypeId);
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
        topic: `Ticket #${ticketNumber} | Type: ${ticketType.label} | Owner: ${member.user.tag} (${member.id}) | ticket-owner:${member.id}`,
        permissionOverwrites: getTicketPermissionOverwrites(guild, member.id, config, ticketType)
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
        ticketType: ticketType.id,
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
        .setTitle(`Ticket #${ticketNumber} - ${ticketType.label}`)
        .setDescription('Support will be with you soon. Use `!close` when this is finished, or `!escalate` if you need an admin.')
        .addFields(
            {
                name: 'Type',
                value: ticketType.label,
                inline: true
            },
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
            },
            {
                name: 'Type',
                value: ticketType.label,
                inline: true
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
    const ticketType = getTicketTypeById(record.ticketType);
    const header = [
        `Ticket Transcript - ${channel.guild.name}`,
        `Action: ${actionLabel}`,
        `Ticket: #${record.ticketNumber || channel.id}`,
        `Type: ${ticketType.label}`,
        `Channel: #${channel.name} (${channel.id})`,
        `Opened By: ${owner ? `${owner.tag} (${owner.id})` : record.ownerId}`,
        `Created At: ${record.createdAt}`,
        `Closed/Logged By: ${actorUser.tag || actorUser.username} (${actorUser.id})`,
        `Reason: ${reason || 'No reason provided.'}`,
        `Rating: ${record.rating ? `${record.rating}/5` : 'Not rated'}`,
        `Rating Comment: ${record.ratingComment || 'No comment'}`,
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
            },
            {
                name: 'Rating',
                value: record.rating ? `${record.rating}/5` : 'Not rated',
                inline: true
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

async function closeTicketChannel(channel, actorUser, reason = 'No reason provided.', rating = null) {

    const record = getTicketRecordForChannel(channel);

    if (!record) {
        throw new Error('This does not look like a ticket channel.');
    }

    record.closeReason = reason;
    record.rating = rating || record.rating || null;

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

    await createCase(
        channel.guild,
        'TICKET_CLOSE',
        record.ownerId,
        actorUser,
        reason,
        {
            ticketChannelId: channel.id,
            ticketNumber: record.ticketNumber,
            ticketType: record.ticketType,
            rating: record.rating || null
        }
    );

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
        components: createTicketOpenRows(),
        allowedMentions: {
            parse: []
        }
    });

    await message.reply(`Ticket panel created in ${targetChannel}.`);

}

async function handleTicketOpenCommand(message, args) {

    const ticketTypeId = getTicketTypeIdFromArgs(args) || 'general';
    const reasonArgs = getTicketTypeIdFromArgs(args) ? args.slice(1) : args;
    const reason = reasonArgs.join(' ').trim() || 'No reason provided.';

    try {

        const result = await createTicketForMember(message.guild, message.member, reason, ticketTypeId);

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

    const closeText = args.join(' ').trim();
    const ratingMatch = closeText.match(/(?:^|\s|\|)([1-5])(?:\s*\/\s*5)?$/);
    const rating = ratingMatch ? Number.parseInt(ratingMatch[1], 10) : null;
    const reason = (ratingMatch ? closeText.slice(0, ratingMatch.index).replace(/\|+$/, '').trim() : closeText) ||
        'No reason provided.';

    try {

        await closeTicketChannel(message.channel, message.author, reason, rating);

    } catch (error) {

        console.error('Ticket close command error:', error);
        await message.reply(`Failed to close ticket: ${error.message}`);

    }

}

async function handleTicketRatingCommand(message, args) {

    const record = getTicketRecordForChannel(message.channel);

    if (!record) {
        return message.reply('This command only works inside a ticket channel.');
    }

    if (!isTicketOwner(message.member, record)) {
        return message.reply('Only the ticket opener can rate this ticket.');
    }

    const rating = Number.parseInt(args[0], 10);
    const comment = args.slice(1).join(' ').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return message.reply('Usage: `!rateticket 1-5 [comment]`');
    }

    record.rating = rating;
    record.ratingComment = comment || null;
    ticketRecords.set(message.channel.id, record);
    saveTicketRecords();

    await message.reply(`Thanks. Your ticket rating was saved as **${rating}/5**.`);

    await sendTicketLog(
        message.guild,
        'Ticket Rated',
        [
            {
                name: 'Ticket',
                value: `${message.channel} (#${record.ticketNumber || message.channel.id})`,
                inline: true
            },
            {
                name: 'Rating',
                value: `${rating}/5`,
                inline: true
            },
            {
                name: 'Comment',
                value: comment || 'No comment.',
                inline: false
            }
        ],
        '#FEE75C',
        getTicketConfig(message.guild.id)
    );

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

    if (interaction.customId.startsWith('ticket_open')) {

        await interaction.deferReply({
            ephemeral: true
        });

        try {

            const result = await createTicketForMember(
                interaction.guild,
                member,
                'Opened from the ticket panel.',
                interaction.customId.split(':')[1] || 'general'
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

function getVrcVerifyKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function normalizeVrcVerifyConfig(config = {}) {

    const verifiedRoleId = String(config.verifiedRoleId || DEFAULT_VRC_VERIFIED_ROLE_ID || '');

    return {
        verifiedRoleId: /^\d{17,20}$/.test(verifiedRoleId) ? verifiedRoleId : null,
        removeRoleIds: getUniqueIdList(config.removeRoleIds),
        logChannelId: /^\d{17,20}$/.test(String(config.logChannelId || '')) ? String(config.logChannelId) : LOG_CHANNEL_ID
    };

}

function loadVrcVerifyConfigs() {

    if (!fs.existsSync(VRC_VERIFY_CONFIG_FILE)) return;

    try {

        const savedConfigs = JSON.parse(fs.readFileSync(VRC_VERIFY_CONFIG_FILE, 'utf8'));

        if (!savedConfigs || typeof savedConfigs !== 'object') return;

        vrcVerifyConfigs.clear();

        for (const [guildId, config] of Object.entries(savedConfigs)) {

            if (!/^\d{17,20}$/.test(guildId)) continue;

            vrcVerifyConfigs.set(guildId, normalizeVrcVerifyConfig(config));

        }

        console.log(`Loaded VRC verifier config for ${vrcVerifyConfigs.size} guild(s).`);

    } catch (error) {

        console.error('Failed to load VRC verifier configs:', error);

    }

}

function saveVrcVerifyConfigs() {

    try {

        fs.writeFileSync(
            VRC_VERIFY_CONFIG_FILE,
            JSON.stringify(Object.fromEntries(vrcVerifyConfigs.entries()), null, 2)
        );

    } catch (error) {

        console.error('Failed to save VRC verifier configs:', error);

    }

}

function getVrcVerifyConfig(guildId) {

    if (!vrcVerifyConfigs.has(guildId)) {
        vrcVerifyConfigs.set(guildId, normalizeVrcVerifyConfig());
    }

    return vrcVerifyConfigs.get(guildId);

}

function setVrcVerifyConfig(guildId, updater) {

    const config = {
        ...getVrcVerifyConfig(guildId)
    };

    updater(config);

    const normalizedConfig = normalizeVrcVerifyConfig(config);
    vrcVerifyConfigs.set(guildId, normalizedConfig);
    saveVrcVerifyConfigs();

    return normalizedConfig;

}

function normalizeVrcVerificationRecord(record = {}) {

    const guildId = String(record.guildId || '');
    const discordUserId = String(record.discordUserId || '');
    const vrcUserId = String(record.vrcUserId || '');

    if (!/^\d{17,20}$/.test(guildId) ||
        !/^\d{17,20}$/.test(discordUserId) ||
        !/^usr_[0-9a-fA-F-]{36}$/.test(vrcUserId)) {
        return null;
    }

    return {
        guildId,
        discordUserId,
        vrcUserId,
        vrcDisplayName: String(record.vrcDisplayName || 'Unknown VRChat User'),
        verifiedAt: record.verifiedAt || new Date().toISOString(),
        verifiedBy: record.verifiedBy || 'profile-code'
    };

}

function loadVrcVerificationRecords() {

    if (!fs.existsSync(VRC_VERIFY_STORE_FILE)) return;

    try {

        const savedRecords = JSON.parse(fs.readFileSync(VRC_VERIFY_STORE_FILE, 'utf8'));
        const records = Array.isArray(savedRecords)
            ? savedRecords
            : Object.values(savedRecords || {});

        vrcVerificationRecords.clear();

        for (const rawRecord of records) {

            const record = normalizeVrcVerificationRecord(rawRecord);

            if (!record) continue;

            vrcVerificationRecords.set(
                getVrcVerifyKey(record.guildId, record.discordUserId),
                record
            );

        }

        console.log(`Loaded ${vrcVerificationRecords.size} VRC verification record(s).`);

    } catch (error) {

        console.error('Failed to load VRC verification records:', error);

    }

}

function saveVrcVerificationRecords() {

    try {

        fs.writeFileSync(
            VRC_VERIFY_STORE_FILE,
            JSON.stringify([...vrcVerificationRecords.values()], null, 2)
        );

    } catch (error) {

        console.error('Failed to save VRC verification records:', error);

    }

}

function getVrcVerifyConfigUsage() {

    return [
        'VRC verifier config usage:',
        '`!vrcverifyconfig list`',
        '`!vrcverifyconfig role @role`',
        '`!vrcverifyconfig logs #channel`',
        '`!vrcverifyconfig remove add @role`',
        '`!vrcverifyconfig remove remove @role`',
        '`!vrcverifyconfig remove clear`',
        '`!vrcverifyconfig reset`'
    ].join('\n');

}

async function getVrcVerifierLogChannel(guild, config = getVrcVerifyConfig(guild.id)) {

    const channelId = config.logChannelId || LOG_CHANNEL_ID;
    const channel = guild.channels.cache.get(channelId) ||
        await guild.channels.fetch(channelId).catch(() => null);

    return channel?.isTextBased?.() && channel.send ? channel : null;

}

function generateVrcVerifyCode() {
    return `${VRC_VERIFY_CODE_PREFIX}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

function cleanupExpiredVrcVerifications() {

    const now = Date.now();

    for (const [key, pending] of pendingVrcVerifications.entries()) {

        if (pending.expiresAt <= now) {
            pendingVrcVerifications.delete(key);
        }

    }

}

function getPendingVrcVerification(guildId, userId) {

    cleanupExpiredVrcVerifications();

    return pendingVrcVerifications.get(getVrcVerifyKey(guildId, userId)) || null;

}

function extractVrcUserIdFromInput(input) {
    return String(input || '').match(/usr_[0-9a-fA-F-]{36}/)?.[0] || null;
}

function normalizeVrcDisplayName(text) {

    return String(text || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

}

async function fetchVrchatApiJson(endpointPath, params = null) {

    if (!VRCHAT_AUTH_COOKIE) {
        throw new Error('Missing VRCHAT_AUTH_COOKIE. Add it to your environment variables before using VRC verification.');
    }

    const url = new URL(`https://api.vrchat.cloud/api/1${endpointPath}`);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value));
        }
    }

    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            Cookie: getVrchatAuthCookieHeader(),
            'User-Agent': VRCHAT_API_USER_AGENT
        }
    });

    const payload = await response.json().catch(() => null);

    if (response.status === 429) {
        throw new Error('VRChat rate limited the verifier. Try again later.');
    }

    if (!response.ok) {
        const errorMessage = payload?.error?.message || payload?.message || response.statusText;
        throw new Error(`VRChat API returned ${response.status}: ${errorMessage}`);
    }

    return payload;

}

async function fetchVrchatUserById(userId) {
    return await fetchVrchatApiJson(`/users/${encodeURIComponent(userId)}`);
}

async function searchVrchatUsers(displayName) {

    const users = await fetchVrchatApiJson('/users', {
        search: displayName,
        n: 10
    });

    return Array.isArray(users) ? users : [];

}

async function resolveVrchatUser(identifier) {

    const trimmedIdentifier = String(identifier || '').trim();

    if (!trimmedIdentifier) return null;

    const userId = extractVrcUserIdFromInput(trimmedIdentifier);

    if (userId) {
        return await fetchVrchatUserById(userId);
    }

    const users = await searchVrchatUsers(trimmedIdentifier);
    const normalizedIdentifier = normalizeVrcDisplayName(trimmedIdentifier);
    const matchedUser = users.find(user =>
        normalizeVrcDisplayName(user.displayName) === normalizedIdentifier
    ) || users[0] || null;

    if (!matchedUser?.id) return null;

    return await fetchVrchatUserById(matchedUser.id);

}

function getVrcProfileVerificationText(user) {

    return [
        user?.bio,
        user?.statusDescription,
        user?.pronouns,
        ...(Array.isArray(user?.bioLinks) ? user.bioLinks : [])
    ]
        .filter(Boolean)
        .join('\n');

}

function vrcProfileContainsCode(user, code) {
    return getVrcProfileVerificationText(user).toLowerCase().includes(String(code || '').toLowerCase());
}

function isVrchatUserAgeVerified18Plus(user) {

    const status = String(user?.ageVerificationStatus || '').toLowerCase().trim();

    return user?.ageVerified === true && status === '18+';

}

async function sendVrcVerificationLog(guild, title, fields = [], color = '#2B90D9', config = getVrcVerifyConfig(guild.id)) {

    const logChannel = await getVrcVerifierLogChannel(guild, config);

    if (!logChannel) return;

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

}

async function applyVrcVerifiedRole(member, config) {

    if (!config.verifiedRoleId) {
        throw new Error('No VRC verified role is configured. Use `!vrcverifyconfig role @role`.');
    }

    const role = member.guild.roles.cache.get(config.verifiedRoleId) ||
        await member.guild.roles.fetch(config.verifiedRoleId).catch(() => null);

    if (!role) {
        throw new Error('The configured VRC verified role could not be found.');
    }

    const botMember = await getBotMember(member.guild);

    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        throw new Error('I need the Manage Roles permission to assign the VRC verified role.');
    }

    if (!canBotAssignRole(botMember, member.guild, role)) {
        throw new Error(`I cannot assign ${role.name}. Move my bot role above it in the role list.`);
    }

    await member.roles.add(role, 'VRChat account verified.');

    const rolesToRemoveAfterVerify = getUniqueIdList([
        AUTO_ROLE_ID,
        ...config.removeRoleIds
    ]);

    for (const roleId of rolesToRemoveAfterVerify) {

        if (roleId === role.id || !member.roles.cache.has(roleId)) continue;

        const roleToRemove = member.guild.roles.cache.get(roleId) ||
            await member.guild.roles.fetch(roleId).catch(() => null);

        if (!roleToRemove || !canBotAssignRole(botMember, member.guild, roleToRemove)) continue;

        await member.roles.remove(roleToRemove, 'VRChat account verified.').catch(() => {});

    }

    return role;

}

async function sendVrcVerifyConfigSummary(message) {

    const config = getVrcVerifyConfig(message.guild.id);
    const rolesRemovedAfterVerify = getUniqueIdList([
        AUTO_ROLE_ID,
        ...config.removeRoleIds
    ]);
    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('VRC Verifier Config')
        .addFields(
            {
                name: 'Verified Role',
                value: config.verifiedRoleId ? `<@&${config.verifiedRoleId}>` : 'None configured.',
                inline: false
            },
            {
                name: 'Remove After Verify',
                value: rolesRemovedAfterVerify.length > 0
                    ? rolesRemovedAfterVerify.map(roleId => `<@&${roleId}>`).join('\n')
                    : 'None configured.',
                inline: false
            },
            {
                name: 'Logs',
                value: config.logChannelId ? `<#${config.logChannelId}>` : `<#${LOG_CHANNEL_ID}>`,
                inline: true
            },
            {
                name: 'Auth',
                value: VRCHAT_AUTH_COOKIE ? 'VRCHAT_AUTH_COOKIE is set.' : 'Missing VRCHAT_AUTH_COOKIE.',
                inline: true
            },
            {
                name: 'Commands',
                value: getVrcVerifyConfigUsage(),
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

async function handleVrcVerifyConfigCommand(message, args) {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return message.reply('Administrator permission required.');
    }

    const section = args[0]?.toLowerCase();

    if (!section || section === 'list' || section === 'show') {
        await sendVrcVerifyConfigSummary(message);
        return;
    }

    if (section === 'reset') {

        vrcVerifyConfigs.set(message.guild.id, normalizeVrcVerifyConfig());
        saveVrcVerifyConfigs();

        await message.reply('VRC verifier config reset to defaults.');
        return;

    }

    if (section === 'role' || section === 'verifiedrole') {

        const role = await resolveRoleFromArg(message, args.slice(1).join(' ').trim());

        if (!role) {
            return message.reply('I could not find that role.');
        }

        setVrcVerifyConfig(message.guild.id, config => {
            config.verifiedRoleId = role.id;
        });

        await message.reply(`VRC verified role set to ${role}.`);
        return;

    }

    if (section === 'logs' || section === 'log') {

        const channel = resolveTextChannelFromArg(message, args[1]);

        if (!channel) {
            return message.reply('Usage: `!vrcverifyconfig logs #channel`');
        }

        setVrcVerifyConfig(message.guild.id, config => {
            config.logChannelId = channel.id;
        });

        await message.reply(`VRC verifier logs will be sent to ${channel}.`);
        return;

    }

    if (section === 'remove') {

        const action = args[1]?.toLowerCase();

        if (action === 'clear') {

            setVrcVerifyConfig(message.guild.id, config => {
                config.removeRoleIds = [];
            });

            await message.reply('Cleared roles removed after VRC verification.');
            return;

        }

        if (!['add', 'remove'].includes(action)) {
            return message.reply(getVrcVerifyConfigUsage());
        }

        const role = await resolveRoleFromArg(message, args.slice(2).join(' ').trim());

        if (!role) {
            return message.reply('I could not find that role.');
        }

        setVrcVerifyConfig(message.guild.id, config => {

            if (action === 'add') {
                config.removeRoleIds = getUniqueIdList([
                    ...config.removeRoleIds,
                    role.id
                ]);
            } else {
                config.removeRoleIds = config.removeRoleIds.filter(roleId => roleId !== role.id);
            }

        });

        await message.reply(`${role} was ${action === 'add' ? 'added to' : 'removed from'} the remove-after-verify list.`);
        return;

    }

    await message.reply(getVrcVerifyConfigUsage());

}

async function handleVrcVerifyStartCommand(message, args) {

    const identifier = args.join(' ').trim();

    if (!identifier) {
        return message.reply('Usage: `!vrcverify VRChatDisplayName` or `!vrcverify https://vrchat.com/home/user/usr_...`');
    }

    const config = getVrcVerifyConfig(message.guild.id);

    if (!config.verifiedRoleId) {
        return message.reply('VRC verification is missing a verified role. Ask an admin to run `!vrcverifyconfig role @role`.');
    }

    const code = generateVrcVerifyCode();
    const expiresAt = Date.now() + VRC_VERIFY_CODE_TTL_MS;

    pendingVrcVerifications.set(getVrcVerifyKey(message.guild.id, message.author.id), {
        guildId: message.guild.id,
        discordUserId: message.author.id,
        vrcIdentifier: identifier,
        code,
        expiresAt,
        createdAt: Date.now()
    });

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('VRChat Verification Started')
        .setDescription('Put this code in your VRChat bio or status, then run `!vrcconfirm` in Discord.')
        .addFields(
            {
                name: 'Verification Code',
                value: `\`${code}\``,
                inline: false
            },
            {
                name: 'VRChat Profile',
                value: identifier,
                inline: false
            },
            {
                name: 'Expires',
                value: `<t:${Math.floor(expiresAt / 1000)}:R>`,
                inline: true
            }
        )
        .setFooter({
            text: 'You can remove the code from your VRChat profile after verification.'
        })
        .setTimestamp();

    await message.reply({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleVrcConfirmCommand(message, args) {

    const pending = getPendingVrcVerification(message.guild.id, message.author.id);

    if (!pending) {
        return message.reply('No active VRC verification found. Start one with `!vrcverify VRChatDisplayName`.');
    }

    const identifier = args.join(' ').trim() || pending.vrcIdentifier;

    if (!identifier) {
        return message.reply('Usage: `!vrcconfirm VRChatDisplayName`');
    }

    const config = getVrcVerifyConfig(message.guild.id);
    const statusMessage = await message.reply('Checking your VRChat profile...');

    try {

        const vrcUser = await resolveVrchatUser(identifier);

        if (!vrcUser?.id) {
            await statusMessage.edit('I could not find that VRChat profile.');
            return;
        }

        if (!isVrchatUserAgeVerified18Plus(vrcUser)) {
            await statusMessage.edit(
                `I found **${vrcUser.displayName || 'that profile'}**, but that VRChat profile is not showing as **18+ age verified**.`
            );

            await sendVrcVerificationLog(
                message.guild,
                'VRC Verification Blocked',
                [
                    {
                        name: 'Discord User',
                        value: `${message.author.tag} (${message.author.id})`,
                        inline: false
                    },
                    {
                        name: 'VRChat User',
                        value: `${vrcUser.displayName || 'Unknown'} (${vrcUser.id})`,
                        inline: false
                    },
                    {
                        name: 'Reason',
                        value: `Profile is not showing 18+ age verification. ageVerified=${Boolean(vrcUser.ageVerified)}, ageVerificationStatus=${vrcUser.ageVerificationStatus || 'missing'}`,
                        inline: false
                    }
                ],
                '#ED4245',
                config
            );

            return;
        }

        if (!vrcProfileContainsCode(vrcUser, pending.code)) {
            await statusMessage.edit(
                `I found **${vrcUser.displayName || 'that profile'}**, but I do not see \`${pending.code}\` in the bio or status yet.`
            );
            return;
        }

        const verifiedRole = await applyVrcVerifiedRole(message.member, config);
        await syncMemberNicknameToVrc(message.member, vrcUser.displayName);
        const record = normalizeVrcVerificationRecord({
            guildId: message.guild.id,
            discordUserId: message.author.id,
            vrcUserId: vrcUser.id,
            vrcDisplayName: vrcUser.displayName,
            verifiedAt: new Date().toISOString()
        });

        if (record) {
            vrcVerificationRecords.set(getVrcVerifyKey(message.guild.id, message.author.id), record);
            saveVrcVerificationRecords();
        }

        pendingVrcVerifications.delete(getVrcVerifyKey(message.guild.id, message.author.id));

        await statusMessage.edit(`Verified as **${vrcUser.displayName}** and gave you **${verifiedRole.name}**.`);

        await sendVrcVerificationLog(
            message.guild,
            'VRC User Verified',
            [
                {
                    name: 'Discord User',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'VRChat User',
                    value: `${vrcUser.displayName} (${vrcUser.id})`,
                    inline: false
                },
                {
                    name: 'Role',
                    value: `${verifiedRole.name} (${verifiedRole.id})`,
                    inline: false
                }
            ],
            '#57F287',
            config
        );

    } catch (error) {

        console.error('VRC confirm command error:', error);
        await statusMessage.edit(`VRC verification failed: ${truncateText(error.message, 300)}`).catch(() => {});

    }

}

async function handleVrcLinkedCommand(message, args) {

    const target = await resolveUserFromArgs(message, args) || message.author;
    const record = vrcVerificationRecords.get(getVrcVerifyKey(message.guild.id, target.id));

    if (!record) {
        return message.reply(`${target} has not verified a VRChat account with this bot.`);
    }

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('Linked VRChat Account')
        .addFields(
            {
                name: 'Discord User',
                value: `${target.tag || target.username} (${target.id})`,
                inline: false
            },
            {
                name: 'VRChat User',
                value: `${record.vrcDisplayName} (${record.vrcUserId})`,
                inline: false
            },
            {
                name: 'Verified',
                value: `<t:${Math.floor(Date.parse(record.verifiedAt) / 1000)}:R>`,
                inline: true
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

async function handleVrcUnverifyCommand(message, args) {

    if (!hasModAccess(message.member)) {
        return message.reply('No permission.');
    }

    const targetMember = await resolveMemberFromArgs(message, args);

    if (!targetMember) {
        return message.reply('Usage: `!vrcunverify @user/userID`');
    }

    const key = getVrcVerifyKey(message.guild.id, targetMember.id);
    const record = vrcVerificationRecords.get(key);

    if (!record) {
        return message.reply('That user is not linked in the VRC verifier records.');
    }

    vrcVerificationRecords.delete(key);
    saveVrcVerificationRecords();

    const config = getVrcVerifyConfig(message.guild.id);

    if (config.verifiedRoleId && targetMember.roles.cache.has(config.verifiedRoleId)) {
        await targetMember.roles.remove(config.verifiedRoleId, 'VRC verification removed.').catch(() => {});
    }

    await message.reply(`Removed VRC verification for ${targetMember.user.tag}.`);

    await sendVrcVerificationLog(
        message.guild,
        'VRC Verification Removed',
        [
            {
                name: 'Discord User',
                value: `${targetMember.user.tag} (${targetMember.id})`,
                inline: false
            },
            {
                name: 'Removed By',
                value: `${message.author.tag} (${message.author.id})`,
                inline: false
            },
            {
                name: 'Former VRChat User',
                value: `${record.vrcDisplayName} (${record.vrcUserId})`,
                inline: false
            }
        ],
        '#ED4245',
        config
    );

}

function normalizeAppConfig(config = {}) {

    return {
        onboardingChannelId: /^\d{17,20}$/.test(String(config.onboardingChannelId || '')) ? String(config.onboardingChannelId) : null,
        eventChannelId: /^\d{17,20}$/.test(String(config.eventChannelId || '')) ? String(config.eventChannelId) : VRCHAT_POST_CHANNEL_ID,
        notesLogChannelId: /^\d{17,20}$/.test(String(config.notesLogChannelId || '')) ? String(config.notesLogChannelId) : LOG_CHANNEL_ID,
        antiRaidEnabled: config.antiRaidEnabled !== false,
        nicknameSyncEnabled: config.nicknameSyncEnabled !== false,
        automodEnabled: config.automodEnabled !== false,
        blockedWords: Array.isArray(config.blockedWords)
            ? config.blockedWords.map(word => String(word || '').toLowerCase().trim()).filter(Boolean)
            : []
    };

}

function loadAppConfigs() {

    if (!fs.existsSync(APP_CONFIG_FILE)) return;

    try {

        const savedConfigs = JSON.parse(fs.readFileSync(APP_CONFIG_FILE, 'utf8'));

        if (!savedConfigs || typeof savedConfigs !== 'object') return;

        appConfigs.clear();

        for (const [guildId, config] of Object.entries(savedConfigs)) {
            if (/^\d{17,20}$/.test(guildId)) {
                appConfigs.set(guildId, normalizeAppConfig(config));
            }
        }

    } catch (error) {
        console.error('Failed to load community config:', error);
    }

}

function saveAppConfigs() {

    try {
        fs.writeFileSync(APP_CONFIG_FILE, JSON.stringify(Object.fromEntries(appConfigs.entries()), null, 2));
    } catch (error) {
        console.error('Failed to save community config:', error);
    }

}

function getAppConfig(guildId) {

    if (!appConfigs.has(guildId)) {
        appConfigs.set(guildId, normalizeAppConfig());
    }

    return appConfigs.get(guildId);

}

function setAppConfig(guildId, updater) {

    const config = {
        ...getAppConfig(guildId)
    };

    updater(config);
    appConfigs.set(guildId, normalizeAppConfig(config));
    saveAppConfigs();

    return appConfigs.get(guildId);

}

function loadStaffNotes() {

    if (!fs.existsSync(STAFF_NOTES_FILE)) return;

    try {

        const savedNotes = JSON.parse(fs.readFileSync(STAFF_NOTES_FILE, 'utf8'));

        staffNotes.clear();

        for (const note of Array.isArray(savedNotes) ? savedNotes : []) {

            if (!note?.guildId || !note?.targetUserId || !note?.note) continue;

            const key = `${note.guildId}:${note.targetUserId}`;
            const notes = staffNotes.get(key) || [];
            notes.push(note);
            staffNotes.set(key, notes);

        }

    } catch (error) {
        console.error('Failed to load staff notes:', error);
    }

}

function saveStaffNotes() {

    try {
        fs.writeFileSync(STAFF_NOTES_FILE, JSON.stringify([...staffNotes.values()].flat(), null, 2));
    } catch (error) {
        console.error('Failed to save staff notes:', error);
    }

}

function loadVrchatEvents() {

    if (!fs.existsSync(VRCHAT_EVENTS_FILE)) return;

    try {

        const savedEvents = JSON.parse(fs.readFileSync(VRCHAT_EVENTS_FILE, 'utf8'));

        vrchatEvents.clear();

        for (const eventRecord of Array.isArray(savedEvents) ? savedEvents : []) {

            if (!eventRecord?.guildId || !eventRecord?.id || !eventRecord?.title) continue;

            vrchatEvents.set(`${eventRecord.guildId}:${eventRecord.id}`, {
                ...eventRecord,
                rsvps: eventRecord.rsvps || {}
            });

        }

    } catch (error) {
        console.error('Failed to load VRChat events:', error);
    }

}

function saveVrchatEvents() {

    try {
        fs.writeFileSync(VRCHAT_EVENTS_FILE, JSON.stringify([...vrchatEvents.values()], null, 2));
    } catch (error) {
        console.error('Failed to save VRChat events:', error);
    }

}

async function sendConfiguredLog(guild, channelId, embed) {

    const channel = guild.channels.cache.get(channelId) ||
        await guild.channels.fetch(channelId).catch(() => null);

    if (channel?.isTextBased?.() && channel.send) {
        await channel.send({
            embeds: [embed],
            allowedMentions: {
                parse: []
            }
        }).catch(() => {});
    }

}

async function handleAntiRaidJoin(member) {

    const config = getAppConfig(member.guild.id);

    if (!config.antiRaidEnabled) return;

    const now = Date.now();
    const timestamps = (antiRaidJoinTimestamps.get(member.guild.id) || [])
        .filter(timestamp => now - timestamp <= ANTI_RAID_JOIN_WINDOW_MS);

    timestamps.push(now);
    antiRaidJoinTimestamps.set(member.guild.id, timestamps);

    if (timestamps.length !== ANTI_RAID_JOIN_LIMIT) return;

    const logChannel = getLogChannel(member.guild);

    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('Anti-Raid Alert')
        .setDescription(`${timestamps.length} members joined within ${ANTI_RAID_JOIN_WINDOW_MS / 1000} seconds.`)
        .setTimestamp();

    await logChannel.send({
        content: MOD_ROLE_IDS.map(roleId => `<@&${roleId}>`).join(' '),
        embeds: [embed],
        allowedMentions: {
            roles: MOD_ROLE_IDS
        }
    }).catch(() => {});

}

async function handleAntiRaidMessage(message) {

    const config = getAppConfig(message.guild.id);

    if (!config.antiRaidEnabled || message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return false;

    const now = Date.now();
    const key = `${message.guild.id}:${message.author.id}`;
    const records = (antiRaidMessageTimestamps.get(key) || [])
        .filter(record => now - record.createdAt <= ANTI_RAID_MESSAGE_WINDOW_MS);

    records.push({
        createdAt: now,
        content: normalizeAskQuestion(message.content)
    });

    antiRaidMessageTimestamps.set(key, records);

    const repeatedCount = records.filter(record => record.content && record.content === records[records.length - 1].content).length;

    if (records.length < ANTI_RAID_MESSAGE_LIMIT && repeatedCount < ANTI_RAID_REPEAT_LIMIT) return false;

    await message.delete().catch(() => {});
    await message.member.timeout(10 * 60 * 1000, 'Anti-raid spam detection.').catch(() => {});

    const logChannel = getLogChannel(message.guild);

    if (logChannel) {

        const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('Anti-Raid Message Action')
            .addFields(
                {
                    name: 'User',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'Channel',
                    value: `${message.channel}`,
                    inline: true
                },
                {
                    name: 'Action',
                    value: 'Message deleted and 10 minute timeout attempted.',
                    inline: false
                }
            )
            .setTimestamp();

        logChannel.send({
            embeds: [embed]
        }).catch(() => {});

    }

    return true;

}

async function handleNoteCommand(message, args) {

    if (!hasModAccess(message.member)) {
        return message.reply('No permission.');
    }

    const targetUser = await resolveUserFromArgs(message, args);
    const noteText = args.slice(1).join(' ').trim();

    if (!targetUser || !noteText) {
        return message.reply('Usage: `!note @user/userID note text`');
    }

    const note = {
        id: crypto.randomBytes(4).toString('hex'),
        guildId: message.guild.id,
        targetUserId: targetUser.id,
        authorId: message.author.id,
        authorTag: message.author.tag,
        note: noteText,
        createdAt: new Date().toISOString()
    };
    const key = `${message.guild.id}:${targetUser.id}`;
    const notes = staffNotes.get(key) || [];

    notes.push(note);
    staffNotes.set(key, notes);
    saveStaffNotes();
    await createCase(message.guild, 'NOTE', targetUser.id, message.author, noteText);

    await message.reply(`Saved note **${note.id}** for ${targetUser.tag}.`);

    await sendConfiguredLog(
        message.guild,
        getAppConfig(message.guild.id).notesLogChannelId,
        new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('Staff Note Added')
            .addFields(
                {
                    name: 'User',
                    value: `${targetUser.tag} (${targetUser.id})`,
                    inline: false
                },
                {
                    name: 'Staff',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'Note',
                    value: truncateText(noteText, 1000),
                    inline: false
                }
            )
            .setTimestamp()
    );

}

async function handleNotesCommand(message, args) {

    if (!hasModAccess(message.member)) {
        return message.reply('No permission.');
    }

    const targetUser = await resolveUserFromArgs(message, args);

    if (!targetUser) {
        return message.reply('Usage: `!notes @user/userID`');
    }

    const notes = staffNotes.get(`${message.guild.id}:${targetUser.id}`) || [];

    if (!notes.length) {
        return message.reply(`No notes saved for ${targetUser.tag}.`);
    }

    const description = notes.slice(-10).map(note =>
        `**${note.id}** - <t:${Math.floor(Date.parse(note.createdAt) / 1000)}:R> by <@${note.authorId}>\n${truncateText(note.note, 350)}`
    ).join('\n\n');

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#FEE75C')
                .setTitle(`Staff Notes for ${targetUser.tag}`)
                .setDescription(description)
                .setTimestamp()
        ],
        allowedMentions: {
            parse: []
        }
    });

}

function getEventKey(guildId, eventId) {
    return `${guildId}:${eventId}`;
}

async function handleEventCommand(message, args) {

    const subcommand = args.shift()?.toLowerCase();

    if (subcommand === 'create') {

        if (!hasModAccess(message.member)) {
            return message.reply('No permission.');
        }

        const [title, timeText, description] = args.join(' ').split('|').map(part => part?.trim());

        if (!title || !timeText) {
            return message.reply('Usage: `!event create title | time/date | description`');
        }

        const eventRecord = {
            id: crypto.randomBytes(3).toString('hex'),
            guildId: message.guild.id,
            title,
            timeText,
            description: description || 'No description provided.',
            createdBy: message.author.id,
            createdAt: new Date().toISOString(),
            rsvps: {}
        };

        vrchatEvents.set(getEventKey(message.guild.id, eventRecord.id), eventRecord);
        saveVrchatEvents();

        const embed = createVrchatEventEmbed(eventRecord);
        const targetChannel = getAppConfig(message.guild.id).eventChannelId
            ? message.guild.channels.cache.get(getAppConfig(message.guild.id).eventChannelId)
            : message.channel;

        await (targetChannel?.send ? targetChannel : message.channel).send({
            embeds: [embed]
        });

        await message.reply(`Created event **${eventRecord.id}**.`);
        return;

    }

    if (subcommand === 'list' || !subcommand) {

        const events = [...vrchatEvents.values()]
            .filter(eventRecord => eventRecord.guildId === message.guild.id)
            .slice(-10);

        if (!events.length) {
            return message.reply('No VRChat events are saved.');
        }

        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('#2B90D9')
                    .setTitle('VRChat Events')
                    .setDescription(events.map(eventRecord =>
                        `**${eventRecord.id}** - ${eventRecord.title}\n${eventRecord.timeText}\nRSVPs: ${Object.keys(eventRecord.rsvps || {}).length}`
                    ).join('\n\n'))
                    .setTimestamp()
            ]
        });
        return;

    }

    if (subcommand === 'ping') {

        if (!hasModAccess(message.member)) {
            return message.reply('No permission.');
        }

        const eventRecord = vrchatEvents.get(getEventKey(message.guild.id, args[0]));

        if (!eventRecord) {
            return message.reply('I could not find that event ID.');
        }

        const goingUserIds = Object.entries(eventRecord.rsvps || {})
            .filter(([, value]) => value === 'yes')
            .map(([userId]) => userId);

        await message.channel.send({
            content: goingUserIds.length
                ? goingUserIds.map(userId => `<@${userId}>`).join(' ')
                : 'No one has RSVP’d yes yet.',
            embeds: [createVrchatEventEmbed(eventRecord)],
            allowedMentions: {
                users: goingUserIds
            }
        });
        return;

    }

    await message.reply('Usage: `!event create title | time/date | description`, `!event list`, or `!event ping eventId`');

}

function createVrchatEventEmbed(eventRecord) {

    const rsvpCounts = {
        yes: 0,
        maybe: 0,
        no: 0
    };

    for (const value of Object.values(eventRecord.rsvps || {})) {
        if (rsvpCounts[value] !== undefined) rsvpCounts[value]++;
    }

    return new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle(eventRecord.title)
        .setDescription(eventRecord.description || 'No description provided.')
        .addFields(
            {
                name: 'Event ID',
                value: eventRecord.id,
                inline: true
            },
            {
                name: 'When',
                value: eventRecord.timeText,
                inline: true
            },
            {
                name: 'RSVP',
                value: `Yes: ${rsvpCounts.yes} | Maybe: ${rsvpCounts.maybe} | No: ${rsvpCounts.no}`,
                inline: false
            }
        )
        .setTimestamp();

}

async function handleRsvpCommand(message, args) {

    const eventId = args[0];
    const response = String(args[1] || '').toLowerCase();

    if (!eventId || !['yes', 'no', 'maybe'].includes(response)) {
        return message.reply('Usage: `!rsvp eventId yes/no/maybe`');
    }

    const eventRecord = vrchatEvents.get(getEventKey(message.guild.id, eventId));

    if (!eventRecord) {
        return message.reply('I could not find that event ID.');
    }

    eventRecord.rsvps = eventRecord.rsvps || {};
    eventRecord.rsvps[message.author.id] = response;
    vrchatEvents.set(getEventKey(message.guild.id, eventRecord.id), eventRecord);
    saveVrchatEvents();

    await message.reply(`RSVP saved as **${response}** for **${eventRecord.title}**.`);

}

async function handleOnboardingCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) {
        return message.reply('No permission. Only server admins or the server owner can use this command.');
    }

    const targetChannel = resolveTextChannelFromArg(message, args[0]) || message.channel;
    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('Welcome to OverFlow')
        .setDescription('Start by verifying, reading the rules, choosing your roles, and linking your VRChat account.')
        .addFields(
            {
                name: 'Step 1',
                value: 'Click the verify button if one is available.'
            },
            {
                name: 'Step 2',
                value: 'Use `!vrcverify VRChatName`, put the code in your VRChat bio/status, then use `!vrcconfirm`.'
            },
            {
                name: 'Need Help?',
                value: 'Open a support ticket with `!ticket` or the ticket panel.'
            }
        )
        .setTimestamp();

    await targetChannel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

    setAppConfig(message.guild.id, config => {
        config.onboardingChannelId = targetChannel.id;
    });

    await message.reply(`Onboarding message sent to ${targetChannel}.`);

}

async function handleCommunityConfigCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) {
        return message.reply('No permission. Only server admins or the server owner can use this command.');
    }

    const section = args[0]?.toLowerCase();

    if (section === 'events') {
        const channel = resolveTextChannelFromArg(message, args[1]);
        if (!channel) return message.reply('Usage: `!config events #channel`');
        setAppConfig(message.guild.id, config => {
            config.eventChannelId = channel.id;
        });
        return message.reply(`Event channel set to ${channel}.`);
    }

    if (section === 'antiraid') {
        const enabled = args[1]?.toLowerCase() !== 'off';
        setAppConfig(message.guild.id, config => {
            config.antiRaidEnabled = enabled;
        });
        return message.reply(`Anti-raid is now **${enabled ? 'on' : 'off'}**.`);
    }

    if (section === 'nicknames') {
        const enabled = args[1]?.toLowerCase() !== 'off';
        setAppConfig(message.guild.id, config => {
            config.nicknameSyncEnabled = enabled;
        });
        return message.reply(`VRC nickname sync is now **${enabled ? 'on' : 'off'}**.`);
    }

    const appConfig = getAppConfig(message.guild.id);
    const ticketConfig = getTicketConfig(message.guild.id);
    const vrcConfig = getVrcVerifyConfig(message.guild.id);

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#2B90D9')
                .setTitle('Bot Config Overview')
                .addFields(
                    {
                        name: 'Logs',
                        value: `<#${LOG_CHANNEL_ID}>`,
                        inline: true
                    },
                    {
                        name: 'Ticket Category',
                        value: ticketConfig.categoryId ? `<#${ticketConfig.categoryId}>` : 'None',
                        inline: true
                    },
                    {
                        name: 'Ticket Logs',
                        value: ticketConfig.logChannelId ? `<#${ticketConfig.logChannelId}>` : 'Default logs',
                        inline: true
                    },
                    {
                        name: 'VRC Verified Role',
                        value: vrcConfig.verifiedRoleId ? `<@&${vrcConfig.verifiedRoleId}>` : 'None',
                        inline: true
                    },
                    {
                        name: 'Event Channel',
                        value: appConfig.eventChannelId ? `<#${appConfig.eventChannelId}>` : 'None',
                        inline: true
                    },
                    {
                        name: 'Systems',
                        value: `Anti-raid: ${appConfig.antiRaidEnabled ? 'on' : 'off'}\nAutoMod: ${appConfig.automodEnabled ? 'on' : 'off'}\nNickname sync: ${appConfig.nicknameSyncEnabled ? 'on' : 'off'}`,
                        inline: false
                    }
                )
                .setTimestamp()
        ],
        allowedMentions: {
            parse: []
        }
    });

}

async function syncMemberNicknameToVrc(member, vrcDisplayName) {

    const config = getAppConfig(member.guild.id);

    if (!config.nicknameSyncEnabled || !vrcDisplayName) return;

    const botMember = await getBotMember(member.guild);

    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageNicknames)) return;
    if (member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0 && member.id !== member.guild.ownerId) return;

    await member.setNickname(vrcDisplayName.slice(0, 32), 'VRChat verification nickname sync.').catch(() => {});

}

const GENERIC_SLASH_COMMAND_NAMES = [
    '8ball',
    'add',
    'appeal',
    'ask',
    'avatar',
    'ban',
    'case',
    'cases',
    'choose',
    'claim',
    'close',
    'coinflip',
    'coins',
    'compliment',
    'config',
    'daily',
    'automod',
    'editcase',
    'escalate',
    'event',
    'fact',
    'giveaway',
    'givecoins',
    'help',
    'inviteinfo',
    'invites',
    'joke',
    'kick',
    'leaderboard',
    'leave',
    'log',
    'massdelete',
    'mute',
    'myinvites',
    'note',
    'notes',
    'nowplaying',
    'onboarding',
    'odds',
    'pause',
    'pay',
    'ping',
    'play',
    'poll',
    'profile',
    'purge',
    'pull',
    'queue',
    'rate',
    'rateticket',
    'reactionrole',
    'remove',
    'reopen',
    'rename',
    'resetwarns',
    'resume',
    'roast',
    'roll',
    'rps',
    'rsvp',
    'rank',
    'serverinfo',
    'setup-roles',
    'sell',
    'sellcard',
    'sellwaifu',
    'ship',
    'skip',
    'staffapply',
    'staffpanel',
    'stop',
    'suggest',
    'synclevels',
    'syncnick',
    'temprole',
    'ticketconfig',
    'ticketsetup',
    'timeout',
    'toplevels',
    'trade',
    'transcript',
    'unclaim',
    'unmute',
    'untimeout',
    'userinfo',
    'volume',
    'waifu',
    'waifudaily',
    'waifuhelp',
    'waifuodds',
    'waifupull',
    'waifus',
    'vrchat',
    'vrclinked',
    'vrcunverify',
    'vrcverifyconfig',
    'warn'
];

const RESTRICTED_SLASH_COMMAND_NAMES = new Set([
    'add',
    'addrole',
    'automod',
    'ban',
    'case',
    'cases',
    'claim',
    'close',
    'config',
    'editcase',
    'escalate',
    'givecoins',
    'kick',
    'log',
    'massdelete',
    'mute',
    'note',
    'notes',
    'onboarding',
    'purge',
    'rateticket',
    'reactionrole',
    'remove',
    'removerole',
    'reopen',
    'rename',
    'resetwarns',
    'staffpanel',
    'synclevels',
    'temprole',
    'ticketconfig',
    'ticketsetup',
    'timeout',
    'transcript',
    'unclaim',
    'unmute',
    'untimeout',
    'vrcunverify',
    'vrcverifyconfig',
    'warn'
]);

function createGenericSlashCommand(commandName) {

    return {
        name: commandName,
        description: `Runs !${commandName}`,
        options: [
            {
                name: 'args',
                description: `Text after !${commandName}, if needed`,
                type: ApplicationCommandOptionType.String,
                required: false
            }
        ]
    };

}

async function removeRestrictedSlashCommandsForGuilds() {

    for (const guild of client.guilds.cache.values()) {

        try {

            const commands = await guild.commands.fetch();
            const restrictedCommands = commands.filter(command =>
                RESTRICTED_SLASH_COMMAND_NAMES.has(command.name)
            );

            for (const command of restrictedCommands.values()) {
                await guild.commands.delete(command.id);
            }

            if (restrictedCommands.size > 0) {
                console.log(`Removed ${restrictedCommands.size} restricted slash command(s) from ${guild.name}.`);
            }

        } catch (error) {
            console.error(`Failed to remove restricted slash commands for ${guild.id}:`, error);
        }

    }

}

async function registerSlashCommandsForGuilds() {

    const specialSlashCommandNames = new Set([
        'ticket',
        'vrcverify',
        'vrcconfirm',
        'addrole',
        'removerole'
    ]);
    const slashCommands = [
        {
            name: 'ticket',
            description: 'Open a support ticket',
            options: [
                {
                    name: 'type',
                    description: 'Ticket type',
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    choices: DEFAULT_TICKET_TYPES.map(type => ({
                        name: type.label,
                        value: type.id
                    }))
                },
                {
                    name: 'reason',
                    description: 'What do you need help with?',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: 'vrcverify',
            description: 'Start VRChat verification',
            options: [
                {
                    name: 'profile',
                    description: 'VRChat display name or profile URL',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: 'vrcconfirm',
            description: 'Confirm VRChat verification',
            options: [
                {
                    name: 'profile',
                    description: 'Optional VRChat display name or profile URL',
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: 'addrole',
            description: 'Add a role to a member',
            options: [
                {
                    name: 'user',
                    description: 'Member',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'role',
                    description: 'Role',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: 'removerole',
            description: 'Remove a role from a member',
            options: [
                {
                    name: 'user',
                    description: 'Member',
                    type: ApplicationCommandOptionType.User,
                    required: true
                },
                {
                    name: 'role',
                    description: 'Role',
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        }
    ].concat(
        GENERIC_SLASH_COMMAND_NAMES
            .filter(commandName =>
                !specialSlashCommandNames.has(commandName) &&
                !RESTRICTED_SLASH_COMMAND_NAMES.has(commandName)
            )
            .map(createGenericSlashCommand)
    ).filter(command => !RESTRICTED_SLASH_COMMAND_NAMES.has(command.name));

    for (const guild of client.guilds.cache.values()) {
        await guild.commands.set(slashCommands).catch(error => {
            console.error(`Failed to register slash commands for ${guild.id}:`, error);
        });
    }

}

async function handleSlashCommand(interaction) {

    if (!interaction.inGuild()) {
        return interaction.reply({
            content: 'This command only works in a server.',
            ephemeral: true
        });
    }

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);

    if (interaction.commandName === 'ticket') {
        const type = interaction.options.getString('type') || 'general';
        const reason = interaction.options.getString('reason') || 'Opened with a slash command.';
        await interaction.deferReply({
            ephemeral: true
        });
        const result = await createTicketForMember(interaction.guild, member, reason, type).catch(error => ({
            ok: false,
            message: error.message
        }));
        return interaction.editReply(result.ok ? `Ticket created: ${result.channel}` : result.message);
    }

    if (interaction.commandName === 'vrcverify') {
        return handleVrcVerifyStartCommand(createMessageLikeInteraction(interaction, member), [interaction.options.getString('profile')]);
    }

    if (interaction.commandName === 'vrcconfirm') {
        return handleVrcConfirmCommand(
            createMessageLikeInteraction(interaction, member),
            interaction.options.getString('profile') ? [interaction.options.getString('profile')] : []
        );
    }

    if (interaction.commandName === 'addrole' || interaction.commandName === 'removerole') {
        const targetMember = interaction.options.getMember('user');
        const role = interaction.options.getRole('role');
        return handleRoleSlashCommand(interaction, member, targetMember, role, interaction.commandName === 'addrole');
    }

    return handleGenericSlashCommand(interaction, member);

}

function createMessageLikeInteraction(interaction, member) {

    return {
        guild: interaction.guild,
        member,
        author: interaction.user,
        channel: interaction.channel,
        mentions: {
            users: {
                first: () => null
            },
            members: {
                first: () => null
            },
            channels: {
                first: () => null
            }
        },
        reply: async (payload) => {
            if (interaction.replied || interaction.deferred) return interaction.followUp({
                ...(typeof payload === 'string' ? { content: payload } : payload),
                ephemeral: true,
                fetchReply: true
            });
            return interaction.reply({
                ...(typeof payload === 'string' ? { content: payload } : payload),
                ephemeral: true,
                fetchReply: true
            });
        }
    };

}

async function handleRoleSlashCommand(interaction, actingMember, targetMember, role, shouldAddRole) {

    if (!hasServerAdminOrOwnerAccess(actingMember)) {
        return interaction.reply({
            content: 'No permission. Only server admins or the server owner can use this command.',
            ephemeral: true
        });
    }

    if (!targetMember || !role) {
        return interaction.reply({
            content: 'Missing member or role.',
            ephemeral: true
        });
    }

    const botMember = await getBotMember(interaction.guild);

    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
        !canBotAssignRole(botMember, interaction.guild, role)) {
        return interaction.reply({
            content: `I cannot manage **${role.name}**. Check my Manage Roles permission and role position.`,
            ephemeral: true
        });
    }

    if (actingMember.id !== interaction.guild.ownerId && actingMember.roles.highest.comparePositionTo(role) <= 0) {
        return interaction.reply({
            content: 'You cannot manage a role equal to or higher than your highest role.',
            ephemeral: true
        });
    }

    if (shouldAddRole) {
        await targetMember.roles.add(role, `Role added by ${interaction.user.tag}`);
        await createCase(interaction.guild, 'ROLE_ADD', targetMember.id, interaction.user, `Added role ${role.name}.`);
    } else {
        await targetMember.roles.remove(role, `Role removed by ${interaction.user.tag}`);
        await createCase(interaction.guild, 'ROLE_REMOVE', targetMember.id, interaction.user, `Removed role ${role.name}.`);
    }

    await interaction.reply({
        content: `${shouldAddRole ? 'Added' : 'Removed'} **${role.name}** ${shouldAddRole ? 'to' : 'from'} ${targetMember}.`,
        ephemeral: true
    });

}

async function handleGenericSlashCommand(interaction, member) {

    const argsText = interaction.options.getString('args') || '';
    const commandContent = `!${interaction.commandName}${argsText ? ` ${argsText}` : ''}`;

    await interaction.deferReply({
        ephemeral: true
    });

    let replyCount = 0;
    const fakeMessage = {
        id: interaction.id,
        content: commandContent,
        author: interaction.user,
        member,
        guild: interaction.guild,
        channel: interaction.channel,
        client,
        webhookId: null,
        createdTimestamp: Date.now(),
        mentions: {
            users: {
                first: () => null,
                values: () => [][Symbol.iterator]()
            },
            members: {
                first: () => null
            },
            channels: {
                first: () => null
            }
        },
        delete: async () => {},
        reply: async (payload) => {

            replyCount++;

            const responsePayload = typeof payload === 'string'
                ? {
                    content: payload
                }
                : payload;

            if (replyCount === 1) {

                await interaction.editReply(responsePayload).catch(() => {});

                return {
                    id: interaction.id,
                    createdTimestamp: Date.now(),
                    edit: async (editPayload) => interaction.editReply(
                        typeof editPayload === 'string'
                            ? {
                                content: editPayload
                            }
                            : editPayload
                    ).catch(() => {})
                };

            }

            const followUpMessage = await interaction.followUp({
                ...responsePayload,
                ephemeral: true,
                fetchReply: true
            }).catch(() => null);

            return followUpMessage || {
                id: interaction.id,
                createdTimestamp: Date.now(),
                edit: async () => {}
            };

        }
    };

    try {

        await handleMessageCreate(fakeMessage);

        if (replyCount === 0) {
            await interaction.editReply(`Ran \`/${interaction.commandName}\`.`).catch(() => {});
        }

    } catch (error) {

        console.error(`Slash command bridge failed for /${interaction.commandName}:`, error);

        const errorMessage = `Command failed: ${truncateText(error.message, 300)}`;

        if (replyCount === 0) {
            await interaction.editReply(errorMessage).catch(() => {});
        } else {
            await interaction.followUp({
                content: errorMessage,
                ephemeral: true
            }).catch(() => {});
        }

    }

}

function readJsonArrayFile(filePath) {

    if (!fs.existsSync(filePath)) return [];

    try {
        const rawPayload = fs.readFileSync(filePath, 'utf8').trim();

        if (!rawPayload) return [];

        const payload = JSON.parse(rawPayload);
        return Array.isArray(payload) ? payload : [];
    } catch (error) {
        console.error(`Failed to read ${filePath}:`, error);
        return [];
    }

}

function writeJsonArrayFile(filePath, values) {

    try {
        fs.writeFileSync(filePath, JSON.stringify(values, null, 2));
    } catch (error) {
        console.error(`Failed to write ${filePath}:`, error);
    }

}

function getWaifuPlayerKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function normalizeWaifuRecord(record = {}) {

    if (!record || typeof record !== 'object' || !record.id) return null;

    return {
        id: String(record.id),
        ownerId: String(record.ownerId || ''),
        name: String(record.name || 'Unknown Waifu'),
        title: String(record.title || 'Mystery Muse'),
        rarity: String(record.rarity || 'common'),
        rarityLabel: String(record.rarityLabel || 'Common'),
        color: String(record.color || '#95A5A6'),
        value: Math.max(0, Number.parseInt(record.value || '0', 10) || 0),
        shiny: record.shiny === true,
        prompt: String(record.prompt || ''),
        imageFileName: record.imageFileName ? String(record.imageFileName) : null,
        sourceImageFileName: record.sourceImageFileName ? String(record.sourceImageFileName) : null,
        createdAt: record.createdAt || new Date().toISOString()
    };

}

function normalizeWaifuPlayer(record = {}) {

    if (!record || typeof record !== 'object') record = {};

    return {
        guildId: String(record.guildId || ''),
        userId: String(record.userId || ''),
        coins: Math.max(0, Number.parseInt(record.coins || '0', 10) || 0),
        pulls: Math.max(0, Number.parseInt(record.pulls || '0', 10) || 0),
        lastDailyAt: record.lastDailyAt || null,
        collection: Array.isArray(record.collection)
            ? record.collection.map(normalizeWaifuRecord).filter(Boolean)
            : []
    };

}

function loadWaifuPlayers() {

    waifuPlayers.clear();

    for (const savedRecord of readJsonArrayFile(WAIFU_GAME_FILE)) {

        const record = normalizeWaifuPlayer(savedRecord);

        if (record.guildId && record.userId) {
            waifuPlayers.set(getWaifuPlayerKey(record.guildId, record.userId), record);
        }

    }

}

function saveWaifuPlayers() {
    writeJsonArrayFile(WAIFU_GAME_FILE, [...waifuPlayers.values()].map(normalizeWaifuPlayer));
}

function getWaifuPlayer(guildId, userId) {

    return normalizeWaifuPlayer(waifuPlayers.get(getWaifuPlayerKey(guildId, userId)) || {
        guildId,
        userId,
        coins: 0,
        pulls: 0,
        lastDailyAt: null,
        collection: []
    });

}

function getOrCreateWaifuPlayer(guildId, userId) {

    const key = getWaifuPlayerKey(guildId, userId);
    const record = getWaifuPlayer(guildId, userId);

    record.guildId = guildId;
    record.userId = userId;
    waifuPlayers.set(key, record);

    return record;

}

function pickWaifuRarity() {

    const totalWeight = WAIFU_RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const rarity of WAIFU_RARITIES) {

        roll -= rarity.weight;

        if (roll <= 0) return rarity;

    }

    return WAIFU_RARITIES[0];

}

function rollWaifuShiny() {
    return Math.random() * 100 < WAIFU_SHINY_CHANCE_PERCENT;
}

function createWaifuPrompt(waifu) {

    return [
        `masterpiece anime trading card portrait of ${waifu.name}, an original adult woman, ${waifu.title}`,
        `${waifu.rarityLabel} rarity character card, ${waifu.aesthetic}, polished VTuber key visual, sharp clean lineart, detailed eyes, elegant mature proportions`,
        'spicy pin-up glamour, sultry confident expression, boudoir nightclub lighting, cinematic rim light, glossy high-fashion styling',
        'very revealing non-nude outfit, micro bikini or sheer lingerie-inspired clubwear, corset, thigh-highs, latex, bodycon cutouts, exposed shoulders, cleavage, strategic coverage',
        'centered half-body portrait, dynamic pose, premium gacha card art, crisp focus, detailed background, vibrant colors, high detail, no text, no watermark, no logo',
        'negative prompt: low quality, blurry, messy anatomy, bad hands, extra fingers, missing fingers, extra limbs, deformed face, crossed eyes, distorted body, childlike, school uniform, visible nipples, visible genitals, sex act, explicit sexual contact, nude, naked'
    ].join(', ');

}

function createWaifuRecord(ownerId) {

    const rarity = pickWaifuRarity();
    const shiny = rollWaifuShiny();
    const firstName = getRandomItem(WAIFU_FIRST_NAMES);
    const title = getRandomItem(WAIFU_TITLES);
    const aesthetic = getRandomItem(WAIFU_AESTHETICS);
    const waifu = {
        id: crypto.randomBytes(5).toString('hex'),
        ownerId,
        name: `${firstName} ${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        title,
        aesthetic,
        rarity: rarity.id,
        rarityLabel: shiny ? `Shiny ${rarity.label}` : rarity.label,
        color: shiny ? '#FFF176' : rarity.color,
        value: shiny ? Math.round(rarity.value * WAIFU_SHINY_VALUE_MULTIPLIER) : rarity.value,
        shiny,
        prompt: '',
        imageFileName: null,
        sourceImageFileName: null,
        createdAt: new Date().toISOString()
    };

    waifu.prompt = createWaifuPrompt(waifu);

    return waifu;

}

function getWaifuImageExtension(mimeType) {

    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';

}

function saveWaifuImage(waifu, imageData) {

    if (!imageData?.data) return null;

    fs.mkdirSync(WAIFU_IMAGE_DIR, {
        recursive: true
    });

    const extension = getWaifuImageExtension(imageData.mimeType);
    const fileName = `${waifu.id}.${extension}`;
    const filePath = path.join(WAIFU_IMAGE_DIR, fileName);

    fs.writeFileSync(filePath, Buffer.from(imageData.data, 'base64'));
    waifu.imageFileName = fileName;

    return filePath;

}

function getWaifuSourceImageFiles() {

    if (!fs.existsSync(WAIFU_SOURCE_IMAGE_DIR)) {
        fs.mkdirSync(WAIFU_SOURCE_IMAGE_DIR, {
            recursive: true
        });
        return [];
    }

    return fs.readdirSync(WAIFU_SOURCE_IMAGE_DIR, {
        withFileTypes: true
    })
        .filter(entry => entry.isFile())
        .map(entry => entry.name)
        .filter(fileName => WAIFU_IMAGE_EXTENSIONS.includes(path.extname(fileName).toLowerCase()));

}

function copyWaifuImageFromFolder(waifu) {

    const imageFiles = getWaifuSourceImageFiles();

    if (!imageFiles.length) {
        throw new Error(`No waifu images found. Add PNG/JPG/WEBP files to ${WAIFU_SOURCE_IMAGE_DIR}`);
    }

    fs.mkdirSync(WAIFU_IMAGE_DIR, {
        recursive: true
    });

    const sourceFileName = getRandomItem(imageFiles);
    const sourcePath = path.join(WAIFU_SOURCE_IMAGE_DIR, sourceFileName);
    const extension = path.extname(sourceFileName).toLowerCase();
    const targetFileName = `${waifu.id}${extension}`;
    const targetPath = path.join(WAIFU_IMAGE_DIR, targetFileName);

    fs.copyFileSync(sourcePath, targetPath);
    waifu.imageFileName = targetFileName;
    waifu.sourceImageFileName = sourceFileName;

    return targetPath;

}

function getWaifuImageAttachment(waifu) {

    if (!waifu.imageFileName) return null;

    const fileName = path.basename(waifu.imageFileName);
    const filePath = path.join(WAIFU_IMAGE_DIR, fileName);

    if (!fs.existsSync(filePath)) return null;

    return new AttachmentBuilder(filePath, {
        name: fileName
    });

}

async function callGeminiImageModel(model, prompt) {

    if (!GEMINI_API_KEY) {
        throw new Error('Missing GEMINI_API_KEY environment variable.');
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage = data?.error?.message || `Gemini image API error ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.model = model;
        throw error;
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {

        const inlineData = part.inlineData || part.inline_data;

        if (inlineData?.data) {
            return {
                data: inlineData.data,
                mimeType: inlineData.mimeType || inlineData.mime_type || 'image/png'
            };
        }

    }

    const error = new Error('Gemini returned no image data. Set WAIFU_IMAGE_MODEL to an image-capable Gemini model.');
    error.model = model;
    throw error;

}

async function callPollinationsImageModel(prompt) {

    const query = new URLSearchParams({
        width: String(POLLINATIONS_IMAGE_WIDTH),
        height: String(POLLINATIONS_IMAGE_HEIGHT),
        model: POLLINATIONS_IMAGE_MODEL,
        nologo: 'true',
        private: 'true',
        enhance: String(POLLINATIONS_IMAGE_ENHANCE),
        seed: crypto.randomInt(1, 2147483647).toString()
    });
    const response = await fetch(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${query.toString()}`,
        {
            headers: {
                Accept: 'image/png,image/jpeg,image/webp,*/*'
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Pollinations image API error ${response.status}: ${truncateText(errorText || response.statusText, 300)}`);
    }

    const mimeType = (response.headers.get('content-type') || 'image/png').split(';')[0];

    if (!mimeType.startsWith('image/')) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Pollinations returned ${mimeType || 'non-image'} instead of an image: ${truncateText(errorText, 300)}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    return {
        data: imageBuffer.toString('base64'),
        mimeType
    };

}

async function generateGeminiWaifuImage(prompt) {

    let lastError = null;

    for (const model of WAIFU_IMAGE_MODELS) {

        for (let attempt = 1; attempt <= 2; attempt++) {

            try {
                return await callGeminiImageModel(model, prompt);
            } catch (error) {

                lastError = error;

                const temporary = isTemporaryGeminiError(error.status, error.message);

                if (!temporary) break;

                console.warn(`Waifu image model ${model} failed temporarily on attempt ${attempt}: ${error.message}`);
                await wait(1000 * attempt);

            }

        }

    }

    const error = new Error(
        `No Gemini image model worked. Tried: ${WAIFU_IMAGE_MODELS.join(', ')}. ` +
        `Set WAIFU_IMAGE_MODEL to a model your API key can use. Last error: ${lastError?.message || 'unknown error'}`
    );
    error.cause = lastError;
    throw error;

}

async function generateWaifuImage(prompt) {

    if (WAIFU_IMAGE_PROVIDER === 'gemini') {
        return generateGeminiWaifuImage(prompt);
    }

    if (WAIFU_IMAGE_PROVIDER === 'pollinations') {
        return callPollinationsImageModel(prompt);
    }

    throw new Error(`Unknown WAIFU_IMAGE_PROVIDER "${WAIFU_IMAGE_PROVIDER}". Use "folder", "pollinations", or "gemini".`);

}

async function assignWaifuImage(waifu) {

    if (WAIFU_IMAGE_PROVIDER === 'folder') {
        return copyWaifuImageFromFolder(waifu);
    }

    const imageData = await generateWaifuImage(waifu.prompt);
    return saveWaifuImage(waifu, imageData);

}

function buildWaifuPayload(ownerUser, player, waifu, heading = 'Waifu Pull') {

    const attachment = getWaifuImageAttachment(waifu);
    const embed = new EmbedBuilder()
        .setColor(waifu.color || '#FF5FA2')
        .setTitle(`${heading}: ${waifu.name}`)
        .setDescription(`**${waifu.rarityLabel}** ${waifu.title}`)
        .addFields(
            {
                name: 'Owner',
                value: `${ownerUser}`,
                inline: true
            },
            {
                name: 'Value',
                value: `${waifu.value} coins`,
                inline: true
            },
            {
                name: 'ID',
                value: `\`${waifu.id}\``,
                inline: true
            },
            {
                name: 'Balance',
                value: `${player.coins} coins`,
                inline: true
            },
            {
                name: 'Variant',
                value: waifu.shiny ? `Shiny (${WAIFU_SHINY_CHANCE_PERCENT}% chance)` : 'Standard',
                inline: true
            }
        )
        .setTimestamp(new Date(waifu.createdAt || Date.now()));

    if (attachment && waifu.imageFileName) {
        embed.setImage(`attachment://${path.basename(waifu.imageFileName)}`);
    } else {
        embed.addFields({
            name: 'Image',
            value: 'Image file not found.',
            inline: false
        });
    }

    return {
        embeds: [embed],
        files: attachment ? [attachment] : []
    };

}

async function handleWaifuDailyCommand(message) {

    const player = getOrCreateWaifuPlayer(message.guild.id, message.author.id);
    const now = Date.now();
    const lastDailyAt = Date.parse(player.lastDailyAt || '') || 0;
    const nextDailyAt = lastDailyAt + WAIFU_DAILY_COOLDOWN_MS;

    if (lastDailyAt && now < nextDailyAt) {
        return message.reply(`You already claimed your daily coins. Come back <t:${Math.floor(nextDailyAt / 1000)}:R>.`);
    }

    player.coins += WAIFU_DAILY_AMOUNT;
    player.lastDailyAt = new Date(now).toISOString();
    waifuPlayers.set(getWaifuPlayerKey(player.guildId, player.userId), player);
    saveWaifuPlayers();

    await message.reply(`You claimed **${WAIFU_DAILY_AMOUNT} coins**. Balance: **${player.coins} coins**.`);

}

async function handleWaifuBalanceCommand(message, args) {

    const targetUser = await resolveUserFromArgs(message, args) || message.author;
    const player = getWaifuPlayer(message.guild.id, targetUser.id);

    await message.reply(`${targetUser} has **${player.coins} coins** and **${player.collection.length} waifu(s)**.`);

}

async function handleWaifuPullCommand(message) {

    const player = getOrCreateWaifuPlayer(message.guild.id, message.author.id);

    if (player.coins < WAIFU_PULL_COST) {
        return message.reply(`You need **${WAIFU_PULL_COST} coins** to pull. Your balance is **${player.coins} coins**. Use \`!daily\` to claim coins.`);
    }

    const statusMessage = await message.reply(
        WAIFU_IMAGE_PROVIDER === 'folder'
            ? 'Opening the waifu vault...'
            : 'Summoning a custom AI waifu...'
    );
    const waifu = createWaifuRecord(message.author.id);

    try {

        await assignWaifuImage(waifu);

    } catch (error) {

        console.error('Waifu image assignment failed:', error);
        await statusMessage.edit(`Waifu pull failed, so no coins were spent. ${truncateText(error.message, 250)}`).catch(() => {});
        return;

    }

    player.coins -= WAIFU_PULL_COST;
    player.pulls++;
    player.collection.push(normalizeWaifuRecord(waifu));
    waifuPlayers.set(getWaifuPlayerKey(player.guildId, player.userId), player);
    saveWaifuPlayers();

    const payload = buildWaifuPayload(message.author, player, waifu, 'New Waifu');
    payload.content = `${message.author} spent **${WAIFU_PULL_COST} coins** and pulled:`;

    await statusMessage.edit(payload).catch(async () => {
        await message.channel.send(payload);
    });

}

async function handleWaifuCollectionCommand(message, args) {

    const targetUser = await resolveUserFromArgs(message, args) || message.author;
    const pageArg = args.find(arg => /^\d+$/.test(arg) && arg !== targetUser.id);
    const requestedPage = Number.parseInt(pageArg || '1', 10);
    const player = getWaifuPlayer(message.guild.id, targetUser.id);
    const totalPages = Math.max(1, Math.ceil(player.collection.length / WAIFU_COLLECTION_PAGE_SIZE));
    const page = Math.min(Math.max((requestedPage || 1) - 1, 0), totalPages - 1);
    const startIndex = page * WAIFU_COLLECTION_PAGE_SIZE;
    const waifus = player.collection.slice(startIndex, startIndex + WAIFU_COLLECTION_PAGE_SIZE);
    const description = waifus.length
        ? waifus.map((waifu, index) =>
            `#${startIndex + index + 1} - **${waifu.name}** | ${waifu.rarityLabel} | ${waifu.value} coins | \`${waifu.id}\``
        ).join('\n')
        : `No waifus yet. Add images to \`${WAIFU_SOURCE_IMAGE_DIR}\`, use \`!daily\`, then \`!pull\`.`;

    const embed = new EmbedBuilder()
        .setColor('#FF5FA2')
        .setTitle(`${targetUser.username}'s Waifu Collection`)
        .setDescription(description)
        .addFields(
            {
                name: 'Coins',
                value: `${player.coins}`,
                inline: true
            },
            {
                name: 'Total Waifus',
                value: `${player.collection.length}`,
                inline: true
            }
        )
        .setFooter({
            text: `Page ${page + 1} of ${totalPages}`
        })
        .setTimestamp();

    await message.channel.send({
        embeds: [embed]
    });

}

async function handleWaifuShowCommand(message, args) {

    const player = getWaifuPlayer(message.guild.id, message.author.id);
    const lookup = args[0];

    if (!lookup) {
        return message.reply('Usage: `!waifu number-or-id`');
    }

    const index = Number.parseInt(lookup, 10);
    const waifu = Number.isFinite(index) && index > 0
        ? player.collection[index - 1]
        : player.collection.find(record => record.id.toLowerCase().startsWith(String(lookup).toLowerCase()));

    if (!waifu) {
        return message.reply('I could not find that waifu in your collection.');
    }

    await message.channel.send(buildWaifuPayload(message.author, player, waifu, 'Waifu'));

}

async function handleGiveCoinsCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) {
        return message.reply('No permission. Only server admins or the server owner can give waifu coins.');
    }

    const targetUser = await resolveUserFromArgs(message, args);

    if (!targetUser) {
        return message.reply('Usage: `!givecoins @user amount`');
    }

    const targetArgIndex = args.findIndex(arg => getUserIdFromArg(arg) === targetUser.id);
    const amountArg = args.slice(Math.max(targetArgIndex + 1, 0)).find(arg => /^\d+$/.test(arg));
    const amount = Number.parseInt(amountArg || '', 10);

    if (!Number.isFinite(amount) || amount < 1) {
        return message.reply('Choose a coin amount greater than 0. Example: `!givecoins @user 1000`');
    }

    const player = getOrCreateWaifuPlayer(message.guild.id, targetUser.id);
    player.coins += amount;
    waifuPlayers.set(getWaifuPlayerKey(player.guildId, player.userId), player);
    saveWaifuPlayers();

    await message.reply(`Gave **${amount} coins** to ${targetUser}. New balance: **${player.coins} coins**.`);

}

function findWaifuCardByReference(player, reference) {

    const lookup = String(reference || '').trim();

    if (!lookup) return null;

    const index = Number.parseInt(lookup, 10);

    if (/^\d+$/.test(lookup) && index > 0) {
        return {
            waifu: player.collection[index - 1] || null,
            index: index - 1
        };
    }

    const normalizedLookup = lookup.toLowerCase();
    const indexById = player.collection.findIndex(waifu =>
        waifu.id.toLowerCase().startsWith(normalizedLookup)
    );

    return {
        waifu: indexById >= 0 ? player.collection[indexById] : null,
        index: indexById
    };

}

function parseWaifuCoinToken(token) {

    const value = String(token || '').trim().toLowerCase();
    const match = value.match(/^(?:coins?|money|cash):(\d+)$/) ||
        value.match(/^\$(\d+)$/) ||
        value.match(/^(\d+)(?:c|coins?|money|cash)$/);

    return match ? Number.parseInt(match[1], 10) : null;

}

function parseWaifuTradeSide(player, sideText) {

    const result = {
        coins: 0,
        cardIds: [],
        cards: [],
        errors: []
    };
    const tokens = String(sideText || '')
        .replace(/,/g, ' ')
        .split(/\s+/)
        .map(token => token.trim())
        .filter(Boolean);
    const seenCardIds = new Set();

    for (let i = 0; i < tokens.length; i++) {

        const token = tokens[i];
        const lowerToken = token.toLowerCase();

        if (['coin', 'coins', 'money', 'cash'].includes(lowerToken)) {

            const nextAmount = Number.parseInt(tokens[i + 1] || '', 10);

            if (!Number.isFinite(nextAmount) || nextAmount < 1) {
                result.errors.push(`Invalid coin amount after "${token}".`);
                continue;
            }

            result.coins += nextAmount;
            i++;
            continue;

        }

        const coinAmount = parseWaifuCoinToken(token);

        if (coinAmount !== null) {

            if (coinAmount < 1) {
                result.errors.push(`Invalid coin amount "${token}".`);
                continue;
            }

            result.coins += coinAmount;
            continue;

        }

        const found = findWaifuCardByReference(player, token);

        if (!found?.waifu) {
            result.errors.push(`Could not find card "${token}".`);
            continue;
        }

        if (seenCardIds.has(found.waifu.id)) {
            result.errors.push(`Card "${token}" was listed more than once.`);
            continue;
        }

        seenCardIds.add(found.waifu.id);
        result.cardIds.push(found.waifu.id);
        result.cards.push(found.waifu);

    }

    return result;

}

function hasWaifuTradeItems(side) {
    return (side.coins || 0) > 0 || side.cardIds.length > 0;
}

function formatWaifuTradeSide(side, user) {

    const parts = [];

    if (side.cardIds.length) {
        parts.push(side.cards.map(waifu => `**${waifu.name}** (${waifu.rarityLabel}, \`${waifu.id}\`)`).join('\n'));
    }

    if (side.coins > 0) {
        parts.push(`**${side.coins} coins**`);
    }

    return parts.length ? parts.join('\n') : `${user} gives nothing`;

}

function removeWaifuCardsFromPlayer(player, cardIds) {

    const cardIdSet = new Set(cardIds);
    const removedCards = [];

    player.collection = player.collection.filter(waifu => {

        if (!cardIdSet.has(waifu.id)) return true;

        removedCards.push(waifu);
        return false;

    });

    return removedCards;

}

function getWaifuCardsByIds(player, cardIds) {
    return cardIds.map(cardId => player.collection.find(waifu => waifu.id === cardId)).filter(Boolean);
}

function validateWaifuTradeState(trade, fromPlayer, toPlayer) {

    const fromCards = getWaifuCardsByIds(fromPlayer, trade.from.cardIds);
    const toCards = getWaifuCardsByIds(toPlayer, trade.to.cardIds);

    if (fromCards.length !== trade.from.cardIds.length) {
        return 'The sender no longer owns all offered cards.';
    }

    if (toCards.length !== trade.to.cardIds.length) {
        return 'The receiver no longer owns all requested cards.';
    }

    if (fromPlayer.coins < trade.from.coins) {
        return 'The sender no longer has enough coins.';
    }

    if (toPlayer.coins < trade.to.coins) {
        return 'The receiver no longer has enough coins.';
    }

    return null;

}

async function handlePayWaifuCoinsCommand(message, args) {

    const targetUser = await resolveUserFromArgs(message, args);

    if (!targetUser) {
        return message.reply('Usage: `!pay @user amount`');
    }

    if (targetUser.bot || targetUser.id === message.author.id) {
        return message.reply('Choose another real user to pay.');
    }

    const targetArgIndex = args.findIndex(arg => getUserIdFromArg(arg) === targetUser.id);
    const amountArg = args.slice(Math.max(targetArgIndex + 1, 0)).find(arg => /^\d+$/.test(arg));
    const amount = Number.parseInt(amountArg || '', 10);

    if (!Number.isFinite(amount) || amount < 1) {
        return message.reply('Choose a coin amount greater than 0. Example: `!pay @user 250`');
    }

    const sender = getOrCreateWaifuPlayer(message.guild.id, message.author.id);
    const receiver = getOrCreateWaifuPlayer(message.guild.id, targetUser.id);

    if (sender.coins < amount) {
        return message.reply(`You only have **${sender.coins} coins**.`);
    }

    sender.coins -= amount;
    receiver.coins += amount;
    waifuPlayers.set(getWaifuPlayerKey(sender.guildId, sender.userId), sender);
    waifuPlayers.set(getWaifuPlayerKey(receiver.guildId, receiver.userId), receiver);
    saveWaifuPlayers();

    await message.reply(`Paid **${amount} coins** to ${targetUser}. Your balance: **${sender.coins} coins**.`);

}

async function handleSellWaifuCommand(message, args) {

    const lookup = args[0];

    if (!lookup) {
        return message.reply('Usage: `!sellwaifu number-or-id`');
    }

    const player = getOrCreateWaifuPlayer(message.guild.id, message.author.id);
    const found = findWaifuCardByReference(player, lookup);

    if (!found?.waifu || found.index < 0) {
        return message.reply('I could not find that waifu in your collection.');
    }

    const [soldWaifu] = player.collection.splice(found.index, 1);
    player.coins += soldWaifu.value || 0;
    waifuPlayers.set(getWaifuPlayerKey(player.guildId, player.userId), player);
    saveWaifuPlayers();

    await message.reply(`Sold **${soldWaifu.name}** (${soldWaifu.rarityLabel}) for **${soldWaifu.value || 0} coins**. Balance: **${player.coins} coins**.`);

}

async function handleWaifuTradeCommand(message, args) {

    const targetUser = await resolveUserFromArgs(message, args);

    if (!targetUser) {
        return message.reply('Usage: `!trade @user yourCards/coins | theirCards/coins`\nExample: `!trade @user 1 2 100c | 4 50c`');
    }

    if (targetUser.bot || targetUser.id === message.author.id) {
        return message.reply('Choose another real user to trade with.');
    }

    const targetArgIndex = args.findIndex(arg => getUserIdFromArg(arg) === targetUser.id);
    const tradeText = args
        .filter((_, index) => index !== targetArgIndex)
        .join(' ')
        .replace(/<@!?\d{17,20}>/, '')
        .trim();
    const [fromText, toText] = tradeText.split('|').map(part => part.trim());

    if (!fromText || !toText) {
        return message.reply('Usage: `!trade @user yourCards/coins | theirCards/coins`\nUse coin formats like `100c`, `$100`, or `coins:100`.');
    }

    const fromPlayer = getOrCreateWaifuPlayer(message.guild.id, message.author.id);
    const toPlayer = getOrCreateWaifuPlayer(message.guild.id, targetUser.id);
    const fromSide = parseWaifuTradeSide(fromPlayer, fromText);
    const toSide = parseWaifuTradeSide(toPlayer, toText);
    const errors = [...fromSide.errors, ...toSide.errors];

    if (errors.length) {
        return message.reply(errors.slice(0, 5).join('\n'));
    }

    if (!hasWaifuTradeItems(fromSide) || !hasWaifuTradeItems(toSide)) {
        return message.reply('Both sides of a trade need at least one card or coin amount.');
    }

    if (fromPlayer.coins < fromSide.coins) {
        return message.reply(`You only have **${fromPlayer.coins} coins**.`);
    }

    if (toPlayer.coins < toSide.coins) {
        return message.reply(`${targetUser} only has **${toPlayer.coins} coins**.`);
    }

    const tradeId = crypto.randomBytes(4).toString('hex');
    const expiresAt = Date.now() + WAIFU_TRADE_TTL_MS;
    const trade = {
        id: tradeId,
        guildId: message.guild.id,
        channelId: message.channel.id,
        fromUserId: message.author.id,
        toUserId: targetUser.id,
        from: {
            coins: fromSide.coins,
            cardIds: fromSide.cardIds
        },
        to: {
            coins: toSide.coins,
            cardIds: toSide.cardIds
        },
        createdAt: new Date().toISOString(),
        expiresAt
    };

    pendingWaifuTrades.set(tradeId, trade);

    setTimeout(() => {
        pendingWaifuTrades.delete(tradeId);
    }, WAIFU_TRADE_TTL_MS).unref?.();

    const embed = new EmbedBuilder()
        .setColor('#FF5FA2')
        .setTitle('Waifu Trade Offer')
        .setDescription(`${message.author} wants to trade with ${targetUser}.`)
        .addFields(
            {
                name: `${message.author.username} gives`,
                value: truncateText(formatWaifuTradeSide(fromSide, message.author), 1000),
                inline: false
            },
            {
                name: `${targetUser.username} gives`,
                value: truncateText(formatWaifuTradeSide(toSide, targetUser), 1000),
                inline: false
            }
        )
        .setFooter({
            text: `Expires in ${Math.floor(WAIFU_TRADE_TTL_MS / 60000)} minutes`
        })
        .setTimestamp();
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`waifu_trade_accept:${tradeId}`)
            .setLabel('Accept')
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`waifu_trade_decline:${tradeId}`)
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({
        content: `${targetUser}, trade offer from ${message.author}.`,
        embeds: [embed],
        components: [row]
    });

}

async function handleWaifuTradeButton(interaction) {

    const [action, tradeId] = interaction.customId.split(':');
    const trade = pendingWaifuTrades.get(tradeId);

    if (!trade) {
        return interaction.reply({
            content: 'That trade offer expired or was already handled.',
            ephemeral: true
        });
    }

    if (interaction.user.id !== trade.toUserId) {
        return interaction.reply({
            content: 'Only the trade receiver can accept or decline this offer.',
            ephemeral: true
        });
    }

    if (action === 'waifu_trade_decline') {

        pendingWaifuTrades.delete(tradeId);
        await interaction.update({
            content: 'Trade declined.',
            embeds: [],
            components: []
        });
        return;

    }

    const fromPlayer = getOrCreateWaifuPlayer(trade.guildId, trade.fromUserId);
    const toPlayer = getOrCreateWaifuPlayer(trade.guildId, trade.toUserId);
    const validationError = validateWaifuTradeState(trade, fromPlayer, toPlayer);

    if (validationError) {

        pendingWaifuTrades.delete(tradeId);
        await interaction.update({
            content: `Trade failed: ${validationError}`,
            embeds: [],
            components: []
        });
        return;

    }

    const fromCards = removeWaifuCardsFromPlayer(fromPlayer, trade.from.cardIds);
    const toCards = removeWaifuCardsFromPlayer(toPlayer, trade.to.cardIds);

    fromPlayer.coins = fromPlayer.coins - trade.from.coins + trade.to.coins;
    toPlayer.coins = toPlayer.coins - trade.to.coins + trade.from.coins;

    for (const waifu of fromCards) {
        waifu.ownerId = trade.toUserId;
        toPlayer.collection.push(waifu);
    }

    for (const waifu of toCards) {
        waifu.ownerId = trade.fromUserId;
        fromPlayer.collection.push(waifu);
    }

    waifuPlayers.set(getWaifuPlayerKey(fromPlayer.guildId, fromPlayer.userId), fromPlayer);
    waifuPlayers.set(getWaifuPlayerKey(toPlayer.guildId, toPlayer.userId), toPlayer);
    saveWaifuPlayers();
    pendingWaifuTrades.delete(tradeId);

    await interaction.update({
        content: `Trade completed between <@${trade.fromUserId}> and <@${trade.toUserId}>.`,
        embeds: [],
        components: []
    });

}

async function handleWaifuHelpCommand(message) {

    const embed = new EmbedBuilder()
        .setColor('#FF5FA2')
        .setTitle('Waifu Collector Commands')
        .setDescription(`A fake-coin collector game using **${WAIFU_IMAGE_PROVIDER}** images. Coins and waifus have no real-money value.`)
        .addFields(
            {
                name: 'Player',
                value:
`\`!daily\` - Claim daily coins.
\`!coins [@user]\` - Check coins and collection size.
\`!pay @user amount\` - Send coins to another user.
\`!pull\` - Spend ${WAIFU_PULL_COST} coins for one waifu image.
\`!waifuodds\` - Shows rarity odds.
\`!waifus [@user] [page]\` - View a collection.
\`!waifu number-or-id\` - View one waifu image.
\`!sellwaifu number-or-id\` - Sell a card for its value.
\`!trade @user 1 2 100c | 4 50c\` - Trade cards and/or coins.`,
                inline: false
            },
            {
                name: 'Admin',
                value: `\`!givecoins @user amount\` - Give fake waifu coins.`,
                inline: false
            }
        )
        .setTimestamp();

    await message.channel.send({
        embeds: [embed]
    });

}

async function handleWaifuOddsCommand(message) {

    const totalWeight = WAIFU_RARITIES.reduce((sum, rarity) => sum + rarity.weight, 0);
    const odds = WAIFU_RARITIES
        .map(rarity => `**${rarity.label}** - ${((rarity.weight / totalWeight) * 100).toFixed(1)}% | ${rarity.value} coin value`)
        .join('\n');
    const shinyOdds = `\n\n**Shiny Variant** - ${WAIFU_SHINY_CHANCE_PERCENT}% after rarity roll | ${WAIFU_SHINY_VALUE_MULTIPLIER}x value`;

    const embed = new EmbedBuilder()
        .setColor('#FF5FA2')
        .setTitle('Waifu Pull Odds')
        .setDescription(odds + shinyOdds)
        .setFooter({
            text: `Each pull costs ${WAIFU_PULL_COST} fake coins. No real-money value.`
        })
        .setTimestamp();

    await message.channel.send({
        embeds: [embed]
    });

}

function getGuildCaseStore(guildId) {

    if (!caseStores.has(guildId)) {
        caseStores.set(guildId, {
            nextCaseId: 1,
            cases: []
        });
    }

    return caseStores.get(guildId);

}

function loadCases() {

    const records = readJsonArrayFile(CASES_FILE);
    caseStores.clear();

    for (const record of records) {

        if (!record?.guildId || !record?.caseId) continue;

        const store = getGuildCaseStore(record.guildId);
        store.cases.push(record);
        store.nextCaseId = Math.max(store.nextCaseId, Number(record.caseId) + 1);

    }

}

function saveCases() {
    writeJsonArrayFile(CASES_FILE, [...caseStores.values()].flatMap(store => store.cases));
}

function createCaseEmbed(caseRecord, guild) {

    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Case #${caseRecord.caseId} - ${caseRecord.type}`)
        .addFields(
            {
                name: 'Target',
                value: caseRecord.targetUserId ? `<@${caseRecord.targetUserId}> (${caseRecord.targetUserId})` : 'None',
                inline: false
            },
            {
                name: 'Moderator/System',
                value: `${caseRecord.moderatorTag || caseRecord.moderatorId} (${caseRecord.moderatorId})`,
                inline: false
            },
            {
                name: 'Reason',
                value: truncateText(caseRecord.reason || 'No reason provided.', 1000),
                inline: false
            },
            ...(caseRecord.ticketChannelId ? [
                {
                    name: 'Ticket Channel ID',
                    value: caseRecord.ticketChannelId,
                    inline: true
                }
            ] : [])
        )
        .setFooter({
            text: guild?.name || 'Case Log'
        })
        .setTimestamp(new Date(caseRecord.createdAt));

}

async function createCase(guild, type, targetUserId, moderatorUser, reason = 'No reason provided.', extra = {}) {

    const store = getGuildCaseStore(guild.id);
    const caseRecord = {
        guildId: guild.id,
        caseId: store.nextCaseId++,
        type,
        targetUserId: targetUserId || null,
        moderatorId: moderatorUser?.id || client.user.id,
        moderatorTag: moderatorUser?.tag || moderatorUser?.username || client.user.username,
        reason,
        createdAt: new Date().toISOString(),
        editedAt: null,
        ...extra
    };

    store.cases.push(caseRecord);
    saveCases();

    const logChannel = getLogChannel(guild);

    if (logChannel) {
        logChannel.send({
            embeds: [createCaseEmbed(caseRecord, guild)]
        }).catch(() => {});
    }

    return caseRecord;

}

function findCase(guildId, caseId) {
    return getGuildCaseStore(guildId).cases.find(caseRecord => String(caseRecord.caseId) === String(caseId)) || null;
}

async function handleCaseCommand(message, args) {

    if (!hasModAccess(message.member)) return message.reply('No permission.');

    const caseRecord = findCase(message.guild.id, args[0]);

    if (!caseRecord) return message.reply('I could not find that case ID.');

    await message.channel.send({
        embeds: [createCaseEmbed(caseRecord, message.guild)],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleCasesCommand(message, args) {

    if (!hasModAccess(message.member)) return message.reply('No permission.');

    const targetUser = await resolveUserFromArgs(message, args);

    if (!targetUser) return message.reply('Usage: `!cases @user/userID`');

    const cases = getGuildCaseStore(message.guild.id).cases
        .filter(caseRecord => caseRecord.targetUserId === targetUser.id)
        .slice(-10);

    if (!cases.length) return message.reply(`No cases found for ${targetUser.tag}.`);

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`Cases for ${targetUser.tag}`)
                .setDescription(cases.map(caseRecord =>
                    `**#${caseRecord.caseId}** ${caseRecord.type} - <t:${Math.floor(Date.parse(caseRecord.createdAt) / 1000)}:R>\n${truncateText(caseRecord.reason, 220)}`
                ).join('\n\n'))
                .setTimestamp()
        ],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleEditCaseCommand(message, args) {

    if (!hasModAccess(message.member)) return message.reply('No permission.');

    const caseRecord = findCase(message.guild.id, args[0]);
    const reason = args.slice(1).join(' ').trim();

    if (!caseRecord || !reason) return message.reply('Usage: `!editcase caseId new reason`');

    caseRecord.reason = reason;
    caseRecord.editedAt = new Date().toISOString();
    caseRecord.editedBy = message.author.id;
    saveCases();

    await message.reply(`Updated case **#${caseRecord.caseId}**.`);

}

function parseDurationMs(input) {

    const match = String(input || '').trim().match(/^(\d+)(s|m|h|d|w)$/i);

    if (!match) return null;

    const amount = Number.parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];

}

function formatDurationFromMs(ms) {

    if (ms >= 7 * 24 * 60 * 60 * 1000 && ms % (7 * 24 * 60 * 60 * 1000) === 0) return `${ms / (7 * 24 * 60 * 60 * 1000)}w`;
    if (ms >= 24 * 60 * 60 * 1000 && ms % (24 * 60 * 60 * 1000) === 0) return `${ms / (24 * 60 * 60 * 1000)}d`;
    if (ms >= 60 * 60 * 1000 && ms % (60 * 60 * 1000) === 0) return `${ms / (60 * 60 * 1000)}h`;
    if (ms >= 60 * 1000 && ms % (60 * 1000) === 0) return `${ms / (60 * 1000)}m`;
    return `${Math.round(ms / 1000)}s`;

}

function loadTempRoles() {

    tempRoles.clear();

    for (const record of readJsonArrayFile(TEMP_ROLES_FILE)) {
        if (record?.guildId && record?.userId && record?.roleId && record?.expiresAt) {
            tempRoles.set(record.id || `${record.guildId}:${record.userId}:${record.roleId}:${record.expiresAt}`, record);
        }
    }

}

function saveTempRoles() {
    writeJsonArrayFile(TEMP_ROLES_FILE, [...tempRoles.values()]);
}

function scheduleTempRoleRemovals() {

    for (const record of tempRoles.values()) {
        scheduleTempRoleRemoval(record);
    }

}

function scheduleTempRoleRemoval(record) {

    const delay = Math.max(1000, Date.parse(record.expiresAt) - Date.now());

    setTimeout(() => {
        removeExpiredTempRole(record.id).catch(error => console.error('Temp role removal failed:', error));
    }, Math.min(delay, 2 ** 31 - 1));

}

async function removeExpiredTempRole(recordId) {

    const record = tempRoles.get(recordId);

    if (!record) return;

    if (Date.parse(record.expiresAt) > Date.now() + 1000) {
        scheduleTempRoleRemoval(record);
        return;
    }

    const guild = client.guilds.cache.get(record.guildId);
    const member = guild ? await guild.members.fetch(record.userId).catch(() => null) : null;

    if (member?.roles.cache.has(record.roleId)) {
        await member.roles.remove(record.roleId, 'Temporary role expired.').catch(() => {});
    }

    tempRoles.delete(recordId);
    saveTempRoles();

}

async function handleTempRoleCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) return message.reply('No permission. Only server admins or the server owner can use this command.');

    const target = await resolveMemberFromArgs(message, args);
    const durationMs = parseDurationMs(args[args.length - 1]);
    const role = await resolveRoleFromArg(message, args.slice(1, -1).join(' '));

    if (!target || !role || !durationMs) return message.reply('Usage: `!temprole @user/userID @role 7d`');

    const botMember = await getBotMember(message.guild);

    if (!botMember?.permissions.has(PermissionsBitField.Flags.ManageRoles) || !canBotAssignRole(botMember, message.guild, role)) {
        return message.reply('I cannot manage that role. Check my Manage Roles permission and role position.');
    }

    await target.roles.add(role, `Temporary role added by ${message.author.tag}`);

    const record = {
        id: crypto.randomBytes(5).toString('hex'),
        guildId: message.guild.id,
        userId: target.id,
        roleId: role.id,
        addedBy: message.author.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + durationMs).toISOString()
    };

    tempRoles.set(record.id, record);
    saveTempRoles();
    scheduleTempRoleRemoval(record);

    await createCase(message.guild, 'TEMP_ROLE', target.id, message.author, `Added ${role.name} for ${formatDurationFromMs(durationMs)}.`);
    await message.reply(`Added **${role.name}** to ${target} for **${formatDurationFromMs(durationMs)}**.`);

}

function loadGiveaways() {

    giveaways.clear();

    for (const record of readJsonArrayFile(GIVEAWAYS_FILE)) {
        if (record?.guildId && record?.id) giveaways.set(`${record.guildId}:${record.id}`, record);
    }

}

function saveGiveaways() {
    writeJsonArrayFile(GIVEAWAYS_FILE, [...giveaways.values()]);
}

function scheduleGiveawayEnds() {

    for (const record of giveaways.values()) {
        if (!record.ended) scheduleGiveawayEnd(record);
    }

}

function scheduleGiveawayEnd(record) {

    const delay = Math.max(1000, Date.parse(record.endsAt) - Date.now());

    setTimeout(() => {
        endGiveaway(record.guildId, record.id).catch(error => console.error('Giveaway end failed:', error));
    }, Math.min(delay, 2 ** 31 - 1));

}

function createGiveawayEmbed(record) {

    return new EmbedBuilder()
        .setColor(record.ended ? '#ED4245' : '#57F287')
        .setTitle(record.ended ? `Giveaway Ended: ${record.prize}` : `Giveaway: ${record.prize}`)
        .setDescription(record.ended ? 'This giveaway has ended.' : 'Click Enter Giveaway to join.')
        .addFields(
            {
                name: 'Ends',
                value: `<t:${Math.floor(Date.parse(record.endsAt) / 1000)}:R>`,
                inline: true
            },
            {
                name: 'Winners',
                value: `${record.winnerCount}`,
                inline: true
            },
            {
                name: 'Entries',
                value: `${record.entries?.length || 0}`,
                inline: true
            }
        )
        .setFooter({
            text: `Giveaway ID: ${record.id}`
        })
        .setTimestamp();

}

function createGiveawayRow(record) {

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`giveaway_join:${record.id}`)
            .setLabel(record.ended ? 'Ended' : 'Enter Giveaway')
            .setStyle(ButtonStyle.Success)
            .setDisabled(Boolean(record.ended))
    );

}

function pickGiveawayWinners(record) {

    const entries = [...new Set(record.entries || [])].sort(() => Math.random() - 0.5);

    return entries.slice(0, Math.min(record.winnerCount || 1, entries.length));

}

async function endGiveaway(guildId, giveawayId) {

    const record = giveaways.get(`${guildId}:${giveawayId}`);

    if (!record || record.ended) return;

    record.ended = true;
    record.winners = pickGiveawayWinners(record);
    giveaways.set(`${guildId}:${giveawayId}`, record);
    saveGiveaways();

    const guild = client.guilds.cache.get(guildId);
    const channel = guild?.channels.cache.get(record.channelId) ||
        await guild?.channels.fetch(record.channelId).catch(() => null);

    if (channel?.isTextBased?.()) {
        const giveawayMessage = await channel.messages.fetch(record.messageId).catch(() => null);
        await giveawayMessage?.edit({
            embeds: [createGiveawayEmbed(record)],
            components: [createGiveawayRow(record)]
        }).catch(() => {});
        await channel.send(`Giveaway ended: **${record.prize}**\nWinner(s): ${record.winners.length ? record.winners.map(userId => `<@${userId}>`).join(', ') : 'No valid entries.'}`).catch(() => {});
    }

}

async function handleGiveawayCommand(message, args) {

    const subcommand = args.shift()?.toLowerCase();

    if (subcommand === 'create') {

        if (!hasModAccess(message.member)) return message.reply('No permission.');

        const [prize, durationText, winnerText] = args.join(' ').split('|').map(part => part?.trim());
        const durationMs = parseDurationMs(durationText);
        const winnerCount = Math.max(1, Number.parseInt(winnerText || '1', 10) || 1);

        if (!prize || !durationMs) return message.reply('Usage: `!giveaway create prize | 1d | winners`');

        const record = {
            id: crypto.randomBytes(3).toString('hex'),
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: null,
            prize,
            winnerCount,
            entries: [],
            winners: [],
            ended: false,
            createdBy: message.author.id,
            createdAt: new Date().toISOString(),
            endsAt: new Date(Date.now() + durationMs).toISOString()
        };

        const giveawayMessage = await message.channel.send({
            embeds: [createGiveawayEmbed(record)],
            components: [createGiveawayRow(record)]
        });

        record.messageId = giveawayMessage.id;
        giveaways.set(`${message.guild.id}:${record.id}`, record);
        saveGiveaways();
        scheduleGiveawayEnd(record);
        await message.reply(`Giveaway **${record.id}** created.`);
        return;

    }

    if (subcommand === 'end') {
        if (!hasModAccess(message.member)) return message.reply('No permission.');
        await endGiveaway(message.guild.id, args[0]);
        return message.reply('Giveaway ended.');
    }

    if (subcommand === 'reroll') {
        if (!hasModAccess(message.member)) return message.reply('No permission.');
        const record = giveaways.get(`${message.guild.id}:${args[0]}`);
        if (!record || !record.ended) return message.reply('I could not find an ended giveaway with that ID.');
        const winners = pickGiveawayWinners(record);
        record.winners = winners;
        saveGiveaways();
        return message.channel.send(`Rerolled **${record.prize}** winner(s): ${winners.length ? winners.map(userId => `<@${userId}>`).join(', ') : 'No valid entries.'}`);
    }

    await message.reply('Usage: `!giveaway create prize | 1d | winners`, `!giveaway end id`, or `!giveaway reroll id`');

}

async function handleGiveawayButton(interaction) {

    const giveawayId = interaction.customId.split(':')[1];
    const record = giveaways.get(`${interaction.guild.id}:${giveawayId}`);

    if (!record || record.ended) {
        return interaction.reply({
            content: 'This giveaway is not active.',
            ephemeral: true
        });
    }

    record.entries = record.entries || [];

    if (record.entries.includes(interaction.user.id)) {
        return interaction.reply({
            content: 'You are already entered.',
            ephemeral: true
        });
    }

    record.entries.push(interaction.user.id);
    giveaways.set(`${interaction.guild.id}:${record.id}`, record);
    saveGiveaways();

    await interaction.reply({
        content: `You entered **${record.prize}**.`,
        ephemeral: true
    });

    const giveawayMessage = await interaction.channel.messages.fetch(record.messageId).catch(() => null);
    await giveawayMessage?.edit({
        embeds: [createGiveawayEmbed(record)],
        components: [createGiveawayRow(record)]
    }).catch(() => {});

}

function loadPolls() {

    polls.clear();

    for (const record of readJsonArrayFile(POLLS_FILE)) {
        if (record?.guildId && record?.id) polls.set(`${record.guildId}:${record.id}`, record);
    }

}

function savePolls() {
    writeJsonArrayFile(POLLS_FILE, [...polls.values()]);
}

function createPollEmbed(record) {

    return new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle(record.question)
        .setDescription(record.options.map((option, index) => {
            const votes = Object.values(record.votes || {}).filter(vote => vote === index).length;
            return `**${index + 1}.** ${option} - ${votes} vote(s)`;
        }).join('\n'))
        .setFooter({
            text: `Poll ID: ${record.id}`
        })
        .setTimestamp();

}

function createPollRows(record) {

    const buttons = record.options.map((option, index) =>
        new ButtonBuilder()
            .setCustomId(`poll_vote:${record.id}:${index}`)
            .setLabel(String(index + 1))
            .setStyle(ButtonStyle.Primary)
    );
    const rows = [];

    for (let i = 0; i < buttons.length; i += 5) {
        rows.push(new ActionRowBuilder().addComponents(...buttons.slice(i, i + 5)));
    }

    return rows;

}

async function handlePollCommand(message, args) {

    const parts = args.join(' ').split('|').map(part => part.trim()).filter(Boolean);
    const question = parts.shift();

    if (!question || parts.length < 2 || parts.length > 10) {
        return message.reply('Usage: `!poll question | option 1 | option 2`');
    }

    const record = {
        id: crypto.randomBytes(3).toString('hex'),
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: null,
        question,
        options: parts,
        votes: {},
        createdBy: message.author.id,
        createdAt: new Date().toISOString()
    };

    const pollMessage = await message.channel.send({
        embeds: [createPollEmbed(record)],
        components: createPollRows(record)
    });

    record.messageId = pollMessage.id;
    polls.set(`${message.guild.id}:${record.id}`, record);
    savePolls();
    await message.reply(`Poll **${record.id}** created.`);

}

async function handlePollButton(interaction) {

    const [, pollId, optionIndexText] = interaction.customId.split(':');
    const record = polls.get(`${interaction.guild.id}:${pollId}`);
    const optionIndex = Number.parseInt(optionIndexText, 10);

    if (!record || !record.options[optionIndex]) {
        return interaction.reply({
            content: 'This poll is no longer available.',
            ephemeral: true
        });
    }

    record.votes = record.votes || {};
    record.votes[interaction.user.id] = optionIndex;
    polls.set(`${interaction.guild.id}:${record.id}`, record);
    savePolls();

    await interaction.reply({
        content: `Your vote was saved for **${record.options[optionIndex]}**.`,
        ephemeral: true
    });

    const pollMessage = await interaction.channel.messages.fetch(record.messageId).catch(() => null);
    await pollMessage?.edit({
        embeds: [createPollEmbed(record)],
        components: createPollRows(record)
    }).catch(() => {});

}

function getXpRecordKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function normalizeXpRecord(record = {}) {

    if (!record || typeof record !== 'object') record = {};

    const normalized = {
        ...record
    };

    normalized.guildId = String(record.guildId || '');
    normalized.userId = String(record.userId || '');
    normalized.xp = Math.max(0, Number.parseInt(record.xp || '0', 10) || 0);
    normalized.messages = Math.max(0, Number.parseInt(record.messages || '0', 10) || 0);

    return normalized;

}

function syncXpToTrackedMessages(record) {

    record.xp = Math.max(
        record.xp || 0,
        (record.messages || 0) * XP_PER_TRACKED_MESSAGE
    );

    return record;

}

function loadXpRecords() {

    xpRecords.clear();

    for (const savedRecord of readJsonArrayFile(XP_FILE)) {

        const record = syncXpToTrackedMessages(normalizeXpRecord(savedRecord));

        if (record.guildId && record.userId) {
            xpRecords.set(getXpRecordKey(record.guildId, record.userId), record);
        }

    }

}

function saveXpRecords() {
    writeJsonArrayFile(
        XP_FILE,
        [...xpRecords.values()].map(record => syncXpToTrackedMessages(normalizeXpRecord(record)))
    );
}

function getOrCreateXpRecord(guildId, userId) {

    const key = getXpRecordKey(guildId, userId);
    const record = normalizeXpRecord(xpRecords.get(key) || {
        guildId,
        userId,
        xp: 0,
        messages: 0
    });

    record.guildId = guildId;
    record.userId = userId;
    syncXpToTrackedMessages(record);
    xpRecords.set(key, record);

    return record;

}

function getXpLevel(xp) {
    return Math.floor(Math.sqrt((xp || 0) / 100));
}

function getXpRankEntries(guildId) {

    return [...xpRecords.values()]
        .map(record => syncXpToTrackedMessages(normalizeXpRecord(record)))
        .filter(record => record.guildId === guildId && ((record.xp || 0) > 0 || (record.messages || 0) > 0))
        .sort((left, right) =>
            (right.xp || 0) - (left.xp || 0) ||
            (right.messages || 0) - (left.messages || 0) ||
            left.userId.localeCompare(right.userId)
        );

}

async function addXpForMessage(message) {

    if (!message.guild || message.author.bot || message.content.startsWith('!')) return;

    const record = getOrCreateXpRecord(message.guild.id, message.author.id);
    const oldLevel = getXpLevel(record.xp);

    record.messages++;
    syncXpToTrackedMessages(record);
    record.updatedAt = new Date().toISOString();
    xpRecords.set(getXpRecordKey(record.guildId, record.userId), record);
    saveXpRecords();

    const newLevel = getXpLevel(record.xp);

    if (newLevel > oldLevel && newLevel > 0) {
        message.channel.send(`${message.author} reached level **${newLevel}**.`).catch(() => {});
    }

}

async function handleRankCommand(message, args) {

    const targetUser = await resolveUserFromArgs(message, args) || message.author;
    const record = syncXpToTrackedMessages(normalizeXpRecord(xpRecords.get(getXpRecordKey(message.guild.id, targetUser.id)) || {
        guildId: message.guild.id,
        userId: targetUser.id,
        xp: 0,
        messages: 0
    }));
    const rankEntries = getXpRankEntries(message.guild.id);
    const rankIndex = rankEntries.findIndex(entry => entry.userId === targetUser.id);

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(`Rank for ${targetUser.tag || targetUser.username}`)
                .addFields(
                    {
                        name: 'Level',
                        value: `${getXpLevel(record.xp)}`,
                        inline: true
                    },
                    {
                        name: 'XP',
                        value: `${record.xp || 0}`,
                        inline: true
                    },
                    {
                        name: 'Tracked Messages',
                        value: `${record.messages || 0}`,
                        inline: true
                    },
                    {
                        name: 'Server Rank',
                        value: rankIndex >= 0 ? `#${rankIndex + 1} of ${rankEntries.length}` : 'Unranked',
                        inline: true
                    }
                )
                .setTimestamp()
        ]
    });

}

function clampTopLevelsPage(page, totalPages) {
    return Math.min(Math.max(page, 0), Math.max(totalPages - 1, 0));
}

async function createTopLevelsPayload(guild, requesterId, page = 0) {

    const rankEntries = getXpRankEntries(guild.id);
    const totalPages = Math.max(1, Math.ceil(rankEntries.length / TOP_LEVELS_PAGE_SIZE));
    const safePage = clampTopLevelsPage(page, totalPages);
    const startIndex = safePage * TOP_LEVELS_PAGE_SIZE;
    const pageEntries = rankEntries.slice(startIndex, startIndex + TOP_LEVELS_PAGE_SIZE);
    const users = await Promise.all(
        pageEntries.map(entry => client.users.fetch(entry.userId).catch(() => null))
    );
    const description = pageEntries.length
        ? pageEntries.map((entry, index) => {
            const user = users[index];
            const label = user ? user.tag : `<@${entry.userId}>`;
            const place = startIndex + index + 1;

            return `#${place} - ${label} | Level ${getXpLevel(entry.xp)} | ${entry.xp || 0} XP | ${entry.messages || 0} messages`;
        }).join('\n')
        : 'No level data yet. Use `!synclevels` to backfill old messages, or wait for new messages to be tracked.';

    const embed = new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('Top Levels')
        .setDescription(description)
        .setFooter({
            text: `Page ${safePage + 1} of ${totalPages} | ${rankEntries.length} ranked user(s)`
        })
        .setTimestamp();

    return {
        embeds: [embed],
        components: [createTopLevelsPaginationRow(requesterId, safePage, totalPages)]
    };

}

function createTopLevelsPaginationRow(requesterId, page, totalPages) {

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`toplevels:${requesterId}:${Math.max(page - 1, 0)}`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 0),
        new ButtonBuilder()
            .setCustomId(`toplevels:${requesterId}:${Math.min(page + 1, totalPages - 1)}`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
    );

}

async function handleTopLevelsCommand(message, args) {

    const requestedPage = Number.parseInt(args[0] || '1', 10);
    const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage - 1 : 0;
    const payload = await createTopLevelsPayload(message.guild, message.author.id, page);

    await message.channel.send(payload);

}

async function handleTopLevelsButton(interaction) {

    const [, requesterId, pageText] = interaction.customId.split(':');

    if (interaction.user.id !== requesterId) {
        return interaction.reply({
            content: 'Only the person who opened this leaderboard can change its page.',
            ephemeral: true
        });
    }

    const requestedPage = Number.parseInt(pageText || '0', 10);
    const page = Number.isFinite(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
    const payload = await createTopLevelsPayload(interaction.guild, requesterId, page);

    await interaction.update(payload);

}

function canTrackXpHistoryInChannel(channel, botMember) {

    if (!channel?.isTextBased?.() || !channel.messages?.fetch) return false;

    const permissions = channel.permissionsFor(botMember);

    return permissions?.has([
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ReadMessageHistory
    ]);

}

async function addXpHistoryChannel(channel, botMember, channels, seenChannelIds, stats) {

    if (!channel || seenChannelIds.has(channel.id)) return;

    seenChannelIds.add(channel.id);

    if (canTrackXpHistoryInChannel(channel, botMember)) {
        channels.push(channel);
        return;
    }

    if (channel?.isTextBased?.() && channel.messages?.fetch) {
        stats.channelsSkipped++;
    }

}

async function collectXpHistoryChannels(guild, botMember, stats) {

    const channels = [];
    const seenChannelIds = new Set();
    const guildChannels = await guild.channels.fetch();

    for (const channel of guildChannels.values()) {

        await addXpHistoryChannel(channel, botMember, channels, seenChannelIds, stats);

        if (!channel?.threads?.fetchActive) continue;

        const activeThreads = await channel.threads.fetchActive().catch(() => null);

        if (!activeThreads?.threads) continue;

        for (const thread of activeThreads.threads.values()) {
            await addXpHistoryChannel(thread, botMember, channels, seenChannelIds, stats);
        }

    }

    return channels;

}

function addHistoryMessageToXpCounts(fetchedMessage, guildId, userMessageCounts) {

    if (!fetchedMessage.author?.id || fetchedMessage.author.bot || fetchedMessage.webhookId) return false;
    if (fetchedMessage.guild?.id && fetchedMessage.guild.id !== guildId) return false;
    if (String(fetchedMessage.content || '').startsWith('!')) return false;

    const userId = fetchedMessage.author.id;
    userMessageCounts.set(userId, (userMessageCounts.get(userId) || 0) + 1);

    return true;

}

function formatXpHistorySyncStatus(stats, isFinished = false) {

    const status = isFinished ? 'Finished' : 'Working';

    return `${status} level history sync.\n` +
        `Channels scanned: **${stats.channelsScanned}/${stats.totalChannels}**\n` +
        `Messages checked: **${stats.messagesChecked}**\n` +
        `Member messages counted: **${stats.memberMessages}**\n` +
        `Users found: **${stats.usersFound}**\n` +
        `Users updated: **${stats.usersUpdated}**\n` +
        `Skipped channels: **${stats.channelsSkipped}**\n` +
        `Channel errors: **${stats.channelErrors}**`;

}

async function handleSyncLevelsCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) {
        return message.reply('No permission. Only server admins or the server owner can sync level history.');
    }

    const parsedLimit = Number.parseInt(args[0] || '', 10);
    const perChannelLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
    const botMember = message.guild.members.me ||
        await message.guild.members.fetchMe().catch(() => null);

    if (!botMember) {
        return message.reply('I could not check my server permissions.');
    }

    const stats = {
        totalChannels: 0,
        channelsScanned: 0,
        channelsSkipped: 0,
        channelErrors: 0,
        messagesChecked: 0,
        memberMessages: 0,
        usersFound: 0,
        usersUpdated: 0
    };
    const userMessageCounts = new Map();
    const statusMessage = await message.reply(
        `Starting level history sync${perChannelLimit ? `, up to ${perChannelLimit} messages per channel` : ''}.`
    );

    try {

        const channels = await collectXpHistoryChannels(message.guild, botMember, stats);
        stats.totalChannels = channels.length;

        if (!channels.length) {
            await statusMessage.edit('I could not access any text channels with View Channel and Read Message History.');
            return;
        }

        let lastStatusUpdate = Date.now();

        for (const channel of channels) {

            stats.channelsScanned++;

            try {

                let before;
                let channelMessagesChecked = 0;

                while (true) {

                    const remainingForChannel = perChannelLimit
                        ? perChannelLimit - channelMessagesChecked
                        : XP_HISTORY_PAGE_SIZE;

                    if (remainingForChannel <= 0) break;

                    const fetchLimit = Math.min(XP_HISTORY_PAGE_SIZE, remainingForChannel);
                    const fetchedMessages = await channel.messages.fetch({
                        limit: fetchLimit,
                        before
                    });

                    if (!fetchedMessages.size) break;

                    before = fetchedMessages.last()?.id;
                    channelMessagesChecked += fetchedMessages.size;
                    stats.messagesChecked += fetchedMessages.size;

                    for (const fetchedMessage of fetchedMessages.values()) {
                        if (addHistoryMessageToXpCounts(fetchedMessage, message.guild.id, userMessageCounts)) {
                            stats.memberMessages++;
                        }
                    }

                    stats.usersFound = userMessageCounts.size;

                    if (Date.now() - lastStatusUpdate >= XP_HISTORY_STATUS_INTERVAL_MS) {

                        lastStatusUpdate = Date.now();
                        await statusMessage.edit(formatXpHistorySyncStatus(stats)).catch(() => {});

                    }

                    if (fetchedMessages.size < fetchLimit || !before) break;

                }

            } catch (error) {

                stats.channelErrors++;
                console.error(`Level history sync failed in ${channel.id}:`, error);

            }

        }

        const syncedAt = new Date().toISOString();

        for (const [userId, messageCount] of userMessageCounts.entries()) {

            const record = getOrCreateXpRecord(message.guild.id, userId);
            const oldMessages = record.messages || 0;
            const oldXp = record.xp || 0;

            record.messages = Math.max(oldMessages, messageCount);
            syncXpToTrackedMessages(record);
            record.historySyncedAt = syncedAt;
            record.updatedAt = syncedAt;
            xpRecords.set(getXpRecordKey(record.guildId, record.userId), record);

            if (record.messages !== oldMessages || record.xp !== oldXp) {
                stats.usersUpdated++;
            }

        }

        saveXpRecords();
        stats.usersFound = userMessageCounts.size;

        await statusMessage.edit(formatXpHistorySyncStatus(stats, true)).catch(() => {});

    } catch (error) {

        console.error('Level history sync failed:', error);
        await statusMessage.edit('Level history sync failed. Check the console for details.').catch(() => {});

    }

}

function loadSuggestions() {

    suggestions.clear();

    for (const record of readJsonArrayFile(SUGGESTIONS_FILE)) {
        if (record?.guildId && record?.id) suggestions.set(`${record.guildId}:${record.id}`, record);
    }

}

function saveSuggestions() {
    writeJsonArrayFile(SUGGESTIONS_FILE, [...suggestions.values()]);
}

function createSuggestionEmbed(record) {

    return new EmbedBuilder()
        .setColor(record.status === 'approved' ? '#57F287' : record.status === 'denied' ? '#ED4245' : '#FEE75C')
        .setTitle(`Suggestion ${record.status || 'pending'}: ${record.id}`)
        .setDescription(record.text)
        .addFields(
            {
                name: 'Submitted By',
                value: `<@${record.authorId}>`,
                inline: true
            },
            {
                name: 'Status',
                value: record.status || 'pending',
                inline: true
            }
        )
        .setTimestamp(new Date(record.createdAt));

}

function createSuggestionRow(record) {

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`suggestion_approve:${record.id}`)
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success)
            .setDisabled(record.status !== 'pending'),
        new ButtonBuilder()
            .setCustomId(`suggestion_deny:${record.id}`)
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(record.status !== 'pending')
    );

}

async function handleSuggestCommand(message, args) {

    const text = args.join(' ').trim();

    if (!text) return message.reply('Usage: `!suggest your idea`');

    const record = {
        id: crypto.randomBytes(3).toString('hex'),
        guildId: message.guild.id,
        channelId: message.channel.id,
        messageId: null,
        authorId: message.author.id,
        text,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const suggestionMessage = await message.channel.send({
        embeds: [createSuggestionEmbed(record)],
        components: [createSuggestionRow(record)],
        allowedMentions: {
            parse: []
        }
    });

    record.messageId = suggestionMessage.id;
    suggestions.set(`${message.guild.id}:${record.id}`, record);
    saveSuggestions();
    await message.reply(`Suggestion **${record.id}** submitted.`);

}

async function handleSuggestionButton(interaction) {

    if (!hasModAccess(interaction.member)) {
        return interaction.reply({
            content: 'No permission.',
            ephemeral: true
        });
    }

    const [action, suggestionId] = interaction.customId.split(':');
    const record = suggestions.get(`${interaction.guild.id}:${suggestionId}`);

    if (!record || record.status !== 'pending') {
        return interaction.reply({
            content: 'This suggestion is no longer pending.',
            ephemeral: true
        });
    }

    record.status = action === 'suggestion_approve' ? 'approved' : 'denied';
    record.reviewedBy = interaction.user.id;
    record.reviewedAt = new Date().toISOString();
    suggestions.set(`${interaction.guild.id}:${record.id}`, record);
    saveSuggestions();

    await interaction.update({
        embeds: [createSuggestionEmbed(record)],
        components: [createSuggestionRow(record)],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleStaffApplyCommand(message, args) {
    await handleTicketOpenCommand(message, ['admin', `Staff application: ${args.join(' ').trim() || 'No details provided.'}`]);
}

async function handleReopenCommand(message, args) {

    if (!hasModAccess(message.member)) return message.reply('No permission.');

    const caseRecord = findCase(message.guild.id, args[0]);

    if (!caseRecord?.targetUserId) return message.reply('Usage: `!reopen caseId` for a case with a target user.');

    const targetMember = await message.guild.members.fetch(caseRecord.targetUserId).catch(() => null);

    if (!targetMember) return message.reply('That user is not currently in the server.');

    const result = await createTicketForMember(
        message.guild,
        targetMember,
        `Reopened from case #${caseRecord.caseId}: ${caseRecord.reason}`,
        caseRecord.ticketType || 'general'
    );

    await message.reply(result.ok ? `Reopened ticket: ${result.channel}` : result.message);

}

async function handleProfileCommand(message, args) {

    const targetMember = await resolveMemberFromArgs(message, args) || message.member;
    const targetUser = targetMember.user;
    const noteCount = (staffNotes.get(`${message.guild.id}:${targetUser.id}`) || []).length;
    const caseCount = getGuildCaseStore(message.guild.id).cases.filter(caseRecord => caseRecord.targetUserId === targetUser.id).length;
    const vrcRecord = vrcVerificationRecords.get(getVrcVerifyKey(message.guild.id, targetUser.id));
    const xpRecord = syncXpToTrackedMessages(normalizeXpRecord(xpRecords.get(getXpRecordKey(message.guild.id, targetUser.id)) || {
        guildId: message.guild.id,
        userId: targetUser.id,
        xp: 0,
        messages: 0
    }));
    const ticketCount = getGuildCaseStore(message.guild.id).cases.filter(caseRecord =>
        caseRecord.targetUserId === targetUser.id &&
        String(caseRecord.type || '').includes('TICKET')
    ).length;

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#2B90D9')
                .setTitle(`Profile: ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL({
                    dynamic: true
                }))
                .addFields(
                    {
                        name: 'Discord',
                        value: `ID: ${targetUser.id}\nJoined: ${targetMember.joinedTimestamp ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>` : 'Unknown'}\nCreated: <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
                        inline: false
                    },
                    {
                        name: 'VRChat',
                        value: vrcRecord ? `${vrcRecord.vrcDisplayName} (${vrcRecord.vrcUserId})` : 'Not linked',
                        inline: false
                    },
                    {
                        name: 'Activity',
                        value: `Level ${getXpLevel(xpRecord.xp)} (${xpRecord.xp || 0} XP)\nMessages: ${xpRecord.messages || 0}\nInvites: ${inviteStats.get(targetUser.id) || 0}`,
                        inline: true
                    },
                    {
                        name: 'Staff Data',
                        value: `Cases: ${caseCount}\nNotes: ${noteCount}\nTickets: ${ticketCount}`,
                        inline: true
                    },
                    {
                        name: 'Roles',
                        value: targetMember.roles.cache
                            .filter(role => role.id !== message.guild.id)
                            .map(role => `${role}`)
                            .slice(0, 20)
                            .join(', ') || 'No roles',
                        inline: false
                    }
                )
                .setTimestamp()
        ],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleStaffPanelCommand(message) {

    if (!hasModAccess(message.member)) return message.reply('No permission.');

    const openTickets = [...ticketRecords.values()].filter(record => record.guildId === message.guild.id && record.status === 'open');
    const pendingAppeals = openTickets.filter(record => record.ticketType === 'appeal').length;
    const recentCases = getGuildCaseStore(message.guild.id).cases.slice(-5).reverse();
    const activeTempRoles = [...tempRoles.values()].filter(record => record.guildId === message.guild.id).length;

    await message.channel.send({
        embeds: [
            new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Staff Dashboard')
                .addFields(
                    {
                        name: 'Tickets',
                        value: `Open: ${openTickets.length}\nPending appeals: ${pendingAppeals}`,
                        inline: true
                    },
                    {
                        name: 'Moderation',
                        value: `Recent cases: ${recentCases.length}\nActive temp roles: ${activeTempRoles}\nRaid joins tracked: ${(antiRaidJoinTimestamps.get(message.guild.id) || []).length}`,
                        inline: true
                    },
                    {
                        name: 'Recent Cases',
                        value: recentCases.length
                            ? recentCases.map(caseRecord => `#${caseRecord.caseId} ${caseRecord.type} - ${truncateText(caseRecord.reason, 80)}`).join('\n')
                            : 'No cases yet.',
                        inline: false
                    }
                )
                .setTimestamp()
        ]
    });

}

async function handleAutomodCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) return message.reply('No permission. Only server admins or the server owner can use this command.');

    const subcommand = args[0]?.toLowerCase();

    if (subcommand === 'on' || subcommand === 'off') {
        const enabled = subcommand === 'on';
        setAppConfig(message.guild.id, config => {
            config.automodEnabled = enabled;
        });
        return message.reply(`Auto moderation is now **${enabled ? 'on' : 'off'}**.`);
    }

    if (subcommand === 'block') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        if (!word) return message.reply('Usage: `!automod block word/phrase`');
        setAppConfig(message.guild.id, config => {
            config.blockedWords = [...new Set([...(config.blockedWords || []), word])];
        });
        return message.reply(`Blocked phrase added: \`${word}\``);
    }

    if (subcommand === 'unblock') {
        const word = args.slice(1).join(' ').toLowerCase().trim();
        setAppConfig(message.guild.id, config => {
            config.blockedWords = (config.blockedWords || []).filter(blockedWord => blockedWord !== word);
        });
        return message.reply(`Blocked phrase removed: \`${word}\``);
    }

    const config = getAppConfig(message.guild.id);
    await message.reply(`Auto moderation: **${config.automodEnabled ? 'on' : 'off'}**\nBlocked phrases: ${(config.blockedWords || []).join(', ') || 'none'}\nUse \`!automod on/off\`, \`!automod block phrase\`, or \`!automod unblock phrase\`.`);

}

async function checkAutoModeration(message) {

    const config = getAppConfig(message.guild.id);

    if (!config.automodEnabled || message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages)) return false;

    const content = message.content || '';
    const lowerContent = content.toLowerCase();
    const blockedWords = config.blockedWords || [];
    const hasBlockedWord = blockedWords.some(word => word && lowerContent.includes(word));
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    const letters = content.replace(/[^a-z]/gi, '');
    const capsRatio = letters.length >= 12
        ? letters.replace(/[^A-Z]/g, '').length / letters.length
        : 0;
    const looksScammy = [
        'free nitro',
        'steam gift',
        'airdrop',
        'crypto giveaway'
    ].some(phrase => lowerContent.includes(phrase));

    if (!hasBlockedWord && mentionCount < 8 && capsRatio < 0.85 && !looksScammy) return false;

    await message.delete().catch(() => {});
    await warnMember(
        message.member,
        client.user,
        hasBlockedWord ? 'AutoMod blocked phrase.' : looksScammy ? 'AutoMod scam phrase.' : mentionCount >= 8 ? 'AutoMod mass mentions.' : 'AutoMod excessive caps.',
        message.channel,
        message.content
    ).catch(() => {});

    await createCase(
        message.guild,
        'AUTOMOD',
        message.author.id,
        client.user,
        hasBlockedWord ? 'Blocked phrase detected.' : looksScammy ? 'Scam phrase detected.' : mentionCount >= 8 ? 'Mass mentions detected.' : 'Excessive caps detected.'
    );

    return true;

}

function startEventReminderWorker() {

    if (eventReminderInterval) return;

    eventReminderInterval = setInterval(() => {
        checkEventReminders().catch(error => console.error('Event reminder worker failed:', error));
    }, EVENT_REMINDER_INTERVAL_MS);

    checkEventReminders().catch(error => console.error('Event reminder worker failed:', error));

}

async function checkEventReminders() {

    const now = Date.now();

    for (const record of vrchatEvents.values()) {

        if (record.reminderSent) continue;

        const eventTime = Date.parse(record.timeText);

        if (Number.isNaN(eventTime)) continue;
        if (eventTime - now > EVENT_REMINDER_BEFORE_MS || eventTime <= now) continue;

        const guild = client.guilds.cache.get(record.guildId);
        const channel = guild?.channels.cache.get(record.channelId) ||
            await guild?.channels.fetch(record.channelId).catch(() => null);

        if (!channel?.isTextBased?.()) continue;

        const goingUserIds = Object.entries(record.rsvps || {})
            .filter(([, value]) => value === 'yes')
            .map(([userId]) => userId);

        await channel.send({
            content: goingUserIds.length
                ? goingUserIds.map(userId => `<@${userId}>`).join(' ')
                : null,
            embeds: [
                new EmbedBuilder()
                    .setColor('#FEE75C')
                    .setTitle(`Event Reminder: ${record.title}`)
                    .setDescription(`This event starts in about 1 hour.\n\n${record.description || ''}`)
                    .addFields({
                        name: 'When',
                        value: record.timeText,
                        inline: false
                    })
                    .setTimestamp()
            ],
            allowedMentions: {
                users: goingUserIds
            }
        }).catch(() => {});

        record.reminderSent = true;
        vrchatEvents.set(getEventKey(record.guildId, record.id), record);
        saveVrchatEvents();

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

        await handleAntiRaidJoin(member);

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

async function handleMessageCreate(message) {

    if (message.author.bot || message.webhookId) return;
    if (!message.guild) return;

    await logCommand(message);

    const args = message.content.trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (!message.content.startsWith('!') && await handleAntiRaidMessage(message)) {
        return;
    }

    if (!message.content.startsWith('!')) {
        if (await checkAutoModeration(message)) return;
        await addXpForMessage(message);
    }
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
    // COMMUNITY SYSTEM COMMANDS
    // ==========================================

    if (command === '!note') {
        await handleNoteCommand(message, args);
        return;
    }

    if (command === '!notes') {
        await handleNotesCommand(message, args);
        return;
    }

    if (command === '!event' || command === '!vrcevent') {
        await handleEventCommand(message, args);
        return;
    }

    if (command === '!rsvp') {
        await handleRsvpCommand(message, args);
        return;
    }

    if (command === '!onboarding' || command === '!welcome-setup') {
        await handleOnboardingCommand(message, args);
        return;
    }

    if (command === '!config') {
        await handleCommunityConfigCommand(message, args);
        return;
    }

    if (command === '!case') {
        await handleCaseCommand(message, args);
        return;
    }

    if (command === '!cases') {
        await handleCasesCommand(message, args);
        return;
    }

    if (command === '!editcase') {
        await handleEditCaseCommand(message, args);
        return;
    }

    if (command === '!automod') {
        await handleAutomodCommand(message, args);
        return;
    }

    if (command === '!staffpanel') {
        await handleStaffPanelCommand(message);
        return;
    }

    if (command === '!reopen') {
        await handleReopenCommand(message, args);
        return;
    }

    if (command === '!profile') {
        await handleProfileCommand(message, args);
        return;
    }

    if (command === '!temprole') {
        await handleTempRoleCommand(message, args);
        return;
    }

    if (command === '!giveaway') {
        await handleGiveawayCommand(message, args);
        return;
    }

    if (command === '!poll') {
        await handlePollCommand(message, args);
        return;
    }

    if (command === '!waifuhelp' || command === '!haremhelp') {
        await handleWaifuHelpCommand(message);
        return;
    }

    if (command === '!daily' || command === '!waifudaily') {
        await handleWaifuDailyCommand(message);
        return;
    }

    if (command === '!coins' || command === '!balance' || command === '!waifubalance') {
        await handleWaifuBalanceCommand(message, args);
        return;
    }

    if (command === '!pay' || command === '!paycoins' || command === '!paymoney') {
        await handlePayWaifuCoinsCommand(message, args);
        return;
    }

    if (command === '!pull' || command === '!waifupull') {
        await handleWaifuPullCommand(message);
        return;
    }

    if (command === '!waifuodds' || command === '!odds') {
        await handleWaifuOddsCommand(message);
        return;
    }

    if (command === '!waifus' || command === '!harem' || command === '!collection') {
        await handleWaifuCollectionCommand(message, args);
        return;
    }

    if (command === '!waifu') {
        await handleWaifuShowCommand(message, args);
        return;
    }

    if (command === '!sell' || command === '!sellwaifu' || command === '!sellcard' || command === '!waifusell') {
        await handleSellWaifuCommand(message, args);
        return;
    }

    if (command === '!trade' || command === '!waifutrade') {
        await handleWaifuTradeCommand(message, args);
        return;
    }

    if (command === '!givecoins' || command === '!givemoney' || command === '!givewaifumoney') {
        await handleGiveCoinsCommand(message, args);
        return;
    }

    if (command === '!rank') {
        await handleRankCommand(message, args);
        return;
    }

    if (command === '!toplevels' || command === '!levelboard' || command === '!levels') {
        await handleTopLevelsCommand(message, args);
        return;
    }

    if (command === '!synclevels' || command === '!levelsync' || command === '!backfilllevels') {
        await handleSyncLevelsCommand(message, args);
        return;
    }

    if (command === '!staffapply') {
        await handleStaffApplyCommand(message, args);
        return;
    }

    if (command === '!suggest') {
        await handleSuggestCommand(message, args);
        return;
    }

    if (command === '!syncnick' || command === '!syncnickname') {
        const record = vrcVerificationRecords.get(getVrcVerifyKey(message.guild.id, message.author.id));

        if (!record) {
            return message.reply('Verify your VRChat account first with `!vrcverify`.');
        }

        await syncMemberNicknameToVrc(message.member, record.vrcDisplayName);
        await message.reply('Nickname sync attempted.');
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
🎫 \`!ticket [type] [reason]\` - Opens a private support ticket.
🔐 \`!vrcverify VRChatName\` - Starts VRChat account verification.`
                },
                {
                    name: '🔐 VRC Verification Commands',
                    value:
`\`!vrcverify VRChatName\` - Starts profile-code verification.
\`!vrcconfirm [VRChatName]\` - Checks your profile and gives the verified role.
\`!vrclinked [@user/userID]\` - Shows a linked VRChat account.
\`!syncnick\` - Syncs your nickname to your verified VRChat name.
\`!vrcverifyconfig\` - Admin config for verified role and logs.
\`!vrcunverify @user/userID\` - Removes a saved VRC verification.`
                },
                {
                    name: '🎫 Ticket Commands',
                    value:
`\`!ticket [type] [reason]\` - Opens general/report/partnership/appeal/admin.
\`!appeal [reason]\` - Opens an appeal ticket.
\`!ticketsetup [#channel]\` - Creates the ticket type button panel.
\`!ticketconfig\` - Shows and edits ticket support/admin roles.
\`!close [reason | 1-5]\` - Saves a transcript and closes the ticket.
\`!rateticket 1-5 [comment]\` - Rates your ticket before close.
\`!transcript [reason]\` - Sends a ticket transcript to logs.
\`!claim\` / \`!unclaim\` - Claims or releases a ticket.
\`!add @user\` / \`!remove @user\` - Adds or removes a user.
\`!rename name\` - Renames the ticket.
\`!escalate [reason]\` - Requests an admin.`
                },
                {
                    name: '🌐 Community Systems',
                    value:
`\`!event create title | time | description\` - Creates a VRChat event.
\`!event list\` / \`!rsvp eventId yes/no/maybe\` - Event RSVP tools.
\`!note @user note\` / \`!notes @user\` - Staff notes.
\`!case id\` / \`!cases @user\` / \`!editcase id reason\` - Case tools.
\`!profile [@user]\` / \`!staffpanel\` - Profile and staff dashboard.
\`!temprole @user @role 7d\` - Temporary roles.
\`!giveaway create prize | 1d | winners\` - Giveaways.
\`!poll question | option 1 | option 2\` - Button polls.
\`!rank [@user]\` - XP/rank.
\`!toplevels [page]\` - Shows paged level leaderboard.
\`!synclevels [max-per-channel]\` - Admin: backfills levels from message history.
\`!waifuhelp\` / \`!pull\` / \`!waifus\` / \`!trade\` - Waifu collector game.
\`!pay @user amount\` / \`!sellwaifu id\` - Waifu coins and card selling.
\`!givecoins @user amount\` - Admin: give fake waifu coins.
\`!staffapply [details]\` / \`!suggest idea\` - Applications and suggestions.
\`!automod on/off\` / \`!automod block phrase\` - Auto moderation.
\`!onboarding [#channel]\` - Sends the welcome/onboarding message.
\`!config\` - Shows bot config, anti-raid, tickets, VRC, and events.`
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
➕ \`!addrole @user/userID @role\` - Adds a role to a member.
➖ \`!removerole @user/userID @role\` - Removes a role from a member.
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
    // VRC VERIFICATION COMMANDS
    // ==========================================

    if (command === '!vrcverifyconfig' || command === '!vrcverifierconfig') {
        await handleVrcVerifyConfigCommand(message, args);
        return;
    }

    if (command === '!vrcverify' || command === '!verifyvrc') {
        await handleVrcVerifyStartCommand(message, args);
        return;
    }

    if (command === '!vrcconfirm' || command === '!confirmvrc') {
        await handleVrcConfirmCommand(message, args);
        return;
    }

    if (command === '!vrclinked' || command === '!vrcwhois') {
        await handleVrcLinkedCommand(message, args);
        return;
    }

    if (command === '!vrcunverify') {
        await handleVrcUnverifyCommand(message, args);
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

    if (command === '!appeal') {
        await handleTicketOpenCommand(message, ['appeal', ...args]);
        return;
    }

    if (command === '!rateticket' || command === '!ticketrating') {
        await handleTicketRatingCommand(message, args);
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

    if (command === '!addrole') {

        if (!hasServerAdminOrOwnerAccess(message.member)) {
            return message.reply('No permission. Only server admins or the server owner can use this command.');
        }

        const target = await resolveMemberFromArgs(message, args);
        const role = await resolveRoleFromArg(message, args.slice(1).join(' '));

        if (!target || !role) {
            return message.reply('âš ï¸ Usage: `!addrole @user/userID @role`');
        }

        if (target.roles.cache.has(role.id)) {
            return message.reply(`âš ï¸ ${target.user.tag} already has the **${role.name}** role.`);
        }

        const botMember = await getBotMember(message.guild);

        if (!botMember) {
            return message.reply('âŒ I could not check my server permissions.');
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('âŒ I need the **Manage Roles** permission to add roles.');
        }

        if (!canBotAssignRole(botMember, message.guild, role)) {
            return message.reply(`âŒ I cannot assign **${role.name}**. Move my bot role above it in the role list.`);
        }

        if (
            message.member.id !== message.guild.ownerId &&
            message.member.roles.highest.comparePositionTo(role) <= 0
        ) {
            return message.reply('âŒ You cannot assign a role equal to or higher than your highest role.');
        }

        try {

            await target.roles.add(role, `Role added by ${message.author.tag}`);
            await createCase(message.guild, 'ROLE_ADD', target.id, message.author, `Added role ${role.name}.`);

            await message.channel.send(`âœ… Added **${role.name}** to ${target}.`);

            const logChannel = getLogChannel(message.guild);

            if (logChannel) {

                const logEmbed = new EmbedBuilder()
                    .setColor('#57F287')
                    .setTitle('Role Added')
                    .addFields(
                        {
                            name: 'User',
                            value: `${target.user.tag} (${target.id})`,
                            inline: false
                        },
                        {
                            name: 'Role',
                            value: `${role.name} (${role.id})`,
                            inline: false
                        },
                        {
                            name: 'Added By',
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

            console.error('Add role command error:', error);
            message.reply('âŒ Failed to add that role.');

        }

        return;
    }

    if (command === '!removerole') {

        if (!hasServerAdminOrOwnerAccess(message.member)) {
            return message.reply('No permission. Only server admins or the server owner can use this command.');
        }

        const target = await resolveMemberFromArgs(message, args);
        const role = await resolveRoleFromArg(message, args.slice(1).join(' '));

        if (!target || !role) {
            return message.reply('Usage: `!removerole @user/userID @role`');
        }

        if (!target.roles.cache.has(role.id)) {
            return message.reply(`${target.user.tag} does not have the **${role.name}** role.`);
        }

        const botMember = await getBotMember(message.guild);

        if (!botMember) {
            return message.reply('I could not check my server permissions.');
        }

        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('I need the **Manage Roles** permission to remove roles.');
        }

        if (!canBotAssignRole(botMember, message.guild, role)) {
            return message.reply(`I cannot manage **${role.name}**. Move my bot role above it in the role list.`);
        }

        if (
            message.member.id !== message.guild.ownerId &&
            message.member.roles.highest.comparePositionTo(role) <= 0
        ) {
            return message.reply('You cannot manage a role equal to or higher than your highest role.');
        }

        try {

            await target.roles.remove(role, `Role removed by ${message.author.tag}`);
            await createCase(message.guild, 'ROLE_REMOVE', target.id, message.author, `Removed role ${role.name}.`);

            await message.channel.send(`Removed **${role.name}** from ${target}.`);

            const logChannel = getLogChannel(message.guild);

            if (logChannel) {

                const logEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('Role Removed')
                    .addFields(
                        {
                            name: 'User',
                            value: `${target.user.tag} (${target.id})`,
                            inline: false
                        },
                        {
                            name: 'Role',
                            value: `${role.name} (${role.id})`,
                            inline: false
                        },
                        {
                            name: 'Removed By',
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

            console.error('Remove role command error:', error);
            message.reply('Failed to remove that role.');

        }

        return;
    }

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
            await createCase(message.guild, 'WARN', target.id, message.author, reason);

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
            await createCase(message.guild, 'BAN', targetUserId, message.author, reason);

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
            await createCase(message.guild, 'KICK', target.id, message.author, reason);

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
            await createCase(message.guild, 'TIMEOUT', target.id, message.author, `Timed out for ${minutes} minute(s).`);

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
            await createCase(message.guild, 'UNTIMEOUT', target.id, message.author, 'Timeout removed.');

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
            await createCase(message.guild, 'MUTE', target.id, message.author, 'Muted role added.');

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
            await createCase(message.guild, 'UNMUTE', target.id, message.author, 'Muted role removed.');

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

}

client.on('messageCreate', handleMessageCreate);

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

    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
        return;
    }

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('toplevels:')) {
        await handleTopLevelsButton(interaction);
        return;
    }

    if (interaction.customId.startsWith('waifu_trade_')) {
        await handleWaifuTradeButton(interaction);
        return;
    }

    if (interaction.customId.startsWith('giveaway_join:')) {
        await handleGiveawayButton(interaction);
        return;
    }

    if (interaction.customId.startsWith('poll_vote:')) {
        await handlePollButton(interaction);
        return;
    }

    if (interaction.customId.startsWith('suggestion_')) {
        await handleSuggestionButton(interaction);
        return;
    }

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
