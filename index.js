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
    Partials,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require('discord.js');

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
const { Shoukaku, Connectors } = require('shoukaku');
const { createMusicSystem } = require('./music-system');

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
const BOT_SERVER_NICKNAME = process.env.BOT_SERVER_NICKNAME || 'Ms.Bon';

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
const INVITE_JOIN_RECORDS_FILE = path.join(process.cwd(), 'invite-joins.json');
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

const DEFAULT_SAFETY_COMMAND_ROLE_IDS = [
    '1447375487918673941',
    '1516608582294962266',
    '1447375564955586612'
];
const SAFETY_COMMAND_ROLE_IDS = [
    ...DEFAULT_SAFETY_COMMAND_ROLE_IDS,
    ...(process.env.SAFETY_COMMAND_ROLE_IDS || process.env.SAFETY_COMMAND_ROLE_ID || '')
        .split(',')
        .map(roleId => roleId.trim())
        .filter(Boolean)
].filter((roleId, index, roleIds) => roleIds.indexOf(roleId) === index);

// LOG CHANNEL
const LOG_CHANNEL_ID = '1516259462124404827';
const VRCHAT_AUDIT_LOG_CHANNEL_ID = process.env.VRCHAT_AUDIT_LOG_CHANNEL_ID || '1525268205633798185';
const BLACKLIST_FLAG_CHANNEL_ID = process.env.BLACKLIST_FLAG_CHANNEL_ID || '1525267928486776872';
const DEFAULT_VRCHAT_GROUP_ID = 'grp_38f88b33-f022-40b8-8acf-5264f5e710a2';

// VRCHAT GROUP POST BRIDGE
const VRCHAT_GROUP_ID = process.env.VRCHAT_GROUP_ID || DEFAULT_VRCHAT_GROUP_ID;
const VRCHAT_POST_CHANNEL_ID = process.env.VRCHAT_POST_CHANNEL_ID || '1451062252974116954';
const VRCHAT_AUTH_COOKIE = process.env.VRCHAT_AUTH_COOKIE || '';
const VRC_VERIFY_REQUIRE_AGE_VERIFICATION = Object.prototype.hasOwnProperty.call(process.env, 'VRC_VERIFY_REQUIRE_AGE_VERIFICATION')
    ? process.env.VRC_VERIFY_REQUIRE_AGE_VERIFICATION === 'true'
    : Boolean(VRCHAT_AUTH_COOKIE);
const VRC_VERIFY_ALLOW_PUBLIC_UNKNOWN_AGE = process.env.VRC_VERIFY_ALLOW_PUBLIC_UNKNOWN_AGE !== 'false';
const VRCHAT_API_USER_AGENT = process.env.VRCHAT_API_USER_AGENT ||
    process.env.VRCHAT_USER_AGENT ||
    'VRChatDiscordPostBridge/1.0';
const VRCHAT_POST_POLL_INTERVAL_MS = Math.max(
    Number.parseInt(process.env.VRCHAT_POST_POLL_INTERVAL_MS || '', 10) || 5 * 60 * 1000,
    60 * 1000
);
const VRCHAT_POST_ERROR_BACKOFF_MS = Math.max(
    Number.parseInt(process.env.VRCHAT_POST_ERROR_BACKOFF_MS || '', 10) || 10 * 60 * 1000,
    60 * 1000
);
const VRCHAT_POST_PUBLIC_ONLY = process.env.VRCHAT_POST_PUBLIC_ONLY !== 'false';
const VRCHAT_SAFETY_BLACKLIST_FILE = process.env.VRCHAT_SAFETY_BLACKLIST_FILE ||
    path.join(process.cwd(), 'vrchat-safety-blacklist.json');
const VRCHAT_SAFETY_STATE_FILE = process.env.VRCHAT_SAFETY_STATE_FILE ||
    path.join(process.cwd(), 'vrchat-safety-state.json');
const MONITORED_VRCHAT_GROUP_ID = process.env.MONITORED_VRCHAT_GROUP_ID || DEFAULT_VRCHAT_GROUP_ID;
const SAFETY_ALERT_CHANNEL_ID = process.env.SAFETY_ALERT_CHANNEL_ID || BLACKLIST_FLAG_CHANNEL_ID;
const CANDIDATE_REVIEW_CHANNEL_ID = process.env.CANDIDATE_REVIEW_CHANNEL_ID || SAFETY_ALERT_CHANNEL_ID;
const SAFETY_SCAN_INTERVAL_MS = Math.max(
    60 * 60 * 1000,
    Number.parseInt(process.env.SAFETY_SCAN_INTERVAL_MS || '', 10) ||
        (Number.parseFloat(process.env.SAFETY_SCAN_INTERVAL_HOURS || '6') || 6) * 60 * 60 * 1000
);
const SAFETY_SCAN_DELAY_MS = Math.max(
    250,
    Number.parseInt(process.env.SAFETY_SCAN_DELAY_MS || '1500', 10) || 1500
);
const SAFETY_ALERT_COOLDOWN_HOURS = Math.max(
    1,
    Number.parseFloat(process.env.SAFETY_ALERT_COOLDOWN_HOURS || '168') || 168
);
const DISCOVER_CANDIDATE_GROUPS = process.env.DISCOVER_CANDIDATE_GROUPS !== 'false';
const MINOR_SAFETY_CATEGORIES = (process.env.MINOR_SAFETY_CATEGORIES ||
    'age_play,grooming,csam,minor_endangerment,sexual_exploitation')
    .split(',')
    .map(category => category.trim().toLowerCase())
    .filter(Boolean);
const CANDIDATE_GROUP_PHRASES = (process.env.CANDIDATE_GROUP_PHRASES ||
    'harming minors,harm minors,hurt minors,hurting minors,abuse minors,abusing minors,exploit minors,exploiting minors,groom minors,grooming minors,predator minors,minor exploitation,minor abuse,minor endangerment,underage sexual,sexual minors,sexualize minors,sexualizing minors,child sexual abuse,child exploitation,child abuse,csam,ageplay,loli nsfw,shota nsfw')
    .split(',')
    .map(phrase => phrase.trim().toLowerCase())
    .filter(Boolean);
const MINOR_REFERENCE_TERMS = (process.env.MINOR_REFERENCE_TERMS ||
    'minor,minors,underage,child,children,kid,kids,teen,teens,young,loli,lolis,shota,shotas')
    .split(',')
    .map(term => term.trim().toLowerCase())
    .filter(Boolean);
const MINOR_HARM_CONTEXT_TERMS = (process.env.MINOR_HARM_CONTEXT_TERMS ||
    'harm,harming,hurt,hurting,abuse,abusing,exploit,exploiting,exploitation,groom,grooming,predator,prey,sexual,sexualize,sexualizing,nsfw,lewd,adult,18+,ageplay,csam')
    .split(',')
    .map(term => term.trim().toLowerCase())
    .filter(Boolean);
const HIGH_RISK_MINOR_SAFETY_TERMS = (process.env.HIGH_RISK_MINOR_SAFETY_TERMS ||
    'csam,ageplay,loli,shota')
    .split(',')
    .map(term => term.trim().toLowerCase())
    .filter(Boolean);
const PROTECTIVE_CONTEXT_PHRASES = (process.env.PROTECTIVE_CONTEXT_PHRASES ||
    'prevention,awareness,reporting,report abuse,survivor support,survivors,victim support,support for victims,child safety,protect minors,protect children,anti-grooming,education,resources,safety policy,zero tolerance')
    .split(',')
    .map(phrase => phrase.trim().toLowerCase())
    .filter(Boolean);
const PROHIBITIVE_CONTEXT_PHRASES = (process.env.PROHIBITIVE_CONTEXT_PHRASES ||
    'not allowed,never allowed,instant ban,automatic ban,zero tolerance,banned,prohibited,forbidden,disallowed,against the rules,report immediately,will be removed,will be kicked,no ageplay,no minors,minors not allowed,adults only,18+ only')
    .split(',')
    .map(phrase => phrase.trim().toLowerCase())
    .filter(Boolean);
const PERMISSIVE_RISK_CONTEXT_PHRASES = (process.env.PERMISSIVE_RISK_CONTEXT_PHRASES ||
    'allowed,welcome,welcomed,accepting,friendly,safe space,looking for,roleplay,rp,erp,fetish,content,sharing,trade,trading,collection,uncensored,lovers,fans,enjoy')
    .split(',')
    .map(phrase => phrase.trim().toLowerCase())
    .filter(Boolean);
const CANDIDATE_RISK_SCORE_THRESHOLD = Math.max(
    5,
    Number.parseInt(process.env.CANDIDATE_RISK_SCORE_THRESHOLD || '8', 10) || 8
);
const CANDIDATE_MIN_DISTINCT_SIGNALS = Math.max(
    1,
    Number.parseInt(process.env.CANDIDATE_MIN_DISTINCT_SIGNALS || '2', 10) || 2
);
const VRCHAT_CANDIDATE_SCAN_DETAIL_LOOKUP = process.env.VRCHAT_CANDIDATE_SCAN_DETAIL_LOOKUP !== 'false';
const VRCHAT_CANDIDATE_GROUP_DETAIL_DELAY_MS = Math.max(
    500,
    Number.parseInt(process.env.VRCHAT_CANDIDATE_GROUP_DETAIL_DELAY_MS || '1500', 10) || 1500
);
const VRCHAT_CANDIDATE_MAX_DETAIL_LOOKUPS_PER_SCAN = Math.max(
    0,
    Number.parseInt(process.env.VRCHAT_CANDIDATE_MAX_DETAIL_LOOKUPS_PER_SCAN || '25', 10) || 25
);
const VRCHAT_API_MIN_INTERVAL_MS = Math.max(
    250,
    Number.parseInt(process.env.VRCHAT_API_MIN_INTERVAL_MS || '1100', 10) || 1100
);
const VRCHAT_RATE_LIMIT_BACKOFF_MS = Math.max(
    60 * 1000,
    Number.parseInt(process.env.VRCHAT_RATE_LIMIT_BACKOFF_MS || '', 10) || 15 * 60 * 1000
);
const VRCLOGGER_STORE_FILE = process.env.VRCLOGGER_STORE_FILE ||
    path.join(process.cwd(), 'vrc-logger-store.json');
const VRCLOGGER_BACKEND_URL = process.env.VRCLOGGER_BACKEND_URL ||
    process.env.VRCHAT_BACKEND_URL ||
    '';
const VRCLOGGER_BACKEND_API_KEY = process.env.VRCLOGGER_BACKEND_API_KEY ||
    process.env.VRCHAT_BACKEND_API_KEY ||
    '';
const VRCLOGGER_ACTION_MODE = (process.env.VRCLOGGER_ACTION_MODE || 'auto').toLowerCase();
const VRCLOGGER_GROUP_ID = process.env.VRCLOGGER_GROUP_ID ||
    MONITORED_VRCHAT_GROUP_ID ||
    VRCHAT_GROUP_ID ||
    DEFAULT_VRCHAT_GROUP_ID;
const VRCHAT_AUDIT_GROUP_ID = process.env.VRCHAT_AUDIT_GROUP_ID || VRCLOGGER_GROUP_ID;
const VRCHAT_AUDIT_POLL_INTERVAL_MS = Math.max(
    60 * 1000,
    Number.parseInt(process.env.VRCHAT_AUDIT_POLL_INTERVAL_MS || '60000', 10) || 60 * 1000
);
const VRCHAT_AUDIT_OVERLAP_MS = Math.max(
    60 * 1000,
    Number.parseInt(process.env.VRCHAT_AUDIT_OVERLAP_MS || '', 10) || 5 * 60 * 1000
);
const VRCHAT_AUDIT_MAX_PAGES_PER_POLL = Math.max(
    1,
    Math.min(50, Number.parseInt(process.env.VRCHAT_AUDIT_MAX_PAGES_PER_POLL || '10', 10) || 10)
);
const VRCHAT_AUDIT_BACKFILL_ON_FIRST_START = process.env.VRCHAT_AUDIT_BACKFILL_ON_FIRST_START === 'true';
const VRCHAT_AUDIT_INITIAL_LOOKBACK_HOURS = Math.max(
    1,
    Number.parseFloat(process.env.VRCHAT_AUDIT_INITIAL_LOOKBACK_HOURS || '24') || 24
);
const VRCHAT_AUDIT_RECENT_ID_LIMIT = Math.max(
    500,
    Number.parseInt(process.env.VRCHAT_AUDIT_RECENT_ID_LIMIT || '5000', 10) || 5000
);
const VRCHAT_MEMBER_GROUP_SCAN_DELAY_MS = Math.max(
    250,
    Number.parseInt(process.env.VRCHAT_MEMBER_GROUP_SCAN_DELAY_MS || '', 10) || SAFETY_SCAN_DELAY_MS
);
const BOT_OWNER_IDS = (process.env.BOT_OWNER_IDS || process.env.BOT_OWNER_ID || '')
    .split(',')
    .map(userId => userId.trim())
    .filter(Boolean);

// Only this Discord account can use !sudo.
const SUDO_USER_ID = '1336490572915015722';

// ==========================================
// LAVALINK CONFIGURATION
// ==========================================

const ENABLE_LAVALINK = process.env.ENABLE_LAVALINK === 'true' ||
    process.env.LAVALINK_ENABLED === 'true';
const LAVALINK_URL = process.env.LAVALINK_URL || '';
const LAVALINK_PASSWORD = process.env.LAVALINK_PASSWORD || '';
const MUSIC_PREFERRED_LAVALINK_NODE = process.env.MUSIC_PREFERRED_LAVALINK_NODE || '';
const LAVALINK_UNHEALTHY_NODE_COOLDOWN_MS = Math.max(
    60 * 1000,
    Number.parseInt(process.env.LAVALINK_UNHEALTHY_NODE_COOLDOWN_MS || '600000', 10) || 10 * 60 * 1000
);

// false for normal ports like 2333
// true for secure/SSL ports like 443
const LAVALINK_SECURE = process.env.LAVALINK_SECURE
    ? process.env.LAVALINK_SECURE === 'true'
    : true;

const LAVALINK_EXTRA_NODES = parseLavalinkExtraNodes(
    process.env.LAVALINK_NODES_JSON ||
    process.env.LAVALINK_EXTRA_NODES ||
    process.env.LAVALINK_NODES ||
    ''
);

const LAVALINK_NODES = buildLavalinkNodes([
    {
        name: 'Primary',
        url: LAVALINK_URL,
        auth: LAVALINK_PASSWORD,
        secure: LAVALINK_SECURE
    },
    ...LAVALINK_EXTRA_NODES
]);

// ==========================================
// INVITE CACHE, STATS, MUSIC QUEUES
// ==========================================

const inviteCache = new Map();
const inviteStats = new Map();
const inviteJoinRecords = new Map();
const preferredLavalinkNodeNames = new Map();
const lavalinkNodeHealth = new Map();

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

// VRChat safety scanner
const vrchatSafetyBlacklist = new Map();
let vrchatSafetyState = {
    matches: {},
    candidates: {}
};
let vrchatSafetyScannerStarted = false;
let vrchatSafetyScannerRunning = false;
let vrchatSafetyScanStopRequested = false;
let vrchatSafetyScanStopRequestedBy = null;
let vrchatSafetyScannerCurrentTrigger = null;
let vrchatSafetyScannerInterval = null;
let vrchatMemberGroupScanRunning = false;
let vrchatApiRequestQueue = Promise.resolve();
let vrchatApiNextRequestAt = 0;
let vrchatApiBackoffUntil = 0;
let vrchatLastRateLimitLogAt = 0;

// VRChat group post watcher state
const seenVrchatPostIds = new Set();
const MAX_SEEN_VRCHAT_POST_IDS = 500;
let vrchatPostWatcherStarted = false;
let vrchatPostPollRunning = false;
let vrchatPostNextAllowedAt = 0;

// VRChat native group audit-log mirror state
let vrchatAuditWatcherStarted = false;
let vrchatAuditPollRunning = false;
let vrchatAuditPollInterval = null;
let vrchatAuditNextAllowedAt = 0;

// ==========================================
// LAVALINK / SHOUKAKU SETUP
// ==========================================

const startupLogEntries = [];

function formatStartupConsoleArgs(args) {

    return args
        .map(value => {
            if (value instanceof Error) return value.stack || value.message;
            if (typeof value === 'string') return value;

            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        })
        .join(' ');

}

function queueStartupLog(level, message) {
    startupLogEntries.push({
        level,
        message: String(message || '').trim()
    });
}

function parseStartupLogEntries(entries) {

    const summary = {
        bot: [],
        data: [],
        vrchat: [],
        notices: [],
        warnings: [],
        other: []
    };

    for (const entry of entries) {
        const message = entry.message;

        if (!message) continue;

        const reactionRoles = message.match(/Loaded (\d+) reaction role mapping/);
        const ticketConfig = message.match(/Loaded ticket config for (\d+) guild/);
        const openTickets = message.match(/Loaded (\d+) open ticket record/);
        const vrcVerifier = message.match(/Loaded VRC verifier config for (\d+) guild/);
        const vrcRecords = message.match(/Loaded (\d+) VRC verification record/);
        const rpgProfiles = message.match(/Loaded (\d+) Adventurer Guild RPG profile/);
        const safetyBlacklist = message.match(/Loaded (\d+) VRChat safety blacklist entr/);
        const postWatcher = message.match(/VRChat group post watcher started for ([^.]+)\./);
        const postSeed = message.match(/VRChat group post watcher seeded (\d+) post/);
        const auditMirror = message.match(/VRChat audit-log mirror started for ([^;]+); sending every event type to Discord channel ([^.]+)\./);
        const safetyScanner = message.match(/VRChat safety scanner started for ([^.]+)\./);

        if (/Lavalink music is disabled/.test(message)) {
            summary.notices.push('Lavalink music disabled. Set ENABLE_LAVALINK=true with a working node to enable music commands.');
        } else if (/Logged in as /.test(message)) {
            summary.bot.push(message.replace(/^.*Logged in as /, 'Logged in as '));
        } else if (/Invite cache loaded/.test(message)) {
            summary.bot.push('Invite cache loaded.');
        } else if (reactionRoles) {
            summary.data.push(`${reactionRoles[1]} reaction role mapping(s).`);
        } else if (ticketConfig) {
            summary.data.push(`${ticketConfig[1]} ticket config guild(s).`);
        } else if (openTickets) {
            summary.data.push(`${openTickets[1]} open ticket record(s).`);
        } else if (vrcVerifier) {
            summary.data.push(`${vrcVerifier[1]} VRC verifier config guild(s).`);
        } else if (vrcRecords) {
            summary.data.push(`${vrcRecords[1]} VRC verification record(s).`);
        } else if (rpgProfiles) {
            summary.data.push(`${rpgProfiles[1]} Adventurer Guild RPG profile(s).`);
        } else if (safetyBlacklist) {
            summary.data.push(`${safetyBlacklist[1]} VRChat safety blacklist entry/entries.`);
        } else if (postWatcher) {
            summary.vrchat.push(`Group post watcher started: ${postWatcher[1]}.`);
        } else if (postSeed) {
            summary.vrchat.push(`Group post watcher seeded ${postSeed[1]} post(s).`);
        } else if (auditMirror) {
            summary.vrchat.push(`Audit-log mirror started: ${auditMirror[1]} -> Discord channel ${auditMirror[2]}.`);
        } else if (/VRChat audit-log mirror is ready/.test(message)) {
            summary.vrchat.push('Audit-log mirror ready; no backfill needed.');
        } else if (/Startup VRChat safety scan skipped/.test(message)) {
            summary.vrchat.push('Startup safety scan skipped. Set RUN_SAFETY_SCAN_ON_START=true to enable it.');
        } else if (safetyScanner) {
            summary.vrchat.push(`Safety scanner started: ${safetyScanner[1]}.`);
        } else if (entry.level === 'warn') {
            summary.warnings.push(message);
        } else {
            summary.other.push(message);
        }
    }

    return summary;

}

function formatStartupLogSummary(entries) {

    const summary = parseStartupLogEntries(entries);
    const lines = [
        '',
        '================ BOT STARTUP ================',
        '[OK] Startup complete.'
    ];
    const addSection = (title, values) => {
        if (!values.length) return;

        lines.push('', title);

        for (const value of values) {
            lines.push(`- ${value}`);
        }
    };

    addSection('Bot', summary.bot);
    addSection('Loaded Data', summary.data);
    addSection('VRChat Systems', summary.vrchat);
    addSection('Notices', summary.notices);
    addSection('Warnings', summary.warnings);
    addSection('Other Startup Logs', summary.other);
    lines.push('=============================================');

    return lines.join('\n');

}

function captureStartupLogs() {

    const originalLog = console.log.bind(console);
    const originalWarn = console.warn.bind(console);
    let restored = false;

    console.log = (...args) => queueStartupLog('info', formatStartupConsoleArgs(args));
    console.warn = (...args) => queueStartupLog('warn', formatStartupConsoleArgs(args));

    return () => {
        if (restored) return;

        restored = true;
        console.log = originalLog;
        console.warn = originalWarn;
        originalLog(formatStartupLogSummary(startupLogEntries));
    };

}

function normalizeLavalinkNodeUrl(url) {

    return String(url || '')
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '');

}

function parseLavalinkSecure(value, fallback = true) {

    if (typeof value === 'boolean') return value;
    if (value == null || value === '') return fallback;

    return ['true', '1', 'yes', 'y', 'secure', 'ssl'].includes(String(value).trim().toLowerCase());

}

function normalizeLavalinkNodeConfig(node, index = 0) {

    if (!node || typeof node !== 'object') return null;

    const url = normalizeLavalinkNodeUrl(node.url || node.host);
    const auth = String(node.auth || node.password || '').trim();

    if (!url || !auth) return null;

    return {
        name: String(node.name || `Lavalink-${index + 1}`).trim() || `Lavalink-${index + 1}`,
        url,
        auth,
        secure: parseLavalinkSecure(node.secure, true)
    };

}

function parseLavalinkExtraNodes(value) {

    const raw = String(value || '').trim();

    if (!raw) return [];

    try {

        const parsed = JSON.parse(raw);
        const nodes = Array.isArray(parsed) ? parsed : [parsed];

        return nodes
            .map((node, index) => normalizeLavalinkNodeConfig(node, index))
            .filter(Boolean);

    } catch {

        return raw
            .split(';')
            .map((entry, index) => {
                const [name, url, auth, secure] = entry.split('|').map(part => part?.trim());
                return normalizeLavalinkNodeConfig({
                    name,
                    url,
                    auth,
                    secure
                }, index);
            })
            .filter(Boolean);

    }

}

function buildLavalinkNodes(nodes) {

    const usedKeys = new Set();
    const usedNames = new Set();
    const builtNodes = [];

    for (const node of nodes) {

        const normalized = normalizeLavalinkNodeConfig(node, builtNodes.length);

        if (!normalized) continue;

        const key = `${normalized.url}|${normalized.auth}|${normalized.secure}`;

        if (usedKeys.has(key)) continue;

        let name = normalized.name;
        let suffix = 2;

        while (usedNames.has(name)) {
            name = `${normalized.name}-${suffix}`;
            suffix += 1;
        }

        usedKeys.add(key);
        usedNames.add(name);
        builtNodes.push({
            ...normalized,
            name
        });

    }

    return builtNodes;

}

function getLavalinkNodeName(node) {

    return node?.name || node?.options?.name || node?.option?.name || null;

}

function markLavalinkNodeHealthy(name) {

    if (!name) return;

    lavalinkNodeHealth.set(name, {
        failures: 0,
        unhealthyUntil: 0,
        reason: ''
    });

}

function markLavalinkNodeUnhealthy(name, reason, cooldownMs = LAVALINK_UNHEALTHY_NODE_COOLDOWN_MS) {

    if (!name) return;

    const current = lavalinkNodeHealth.get(name) || {
        failures: 0,
        unhealthyUntil: 0,
        reason: ''
    };

    lavalinkNodeHealth.set(name, {
        failures: current.failures + 1,
        unhealthyUntil: Date.now() + cooldownMs,
        reason: String(reason || 'unknown error').slice(0, 160)
    });

}

function isLavalinkNodeHealthy(name) {

    if (!name) return true;

    const health = lavalinkNodeHealth.get(name);

    return !health?.unhealthyUntil || health.unhealthyUntil <= Date.now();

}

function isLavalinkNodeConnected(node) {

    return node?.state === 1 || node?.ws?.readyState === 1;

}

function isLavalinkNodeUsable(node) {

    const name = getLavalinkNodeName(node);

    return isLavalinkNodeConnected(node) && isLavalinkNodeHealthy(name);

}

function getLavalinkNodesArray(nodes = shoukaku?.nodes) {

    if (!nodes) return [];
    if (Array.isArray(nodes)) return nodes.filter(Boolean);
    if (typeof nodes.values === 'function') return Array.from(nodes.values()).filter(Boolean);

    return Object.values(nodes).filter(Boolean);

}

function getLavalinkNodePenalty(node) {

    const stats = node?.stats || {};
    const players = Number(stats.players || 0);
    const playingPlayers = Number(stats.playingPlayers || 0);
    const frameStats = stats.frameStats || {};
    const deficit = Number(frameStats.deficit || 0);
    const nulled = Number(frameStats.nulled || 0);

    return players + playingPlayers + deficit + nulled;

}

function resolveLavalinkNode(nodes, connection) {

    const allNodes = getLavalinkNodesArray(nodes);
    const healthyNodes = allNodes.filter(isLavalinkNodeUsable);
    const connectedNodes = allNodes.filter(isLavalinkNodeConnected);
    const nodeList = healthyNodes.length ? healthyNodes : connectedNodes;

    if (!nodeList.length) return undefined;

    const preferredName = (connection?.guildId ? preferredLavalinkNodeNames.get(connection.guildId) : null) ||
        (connection?.guild_id ? preferredLavalinkNodeNames.get(connection.guild_id) : null) ||
        MUSIC_PREFERRED_LAVALINK_NODE;

    if (preferredName) {
        const preferredNode = nodeList.find(node => getLavalinkNodeName(node) === preferredName);
        if (preferredNode) return preferredNode;
    }

    return nodeList
        .slice()
        .sort((left, right) => getLavalinkNodePenalty(left) - getLavalinkNodePenalty(right))[0];

}

let shoukaku = null;

if (ENABLE_LAVALINK && LAVALINK_NODES.length) {

shoukaku = new Shoukaku(
    new Connectors.DiscordJS(client),
    LAVALINK_NODES,
    {
        moveOnDisconnect: false,
        resumable: false,
        reconnectTries: 3,
        reconnectInterval: 10,
        restTimeout: 20,
        nodeResolver: resolveLavalinkNode
    }
);

client.shoukaku = shoukaku;

shoukaku.on('ready', (name) => {
    markLavalinkNodeHealthy(name);
    console.log(`✅ Lavalink node connected: ${name}`);
    void musicSystem.handleNodeReady(name).catch(error => {
        console.error(`Music recovery failed after Lavalink node ${name} connected:`, error);
    });
});

shoukaku.on('error', (name, error) => {
    markLavalinkNodeUnhealthy(name, error?.code || error?.message || 'node error');
    console.error(`❌ Lavalink node error on ${name}:`, error);
    void musicSystem.handleNodeUnavailable(name);
});

shoukaku.on('close', (name, code, reason) => {
    markLavalinkNodeUnhealthy(name, `closed ${code || ''} ${reason || ''}`.trim());
    console.warn(`⚠️ Lavalink node closed: ${name} | Code: ${code} | Reason: ${reason}`);
    void musicSystem.handleNodeUnavailable(name);
});

shoukaku.on('disconnect', (name, count) => {
    markLavalinkNodeUnhealthy(name, `disconnect ${count || 0}`);
    console.warn(`⚠️ Lavalink node disconnected: ${name} | Reconnect count: ${count}`);
    void musicSystem.handleNodeUnavailable(name);
});

} else {

    client.shoukaku = null;
    queueStartupLog('info', 'Lavalink music is disabled. Set ENABLE_LAVALINK=true and configure LAVALINK_URL/LAVALINK_PASSWORD or LAVALINK_NODES_JSON.');

}

function getMusicLavalinkNodes(guildId = null) {
    const nodes = getLavalinkNodesArray(shoukaku?.nodes).filter(isLavalinkNodeUsable);
    const preferredName = guildId ? preferredLavalinkNodeNames.get(guildId) : MUSIC_PREFERRED_LAVALINK_NODE;
    return nodes.slice().sort((left, right) => {
        const leftPreferred = preferredName && getLavalinkNodeName(left) === preferredName ? -1 : 0;
        const rightPreferred = preferredName && getLavalinkNodeName(right) === preferredName ? -1 : 0;
        return leftPreferred - rightPreferred || getLavalinkNodePenalty(left) - getLavalinkNodePenalty(right);
    });
}

const musicSystem = createMusicSystem({
    client,
    enabled: ENABLE_LAVALINK && LAVALINK_NODES.length > 0,
    getShoukaku: () => shoukaku,
    getNodes: getMusicLavalinkNodes,
    getNodeName: getLavalinkNodeName,
    preferNode: (guildId, nodeName) => {
        if (guildId && nodeName) preferredLavalinkNodeNames.set(guildId, nodeName);
    },
    markNodeUnhealthy: (nodeName, reason) => markLavalinkNodeUnhealthy(nodeName, reason),
    isTicketChannel: channel => Boolean(getTicketRecordForChannel(channel)),
    discord: {
        EmbedBuilder,
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
        PermissionsBitField,
        ChannelType,
        StringSelectMenuBuilder,
        StringSelectMenuOptionBuilder
    }
});

// Discord.js forwards rejected async event handlers to the client's error
// event. Always listen for it so one failed command cannot stop the process.
client.on('error', (error) => {
    console.error('Discord client error:', error);
});

async function applyConfiguredBotNickname() {
    if (!BOT_SERVER_NICKNAME) return;
    let updated = 0;
    let failed = 0;

    for (const guild of client.guilds.cache.values()) {
        try {
            const botMember = guild.members.me || await guild.members.fetchMe();
            if (botMember.nickname !== BOT_SERVER_NICKNAME) {
                await botMember.setNickname(BOT_SERVER_NICKNAME, 'Configured bot display name');
            }
            updated += 1;
        } catch (error) {
            failed += 1;
            console.warn(`Could not set the bot nickname in guild ${guild.id}: ${error?.message || error}`);
        }
    }

    console.log(`Bot nickname "${BOT_SERVER_NICKNAME}" applied in ${updated} guild(s)${failed ? `; ${failed} failed` : ''}.`);
}

// ==========================================
// READY EVENT
// ==========================================

client.once('clientReady', async () => {

    const flushStartupLogs = captureStartupLogs();

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
    loadInviteJoinRecords();
    loadWaifuPlayers();
    loadRpgStore();
    loadVrchatSafetyBlacklist();
    loadVrchatSafetyState();
    musicSystem.load();

    client.user.setPresence({
    activities: [
        {
            name: '!help - !vrchat',
            type: ActivityType.Watching
        }
    ],
    status: 'online'
});

    await applyConfiguredBotNickname();

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
    startVrchatAuditLogWatcher();
    startVrchatSafetyScanner();
    scheduleTempRoleRemovals();
    scheduleGiveawayEnds();
    startEventReminderWorker();

    await musicSystem.restorePersistentSessions();

    if (ENABLE_SLASH_COMMAND_REGISTRATION) {
        registerSlashCommandsForGuilds();
    } else {
        removeRestrictedSlashCommandsForGuilds();
    }

    const startupLogFlushTimer = setTimeout(flushStartupLogs, 5000);

    if (typeof startupLogFlushTimer.unref === 'function') {
        startupLogFlushTimer.unref();
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

function hasSafetyCommandAccess(member) {

    return (
        hasModAccess(member) ||
        member.roles.cache.some(role =>
            SAFETY_COMMAND_ROLE_IDS.includes(role.id)
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

function getVrcVerificationRecordsForVrchatUser(guildId, vrcUserId) {

    const normalizedGuildId = String(guildId || '');
    const normalizedVrcUserId = String(vrcUserId || '');

    if (!/^\d{17,20}$/.test(normalizedGuildId) ||
        !/^usr_[0-9a-fA-F-]{36}$/.test(normalizedVrcUserId)) {
        return [];
    }

    return [...vrcVerificationRecords.values()].filter(record =>
        record.guildId === normalizedGuildId &&
        record.vrcUserId === normalizedVrcUserId
    );

}

async function getLinkedDiscordAccountsForVrchatUser(guild, vrcUserId) {

    if (!guild?.id) return [];

    const records = getVrcVerificationRecordsForVrchatUser(guild.id, vrcUserId);
    const linkedAccounts = [];

    for (const record of records) {

        const discordUserId = record.discordUserId;
        let member = guild.members.cache.get(discordUserId) || null;

        if (!member) {
            member = await guild.members.fetch(discordUserId).catch(() => null);
        }

        let user = member?.user || client.users.cache.get(discordUserId) || null;

        if (!user) {
            user = await client.users.fetch(discordUserId).catch(() => null);
        }

        linkedAccounts.push({
            discordUserId,
            username: user?.username || 'Unknown Discord user',
            stillInServer: Boolean(member),
            verifiedAt: record.verifiedAt || null
        });

    }

    return linkedAccounts;

}

function formatLinkedDiscordAccounts(accounts, maxAccounts = 5) {

    if (!Array.isArray(accounts) || accounts.length === 0) {
        return 'No linked Discord account found.';
    }

    const visibleAccounts = accounts.slice(0, Math.max(1, maxAccounts));
    const lines = visibleAccounts.map(account => {
        const username = truncateSafetyText(`@${account.username || 'Unknown Discord user'}`, 100);
        const serverStatus = account.stillInServer ? '' : ' *(no longer in server)*';
        return `• Discord username: **${username}**${serverStatus}\n  Discord user ID: \`${account.discordUserId}\``;
    });

    if (accounts.length > visibleAccounts.length) {
        lines.push(`• ${accounts.length - visibleAccounts.length} additional linked account(s) omitted.`);
    }

    return lines.join('\n');

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

    const channelId = config.logChannelId || VRCHAT_AUDIT_LOG_CHANNEL_ID || LOG_CHANNEL_ID;
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

class VrchatRateLimitError extends Error {

    constructor(retryAfterMs, source = 'response') {

        const safeRetryAfterMs = Math.max(1000, Number(retryAfterMs) || VRCHAT_RATE_LIMIT_BACKOFF_MS);
        const retryMinutes = Math.max(1, Math.ceil(safeRetryAfterMs / 60000));

        super(`VRChat rate limited requests. Scanner paused for about ${retryMinutes} minute(s).`);
        this.name = 'VrchatRateLimitError';
        this.code = 'VRCHAT_RATE_LIMITED';
        this.statusCode = 429;
        this.retryAfterMs = safeRetryAfterMs;
        this.source = source;

    }

}

function isVrchatRateLimitError(error) {
    return error?.code === 'VRCHAT_RATE_LIMITED' || /rate limit/i.test(String(error?.message || ''));
}

function getVrchatRetryAfterMs(response) {

    const retryAfter = response.headers.get('retry-after');

    if (retryAfter) {

        const seconds = Number(retryAfter);

        if (Number.isFinite(seconds) && seconds >= 0) {
            return Math.max(1000, Math.ceil(seconds * 1000));
        }

        const retryDate = Date.parse(retryAfter);

        if (!Number.isNaN(retryDate)) {
            return Math.max(1000, retryDate - Date.now());
        }

    }

    const resetHeader = response.headers.get('x-ratelimit-reset');
    const resetValue = Number(resetHeader);

    if (Number.isFinite(resetValue) && resetValue > 0) {
        const resetAt = resetValue > 10_000_000_000 ? resetValue : resetValue * 1000;
        return Math.max(1000, resetAt - Date.now());
    }

    return VRCHAT_RATE_LIMIT_BACKOFF_MS;

}

function setVrchatApiBackoff(retryAfterMs) {

    const safeRetryAfterMs = Math.max(1000, Number(retryAfterMs) || VRCHAT_RATE_LIMIT_BACKOFF_MS);
    vrchatApiBackoffUntil = Math.max(vrchatApiBackoffUntil, Date.now() + safeRetryAfterMs);

    if (Date.now() - vrchatLastRateLimitLogAt > 60 * 1000) {
        vrchatLastRateLimitLogAt = Date.now();
        console.warn(
            `VRChat API backoff enabled for about ${Math.max(1, Math.ceil(safeRetryAfterMs / 60000))} minute(s).`
        );
    }

}

async function runVrchatApiRequest(task) {

    const queuedRequest = vrchatApiRequestQueue.then(async () => {

        const now = Date.now();

        if (vrchatApiBackoffUntil > now) {
            throw new VrchatRateLimitError(vrchatApiBackoffUntil - now, 'local-backoff');
        }

        const throttleWaitMs = Math.max(0, vrchatApiNextRequestAt - now);

        if (throttleWaitMs > 0) {
            await wait(throttleWaitMs);
        }

        vrchatApiNextRequestAt = Date.now() + VRCHAT_API_MIN_INTERVAL_MS;
        return await task();

    });

    vrchatApiRequestQueue = queuedRequest.catch(() => {});
    return await queuedRequest;

}

async function requestVrchatApiJson(method, endpointPath, {
    params = null,
    body = null
} = {}) {

    const url = new URL(`https://api.vrchat.cloud/api/1${endpointPath}`);

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, String(value));
        }
    }

    const headers = getVrchatRequestHeaders();

    if (body !== null && body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await runVrchatApiRequest(() => fetch(url, {
        method,
        headers,
        body: body !== null && body !== undefined
            ? JSON.stringify(body)
            : undefined
    }));

    const payload = await response.json().catch(() => null);

    if (response.status === 429) {
        const retryAfterMs = getVrchatRetryAfterMs(response);
        setVrchatApiBackoff(retryAfterMs);
        throw new VrchatRateLimitError(retryAfterMs);
    }

    if (!response.ok) {
        const errorMessage = payload?.error?.message || payload?.message || response.statusText;

        if ((response.status === 401 || response.status === 403) && !VRCHAT_AUTH_COOKIE) {
            const error = new Error(
                `VRChat rejected the public request for ${endpointPath}. ` +
                'This VRChat endpoint may require authentication or a backend service.'
            );
            error.statusCode = response.status;
            error.payload = payload;
            error.endpointPath = endpointPath;
            throw error;
        }

        const error = new Error(`VRChat API returned ${response.status}: ${errorMessage}`);
        error.statusCode = response.status;
        error.payload = payload;
        error.endpointPath = endpointPath;
        throw error;
    }

    return payload;

}

async function fetchVrchatApiJson(endpointPath, params = null) {
    return await requestVrchatApiJson('GET', endpointPath, {
        params
    });
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

function getVrchatAgeVerificationResult(user) {

    const hasAgeVerifiedField = Object.prototype.hasOwnProperty.call(user || {}, 'ageVerified');
    const hasAgeStatusField = Object.prototype.hasOwnProperty.call(user || {}, 'ageVerificationStatus');
    const status = String(user?.ageVerificationStatus || '').toLowerCase().trim();
    const ageVerified = user?.ageVerified;
    const statusLooksNotVerified = status.includes('not') ||
        status.includes('unverified') ||
        status.includes('none') ||
        status.includes('under');
    const statusLooks18Plus = !statusLooksNotVerified && (
        status === '18+' ||
        status.includes('18+') ||
        status.includes('verified')
    );

    if (ageVerified === true && (!hasAgeStatusField || statusLooks18Plus)) {
        return {
            allowed: true,
            verified: true,
            reason: 'VRChat profile shows 18+ age verification.'
        };
    }

    if (ageVerified !== false && hasAgeStatusField && statusLooks18Plus) {
        return {
            allowed: true,
            verified: true,
            reason: 'VRChat profile shows an 18+ age verification status.'
        };
    }

    if (!hasAgeVerifiedField && !hasAgeStatusField) {
        return {
            allowed: !VRC_VERIFY_REQUIRE_AGE_VERIFICATION && VRC_VERIFY_ALLOW_PUBLIC_UNKNOWN_AGE,
            verified: false,
            unknown: true,
            reason: 'VRChat public/no-account mode did not expose age verification fields.'
        };
    }

    return {
        allowed: !VRC_VERIFY_REQUIRE_AGE_VERIFICATION &&
            ageVerified !== false &&
            !statusLooksNotVerified,
        verified: false,
        unknown: false,
        reason: `VRChat profile is not showing 18+ age verification. ageVerified=${Boolean(ageVerified)}, ageVerificationStatus=${user?.ageVerificationStatus || 'missing'}`
    };

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
                value: VRCHAT_AUTH_COOKIE
                    ? 'VRCHAT_AUTH_COOKIE is set.'
                    : 'Public/no-account mode. Some VRChat endpoints may reject unauthenticated requests.',
                inline: true
            },
            {
                name: 'Age Check',
                value: VRC_VERIFY_REQUIRE_AGE_VERIFICATION
                    ? 'Strict: VRChat must expose 18+ age verification.'
                    : `No-account mode: ${VRC_VERIFY_ALLOW_PUBLIC_UNKNOWN_AGE ? 'allows unknown public age fields' : 'blocks unknown public age fields'}.`,
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

        const ageVerification = getVrchatAgeVerificationResult(vrcUser);

        if (!ageVerification.allowed) {
            await statusMessage.edit(
                `I found **${vrcUser.displayName || 'that profile'}**, but ${ageVerification.reason}`
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
                        value: ageVerification.reason,
                        inline: false
                    }
                ],
                '#ED4245',
                config
            );

            return;
        }

        if (ageVerification.unknown) {
            await sendVrcVerificationLog(
                message.guild,
                'VRC Age Verification Not Publicly Visible',
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
                        value: `${ageVerification.reason} Continuing because public/no-account mode is allowed.`,
                        inline: false
                    }
                ],
                '#FEE75C',
                config
            );
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
                    name: 'Account Link',
                    value: `Discord \`${message.author.id}\` is now linked to VRChat \`${vrcUser.id}\` for safety alerts.`,
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
    'adminpull',
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
    'givewaifu',
    'help',
    'inviteinfo',
    'invites',
    'joke',
    'kick',
    'leaderboard',
    'leave',
    'log',
    'massdelete',
    'maxpull',
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
    'warn',
    'whoinvited'
];

const RESTRICTED_SLASH_COMMAND_NAMES = new Set([
    'add',
    'addrole',
    'aboutbot',
    'automod',
    'ban',
    'blacklistgroup',
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
    'reloadcmd',
    'remove',
    'removerole',
    'reopen',
    'rename',
    'restart',
    'resetwarns',
    'safetyscan',
    'stopscan',
    'stopsafetyscan',
    'cancelscan',
    'scanblacklist',
    'scanblacklisted',
    'blacklistscan',
    'scanmembergroups',
    'scanvrcgroups',
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
    'uptime',
    'vcrupdatestaff',
    'vrcaccountstatus',
    'vrcaddadmin',
    'vrcaddstaff',
    'vrcavibl',
    'vrcban',
    'vrccookiestatus',
    'vrcunverify',
    'vrcblacklist',
    'vrcauthstatus',
    'vrccheck',
    'vrcgroupsbl',
    'vrcmanageapikey',
    'vrcmembergroups',
    'vrcremoveadmin',
    'vrcremovestaff',
    'vrcunban',
    'vrcuserbl',
    'vrcupdatestaff',
    'vrcverifyconfig',
    'vrchatscan',
    'vrckick',
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

function readJsonObjectFile(filePath, fallback = {}) {

    if (!fs.existsSync(filePath)) return fallback;

    try {

        const rawPayload = fs.readFileSync(filePath, 'utf8').trim();

        if (!rawPayload) return fallback;

        const payload = JSON.parse(rawPayload);
        return payload && typeof payload === 'object' && !Array.isArray(payload)
            ? payload
            : fallback;

    } catch (error) {

        console.error(`Failed to read ${filePath}:`, error);
        return fallback;

    }

}

function writeJsonObjectFile(filePath, value) {

    try {
        fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    } catch (error) {
        console.error(`Failed to write ${filePath}:`, error);
    }

}

function getInviteJoinKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function normalizeInviteJoinRecord(record = {}) {

    const guildId = String(record.guildId || '');
    const joinedUserId = String(record.joinedUserId || record.userId || '');

    if (!/^\d{17,20}$/.test(guildId) || !/^\d{17,20}$/.test(joinedUserId)) {
        return null;
    }

    const inviterId = String(record.inviterId || '');

    return {
        guildId,
        joinedUserId,
        joinedUserTag: String(record.joinedUserTag || record.userTag || joinedUserId),
        inviterId: /^\d{17,20}$/.test(inviterId) ? inviterId : null,
        inviterTag: record.inviterTag ? String(record.inviterTag) : null,
        inviteCode: record.inviteCode ? String(record.inviteCode) : null,
        joinedAt: record.joinedAt || new Date().toISOString()
    };

}

function loadInviteJoinRecords() {

    const savedRecords = readJsonObjectFile(INVITE_JOIN_RECORDS_FILE, {});
    inviteJoinRecords.clear();

    for (const rawRecord of Object.values(savedRecords)) {
        const record = normalizeInviteJoinRecord(rawRecord);

        if (!record) continue;

        inviteJoinRecords.set(getInviteJoinKey(record.guildId, record.joinedUserId), record);
    }

    if (inviteJoinRecords.size > 0) {
        console.log(`Loaded ${inviteJoinRecords.size} invite join record(s).`);
    }

}

function saveInviteJoinRecords() {

    writeJsonObjectFile(
        INVITE_JOIN_RECORDS_FILE,
        Object.fromEntries(inviteJoinRecords.entries())
    );

}

function recordInviteJoin(member, usedInvite = null) {

    if (!member?.guild?.id || !member?.user?.id) return;

    const record = normalizeInviteJoinRecord({
        guildId: member.guild.id,
        joinedUserId: member.user.id,
        joinedUserTag: member.user.tag,
        inviterId: usedInvite?.inviter?.id || null,
        inviterTag: usedInvite?.inviter?.tag || null,
        inviteCode: usedInvite?.code || null,
        joinedAt: new Date().toISOString()
    });

    if (!record) return;

    inviteJoinRecords.set(getInviteJoinKey(record.guildId, record.joinedUserId), record);
    saveInviteJoinRecords();

}

function formatInviteJoinRecord(record, targetLabel) {

    if (!record) {
        return `No invite record found for ${targetLabel}. I can track future joins, and I can recover older joins only if recent join logs still contain that member's current tag/name.`;
    }

    const lines = [
        `Invite record for ${targetLabel}:`,
        record.inviterId
            ? `Inviter: ${record.inviterTag || 'Unknown user'} (${record.inviterId})`
            : 'Inviter: Unknown',
        record.inviteCode ? `Invite code: \`${record.inviteCode}\`` : 'Invite code: Unknown',
        `Joined at: ${record.joinedAt || 'Unknown'}`
    ];

    return lines.join('\n');

}

function getInviteLogSearchTerms(targetUser) {

    return [
        targetUser?.tag,
        targetUser?.username,
        targetUser?.globalName,
        targetUser?.displayName,
        targetUser?.id
    ]
        .map(value => String(value || '').trim().toLowerCase())
        .filter((value, index, values) => value && values.indexOf(value) === index);

}

function getInviteLogMessageText(logMessage) {

    const parts = [logMessage.content || ''];

    for (const embed of logMessage.embeds?.values?.() || logMessage.embeds || []) {
        if (embed.title) parts.push(embed.title);
        if (embed.description) parts.push(embed.description);

        for (const field of embed.fields || []) {
            if (field.name) parts.push(field.name);
            if (field.value) parts.push(field.value);
        }
    }

    return parts.filter(Boolean).join('\n');

}

function parseInviteJoinRecordFromLogMessage(logMessage, guildId, targetUser) {

    const text = getInviteLogMessageText(logMessage);
    const normalizedText = text.toLowerCase();
    const searchTerms = getInviteLogSearchTerms(targetUser);

    if (!searchTerms.some(term => normalizedText.includes(term))) return null;
    if (!/joined/i.test(text) || !/invite/i.test(text)) return null;

    const mentionInviterMatch = text.match(/(?:from|inviter:\s*)\s*<@!?(\d{17,20})>/i);
    const plainInviterMatch = text.match(/(?:from|inviter:\s*)\s*([^\n()]+?)\s*\((\d{17,20})\)/i);
    const inviteCodeMatch =
        text.match(/invite\s+`([^`]+)`/i) ||
        text.match(/invite:\s*`?([A-Za-z0-9_-]+)`?/i);
    const inviterId = mentionInviterMatch?.[1] || plainInviterMatch?.[2] || null;
    const inviterTag = plainInviterMatch?.[1]?.trim() || null;

    return normalizeInviteJoinRecord({
        guildId,
        joinedUserId: targetUser.id,
        joinedUserTag: targetUser.tag,
        inviterId,
        inviterTag,
        inviteCode: inviteCodeMatch?.[1] || null,
        joinedAt: logMessage.createdAt?.toISOString?.() || new Date(logMessage.createdTimestamp || Date.now()).toISOString()
    });

}

async function searchInviteJoinRecordInChannel(channel, guildId, targetUser, maxMessages = 1000) {

    if (!channel?.messages?.fetch) return null;

    let before;
    let checked = 0;

    while (checked < maxMessages) {
        const limit = Math.min(100, maxMessages - checked);
        const fetchedMessages = await channel.messages.fetch({
            limit,
            before
        }).catch(() => null);

        if (!fetchedMessages?.size) break;

        const orderedMessages = [...fetchedMessages.values()]
            .sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        for (const logMessage of orderedMessages) {
            checked++;

            const record = parseInviteJoinRecordFromLogMessage(logMessage, guildId, targetUser);

            if (record) return record;
        }

        before = fetchedMessages.last()?.id;

        if (fetchedMessages.size < limit || !before) break;
    }

    return null;

}

async function findInviteJoinRecordFromLogs(guild, targetUser) {

    if (!guild || !targetUser) return null;

    const channels = [
        getLogChannel(guild),
        guild.systemChannel
    ].filter((channel, index, values) =>
        channel?.id && values.findIndex(candidate => candidate?.id === channel.id) === index
    );

    for (const channel of channels) {
        const record = await searchInviteJoinRecordInChannel(channel, guild.id, targetUser);

        if (!record) continue;

        inviteJoinRecords.set(getInviteJoinKey(record.guildId, record.joinedUserId), record);
        saveInviteJoinRecords();
        return record;
    }

    return null;

}

function getDefaultVrcLoggerStore() {

    return {
        userBlacklist: {},
        avatarBlacklist: {},
        staff: {},
        admins: {},
        apiKeys: {},
        moderationLog: [],
        auditLogMirror: {
            groupId: null,
            initialized: false,
            lastCreatedAt: null,
            recentIds: [],
            lastPolledAt: null
        }
    };

}

function normalizeVrchatAuditMirrorState(state = {}) {

    return {
        groupId: typeof state.groupId === 'string' ? state.groupId : null,
        initialized: state.initialized === true,
        lastCreatedAt: typeof state.lastCreatedAt === 'string' ? state.lastCreatedAt : null,
        recentIds: Array.isArray(state.recentIds)
            ? [...new Set(state.recentIds.map(value => String(value || '')).filter(Boolean))]
                .slice(-VRCHAT_AUDIT_RECENT_ID_LIMIT)
            : [],
        lastPolledAt: typeof state.lastPolledAt === 'string' ? state.lastPolledAt : null
    };

}

function readVrcLoggerStore() {

    const savedStore = readJsonObjectFile(VRCLOGGER_STORE_FILE, getDefaultVrcLoggerStore());

    return {
        ...getDefaultVrcLoggerStore(),
        ...savedStore,
        userBlacklist: savedStore.userBlacklist || {},
        avatarBlacklist: savedStore.avatarBlacklist || {},
        staff: savedStore.staff || {},
        admins: savedStore.admins || {},
        apiKeys: savedStore.apiKeys || {},
        moderationLog: Array.isArray(savedStore.moderationLog) ? savedStore.moderationLog : [],
        auditLogMirror: normalizeVrchatAuditMirrorState(savedStore.auditLogMirror)
    };

}

function saveVrcLoggerStore(store) {
    writeJsonObjectFile(VRCLOGGER_STORE_FILE, store);
}

function saveVrchatAuditMirrorState(state) {

    const latestStore = readVrcLoggerStore();
    latestStore.auditLogMirror = normalizeVrchatAuditMirrorState(state);
    saveVrcLoggerStore(latestStore);

}

function hasBotOwnerAccess(message) {

    return (
        BOT_OWNER_IDS.includes(message.author.id) ||
        hasServerAdminOrOwnerAccess(message.member)
    );

}

function hasVrcLoggerAdminAccess(member) {

    const store = readVrcLoggerStore();

    return (
        hasSafetyCommandAccess(member) ||
        store.admins?.[member.id]?.active === true
    );

}

function hasVrcLoggerStaffAccess(member) {

    const store = readVrcLoggerStore();

    return (
        hasVrcLoggerAdminAccess(member) ||
        store.staff?.[member.id]?.active === true
    );

}

function extractVrchatAvatarIdFromInput(input) {
    return String(input || '').match(/avtr_[0-9a-fA-F-]{36}/)?.[0] || null;
}

function extractVrchatWorldIdFromInput(input) {
    return String(input || '').match(/wrld_[0-9a-fA-F-]{36}/)?.[0] || null;
}

function getVrcLoggerBackendEndpoint(action) {

    const endpoints = {
        ban: process.env.VRCLOGGER_BAN_ENDPOINT || '/moderation/ban',
        unban: process.env.VRCLOGGER_UNBAN_ENDPOINT || '/moderation/unban',
        kick: process.env.VRCLOGGER_KICK_ENDPOINT || '/moderation/kick'
    };

    return endpoints[action] || `/moderation/${action}`;

}

async function callVrcLoggerBackend(action, payload) {

    if (!VRCLOGGER_BACKEND_URL || !VRCLOGGER_BACKEND_API_KEY) {
        throw new Error('Set VRCLOGGER_BACKEND_URL and VRCLOGGER_BACKEND_API_KEY before using VRChat moderation actions.');
    }

    const endpoint = getVrcLoggerBackendEndpoint(action);
    const url = new URL(endpoint, VRCLOGGER_BACKEND_URL.endsWith('/')
        ? VRCLOGGER_BACKEND_URL
        : `${VRCLOGGER_BACKEND_URL}/`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${VRCLOGGER_BACKEND_API_KEY}`
        },
        body: JSON.stringify(payload)
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
        const message = body?.error?.message || body?.message || response.statusText;
        throw new Error(`Backend returned ${response.status}: ${message}`);
    }

    return body || {};

}

function getDirectVrchatModerationAttempts(action, groupId, userId, reason) {

    if (action === 'ban') {
        return [
            {
                method: 'POST',
                path: `/groups/${encodeURIComponent(groupId)}/bans`,
                body: {
                    userId,
                    reason
                }
            },
            {
                method: 'POST',
                path: `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/ban`,
                body: {
                    reason
                }
            },
            {
                method: 'PUT',
                path: `/groups/${encodeURIComponent(groupId)}/bans/${encodeURIComponent(userId)}`,
                body: {
                    reason
                }
            }
        ];
    }

    if (action === 'unban') {
        return [
            {
                method: 'DELETE',
                path: `/groups/${encodeURIComponent(groupId)}/bans/${encodeURIComponent(userId)}`
            },
            {
                method: 'DELETE',
                path: `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/ban`
            }
        ];
    }

    return [
        {
            method: 'DELETE',
            path: `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}`,
            body: {
                reason
            }
        },
        {
            method: 'POST',
            path: `/groups/${encodeURIComponent(groupId)}/members/${encodeURIComponent(userId)}/kick`,
            body: {
                reason
            }
        }
    ];

}

async function callVrchatDirectModeration(action, payload) {

    if (!VRCHAT_AUTH_COOKIE) {
        throw new Error(
            'Direct VRChat moderation needs VRCHAT_AUTH_COOKIE from a VRChat account that can moderate the group. ' +
            'Without a backend or moderator auth, VRChat will not allow real ban/kick/unban actions.'
        );
    }

    const groupId = payload.groupId;
    const userId = payload.userId;

    if (!groupId || !userId) {
        throw new Error('Missing VRChat group ID or user ID for direct moderation.');
    }

    const attempts = getDirectVrchatModerationAttempts(action, groupId, userId, payload.reason);
    const errors = [];

    for (const attempt of attempts) {

        try {
            const result = await requestVrchatApiJson(attempt.method, attempt.path, {
                body: attempt.body || null
            });

            return {
                mode: 'direct',
                endpoint: `${attempt.method} ${attempt.path}`,
                result
            };

        } catch (error) {
            errors.push(`${attempt.method} ${attempt.path}: ${error.message}`);
        }

    }

    throw new Error(`Direct VRChat ${action} failed. Tried ${attempts.length} endpoint(s). ${errors.join(' | ')}`);

}

async function executeVrcLoggerModerationAction(action, payload) {

    if (VRCLOGGER_ACTION_MODE === 'log-only') {
        return {
            mode: 'log-only',
            result: {
                queued: true
            }
        };
    }

    const canUseDirect = VRCLOGGER_ACTION_MODE !== 'backend' && Boolean(VRCHAT_AUTH_COOKIE);
    const canUseBackend = VRCLOGGER_ACTION_MODE !== 'direct' && Boolean(VRCLOGGER_BACKEND_URL && VRCLOGGER_BACKEND_API_KEY);

    if (canUseDirect) {
        try {
            return await callVrchatDirectModeration(action, payload);
        } catch (error) {
            if (!canUseBackend || VRCLOGGER_ACTION_MODE === 'direct') {
                throw error;
            }

            console.warn(`Direct VRChat ${action} failed, falling back to backend:`, error.message);

            return {
                mode: 'backend',
                directError: error.message,
                result: await callVrcLoggerBackend(action, payload)
            };
        }
    }

    if (canUseBackend) {
        return {
            mode: 'backend',
            result: await callVrcLoggerBackend(action, payload)
        };
    }

    throw new Error(
        'No live VRChat moderation method is configured. To avoid a backend, set VRCHAT_AUTH_COOKIE for a VRChat moderator account. ' +
        'Otherwise set VRCLOGGER_BACKEND_URL and VRCLOGGER_BACKEND_API_KEY, or use VRCLOGGER_ACTION_MODE=log-only to only audit requests.'
    );

}

function addVrcLoggerModerationLog(action, data) {

    const store = readVrcLoggerStore();

    store.moderationLog.unshift({
        id: crypto.randomUUID(),
        action,
        ...data,
        createdAt: new Date().toISOString()
    });
    store.moderationLog = store.moderationLog.slice(0, 500);
    saveVrcLoggerStore(store);

}

async function getVrchatAuditLogChannel(guild) {

    const channel = guild.channels.cache.get(VRCHAT_AUDIT_LOG_CHANNEL_ID) ||
        await guild.channels.fetch(VRCHAT_AUDIT_LOG_CHANNEL_ID).catch(() => null);

    return channel?.isTextBased?.() && channel.send ? channel : null;

}

async function sendVrchatAuditLog(guild, title, fields = [], color = '#2B90D9') {

    const channel = await getVrchatAuditLogChannel(guild);

    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .addFields(
            fields
                .filter(field => field?.name && field?.value !== undefined && field?.value !== null)
                .map(field => ({
                    name: String(field.name).slice(0, 256),
                    value: truncateText(String(field.value), 1000),
                    inline: Boolean(field.inline)
                }))
        )
        .setTimestamp();

    await channel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    }).catch(error => {
        console.error('Failed to send VRChat audit log:', error);
    });

}

function formatDuration(totalSeconds) {

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return [
        days ? `${days}d` : null,
        hours ? `${hours}h` : null,
        minutes ? `${minutes}m` : null,
        `${seconds}s`
    ].filter(Boolean).join(' ');

}

function getVrcLoggerCommandList() {

    return [
        '**General**',
        '`!ping`, `!help`, `!aboutbot`',
        '**Bot owners**',
        '`!uptime`, `!restart`, `!reloadcmd`',
        '**VRChat / VRCLogger**',
        '`!vrcaccountstatus`, `!vrccheck`, `!vrcban`, `!vrcunban`, `!vrckick`',
        '`!safetyscan`, `!stopscan`, `!scanblacklist`, `!scanmembergroups`, `!blacklistgroup`',
        '`!vrcuserbl`, `!vrcavibl`, `!vrcgroupsbl`',
        '`!vrcaddstaff`, `!vrcremovestaff`, `!vrcupdatestaff`',
        '`!vrcaddadmin`, `!vrcremoveadmin`, `!vrcmanageapikey`'
    ].join('\n');

}

async function handleAboutBotCommand(message) {

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('discordBotStandalone (VRCLogger BanLogger)')
        .setDescription(
            'Standalone Discord bot for VRChat group moderation logging, blacklist tooling, and staff/admin workflows. ' +
            'This build runs as a single bot instance with direct VRChat API support, optional backend fallback, and local JSON datastore tooling.'
        )
        .addFields(
            {
                name: 'Features',
                value: [
                    'VRChat group moderation actions: ban, unban, kick, request handling hooks',
                    'User, avatar, and group blacklist management',
                    'Staff/admin role management with access controls',
                    'API key management for VRChat staff workflows',
                    'VRChat user lookup and group membership checks'
                ].join('\n'),
                inline: false
            },
            {
                name: 'Commands',
                value: getVrcLoggerCommandList(),
                inline: false
            }
        )
        .setFooter({
            text: 'All VRCLogger commands use ! prefix commands in this build.'
        })
        .setTimestamp();

    await message.channel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

async function handleUptimeCommand(message) {

    if (!hasBotOwnerAccess(message)) {
        return message.reply('No permission. Bot owner access is required.');
    }

    return message.reply(`Uptime: **${formatDuration(process.uptime())}**`);

}

async function handleReloadCmdCommand(message) {

    if (!hasBotOwnerAccess(message)) {
        return message.reply('No permission. Bot owner access is required.');
    }

    loadVrchatSafetyBlacklist();
    loadVrchatSafetyState();

    return message.reply('Reloaded VRCLogger safety data and local command datastore.');

}

async function handleRestartCommand(message) {

    if (!hasBotOwnerAccess(message)) {
        return message.reply('No permission. Bot owner access is required.');
    }

    await message.reply('Restarting bot process. Your host must auto-restart the process for it to come back online.');

    setTimeout(() => {
        process.exit(0);
    }, 1000);

}

async function resolveVrchatUserForLogger(input) {

    const userId = extractVrcUserIdFromInput(input);

    if (userId) {
        return await fetchVrchatUserById(userId);
    }

    return await resolveVrchatUser(input);

}

function hasVrchatAccountStatusAccess(member) {
    return hasSafetyCommandAccess(member) || hasVrcLoggerStaffAccess(member);
}

function getVrcLoggerActionModeLabel() {

    if (VRCLOGGER_ACTION_MODE === 'log-only') return 'Log-only';
    if (VRCLOGGER_ACTION_MODE === 'direct') return 'Direct VRChat API only';
    if (VRCLOGGER_ACTION_MODE === 'backend') return 'Backend only';

    return VRCHAT_AUTH_COOKIE
        ? 'Auto: direct VRChat API first'
        : VRCLOGGER_BACKEND_URL && VRCLOGGER_BACKEND_API_KEY
            ? 'Auto: backend'
            : 'Auto: no live action method configured';

}

async function handleVrcAccountStatusCommand(message) {

    if (!hasVrchatAccountStatusAccess(message.member)) {
        return message.reply('No permission.');
    }

    if (!VRCHAT_AUTH_COOKIE) {
        return message.reply(
            'No `VRCHAT_AUTH_COOKIE` is configured. Public lookup/scans can still work where VRChat allows them, ' +
            'but direct VRChat ban/kick/unban actions need a valid moderator account cookie.'
        );
    }

    const statusMessage = await message.reply('Checking connected VRChat account...');

    try {

        const authUser = await requestVrchatApiJson('GET', '/auth/user');
        const twoFactorMethods = Array.isArray(authUser?.requiresTwoFactorAuth)
            ? authUser.requiresTwoFactorAuth
            : [];
        const needsTwoFactor = twoFactorMethods.length > 0;
        const accountId = authUser?.id || authUser?.userId || 'Unknown';
        const displayName = authUser?.displayName || authUser?.username || accountId;
        let groupMembership = 'Not checked';
        let groupRoles = 'No role details returned by VRChat.';

        if (!needsTwoFactor && VRCLOGGER_GROUP_ID) {

            try {

                const group = await fetchVrchatGroup(VRCLOGGER_GROUP_ID);
                const myMember = group?.myMember || null;
                const roleIds = Array.isArray(myMember?.roleIds) ? myMember.roleIds : [];
                const roleNames = roleIds
                    .map(roleId => {
                        const role = Array.isArray(group?.roles)
                            ? group.roles.find(groupRole => groupRole.id === roleId)
                            : null;

                        return role?.name || roleId;
                    })
                    .filter(Boolean);

                groupMembership = myMember
                    ? myMember.membershipStatus || 'Member'
                    : 'VRChat did not return membership details.';
                groupRoles = roleNames.length
                    ? roleNames.join(', ')
                    : groupRoles;

            } catch (error) {
                groupMembership = `Check failed: ${truncateText(error.message, 180)}`;
            }

        }

        const embed = new EmbedBuilder()
            .setColor(needsTwoFactor ? '#FEE75C' : '#57F287')
            .setTitle('Connected VRChat Account Status')
            .addFields(
                {
                    name: 'Cookie',
                    value: 'Configured',
                    inline: true
                },
                {
                    name: 'Login Status',
                    value: needsTwoFactor
                        ? `Needs 2FA: ${twoFactorMethods.join(', ')}`
                        : 'Valid',
                    inline: true
                },
                {
                    name: 'Action Mode',
                    value: getVrcLoggerActionModeLabel(),
                    inline: false
                },
                {
                    name: 'VRChat Account',
                    value: needsTwoFactor
                        ? 'VRChat did not return the account until 2FA is completed.'
                        : `${displayName} (${accountId})`,
                    inline: false
                },
                {
                    name: 'Moderated Group',
                    value: VRCLOGGER_GROUP_ID || 'Not configured',
                    inline: false
                },
                {
                    name: 'Native Audit Log Mirror',
                    value: vrchatAuditWatcherStarted
                        ? `Running every ${Math.round(VRCHAT_AUDIT_POLL_INTERVAL_MS / 1000)} second(s) → <#${VRCHAT_AUDIT_LOG_CHANNEL_ID}>`
                        : 'Not running',
                    inline: false
                },
                {
                    name: 'Audit Log Group',
                    value: VRCHAT_AUDIT_GROUP_ID || 'Not configured',
                    inline: false
                },
                {
                    name: 'Group Membership',
                    value: groupMembership,
                    inline: true
                },
                {
                    name: 'Group Roles',
                    value: truncateText(groupRoles, 900),
                    inline: false
                }
            )
            .setTimestamp();

        if (!needsTwoFactor && accountId && accountId !== 'Unknown') {
            embed.setURL(`https://vrchat.com/home/user/${encodeURIComponent(accountId)}`);
        }

        await statusMessage.edit({
            content: '',
            embeds: [embed]
        });

    } catch (error) {

        await statusMessage.edit(
            `VRChat account status check failed: ${truncateText(error.message, 300)}`
        );

    }

}

async function handleVrcCheckCommand(message, args) {

    if (!hasVrcLoggerStaffAccess(message.member)) {
        return message.reply('No permission.');
    }

    const query = args[0];

    if (!query) {
        return message.reply('Usage: `!vrccheck <VRChat user ID/name/profile> [groupId/url]`');
    }

    const groupId = extractVrchatGroupIdFromInput(args[1]) || VRCLOGGER_GROUP_ID;
    const statusMessage = await message.reply('Looking up VRChat account...');

    try {

        const user = await resolveVrchatUserForLogger(query);

        if (!user?.id) {
            return statusMessage.edit('No VRChat user found.');
        }

        let groups = [];
        let isInGroup = null;

        try {
            groups = await fetchVrchatUserGroups(user.id);
            if (groupId) {
                isInGroup = groups.some(group => (group.groupId || group.id) === groupId);
            }
        } catch (error) {
            console.warn(`Unable to fetch groups for ${user.id}:`, error.message);
        }

        const userBlacklist = readVrcLoggerStore().userBlacklist[user.id];
        const embed = new EmbedBuilder()
            .setColor(userBlacklist?.active ? '#FF3B30' : '#2B90D9')
            .setTitle(user.displayName || user.username || user.id)
            .setURL(`https://vrchat.com/home/user/${encodeURIComponent(user.id)}`)
            .addFields(
                {
                    name: 'VRChat ID',
                    value: `\`${user.id}\``,
                    inline: false
                },
                {
                    name: 'Public Groups',
                    value: `${groups.length}`,
                    inline: true
                },
                {
                    name: 'Group Member',
                    value: isInGroup === null ? 'Not checked' : isInGroup ? 'Yes' : 'No',
                    inline: true
                },
                {
                    name: 'User Blacklist',
                    value: userBlacklist?.active
                        ? `Active | ${userBlacklist.severity || 'review'} | ${truncateSafetyText(userBlacklist.evidence || 'No evidence summary.', 300)}`
                        : 'No active local user blacklist entry.',
                    inline: false
                }
            )
            .setTimestamp();

        if (user.currentAvatarThumbnailImageUrl && /^https:\/\//i.test(user.currentAvatarThumbnailImageUrl)) {
            embed.setThumbnail(user.currentAvatarThumbnailImageUrl);
        }

        await statusMessage.edit({
            content: '',
            embeds: [embed]
        });

    } catch (error) {

        await statusMessage.edit(`VRChat lookup failed: ${truncateText(error.message, 300)}`);

    }

}

async function handleVrcModerationActionCommand(message, args, action) {

    if (!hasVrcLoggerStaffAccess(message.member)) {
        return message.reply('No permission.');
    }

    const targetInput = args.shift();
    const reason = args.join(' ').trim() || 'No reason provided.';

    if (!targetInput) {
        return message.reply(`Usage: \`!vrc${action} <VRChat user ID/name/profile> [reason]\``);
    }

    const statusMessage = await message.reply(`Sending VRChat ${action} request...`);

    try {

        const user = await resolveVrchatUserForLogger(targetInput);

        if (!user?.id) {
            return statusMessage.edit('No VRChat user found.');
        }

        const moderationPayload = {
            groupId: VRCLOGGER_GROUP_ID,
            userId: user.id,
            displayName: user.displayName || null,
            reason,
            moderatorDiscordId: message.author.id,
            moderatorTag: message.author.tag
        };
        const result = await executeVrcLoggerModerationAction(action, moderationPayload);

        addVrcLoggerModerationLog(action, {
            groupId: VRCLOGGER_GROUP_ID,
            vrchatUserId: user.id,
            displayName: user.displayName || user.id,
            reason,
            moderatorId: message.author.id,
            actionMode: result.mode || 'unknown',
            backendResult: result
        });

        await sendVrchatAuditLog(
            message.guild,
            `VRChat ${action.toUpperCase()} Completed`,
            [
                {
                    name: 'VRChat User',
                    value: `${user.displayName || user.id} (${user.id})`,
                    inline: false
                },
                {
                    name: 'Group',
                    value: VRCLOGGER_GROUP_ID || 'Not configured',
                    inline: false
                },
                {
                    name: 'Moderator',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'Reason',
                    value: reason,
                    inline: false
                },
                {
                    name: 'Mode',
                    value: result.mode === 'log-only'
                        ? 'Log-only'
                        : result.mode === 'direct'
                            ? 'Direct VRChat API'
                            : 'Backend',
                    inline: true
                }
            ],
            result.mode === 'log-only' ? '#FEE75C' : '#57F287'
        );

        await statusMessage.edit(
            result.mode === 'log-only'
                ? `VRChat ${action} request logged for **${user.displayName || user.id}** (\`${user.id}\`).`
                : `VRChat ${action} request completed for **${user.displayName || user.id}** (\`${user.id}\`) using ${result.mode || 'configured'} mode.`
        );

    } catch (error) {

        await statusMessage.edit(`VRChat ${action} failed: ${truncateText(error.message, 300)}`);

    }

}

function getVrcLoggerBlacklistUsage(kind) {

    const commandName = {
        user: 'vrcuserbl',
        avatar: 'vrcavibl',
        group: 'vrcgroupsbl'
    }[kind];
    const target = {
        user: 'VRChat user ID/name/profile',
        avatar: 'avatar ID/url',
        group: 'group ID/url'
    }[kind];

    if (kind === 'group') {
        return [
            `Usage: \`!${commandName} add <${target}> <category> <severity> <evidence summary>\``,
            `Other: \`!${commandName} check <${target}>\`, \`!${commandName} remove <${target}>\`, \`!${commandName} list\``
        ].join('\n');
    }

    return [
        `Usage: \`!${commandName} add <${target}> <severity> <evidence summary>\``,
        `Other: \`!${commandName} check <${target}>\`, \`!${commandName} remove <${target}>\`, \`!${commandName} list\``
    ].join('\n');

}

async function resolveVrcLoggerBlacklistTarget(kind, input) {

    if (kind === 'user') {
        const user = await resolveVrchatUserForLogger(input);
        return user?.id
            ? {
                id: user.id,
                name: user.displayName || user.id,
                url: `https://vrchat.com/home/user/${encodeURIComponent(user.id)}`
            }
            : null;
    }

    if (kind === 'avatar') {
        const avatarId = extractVrchatAvatarIdFromInput(input);
        return avatarId
            ? {
                id: avatarId,
                name: avatarId,
                url: `https://vrchat.com/home/avatar/${encodeURIComponent(avatarId)}`
            }
            : null;
    }

    const groupId = extractVrchatGroupIdFromInput(input);
    return groupId
        ? {
            id: groupId,
            name: groupId,
            url: `https://vrchat.com/home/group/${encodeURIComponent(groupId)}`
        }
        : null;

}

function getVrcLoggerBlacklistBucket(store, kind) {
    return kind === 'avatar' ? store.avatarBlacklist : store.userBlacklist;
}

async function handleVrcLoggerBlacklistCommand(message, args, kind) {

    if (!hasVrcLoggerStaffAccess(message.member)) {
        return message.reply('No permission.');
    }

    const action = String(args.shift() || '').toLowerCase();

    if (!action || action === 'help') {
        return message.reply(getVrcLoggerBlacklistUsage(kind));
    }

    if (kind === 'group') {
        return handleVrcLoggerGroupBlacklistCommand(message, [action, ...args]);
    }

    const store = readVrcLoggerStore();
    const bucket = getVrcLoggerBlacklistBucket(store, kind);

    if (action === 'list') {

        const activeRecords = Object.values(bucket)
            .filter(record => record?.active)
            .slice(0, 15);

        if (activeRecords.length === 0) {
            return message.reply(`No active ${kind} blacklist entries.`);
        }

        return message.reply(
            activeRecords.map(record =>
                `\`${record.id}\` | **${record.severity || 'review'}** | ${truncateSafetyText(record.name || record.id, 80)}`
            ).join('\n')
        );

    }

    const targetInput = args.shift();
    const target = await resolveVrcLoggerBlacklistTarget(kind, targetInput);

    if (!target) {
        return message.reply(getVrcLoggerBlacklistUsage(kind));
    }

    if (action === 'check') {
        const record = bucket[target.id];
        return message.reply(record?.active
            ? `Active ${kind} blacklist entry: \`${target.id}\` | **${record.severity || 'review'}** | ${record.evidence || 'No evidence summary.'}`
            : `No active ${kind} blacklist entry for \`${target.id}\`.`);
    }

    if (action === 'remove') {
        if (!bucket[target.id]) {
            return message.reply(`No ${kind} blacklist entry exists for \`${target.id}\`.`);
        }

        bucket[target.id].active = false;
        bucket[target.id].updatedBy = message.author.id;
        bucket[target.id].updatedAt = new Date().toISOString();
        saveVrcLoggerStore(store);

        await sendVrchatAuditLog(
            message.guild,
            `VRChat ${kind} Blacklist Removed`,
            [
                {
                    name: 'Target',
                    value: `${target.name} (${target.id})`,
                    inline: false
                },
                {
                    name: 'Moderator',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#FEE75C'
        );

        return message.reply(`Removed \`${target.id}\` from the active ${kind} blacklist.`);
    }

    if (action !== 'add') {
        return message.reply(getVrcLoggerBlacklistUsage(kind));
    }

    const severity = String(args.shift() || '').trim().toLowerCase();
    const evidence = args.join(' ').trim();

    if (!severity || !evidence) {
        return message.reply(getVrcLoggerBlacklistUsage(kind));
    }

    const now = new Date().toISOString();
    const existing = bucket[target.id] || {};

    bucket[target.id] = {
        ...existing,
        id: target.id,
        name: target.name,
        url: target.url,
        severity,
        evidence,
        active: true,
        addedBy: existing.addedBy || message.author.id,
        addedAt: existing.addedAt || now,
        updatedBy: message.author.id,
        updatedAt: now
    };
    saveVrcLoggerStore(store);

    await sendVrchatAuditLog(
        message.guild,
        `VRChat ${kind} Blacklist Added`,
        [
            {
                name: 'Target',
                value: `${target.name} (${target.id})`,
                inline: false
            },
            {
                name: 'Severity',
                value: severity,
                inline: true
            },
            {
                name: 'Moderator',
                value: `${message.author.tag} (${message.author.id})`,
                inline: false
            },
            {
                name: 'Evidence',
                value: evidence,
                inline: false
            }
        ],
        '#FF3B30'
    );

    return message.reply(`Saved active ${kind} blacklist entry for **${target.name}** (\`${target.id}\`).`);

}

async function handleVrcLoggerGroupBlacklistCommand(message, args) {

    const action = String(args.shift() || '').toLowerCase();

    if (!action || action === 'help') {
        return message.reply(getVrcLoggerBlacklistUsage('group'));
    }

    if (action === 'add') {
        return handleVrchatBlacklistGroupCommand(message, ['add', ...args]);
    }

    const { payload, records } = readVrchatSafetyBlacklistFile();

    if (action === 'list') {

        const activeRecords = records
            .map(normalizeVrchatSafetyBlacklistEntry)
            .filter(Boolean)
            .filter(record => record.active)
            .slice(0, 15);

        if (activeRecords.length === 0) {
            return message.reply('No active VRChat group blacklist entries.');
        }

        return message.reply(
            activeRecords.map(record =>
                `\`${record.group_id}\` | **${record.category}** | **${record.severity}** | ${truncateSafetyText(record.name, 80)}`
            ).join('\n')
        );

    }

    const groupId = extractVrchatGroupIdFromInput(args[0]);

    if (!groupId) {
        return message.reply(getVrcLoggerBlacklistUsage('group'));
    }

    const recordIndex = records.findIndex(record =>
        normalizeVrchatSafetyBlacklistEntry(record)?.group_id === groupId
    );
    const record = recordIndex >= 0 ? normalizeVrchatSafetyBlacklistEntry(records[recordIndex]) : null;

    if (action === 'check') {
        return message.reply(record?.active
            ? `Active group blacklist entry: \`${groupId}\` | **${record.category}** | **${record.severity}** | ${record.evidence || 'No evidence summary.'}`
            : `No active group blacklist entry for \`${groupId}\`.`);
    }

    if (action === 'remove') {
        if (recordIndex < 0) {
            return message.reply(`No group blacklist entry exists for \`${groupId}\`.`);
        }

        records[recordIndex] = {
            ...records[recordIndex],
            active: false,
            updated_by: message.author.id,
            updated_date: new Date().toISOString()
        };
        writeVrchatSafetyBlacklistFile(records, payload);
        loadVrchatSafetyBlacklist();

        await sendVrchatAuditLog(
            message.guild,
            'VRChat Group Blacklist Removed',
            [
                {
                    name: 'Group ID',
                    value: groupId,
                    inline: false
                },
                {
                    name: 'Moderator',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#FEE75C'
        );

        return message.reply(`Removed \`${groupId}\` from the active VRChat group blacklist.`);
    }

    return message.reply(getVrcLoggerBlacklistUsage('group'));

}

function formatVrcLoggerStaffUsage(commandName) {
    return `Usage: \`!${commandName} @user/userID${commandName === 'vrcaddstaff' || commandName === 'vrcupdatestaff' ? ' <staff role>' : ''}\``;
}

async function resolveDiscordUserIdForVrcLogger(message, arg) {

    const user = await resolveUserFromArg(message, arg);
    return user?.id || getUserIdFromArg(arg);

}

async function handleVrcStaffCommand(message, args, action) {

    if (!hasVrcLoggerAdminAccess(message.member)) {
        return message.reply('No permission.');
    }

    const commandName = action === 'add' ? 'vrcaddstaff' : action === 'remove' ? 'vrcremovestaff' : 'vrcupdatestaff';
    const targetInput = args.shift();
    const targetUserId = await resolveDiscordUserIdForVrcLogger(message, targetInput);
    const staffRole = args.join(' ').trim();

    if (!targetUserId || (action !== 'remove' && !staffRole)) {
        return message.reply(formatVrcLoggerStaffUsage(commandName));
    }

    const store = readVrcLoggerStore();
    const now = new Date().toISOString();
    const existing = store.staff[targetUserId] || {};

    if (action === 'remove') {
        store.staff[targetUserId] = {
            ...existing,
            discordId: targetUserId,
            active: false,
            updatedBy: message.author.id,
            updatedAt: now
        };
        saveVrcLoggerStore(store);

        await sendVrchatAuditLog(
            message.guild,
            'VRCLogger Staff Disabled',
            [
                {
                    name: 'Staff User',
                    value: `<@${targetUserId}> (${targetUserId})`,
                    inline: false
                },
                {
                    name: 'Moderator',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#FEE75C'
        );

        return message.reply(`Disabled VRCLogger staff access for <@${targetUserId}>.`);
    }

    store.staff[targetUserId] = {
        ...existing,
        discordId: targetUserId,
        role: staffRole,
        active: true,
        addedBy: existing.addedBy || message.author.id,
        addedAt: existing.addedAt || now,
        updatedBy: message.author.id,
        updatedAt: now
    };
    saveVrcLoggerStore(store);

    await sendVrchatAuditLog(
        message.guild,
        action === 'add' ? 'VRCLogger Staff Added' : 'VRCLogger Staff Updated',
        [
            {
                name: 'Staff User',
                value: `<@${targetUserId}> (${targetUserId})`,
                inline: false
            },
            {
                name: 'Staff Role',
                value: staffRole,
                inline: false
            },
            {
                name: 'Moderator',
                value: `${message.author.tag} (${message.author.id})`,
                inline: false
            }
        ],
        '#2B90D9'
    );

    return message.reply(`${action === 'add' ? 'Added' : 'Updated'} VRCLogger staff access for <@${targetUserId}> as **${staffRole}**.`);

}

async function handleVrcAdminCommand(message, args, shouldAdd) {

    if (!hasVrcLoggerAdminAccess(message.member)) {
        return message.reply('No permission.');
    }

    const targetUserId = await resolveDiscordUserIdForVrcLogger(message, args[0]);

    if (!targetUserId) {
        return message.reply(`Usage: \`${shouldAdd ? '!vrcaddadmin' : '!vrcremoveadmin'} @user/userID\``);
    }

    const store = readVrcLoggerStore();
    const now = new Date().toISOString();
    const existing = store.admins[targetUserId] || {};

    store.admins[targetUserId] = {
        ...existing,
        discordId: targetUserId,
        active: shouldAdd,
        addedBy: existing.addedBy || message.author.id,
        addedAt: existing.addedAt || now,
        updatedBy: message.author.id,
        updatedAt: now
    };
    saveVrcLoggerStore(store);

    await sendVrchatAuditLog(
        message.guild,
        shouldAdd ? 'VRCLogger Admin Added' : 'VRCLogger Admin Disabled',
        [
            {
                name: 'Admin User',
                value: `<@${targetUserId}> (${targetUserId})`,
                inline: false
            },
            {
                name: 'Moderator',
                value: `${message.author.tag} (${message.author.id})`,
                inline: false
            }
        ],
        shouldAdd ? '#2B90D9' : '#FEE75C'
    );

    return message.reply(`${shouldAdd ? 'Added' : 'Disabled'} VRCLogger admin access for <@${targetUserId}>.`);

}

function createVrcLoggerApiKey(label) {

    const id = `key_${crypto.randomBytes(4).toString('hex')}`;
    const secret = `vrc_${crypto.randomBytes(24).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(secret).digest('hex');

    return {
        id,
        label,
        secret,
        record: {
            id,
            label,
            hash,
            prefix: secret.slice(0, 12),
            active: true,
            createdAt: new Date().toISOString()
        }
    };

}

async function handleVrcManageApiKeyCommand(message, args) {

    if (!hasVrcLoggerAdminAccess(message.member)) {
        return message.reply('No permission.');
    }

    const action = String(args.shift() || '').toLowerCase();
    const store = readVrcLoggerStore();

    if (!action || action === 'help') {
        return message.reply('Usage: `!vrcmanageapikey create <label>`, `!vrcmanageapikey list`, `!vrcmanageapikey remove <keyId>`, `!vrcmanageapikey regenerate <keyId>`');
    }

    if (action === 'list') {
        const keys = Object.values(store.apiKeys).filter(key => key?.active);
        return message.reply(keys.length
            ? keys.map(key => `\`${key.id}\` | **${key.label}** | prefix: \`${key.prefix}\``).join('\n')
            : 'No active API keys.');
    }

    if (action === 'create') {
        const label = args.join(' ').trim() || `created-by-${message.author.id}`;
        const created = createVrcLoggerApiKey(label);
        store.apiKeys[created.id] = {
            ...created.record,
            createdBy: message.author.id
        };
        saveVrcLoggerStore(store);

        await sendVrchatAuditLog(
            message.guild,
            'VRCLogger API Key Created',
            [
                {
                    name: 'Key ID',
                    value: created.id,
                    inline: true
                },
                {
                    name: 'Label',
                    value: label,
                    inline: true
                },
                {
                    name: 'Created By',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#2B90D9'
        );

        return message.reply(`Created API key \`${created.id}\`. Save this secret now; it will not be shown again:\n\`\`\`${created.secret}\`\`\``);
    }

    const keyId = args[0];

    if (!keyId || !store.apiKeys[keyId]) {
        return message.reply('Unknown API key ID.');
    }

    if (action === 'remove') {
        store.apiKeys[keyId].active = false;
        store.apiKeys[keyId].updatedBy = message.author.id;
        store.apiKeys[keyId].updatedAt = new Date().toISOString();
        saveVrcLoggerStore(store);

        await sendVrchatAuditLog(
            message.guild,
            'VRCLogger API Key Removed',
            [
                {
                    name: 'Key ID',
                    value: keyId,
                    inline: true
                },
                {
                    name: 'Removed By',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#FEE75C'
        );

        return message.reply(`Removed API key \`${keyId}\`.`);
    }

    if (action === 'regenerate') {
        const label = store.apiKeys[keyId].label || keyId;
        const created = createVrcLoggerApiKey(label);
        store.apiKeys[keyId] = {
            ...store.apiKeys[keyId],
            ...created.record,
            id: keyId,
            regeneratedBy: message.author.id,
            regeneratedAt: new Date().toISOString()
        };
        saveVrcLoggerStore(store);

        await sendVrchatAuditLog(
            message.guild,
            'VRCLogger API Key Regenerated',
            [
                {
                    name: 'Key ID',
                    value: keyId,
                    inline: true
                },
                {
                    name: 'Label',
                    value: label,
                    inline: true
                },
                {
                    name: 'Regenerated By',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                }
            ],
            '#FEE75C'
        );

        return message.reply(`Regenerated API key \`${keyId}\`. Save this secret now; it will not be shown again:\n\`\`\`${created.secret}\`\`\``);
    }

    return message.reply('Usage: `!vrcmanageapikey create/list/remove/regenerate`');

}

function normalizeVrchatSafetyBlacklistEntry(record = {}) {

    if (!record || typeof record !== 'object') return null;

    const groupId = String(record.group_id || record.groupId || record.id || '').trim();

    if (!groupId) return null;

    return {
        group_id: groupId,
        platform: String(record.platform || 'vrchat').trim().toLowerCase(),
        name: String(record.name || record.groupName || groupId).trim() || groupId,
        category: String(record.category || 'uncategorized').trim().toLowerCase(),
        severity: String(record.severity || 'review').trim().toLowerCase(),
        evidence: String(record.evidence || record.evidenceSummary || record.notes || '').trim(),
        source: String(record.source || '').trim(),
        active: record.active !== false
    };

}

function loadVrchatSafetyBlacklist() {

    vrchatSafetyBlacklist.clear();

    if (!fs.existsSync(VRCHAT_SAFETY_BLACKLIST_FILE)) {
        if (MONITORED_VRCHAT_GROUP_ID) {
            console.warn(`VRChat safety blacklist not found: ${VRCHAT_SAFETY_BLACKLIST_FILE}`);
        }
        return;
    }

    try {

        const rawPayload = fs.readFileSync(VRCHAT_SAFETY_BLACKLIST_FILE, 'utf8').trim();
        const payload = rawPayload ? JSON.parse(rawPayload) : [];
        const records = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.blacklist)
                ? payload.blacklist
                : Array.isArray(payload.entries)
                    ? payload.entries
                    : [];

        for (const rawRecord of records) {

            const record = normalizeVrchatSafetyBlacklistEntry(rawRecord);

            if (!record || record.platform !== 'vrchat' || !record.active) continue;

            vrchatSafetyBlacklist.set(record.group_id, record);

        }

        console.log(`Loaded ${vrchatSafetyBlacklist.size} VRChat safety blacklist entr${vrchatSafetyBlacklist.size === 1 ? 'y' : 'ies'}.`);

    } catch (error) {

        console.error('Failed to load VRChat safety blacklist:', error);

    }

}

function readVrchatSafetyBlacklistFile() {

    if (!fs.existsSync(VRCHAT_SAFETY_BLACKLIST_FILE)) {
        return {
            payload: [],
            records: []
        };
    }

    try {

        const rawPayload = fs.readFileSync(VRCHAT_SAFETY_BLACKLIST_FILE, 'utf8').trim();
        const payload = rawPayload ? JSON.parse(rawPayload) : [];
        const records = Array.isArray(payload)
            ? payload
            : Array.isArray(payload.blacklist)
                ? payload.blacklist
                : Array.isArray(payload.entries)
                    ? payload.entries
                    : [];

        return {
            payload,
            records: [...records]
        };

    } catch (error) {

        console.error('Failed to read VRChat safety blacklist:', error);

        return {
            payload: [],
            records: []
        };

    }

}

function writeVrchatSafetyBlacklistFile(records, existingPayload = []) {

    let payload = records;

    if (existingPayload && typeof existingPayload === 'object' && !Array.isArray(existingPayload)) {
        if (Array.isArray(existingPayload.blacklist)) {
            payload = {
                ...existingPayload,
                blacklist: records
            };
        } else if (Array.isArray(existingPayload.entries)) {
            payload = {
                ...existingPayload,
                entries: records
            };
        }
    }

    fs.mkdirSync(path.dirname(VRCHAT_SAFETY_BLACKLIST_FILE), {
        recursive: true
    });
    fs.writeFileSync(VRCHAT_SAFETY_BLACKLIST_FILE, JSON.stringify(payload, null, 2));

}

function extractVrchatGroupIdFromInput(input) {
    return String(input || '').match(/grp_[0-9a-fA-F-]{36}/)?.[0] || null;
}

function getVrchatBlacklistGroupUsage() {

    return [
        'Quick add: `!blacklistgroup <groupId/url>`',
        'Example: `!blacklistgroup grp_00000000-0000-0000-0000-000000000000`',
        'The category, severity, and evidence are filled automatically.',
        'Legacy/detailed form: `!blacklistgroup add <groupId/url> [category] [severity] [evidence summary]`',
        `Scanner alert categories: ${MINOR_SAFETY_CATEGORIES.map(category => `\`${category}\``).join(', ')}`
    ].join('\n');

}

function inferVrchatBlacklistCategory(candidateMatch) {

    const terms = (candidateMatch?.terms || [])
        .map(term => normalizeVrchatSafetyScanText(term));
    const combined = terms.join(' ');

    if (/\bcsam\b/.test(combined)) return 'csam';
    if (/\b(?:groom|grooming|predator)\b/.test(combined)) return 'grooming';
    if (/\b(?:sexual|sexualize|sexualizing|exploitation|exploit|ageplay|loli|shota)\b/.test(combined)) {
        return 'sexual_exploitation';
    }

    return 'minor_endangerment';

}

function inferVrchatBlacklistSeverity(candidateMatch) {

    if (!candidateMatch?.matched) return 'review';

    return candidateMatch.confidence === 'high' ? 'ban' : 'review';

}

function buildVrchatBlacklistEvidence(candidateMatch, message) {

    const moderator = message.author.tag || message.author.username || message.author.id;

    if (!candidateMatch?.matched) {
        return `Manually added by ${moderator}; review the group evidence before enforcement.`;
    }

    const evidenceSegments = (candidateMatch.items || [])
        .map(item => item.segment)
        .filter(Boolean)
        .filter((segment, index, segments) => segments.indexOf(segment) === index)
        .slice(0, 2);
    const terms = (candidateMatch.terms || []).slice(0, 6).join(', ');
    const summaryParts = [
        `Auto-classified minor-safety match with risk score ${candidateMatch.score}/${candidateMatch.threshold}.`
    ];

    if (terms) summaryParts.push(`Signals: ${terms}.`);
    if (evidenceSegments.length > 0) summaryParts.push(`Profile evidence: ${evidenceSegments.join(' | ')}`);

    return truncateSafetyText(summaryParts.join(' '), 1000);

}

async function handleVrchatBlacklistGroupCommand(message, args) {

    if (!hasSafetyCommandAccess(message.member)) {
        return message.reply('No permission.');
    }

    const workingArgs = [...args];
    const firstArgument = String(workingArgs[0] || '').trim();
    const firstToken = firstArgument.toLowerCase();

    if (!firstArgument || firstToken === 'help') {
        return message.reply(getVrchatBlacklistGroupUsage());
    }

    // `add` is optional. The preferred command is:
    // !blacklistgroup <group ID or VRChat group URL>
    if (firstToken === 'add') {
        workingArgs.shift();
    }

    const groupInput = workingArgs.shift();
    const suppliedCategory = String(workingArgs.shift() || '').trim().toLowerCase();
    const suppliedSeverity = String(workingArgs.shift() || '').trim().toLowerCase();
    const suppliedEvidence = workingArgs.join(' ').trim();
    const groupId = extractVrchatGroupIdFromInput(groupInput);

    if (!groupId) {
        return message.reply(getVrchatBlacklistGroupUsage());
    }

    let groupName = groupId;
    let groupUrl = `https://vrchat.com/home/group/${encodeURIComponent(groupId)}`;
    let fetchedGroup = null;
    let candidateMatch = null;

    try {
        fetchedGroup = await fetchVrchatGroup(groupId);
        groupName = fetchedGroup?.name || groupName;
        groupUrl = fetchedGroup?.url || groupUrl;
        candidateMatch = getVrchatSafetyCandidateMatch(fetchedGroup || {});
    } catch (error) {
        console.warn(`Unable to fetch VRChat group ${groupId} before blacklisting:`, error.message);
    }

    const category = suppliedCategory || inferVrchatBlacklistCategory(candidateMatch);
    const severity = suppliedSeverity || inferVrchatBlacklistSeverity(candidateMatch);
    const evidence = suppliedEvidence || buildVrchatBlacklistEvidence(candidateMatch, message);
    const usedQuickAdd = !suppliedCategory && !suppliedSeverity && !suppliedEvidence;

    const { payload, records } = readVrchatSafetyBlacklistFile();
    const existingIndex = records.findIndex(record =>
        normalizeVrchatSafetyBlacklistEntry(record)?.group_id === groupId
    );
    const existingRecord = existingIndex >= 0 ? records[existingIndex] : null;
    const now = new Date().toISOString();
    const nextRecord = {
        ...(existingRecord || {}),
        group_id: groupId,
        platform: 'vrchat',
        name: groupName,
        category,
        severity,
        evidence,
        source: groupUrl,
        active: true,
        added_by: existingRecord?.added_by || message.author.id,
        added_date: existingRecord?.added_date || now,
        updated_by: message.author.id,
        updated_date: now
    };

    if (existingIndex >= 0) {
        records[existingIndex] = nextRecord;
    } else {
        records.push(nextRecord);
    }

    try {

        writeVrchatSafetyBlacklistFile(records, payload);
        loadVrchatSafetyBlacklist();

        await sendVrchatAuditLog(
            message.guild,
            existingIndex >= 0 ? 'VRChat Group Blacklist Updated' : 'VRChat Group Blacklist Added',
            [
                {
                    name: 'Group',
                    value: `${groupName} (${groupId})`,
                    inline: false
                },
                {
                    name: 'Category',
                    value: category,
                    inline: true
                },
                {
                    name: 'Severity',
                    value: severity,
                    inline: true
                },
                {
                    name: 'Moderator',
                    value: `${message.author.tag} (${message.author.id})`,
                    inline: false
                },
                {
                    name: 'Evidence',
                    value: evidence,
                    inline: false
                }
            ],
            existingIndex >= 0 ? '#FEE75C' : '#FF3B30'
        );

    } catch (error) {

        console.error('Failed to update VRChat safety blacklist:', error);
        return message.reply(`Failed to update the blacklist: ${truncateText(error.message, 300)}`);

    }

    const embed = new EmbedBuilder()
        .setColor(existingIndex >= 0 ? '#FFCC00' : '#FF3B30')
        .setTitle(existingIndex >= 0 ? 'VRChat Blacklist Group Updated' : 'VRChat Blacklist Group Added')
        .setDescription(`[${truncateSafetyText(groupName, 150)}](${groupUrl})`)
        .addFields(
            {
                name: 'Group ID',
                value: `\`${groupId}\``,
                inline: false
            },
            {
                name: 'Category',
                value: category,
                inline: true
            },
            {
                name: 'Severity',
                value: severity,
                inline: true
            },
            {
                name: 'Evidence Summary',
                value: truncateSafetyText(evidence, 1024),
                inline: false
            }
        )
        .setFooter({
            text: `Updated by ${message.author.tag}`
        })
        .setTimestamp();

    if (usedQuickAdd) {
        embed.addFields({
            name: 'Quick Add',
            value: candidateMatch?.matched
                ? `Category, severity, and evidence were auto-filled from the group profile (${candidateMatch.confidence} confidence).`
                : 'Category, severity, and evidence were filled with safe review defaults because no confirmed minor-safety profile match was found.',
            inline: false
        });
    }

    if (!MINOR_SAFETY_CATEGORIES.includes(category)) {
        embed.addFields({
            name: 'Scanner Note',
            value: `This group was saved, but category \`${category}\` is not in the scanner alert category list.`,
            inline: false
        });
    }

    await message.reply({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

function normalizeVrchatSafetyState(state = {}) {

    return {
        matches: state.matches && typeof state.matches === 'object' && !Array.isArray(state.matches)
            ? state.matches
            : {},
        candidates: state.candidates && typeof state.candidates === 'object' && !Array.isArray(state.candidates)
            ? state.candidates
            : {}
    };

}

function loadVrchatSafetyState() {
    vrchatSafetyState = normalizeVrchatSafetyState(readJsonObjectFile(VRCHAT_SAFETY_STATE_FILE));
}

function saveVrchatSafetyState() {
    writeJsonObjectFile(VRCHAT_SAFETY_STATE_FILE, normalizeVrchatSafetyState(vrchatSafetyState));
}

function getVrchatSafetyMatchKey(vrchatUserId, groupId) {
    return `${vrchatUserId}:${groupId}`;
}

function getActiveVrchatSafetyBlacklistEntries() {

    const categorySet = new Set(MINOR_SAFETY_CATEGORIES);

    return [...vrchatSafetyBlacklist.values()].filter(entry =>
        entry.active !== false &&
        entry.platform === 'vrchat' &&
        (categorySet.size === 0 || categorySet.has(String(entry.category || '').toLowerCase()))
    );

}

function getVrchatSafetyBlacklistByGroupId() {
    return new Map(getActiveVrchatSafetyBlacklistEntries().map(entry => [entry.group_id, entry]));
}

function refreshVrchatSafetyUserMatches(vrchatUserId, displayName, groupIds) {

    const now = new Date().toISOString();
    const matches = vrchatSafetyState.matches || {};

    for (const match of Object.values(matches)) {
        if (match?.vrchatUserId === vrchatUserId) {
            match.active = false;
            match.lastSeen = now;
        }
    }

    for (const groupId of [...new Set(groupIds)]) {

        const key = getVrchatSafetyMatchKey(vrchatUserId, groupId);
        const existing = matches[key] || {};

        matches[key] = {
            vrchatUserId,
            displayName,
            groupId,
            firstSeen: existing.firstSeen || now,
            lastSeen: now,
            lastNotified: existing.lastNotified || null,
            active: true
        };

    }

    vrchatSafetyState.matches = matches;
    saveVrchatSafetyState();

}

function shouldNotifyVrchatSafetyMatch(vrchatUserId, groupId) {

    const match = vrchatSafetyState.matches?.[getVrchatSafetyMatchKey(vrchatUserId, groupId)];
    const lastNotified = match?.lastNotified ? Date.parse(match.lastNotified) : NaN;

    return Number.isNaN(lastNotified) ||
        Date.now() - lastNotified >= SAFETY_ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;

}

function markVrchatSafetyMatchesNotified(vrchatUserId, groupIds) {

    const now = new Date().toISOString();

    for (const groupId of groupIds) {

        const key = getVrchatSafetyMatchKey(vrchatUserId, groupId);

        if (vrchatSafetyState.matches?.[key]) {
            vrchatSafetyState.matches[key].lastNotified = now;
        }

    }

    saveVrchatSafetyState();

}

function upsertVrchatSafetyCandidateGroup(group, candidateMatch) {

    const groupId = group?.groupId || group?.id;

    if (!groupId) return;

    const matchedTerms = Array.isArray(candidateMatch)
        ? candidateMatch
        : candidateMatch?.terms || [];
    const now = new Date().toISOString();
    const candidates = vrchatSafetyState.candidates || {};
    const existing = candidates[groupId] || {};

    candidates[groupId] = {
        groupId,
        name: group.name || existing.name || 'Unknown group',
        description: group.description || existing.description || '',
        matchedTerms,
        matchedFields: Array.isArray(candidateMatch)
            ? existing.matchedFields || []
            : candidateMatch?.fields || [],
        protectiveTerms: Array.isArray(candidateMatch)
            ? existing.protectiveTerms || []
            : candidateMatch?.protectiveTerms || [],
        minorNexusTerms: Array.isArray(candidateMatch)
            ? existing.minorNexusTerms || []
            : candidateMatch?.minorNexusTerms || [],
        riskScore: Array.isArray(candidateMatch)
            ? existing.riskScore || null
            : candidateMatch?.score ?? null,
        riskThreshold: Array.isArray(candidateMatch)
            ? existing.riskThreshold || CANDIDATE_RISK_SCORE_THRESHOLD
            : candidateMatch?.threshold ?? CANDIDATE_RISK_SCORE_THRESHOLD,
        confidence: Array.isArray(candidateMatch)
            ? existing.confidence || 'unknown'
            : candidateMatch?.confidence || 'unknown',
        distinctSignals: Array.isArray(candidateMatch)
            ? existing.distinctSignals || 0
            : candidateMatch?.distinctSignals || 0,
        evidence: Array.isArray(candidateMatch)
            ? existing.evidence || []
            : candidateMatch?.items || [],
        suppressedEvidence: Array.isArray(candidateMatch)
            ? existing.suppressedEvidence || []
            : candidateMatch?.suppressedItems || [],
        status: existing.status || 'pending',
        firstSeen: existing.firstSeen || now,
        lastSeen: now,
        lastNotified: existing.lastNotified || null
    };

    vrchatSafetyState.candidates = candidates;
    saveVrchatSafetyState();

}

function shouldNotifyVrchatSafetyCandidate(groupId) {

    const candidate = vrchatSafetyState.candidates?.[groupId];

    if (!candidate || candidate.status !== 'pending') return false;

    const lastNotified = candidate.lastNotified ? Date.parse(candidate.lastNotified) : NaN;

    return Number.isNaN(lastNotified) ||
        Date.now() - lastNotified >= SAFETY_ALERT_COOLDOWN_HOURS * 60 * 60 * 1000;

}

function markVrchatSafetyCandidateNotified(groupId) {

    if (!vrchatSafetyState.candidates?.[groupId]) return;

    vrchatSafetyState.candidates[groupId].lastNotified = new Date().toISOString();
    saveVrchatSafetyState();

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

function getMaxWaifuRarity() {
    return WAIFU_RARITIES.reduce((bestRarity, rarity) =>
        rarity.value > bestRarity.value ? rarity : bestRarity,
        WAIFU_RARITIES[0]
    );
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

function createWaifuRecord(ownerId, options = {}) {

    const rarity = options.rarity || pickWaifuRarity();
    const shiny = typeof options.shiny === 'boolean' ? options.shiny : rollWaifuShiny();
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

async function handleAdminWaifuPullCommand(message, args) {

    if (!hasServerAdminOrOwnerAccess(message.member)) {
        return message.reply('No permission. Only server admins or the server owner can use admin waifu pulls.');
    }

    const targetUser = await resolveUserFromArgs(message, args) || message.author;

    if (targetUser.bot) {
        return message.reply('Choose a real user for the admin pull.');
    }

    const player = getOrCreateWaifuPlayer(message.guild.id, targetUser.id);
    const shouldForceShiny = args.some(arg => ['shiny', '--shiny'].includes(String(arg).toLowerCase()));
    const statusMessage = await message.reply(`Creating a max-rarity waifu for ${targetUser}...`);
    const waifu = createWaifuRecord(targetUser.id, {
        rarity: getMaxWaifuRarity(),
        shiny: shouldForceShiny || rollWaifuShiny()
    });

    try {

        await assignWaifuImage(waifu);

    } catch (error) {

        console.error('Admin waifu pull failed:', error);
        await statusMessage.edit(`Admin waifu pull failed. ${truncateText(error.message, 250)}`).catch(() => {});
        return;

    }

    player.pulls++;
    player.collection.push(normalizeWaifuRecord(waifu));
    waifuPlayers.set(getWaifuPlayerKey(player.guildId, player.userId), player);
    saveWaifuPlayers();

    const payload = buildWaifuPayload(targetUser, player, waifu, 'Admin Max-Rarity Waifu');
    payload.content = `${message.author} created a max-rarity waifu for ${targetUser}:`;

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
                value:
`\`!givecoins @user amount\` - Give fake waifu coins.
\`!adminpull [@user] [shiny]\` - Create a max-rarity waifu card.`,
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
    const looksScammy = [
        'free nitro',
        'steam gift',
        'airdrop',
        'crypto giveaway'
    ].some(phrase => lowerContent.includes(phrase));

    if (!hasBlockedWord && mentionCount < 8 && !looksScammy) return false;

    const warningReason = hasBlockedWord
        ? 'AutoMod blocked phrase.'
        : looksScammy
            ? 'AutoMod scam phrase.'
            : 'AutoMod mass mentions.';
    const caseReason = hasBlockedWord
        ? 'Blocked phrase detected.'
        : looksScammy
            ? 'Scam phrase detected.'
            : 'Mass mentions detected.';

    await message.delete().catch(() => {});
    await warnMember(
        message.member,
        client.user,
        warningReason,
        message.channel,
        message.content
    ).catch(() => {});

    await createCase(
        message.guild,
        'AUTOMOD',
        message.author.id,
        client.user,
        caseReason
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

    return missing;

}

function getVrchatAuthCookieHeader() {

    const cookie = VRCHAT_AUTH_COOKIE.trim();

    if (!cookie) return '';

    return cookie.includes('=') ? cookie : `auth=${cookie}`;

}

function getVrchatRequestHeaders(accept = 'application/json') {

    const headers = {
        Accept: accept,
        'User-Agent': VRCHAT_API_USER_AGENT
    };
    const cookie = getVrchatAuthCookieHeader();

    if (cookie) {
        headers.Cookie = cookie;
    }

    return headers;

}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function truncateSafetyText(value, maxLength) {

    const text = String(value || '');

    if (text.length <= maxLength) return text;

    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;

}

function getVrchatSafetyScannerMissingSettings() {

    const missing = [];

    if (!MONITORED_VRCHAT_GROUP_ID) missing.push('MONITORED_VRCHAT_GROUP_ID');
    if (!SAFETY_ALERT_CHANNEL_ID) missing.push('SAFETY_ALERT_CHANNEL_ID or LOG_CHANNEL_ID');

    return missing;

}

function getVrchatSafetyScannerStatusText() {

    const missingSettings = getVrchatSafetyScannerMissingSettings();
    const activeEntries = getActiveVrchatSafetyBlacklistEntries();

    return [
        `VRChat safety scanner: ${missingSettings.length ? 'disabled' : 'configured'}.`,
        missingSettings.length ? `Missing: ${missingSettings.join(', ')}` : null,
        `Running now: ${vrchatSafetyScannerRunning ? 'yes' : 'no'}.`,
        vrchatSafetyScannerRunning
            ? `Current scan: ${vrchatSafetyScannerCurrentTrigger || 'unknown'}.`
            : null,
        vrchatSafetyScannerRunning
            ? `Stop requested: ${vrchatSafetyScanStopRequested ? 'yes' : 'no'}.`
            : null,
        `VRChat auth: ${VRCHAT_AUTH_COOKIE ? 'cookie configured' : 'public/no-account mode'}.`,
        `Reviewed safety groups loaded: ${activeEntries.length}.`,
        `Candidate discovery: ${DISCOVER_CANDIDATE_GROUPS ? 'on' : 'off'}.`,
        `Candidate detail scan: ${VRCHAT_CANDIDATE_SCAN_DETAIL_LOOKUP ? 'on' : 'off'}.`,
        `Candidate detail budget: ${VRCHAT_CANDIDATE_MAX_DETAIL_LOOKUPS_PER_SCAN} lookup(s) per scan.`,
        `VRChat request spacing: ${VRCHAT_API_MIN_INTERVAL_MS}ms minimum.`,
        vrchatApiBackoffUntil > Date.now()
            ? `VRChat API backoff: active for about ${Math.max(1, Math.ceil((vrchatApiBackoffUntil - Date.now()) / 60000))} more minute(s).`
            : 'VRChat API backoff: inactive.',
        `Alert cooldown: ${SAFETY_ALERT_COOLDOWN_HOURS} hour(s).`
    ].filter(Boolean).join('\n');

}

async function fetchVrchatGroup(groupId) {
    return await fetchVrchatApiJson(`/groups/${encodeURIComponent(groupId)}`);
}

async function fetchVrchatGroupMembersPage(groupId, offset = 0, pageSize = 100) {

    const members = await fetchVrchatApiJson(`/groups/${encodeURIComponent(groupId)}/members`, {
        n: pageSize,
        offset,
        sort: 'joinedAt:asc'
    });

    return Array.isArray(members) ? members : [];

}

async function fetchAllVrchatGroupMembers(groupId, {
    shouldStop = () => false
} = {}) {

    const members = [];
    const pageSize = 100;
    let offset = 0;

    while (true) {

        if (shouldStop()) break;

        const page = await fetchVrchatGroupMembersPage(groupId, offset, pageSize);

        members.push(...page);

        if (page.length < pageSize || shouldStop()) break;

        offset += pageSize;

    }

    const group = shouldStop()
        ? null
        : await fetchVrchatGroup(groupId).catch(error => {
            console.warn('Failed to fetch VRChat group details for safety scanner:', error.message);
            return null;
        });

    const myMemberUserId = group?.myMember?.userId;

    if (myMemberUserId && !members.some(member => member.userId === myMemberUserId || member.user?.id === myMemberUserId)) {

        members.push({
            ...group.myMember,
            userId: myMemberUserId,
            user: {
                id: myMemberUserId,
                displayName: group.myMember.user?.displayName || 'Scanner account',
                thumbnailUrl: group.myMember.user?.thumbnailUrl || null
            }
        });

    }

    return members;

}

async function fetchVrchatUserGroups(userId) {

    const groups = await fetchVrchatApiJson(`/users/${encodeURIComponent(userId)}/groups`);

    return Array.isArray(groups) ? groups : [];

}

async function getVrchatSafetyTextChannel(channelId) {

    const channel = client.channels.cache.get(channelId) ||
        await client.channels.fetch(channelId).catch(() => null);

    if (!channel?.isTextBased?.() || !channel.send) {
        throw new Error(`Configured Discord channel ${channelId} is not text-based.`);
    }

    return channel;

}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeVrchatSafetyScanText(value) {

    return String(value || '')
        .toLowerCase()
        .replace(/[_\-]+/g, ' ')
        .replace(/\bage\s*play\b/g, 'ageplay')
        .replace(/\bchild sexual abuse materials?\b/g, 'csam')
        .replace(/\s+/g, ' ')
        .trim();

}

function textContainsSafetyTerm(text, term) {

    const normalizedTerm = normalizeVrchatSafetyScanText(term);

    if (!normalizedTerm) return false;

    if (/^[a-z0-9+ ]+$/.test(normalizedTerm)) {
        const leftBoundary = /^[a-z0-9]/.test(normalizedTerm) ? '\\b' : '';
        const rightBoundary = /[a-z0-9]$/.test(normalizedTerm) ? '\\b' : '';

        return new RegExp(
            `${leftBoundary}${escapeRegExp(normalizedTerm)}${rightBoundary}`,
            'i'
        ).test(text);
    }

    return text.includes(normalizedTerm);

}

function shouldIgnoreVrchatSafetyTextPath(pathName) {

    const pathText = String(pathName || '').toLowerCase();

    return /(id|url|image|thumbnail|icon|banner|created|updated|joined|membercount|onlinecount|ownerid)$/i.test(pathText);

}

function collectVrchatSafetyTextParts(value, pathName = 'group', parts = [], depth = 0) {

    if (depth > 6 || value === null || value === undefined) return parts;

    if (typeof value === 'string' || typeof value === 'number') {

        const text = String(value || '').trim();

        if (text && !shouldIgnoreVrchatSafetyTextPath(pathName)) {
            parts.push({
                field: pathName,
                text
            });
        }

        return parts;

    }

    if (Array.isArray(value)) {

        value.forEach((item, index) => {
            collectVrchatSafetyTextParts(item, `${pathName}.${index}`, parts, depth + 1);
        });

        return parts;

    }

    if (typeof value === 'object') {

        for (const [key, childValue] of Object.entries(value)) {
            collectVrchatSafetyTextParts(childValue, `${pathName}.${key}`, parts, depth + 1);
        }

    }

    return parts;

}

function splitVrchatSafetyTextSegments(value) {

    const raw = String(value || '');
    const segments = raw
        .split(/[\n\r.!?;|•·]+/g)
        .map(segment => normalizeVrchatSafetyScanText(segment))
        .filter(Boolean);

    return segments.length > 0 ? segments : [normalizeVrchatSafetyScanText(raw)].filter(Boolean);

}

function getVrchatSafetyFieldWeight(field) {

    const normalizedField = String(field || '').toLowerCase();

    if (/(^|\.)(name|shortcode|tagline|title)$/.test(normalizedField)) return 2;
    if (/(^|\.)(description|about|summary)$/.test(normalizedField)) return 1;

    return 0;

}

function getVrchatSafetyTermWindow(text, term, radius = 90) {

    const normalizedText = normalizeVrchatSafetyScanText(text);
    const normalizedTerm = normalizeVrchatSafetyScanText(term);
    const index = normalizedText.indexOf(normalizedTerm);

    if (index < 0) return normalizedText;

    return normalizedText.slice(
        Math.max(0, index - radius),
        Math.min(normalizedText.length, index + normalizedTerm.length + radius)
    );

}

function getMatchedSafetyTerms(text, terms) {
    return terms.filter(term => textContainsSafetyTerm(text, term));
}

function getProtectiveSafetyTerms(text) {
    return [
        ...getMatchedSafetyTerms(text, PROTECTIVE_CONTEXT_PHRASES),
        ...getMatchedSafetyTerms(text, PROHIBITIVE_CONTEXT_PHRASES)
    ].filter((term, index, terms) => terms.indexOf(term) === index);
}

function hasPermissiveRiskContext(text, term) {

    const window = getVrchatSafetyTermWindow(text, term);

    return PERMISSIVE_RISK_CONTEXT_PHRASES.some(phrase => textContainsSafetyTerm(window, phrase));

}

function hasProhibitiveRiskContext(text, term) {

    const window = getVrchatSafetyTermWindow(text, term);
    const normalizedTerm = normalizeVrchatSafetyScanText(term);
    const escapedTerm = escapeRegExp(normalizedTerm);
    const prefixPattern = new RegExp(
        `(?:\\bno\\b|\\bnot\\b|\\bnever\\b|\\bban(?:ned|ning)?\\b|\\bprohibit(?:ed|ing)?\\b|` +
        `\\bforbid(?:den|ding)?\\b|\\bdisallow(?:ed|ing)?\\b|\\binstant ban\\b|` +
        `\\bautomatic ban\\b|\\bzero tolerance\\b|\\breport(?:ed|ing)?\\b|` +
        `\\bremove(?:d|al)?\\b|\\bkick(?:ed|ing)?\\b|\\bagainst\\b|\\banti\\b)` +
        `.{0,70}\\b${escapedTerm}\\b`,
        'i'
    );
    const suffixPattern = new RegExp(
        `\\b${escapedTerm}\\b.{0,70}` +
        `(?:\\bnot allowed\\b|\\bnever allowed\\b|\\bbanned\\b|\\bprohibited\\b|` +
        `\\bforbidden\\b|\\bdisallowed\\b|\\binstant ban\\b|\\bautomatic ban\\b|` +
        `\\bzero tolerance\\b|\\breportable\\b|\\bwill be removed\\b|\\bwill be kicked\\b)`,
        'i'
    );

    if (prefixPattern.test(window) || suffixPattern.test(window)) return true;

    const protectiveTerms = getProtectiveSafetyTerms(window);
    const permissive = hasPermissiveRiskContext(window, term);

    return protectiveTerms.length > 0 && !permissive;

}

function getVrchatSafetyPhraseScore(phrase) {

    const normalized = normalizeVrchatSafetyScanText(phrase);

    if (normalized === 'csam' || /child sexual abuse|underage sexual/.test(normalized)) return 7;
    if (/loli nsfw|shota nsfw/.test(normalized)) return 7;
    if (/groom|exploit|abuse|endanger|sexualize|harm|hurt|predator/.test(normalized)) return 6;
    if (normalized === 'ageplay') return 4;

    return 5;

}

function getVrchatSafetyTermScore(term) {

    const normalized = normalizeVrchatSafetyScanText(term);

    if (normalized === 'csam') return 7;
    if (normalized === 'ageplay') return 4;
    if (normalized === 'loli' || normalized === 'shota') return 3;

    return 3;

}

function isAmbiguousMinorReference(text, term) {

    const normalizedTerm = normalizeVrchatSafetyScanText(term);

    if (normalizedTerm === 'young' && /\byoung adults?\b/.test(text)) return true;
    if ((normalizedTerm === 'teen' || normalizedTerm === 'teens') && /\b(?:18|19)[ -]?(?:year[ -]?old|yo)?\b/.test(text)) return true;

    return false;

}

function isStrongMinorReferenceTerm(term) {

    const normalizedTerm = normalizeVrchatSafetyScanText(term);

    // These words can legitimately describe adults, so they cannot establish
    // a minor-safety match without a clearer term such as minor/underage/child.
    return !['teen', 'teens', 'young'].includes(normalizedTerm);

}

function getVrchatMinorNexusTerms(text) {

    const normalizedText = normalizeVrchatSafetyScanText(text);
    const terms = MINOR_REFERENCE_TERMS
        .filter(term => textContainsSafetyTerm(normalizedText, term))
        .filter(term => !isAmbiguousMinorReference(normalizedText, term))
        .filter(isStrongMinorReferenceTerm)
        .map(normalizeVrchatSafetyScanText);

    // CSAM is unambiguously minor-related even though the acronym does not
    // contain one of the normal minor-reference words.
    if (textContainsSafetyTerm(normalizedText, 'csam')) {
        terms.push('csam');
    }

    return [...new Set(terms)];

}

function getVrchatActiveMinorNexusTerms(text) {

    return getVrchatMinorNexusTerms(text)
        .filter(term => !hasProhibitiveRiskContext(text, term));

}

function addVrchatCandidateEvidence(evidence, item) {

    const key = [item.type, item.term, item.field, item.segment].join(':');

    if (evidence.seen.has(key)) return;

    evidence.seen.add(key);
    evidence.items.push(item);

}

function getVrchatSafetyCandidateMatch(group) {

    const parts = collectVrchatSafetyTextParts(group);
    const evidence = {
        seen: new Set(),
        items: []
    };
    const suppressedEvidence = {
        seen: new Set(),
        items: []
    };
    const protectiveTerms = new Set();

    for (const part of parts) {

        for (const segment of splitVrchatSafetyTextSegments(part.text)) {

            if (!segment) continue;

            getProtectiveSafetyTerms(segment).forEach(term => protectiveTerms.add(term));
            const fieldWeight = getVrchatSafetyFieldWeight(part.field);
            const coveredHighRiskTerms = new Set();
            const minorNexusTerms = getVrchatMinorNexusTerms(segment);
            const activeMinorNexusTerms = getVrchatActiveMinorNexusTerms(segment);
            const hasActiveMinorNexus = activeMinorNexusTerms.length > 0;

            for (const phrase of CANDIDATE_GROUP_PHRASES) {

                if (!textContainsSafetyTerm(segment, phrase)) continue;

                const normalizedPhrase = normalizeVrchatSafetyScanText(phrase);
                const phraseMinorNexusTerms = getVrchatMinorNexusTerms(normalizedPhrase);

                // A sexual/adult keyword is not enough. The phrase itself or
                // its surrounding segment must clearly and affirmatively relate
                // to minors. This intentionally excludes ordinary 18+/lewd groups.
                if (phraseMinorNexusTerms.length === 0 && !hasActiveMinorNexus) continue;

                const prohibited = hasProhibitiveRiskContext(segment, normalizedPhrase);
                const permissive = hasPermissiveRiskContext(segment, normalizedPhrase);
                const points = getVrchatSafetyPhraseScore(normalizedPhrase) + fieldWeight + (permissive ? 3 : 0);
                const item = {
                    term: normalizedPhrase,
                    field: part.field,
                    segment: segment.slice(0, 240),
                    type: 'phrase',
                    points,
                    permissive,
                    prohibited,
                    minorNexusTerms: [...new Set([
                        ...phraseMinorNexusTerms,
                        ...activeMinorNexusTerms
                    ])]
                };

                if (prohibited) {
                    addVrchatCandidateEvidence(suppressedEvidence, item);
                } else {
                    addVrchatCandidateEvidence(evidence, item);
                }

                for (const highRiskTerm of HIGH_RISK_MINOR_SAFETY_TERMS) {
                    if (textContainsSafetyTerm(normalizedPhrase, highRiskTerm)) {
                        coveredHighRiskTerms.add(normalizeVrchatSafetyScanText(highRiskTerm));
                    }
                }

            }

            for (const term of HIGH_RISK_MINOR_SAFETY_TERMS) {

                const normalizedTerm = normalizeVrchatSafetyScanText(term);

                if (coveredHighRiskTerms.has(normalizedTerm) || !textContainsSafetyTerm(segment, normalizedTerm)) continue;

                const termMinorNexusTerms = getVrchatMinorNexusTerms(normalizedTerm);

                // Standalone ageplay or other adult-fetish wording does not
                // establish a minor connection. CSAM/loli/shota do because they
                // are intrinsically minor-coded in this scanner.
                if (termMinorNexusTerms.length === 0 && !hasActiveMinorNexus) continue;

                const prohibited = hasProhibitiveRiskContext(segment, normalizedTerm);
                const permissive = hasPermissiveRiskContext(segment, normalizedTerm);
                const points = getVrchatSafetyTermScore(normalizedTerm) + fieldWeight + (permissive ? 3 : 0);
                const item = {
                    term: normalizedTerm,
                    field: part.field,
                    segment: segment.slice(0, 240),
                    type: 'high-risk',
                    points,
                    permissive,
                    prohibited,
                    minorNexusTerms: [...new Set([
                        ...termMinorNexusTerms,
                        ...activeMinorNexusTerms
                    ])]
                };

                if (prohibited) {
                    addVrchatCandidateEvidence(suppressedEvidence, item);
                } else {
                    addVrchatCandidateEvidence(evidence, item);
                }

            }

            const minorTerms = activeMinorNexusTerms;
            const meaningfulHarmTerms = MINOR_HARM_CONTEXT_TERMS
                .filter(term => !['adult', '18+', 'nsfw', 'lewd'].includes(normalizeVrchatSafetyScanText(term)))
                .filter(term => textContainsSafetyTerm(segment, term));
            const adultSexualTerms = ['sexual', 'sexualize', 'sexualizing', 'ageplay', 'csam', 'nsfw', 'lewd']
                .filter(term => textContainsSafetyTerm(segment, term));
            const harmTerms = [...new Set([...meaningfulHarmTerms, ...adultSexualTerms])];

            if (minorTerms.length > 0 && harmTerms.length > 0) {

                const representativeMinor = normalizeVrchatSafetyScanText(minorTerms[0]);
                const representativeHarm = normalizeVrchatSafetyScanText(harmTerms[0]);
                const combinationTerm = `${representativeMinor} + ${representativeHarm}`;
                const prohibited = hasProhibitiveRiskContext(segment, representativeMinor) ||
                    hasProhibitiveRiskContext(segment, representativeHarm);
                const permissive = hasPermissiveRiskContext(segment, representativeMinor) ||
                    hasPermissiveRiskContext(segment, representativeHarm);
                const sexualCombination = adultSexualTerms.length > 0;
                const points = (sexualCombination ? 7 : 6) +
                    fieldWeight +
                    (permissive ? 3 : 0);
                const item = {
                    term: combinationTerm,
                    field: part.field,
                    segment: segment.slice(0, 240),
                    type: 'co-occurrence',
                    points,
                    permissive,
                    prohibited,
                    minorNexusTerms: minorTerms
                };

                if (prohibited) {
                    addVrchatCandidateEvidence(suppressedEvidence, item);
                } else {
                    addVrchatCandidateEvidence(evidence, item);
                }

            }

        }

    }

    const items = evidence.items;
    const totalScore = items.reduce((sum, item) => sum + Math.max(0, item.points || 0), 0);
    const distinctSignals = new Set(items.map(item => `${item.type}:${item.term}`)).size;
    const strongestSignal = items.reduce((highest, item) => Math.max(highest, item.points || 0), 0);
    const activeMinorNexusSignals = new Set(
        items.flatMap(item => Array.isArray(item.minorNexusTerms) ? item.minorNexusTerms : [])
    );
    const severeSingleSignal = strongestSignal >= CANDIDATE_RISK_SCORE_THRESHOLD;
    const matched = activeMinorNexusSignals.size > 0 &&
        totalScore >= CANDIDATE_RISK_SCORE_THRESHOLD &&
        (distinctSignals >= CANDIDATE_MIN_DISTINCT_SIGNALS || severeSingleSignal);
    const confidence = !matched
        ? 'none'
        : totalScore >= CANDIDATE_RISK_SCORE_THRESHOLD + 5
            ? 'high'
            : totalScore >= CANDIDATE_RISK_SCORE_THRESHOLD + 2
                ? 'medium'
                : 'review';

    return {
        matched,
        score: totalScore,
        threshold: CANDIDATE_RISK_SCORE_THRESHOLD,
        confidence,
        distinctSignals,
        strongestSignal,
        minorNexusTerms: [...activeMinorNexusSignals],
        terms: [...new Set(items.map(match => match.term))],
        fields: [...new Set(items.map(match => match.field))],
        items,
        suppressedItems: suppressedEvidence.items,
        protectiveTerms: [...protectiveTerms]
    };

}

function getVrchatSafetyCandidateTerms(group) {
    return getVrchatSafetyCandidateMatch(group).terms;
}

function hasVrchatMinorSafetyDetailHint(group, candidateMatch = null) {

    if (candidateMatch?.items?.length > 0) return true;

    return collectVrchatSafetyTextParts(group).some(part =>
        splitVrchatSafetyTextSegments(part.text).some(segment =>
            getVrchatActiveMinorNexusTerms(segment).length > 0
        )
    );

}

async function getVrchatSafetyCandidateScanGroup(group, groupDetailCache, detailState) {

    const groupId = group?.groupId || group?.id;

    if (!groupId || !VRCHAT_CANDIDATE_SCAN_DETAIL_LOOKUP || detailState?.disabled) return group;

    if (detailState && detailState.lookups >= detailState.maxLookups) {
        detailState.disabled = true;
        return group;
    }

    if (!groupDetailCache.has(groupId)) {

        if (detailState) {
            detailState.lookups += 1;
        }

        let detail = null;

        try {
            detail = await fetchVrchatGroup(groupId);
        } catch (error) {

            if (isVrchatRateLimitError(error)) {
                if (detailState) {
                    detailState.disabled = true;
                    detailState.rateLimited = true;
                    detailState.retryAfterMs = error.retryAfterMs || 0;
                }

                throw error;
            }

            console.warn(`Unable to fetch VRChat group details for candidate scan ${groupId}:`, error.message);

        }

        groupDetailCache.set(groupId, detail);

        if (detail && VRCHAT_CANDIDATE_GROUP_DETAIL_DELAY_MS > 0) {
            await wait(VRCHAT_CANDIDATE_GROUP_DETAIL_DELAY_MS);
        }

    }

    const detail = groupDetailCache.get(groupId);

    return detail
        ? {
            ...group,
            ...detail,
            groupId
        }
        : group;

}

async function sendVrchatSafetyMemberAlert(channel, member, matches) {

    const userId = member.userId || member.user?.id;
    const displayName = member.user?.displayName || member.displayName || userId || 'Unknown user';
    const profileUrl = `https://vrchat.com/home/user/${encodeURIComponent(userId)}`;
    const thumbnail = member.user?.thumbnailUrl || member.user?.currentAvatarThumbnailImageUrl;
    const linkedDiscordAccounts = await getLinkedDiscordAccountsForVrchatUser(channel.guild, userId);
    const linkedDiscordText = formatLinkedDiscordAccounts(linkedDiscordAccounts);

    const embed = new EmbedBuilder()
        .setColor(0xff3b30)
        .setTitle('Minor-safety blacklist match requires moderator review')
        .setURL(profileUrl)
        .setDescription(
            `**VRChat member:** [${truncateSafetyText(displayName, 150)}](${profileUrl})\n` +
            `**VRChat user ID:** \`${userId}\`\n\n` +
            `**Linked Discord identity:**\n${linkedDiscordText}\n\n` +
            'This alert indicates a match against your moderator-reviewed group blacklist. ' +
            'Membership alone is not proof of misconduct; verify the evidence and context before taking action.'
        )
        .setTimestamp()
        .setFooter({
            text: `Monitored group: ${MONITORED_VRCHAT_GROUP_ID}`
        });

    if (thumbnail && /^https:\/\//i.test(thumbnail)) {
        embed.setThumbnail(thumbnail);
    }

    for (const match of matches.slice(0, 20)) {

        const entry = match.blacklist;
        const group = match.publicGroup;
        const groupId = entry.group_id;
        const groupUrl = `https://vrchat.com/home/group/${encodeURIComponent(groupId)}`;
        const evidence = entry.evidence
            ? truncateSafetyText(entry.evidence, 450)
            : 'No evidence summary stored.';

        embed.addFields({
            name: truncateSafetyText(group.name || entry.name || groupId, 256),
            value: truncateSafetyText(
                `[Open VRChat group](${groupUrl})\n` +
                `ID: \`${groupId}\`\n` +
                `Category: **${entry.category}** | Severity: **${entry.severity}**\n` +
                `Evidence: ${evidence}`,
                1024
            ),
            inline: false
        });

    }

    if (matches.length > 20) {
        embed.addFields({
            name: 'Additional matches',
            value: `${matches.length - 20} more matched groups were omitted due to Discord embed limits.`,
            inline: false
        });
    }

    const roleMention = process.env.MOD_ROLE_ID ? `<@&${process.env.MOD_ROLE_ID}>` : undefined;

    await channel.send({
        content: roleMention,
        embeds: [embed],
        allowedMentions: process.env.MOD_ROLE_ID
            ? {
                roles: [process.env.MOD_ROLE_ID]
            }
            : {
                parse: []
            }
    });

}

async function sendVrchatSafetyCandidateAlert(channel, group, candidateMatch, member = null) {

    const groupId = group.groupId || group.id;
    const groupUrl = `https://vrchat.com/home/group/${encodeURIComponent(groupId)}`;
    const matchedTerms = Array.isArray(candidateMatch)
        ? candidateMatch
        : candidateMatch?.terms || [];
    const matchedFields = Array.isArray(candidateMatch)
        ? []
        : candidateMatch?.fields || [];
    const protectiveTerms = Array.isArray(candidateMatch)
        ? []
        : candidateMatch?.protectiveTerms || [];
    const minorNexusTerms = Array.isArray(candidateMatch)
        ? []
        : candidateMatch?.minorNexusTerms || [];
    const riskScore = Array.isArray(candidateMatch) ? null : candidateMatch?.score;
    const riskThreshold = Array.isArray(candidateMatch)
        ? CANDIDATE_RISK_SCORE_THRESHOLD
        : candidateMatch?.threshold ?? CANDIDATE_RISK_SCORE_THRESHOLD;
    const confidence = Array.isArray(candidateMatch) ? 'unknown' : candidateMatch?.confidence || 'unknown';
    const evidenceItems = Array.isArray(candidateMatch) ? [] : candidateMatch?.items || [];
    const suppressedItems = Array.isArray(candidateMatch) ? [] : candidateMatch?.suppressedItems || [];
    const matchedMemberId = member?.userId || member?.user?.id || null;
    const matchedMemberName = member?.user?.displayName || member?.displayName || matchedMemberId || null;
    const linkedDiscordAccounts = matchedMemberId
        ? await getLinkedDiscordAccountsForVrchatUser(channel.guild, matchedMemberId)
        : [];
    const foundWhileScanningText = matchedMemberId
        ? `VRChat: ${truncateSafetyText(matchedMemberName, 150)} (\`${matchedMemberId}\`)\n` +
            `Discord link(s):\n${formatLinkedDiscordAccounts(linkedDiscordAccounts)}`
        : 'Group scan';

    const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle('Minor-safety VRChat group candidate')
        .setURL(groupUrl)
        .setDescription(
            'A public text scan found an **unverified** group that may require moderator review.\n\n' +
            `**Group:** [${truncateSafetyText(group.name || groupId, 150)}](${groupUrl})\n` +
            `**ID:** \`${groupId}\`\n` +
            `**Risk score:** **${riskScore ?? 'n/a'} / ${riskThreshold}** (${confidence} confidence)\n` +
            `**Minor nexus:** ${minorNexusTerms.slice(0, 15).map(term => `\`${term}\``).join(', ') || 'None'}\n` +
            `**Matched terms:** ${matchedTerms.slice(0, 25).map(term => `\`${term}\``).join(', ') || 'None'}\n\n` +
            'Do not treat this alert as proof and do not take action against a member from this candidate alone. ' +
            'Review the group, preserve lawful evidence, and add its exact ID to the blacklist only after verification.'
        )
        .addFields(
            {
                name: 'Matched public fields',
                value: matchedFields.length
                    ? truncateSafetyText(matchedFields.slice(0, 20).join(', '), 1024)
                    : 'Public group text',
                inline: false
            },
            {
                name: 'Found while scanning',
                value: truncateSafetyText(foundWhileScanningText, 1024),
                inline: false
            },
            {
                name: 'Public description',
                value: truncateSafetyText(group.description || 'No public description.', 1024),
                inline: false
            }
        )
        .setTimestamp();

    if (protectiveTerms.length > 0) {
        embed.addFields({
            name: 'Context note',
            value: `This group also contains possible prevention/reporting context: ${protectiveTerms.slice(0, 10).map(term => `\`${term}\``).join(', ')}. Staff should review manually.`,
            inline: false
        });
    }


    if (evidenceItems.length > 0) {
        embed.addFields({
            name: 'Scored evidence',
            value: truncateSafetyText(
                evidenceItems.slice(0, 8).map(item =>
                    `+${item.points} [${item.type}] ${item.term} in ${item.field}: ${item.segment}`
                ).join('\n'),
                1024
            ),
            inline: false
        });
    }

    if (suppressedItems.length > 0) {
        embed.addFields({
            name: 'Suppressed rule/prohibition matches',
            value: truncateSafetyText(
                suppressedItems.slice(0, 6).map(item =>
                    `${item.term} in ${item.field}: ${item.segment}`
                ).join('\n'),
                1024
            ),
            inline: false
        });
    }

    await channel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

function requestVrchatSafetyScanStop(requestedBy = null) {

    if (!vrchatSafetyScannerRunning) {
        return {
            requested: false,
            reason: 'No VRChat safety scan is currently running.'
        };
    }

    vrchatSafetyScanStopRequested = true;
    vrchatSafetyScanStopRequestedBy = requestedBy || null;

    return {
        requested: true,
        reason: 'Stop requested. The scan will exit after the current VRChat request finishes.'
    };

}

async function waitForVrchatSafetyScanToStop(timeoutMs = 30000) {

    const deadline = Date.now() + Math.max(1000, timeoutMs);

    while (vrchatSafetyScannerRunning && Date.now() < deadline) {
        await wait(250);
    }

    return !vrchatSafetyScannerRunning;

}

function formatVrchatSafetyScanResult(result) {

    if (result.skipped) return result.reason;

    const cancelledText = result.cancelled
        ? ` Scan stopped by request${result.cancelledBy ? ` from Discord user ${result.cancelledBy}` : ''}.`
        : '';
    const rateLimitText = result.rateLimited
        ? ` Scan stopped early because VRChat rate limited requests; retry in about ${Math.max(1, Math.ceil((result.rateLimitRetryAfterMs || VRCHAT_RATE_LIMIT_BACKOFF_MS) / 60000))} minute(s).`
        : '';
    const matchedText = `${result.matchedMembers || 0} member(s) matched a blacklisted group`;
    const alertText = `${result.flaggedMembers || 0} alert(s) sent`;
    const cooldownText = `${result.cooldownSuppressedMembers || 0} alert(s) suppressed by cooldown`;

    if (result.blacklistOnly) {
        return `${result.cancelled ? 'Blacklist-only scan stopped' : 'Blacklist-only scan complete'}: checked ${result.checked}/${result.totalMembers} members; ` +
            `${matchedText}; ${alertText}; ${cooldownText}; ` +
            `${result.failedMembers} member lookup failure(s).${cancelledText}${rateLimitText}`;
    }

    return `${result.cancelled ? 'Scan stopped' : 'Scan complete'}: checked ${result.checked}/${result.totalMembers} members; ` +
        `${matchedText}; ${alertText}; ${cooldownText}; ` +
        `${result.candidateGroups} candidate group alert(s), ` +
        `${result.failedMembers} member lookup failure(s), ` +
        `${result.candidateDetailLookups || 0} candidate detail lookup(s).${cancelledText}${rateLimitText}`;

}

async function runVrchatSafetyScan({
    trigger = 'manual',
    requestedBy = null,
    blacklistOnly = false
} = {}) {

    if (vrchatSafetyScannerRunning) {
        return {
            skipped: true,
            reason: 'A VRChat safety scan is already running. Use `!stopscan` and wait for it to stop before starting another scan.'
        };
    }

    const missingSettings = getVrchatSafetyScannerMissingSettings();

    if (missingSettings.length > 0) {
        return {
            skipped: true,
            reason: `VRChat safety scanner is disabled. Missing: ${missingSettings.join(', ')}.`
        };
    }

    vrchatSafetyScannerRunning = true;
    vrchatSafetyScanStopRequested = false;
    vrchatSafetyScanStopRequestedBy = null;
    vrchatSafetyScannerCurrentTrigger = trigger;
    const startedAt = Date.now();
    let checked = 0;
    let matchedMembers = 0;
    let flaggedMembers = 0;
    let cooldownSuppressedMembers = 0;
    let failedMembers = 0;
    let candidateGroups = 0;
    let rateLimited = false;
    let rateLimitRetryAfterMs = 0;
    let cancelled = false;

    try {

        loadVrchatSafetyBlacklist();

        const members = await fetchAllVrchatGroupMembers(
            MONITORED_VRCHAT_GROUP_ID,
            {
                shouldStop: () => vrchatSafetyScanStopRequested
            }
        );

        if (vrchatSafetyScanStopRequested) {
            cancelled = true;
        }
        const verifiedByGroupId = getVrchatSafetyBlacklistByGroupId();
        const allBlacklistedGroupIds = new Set([...vrchatSafetyBlacklist.keys()]);
        const candidateGroupDetailCache = new Map();
        const candidateDetailState = {
            lookups: 0,
            maxLookups: blacklistOnly ? 0 : VRCHAT_CANDIDATE_MAX_DETAIL_LOOKUPS_PER_SCAN,
            disabled: blacklistOnly || VRCHAT_CANDIDATE_MAX_DETAIL_LOOKUPS_PER_SCAN === 0,
            rateLimited: false,
            retryAfterMs: 0
        };
        const alertChannel = await getVrchatSafetyTextChannel(SAFETY_ALERT_CHANNEL_ID);
        const candidateChannel = !blacklistOnly && DISCOVER_CANDIDATE_GROUPS
            ? await getVrchatSafetyTextChannel(CANDIDATE_REVIEW_CHANNEL_ID)
            : null;

        for (const member of members) {

            if (vrchatSafetyScanStopRequested) {
                cancelled = true;
                break;
            }

            const userId = member.userId || member.user?.id;
            const displayName = member.user?.displayName || member.displayName || userId || 'Unknown user';

            if (!userId) continue;

            try {

                const publicGroups = await fetchVrchatUserGroups(userId);

                if (vrchatSafetyScanStopRequested) {
                    cancelled = true;
                    break;
                }

                checked += 1;

                const matches = publicGroups
                    .map(group => ({
                        publicGroup: group,
                        blacklist: verifiedByGroupId.get(group.groupId || group.id)
                    }))
                    .filter(match => Boolean(match.blacklist));

                refreshVrchatSafetyUserMatches(
                    userId,
                    displayName,
                    matches.map(match => match.blacklist.group_id)
                );

                if (matches.length > 0) {

                    matchedMembers += 1;

                    const shouldNotify = matches.some(match =>
                        shouldNotifyVrchatSafetyMatch(userId, match.blacklist.group_id)
                    );

                    if (shouldNotify) {
                        await sendVrchatSafetyMemberAlert(alertChannel, member, matches);
                        markVrchatSafetyMatchesNotified(
                            userId,
                            matches.map(match => match.blacklist.group_id)
                        );
                        flaggedMembers += 1;
                    } else {
                        cooldownSuppressedMembers += 1;
                    }

                }

                if (!blacklistOnly && DISCOVER_CANDIDATE_GROUPS && candidateChannel) {

                    for (const group of publicGroups) {

                        if (vrchatSafetyScanStopRequested) {
                            cancelled = true;
                            break;
                        }

                        const groupId = group.groupId || group.id;

                        if (!groupId || allBlacklistedGroupIds.has(groupId)) continue;

                        let scanGroup = group;
                        let candidateMatch = getVrchatSafetyCandidateMatch(group);

                        // Do not fetch full details for ordinary 18+/adult/lewd groups.
                        // A group must already have at least one unsuppressed minor-safety
                        // evidence item in its public summary before it can spend a detail request.
                        if (!candidateMatch.matched && hasVrchatMinorSafetyDetailHint(group, candidateMatch)) {
                            scanGroup = await getVrchatSafetyCandidateScanGroup(
                                group,
                                candidateGroupDetailCache,
                                candidateDetailState
                            );
                            candidateMatch = getVrchatSafetyCandidateMatch(scanGroup);
                        }

                        if (!candidateMatch.matched) continue;

                        upsertVrchatSafetyCandidateGroup(scanGroup, candidateMatch);

                        if (shouldNotifyVrchatSafetyCandidate(groupId)) {
                            await sendVrchatSafetyCandidateAlert(candidateChannel, scanGroup, candidateMatch, member);
                            markVrchatSafetyCandidateNotified(groupId);
                            candidateGroups += 1;
                        }

                    }

                }

            } catch (error) {

                if (isVrchatRateLimitError(error)) {
                    rateLimited = true;
                    rateLimitRetryAfterMs = error.retryAfterMs || VRCHAT_RATE_LIMIT_BACKOFF_MS;
                    console.warn(
                        `VRChat safety scan stopped after ${checked}/${members.length} members because the API rate limit was reached.`
                    );
                    break;
                }

                failedMembers += 1;
                console.warn(`Unable to scan VRChat member ${displayName} (${userId}):`, error.message);

            }

            if (vrchatSafetyScanStopRequested) {
                cancelled = true;
                break;
            }

            await wait(SAFETY_SCAN_DELAY_MS);

        }

        const result = {
            skipped: false,
            trigger,
            requestedBy,
            blacklistOnly,
            totalMembers: members.length,
            checked,
            matchedMembers,
            flaggedMembers,
            cooldownSuppressedMembers,
            candidateGroups,
            failedMembers,
            candidateDetailLookups: candidateDetailState.lookups,
            candidateDetailBudgetReached: candidateDetailState.disabled && !candidateDetailState.rateLimited,
            rateLimited,
            rateLimitRetryAfterMs,
            cancelled,
            cancelledBy: cancelled ? vrchatSafetyScanStopRequestedBy : null,
            durationMs: Date.now() - startedAt
        };

        console.log('VRChat safety scan completed:', result);
        return result;

    } catch (error) {

        console.error('VRChat safety scan failed:', error);
        throw error;

    } finally {

        vrchatSafetyScannerRunning = false;
        vrchatSafetyScanStopRequested = false;
        vrchatSafetyScanStopRequestedBy = null;
        vrchatSafetyScannerCurrentTrigger = null;

    }

}

function startVrchatSafetyScanner() {

    if (vrchatSafetyScannerStarted) return;

    const missingSettings = getVrchatSafetyScannerMissingSettings();

    if (missingSettings.length > 0) {
        console.warn(`VRChat safety scanner disabled. Missing: ${missingSettings.join(', ')}`);
        return;
    }

    vrchatSafetyScannerStarted = true;

    const runScheduledSafetyScan = () => {
        runVrchatSafetyScan({
            trigger: 'scheduled'
        }).catch(error => {
            console.error('Scheduled VRChat safety scan failed:', error);
        });
    };

    let scheduledWithCron = false;

    if (process.env.SAFETY_SCAN_CRON) {

        try {

            const cron = require('node-cron');

            if (cron.validate(process.env.SAFETY_SCAN_CRON)) {
                vrchatSafetyScannerInterval = cron.schedule(process.env.SAFETY_SCAN_CRON, runScheduledSafetyScan);
                scheduledWithCron = true;
            } else {
                console.warn(`Invalid SAFETY_SCAN_CRON expression: ${process.env.SAFETY_SCAN_CRON}`);
            }

        } catch (error) {

            console.warn('SAFETY_SCAN_CRON ignored because node-cron is not installed. Falling back to interval scheduling.');

        }

    }

    if (!scheduledWithCron) {
        vrchatSafetyScannerInterval = setInterval(runScheduledSafetyScan, SAFETY_SCAN_INTERVAL_MS);
    }

    if (process.env.RUN_SAFETY_SCAN_ON_START === 'true') {
        setTimeout(() => {
            runVrchatSafetyScan({
                trigger: 'startup'
            }).catch(error => {
                console.error('Startup VRChat safety scan failed:', error);
            });
        }, 5000);
    } else {
        console.log('Startup VRChat safety scan skipped. Set RUN_SAFETY_SCAN_ON_START=true to enable it.');
    }

    console.log(`VRChat safety scanner started for ${MONITORED_VRCHAT_GROUP_ID}.`);

}

async function runSafetyScanFromMessage(message, {
    blacklistOnly = false
} = {}) {

    const statusMessage = await message.reply(
        blacklistOnly
            ? 'Starting blacklist-only VRChat scan...'
            : 'Starting VRChat safety scan...'
    );

    try {

        const result = await runVrchatSafetyScan({
            trigger: blacklistOnly ? 'manual-blacklist-only' : 'manual',
            requestedBy: message.author.id,
            blacklistOnly
        });

        await statusMessage.edit(formatVrchatSafetyScanResult(result));

    } catch (error) {

        await statusMessage.edit(
            `${blacklistOnly ? 'Blacklist-only scan' : 'Safety scan'} failed: ${truncateText(error.message, 300)}`
        );

    }

}

async function handleStopSafetyScanCommand(message) {

    if (!hasSafetyCommandAccess(message.member)) {
        return message.reply('No permission.');
    }

    const stopResult = requestVrchatSafetyScanStop(message.author.id);

    if (!stopResult.requested) {
        return message.reply(stopResult.reason);
    }

    const statusMessage = await message.reply(
        `${stopResult.reason} Waiting for the scanner lock to be released...`
    );

    const stopped = await waitForVrchatSafetyScanToStop(30000);

    if (stopped) {
        return statusMessage.edit(
            'VRChat safety scan stopped. You can now run `!scanblacklist`.'
        );
    }

    return statusMessage.edit(
        'Stop is still pending because the current VRChat request has not finished yet. Check `!safetyscan status`, then run `!scanblacklist` once “Running now” shows “no”.'
    );

}

async function handleSafetyScanMessageCommand(message, args) {

    if (!hasSafetyCommandAccess(message.member)) {
        return message.reply('No permission.');
    }

    const subcommand = String(args[0] || 'status').toLowerCase();

    if (subcommand === 'status') {
        return message.reply(getVrchatSafetyScannerStatusText());
    }

    if (['stop', 'cancel', 'abort'].includes(subcommand)) {
        return handleStopSafetyScanCommand(message);
    }

    if (['blacklist', 'blacklisted', 'blacklist-only'].includes(subcommand)) {
        return runSafetyScanFromMessage(message, {
            blacklistOnly: true
        });
    }

    if (subcommand !== 'run') {
        return message.reply(
            'Usage: `!safetyscan status`, `!safetyscan run`, `!safetyscan blacklist`, or `!safetyscan stop`'
        );
    }

    return runSafetyScanFromMessage(message);

}

async function handleBlacklistOnlySafetyScanCommand(message) {

    if (!hasSafetyCommandAccess(message.member)) {
        return message.reply('No permission.');
    }

    return runSafetyScanFromMessage(message, {
        blacklistOnly: true
    });

}

function getVrchatPublicGroupId(group) {
    return group?.groupId || group?.id || group?.group_id || null;
}

function getVrchatPublicGroupName(group, fallbackId) {
    return group?.name || group?.shortCode || fallbackId || 'Unknown group';
}

function formatVrchatMemberGroupScanResult(result) {

    if (result.skipped) return result.reason;

    const rateLimitText = result.rateLimited
        ? ` Stopped early due to VRChat rate limiting; retry in about ${Math.max(1, Math.ceil((result.rateLimitRetryAfterMs || VRCHAT_RATE_LIMIT_BACKOFF_MS) / 60000))} minute(s).`
        : '';

    return `Member group scan complete: checked ${result.checked}/${result.totalMembers} members; ` +
        `found ${result.uniqueGroups.length} unique public group(s); ` +
        `${result.failedMembers} member lookup failure(s).${rateLimitText}`;

}

function createVrchatMemberGroupScanAttachment(result) {

    const report = {
        scannedAt: result.finishedAt,
        startedAt: result.startedAt,
        durationMs: result.durationMs,
        monitoredGroupId: result.groupId,
        requestedBy: result.requestedBy,
        totals: {
            totalMembers: result.totalMembers,
            checked: result.checked,
            failedMembers: result.failedMembers,
            uniquePublicGroups: result.uniqueGroups.length
        },
        topPublicGroups: result.uniqueGroups.slice(0, 100),
        members: result.memberRecords
    };
    const json = Buffer.from(JSON.stringify(report, null, 2), 'utf8');

    if (json.length > 7_500_000) {
        const compressed = zlib.gzipSync(json);

        return new AttachmentBuilder(compressed, {
            name: `vrchat-member-groups-${Date.now()}.json.gz`
        });
    }

    return new AttachmentBuilder(json, {
        name: `vrchat-member-groups-${Date.now()}.json`
    });

}

async function sendVrchatMemberGroupScanReport(guild, result) {

    const channel = await getVrchatAuditLogChannel(guild);

    if (!channel) {
        throw new Error(`VRChat audit log channel ${VRCHAT_AUDIT_LOG_CHANNEL_ID} could not be found.`);
    }

    const topGroupsText = result.uniqueGroups.length
        ? result.uniqueGroups
            .slice(0, 15)
            .map((group, index) =>
                `${index + 1}. ${truncateSafetyText(group.name, 80)} - ${group.memberCount} member(s) - \`${group.id}\``
            )
            .join('\n')
        : 'No public groups were visible on scanned members.';

    const embed = new EmbedBuilder()
        .setColor('#2B90D9')
        .setTitle('VRChat Member Group Inventory Scan')
        .setDescription('Public VRChat groups found across members of the monitored group.')
        .addFields(
            {
                name: 'Monitored Group',
                value: `\`${result.groupId}\``,
                inline: false
            },
            {
                name: 'Members Checked',
                value: `${result.checked}/${result.totalMembers}`,
                inline: true
            },
            {
                name: 'Unique Public Groups',
                value: `${result.uniqueGroups.length}`,
                inline: true
            },
            {
                name: 'Lookup Failures',
                value: `${result.failedMembers}`,
                inline: true
            },
            {
                name: 'Requested By',
                value: result.requestedBy ? `<@${result.requestedBy}>` : 'Scheduled/system',
                inline: false
            },
            {
                name: 'Top Shared Public Groups',
                value: truncateSafetyText(topGroupsText, 1024),
                inline: false
            }
        )
        .setFooter({
            text: `Finished in ${Math.round(result.durationMs / 1000)} second(s)`
        })
        .setTimestamp();

    await channel.send({
        embeds: [embed],
        files: [createVrchatMemberGroupScanAttachment(result)],
        allowedMentions: {
            parse: []
        }
    });

}

async function runVrchatMemberGroupInventoryScan({
    requestedBy = null
} = {}) {

    if (vrchatMemberGroupScanRunning) {
        return {
            skipped: true,
            reason: 'A VRChat member group scan is already running.'
        };
    }

    if (vrchatSafetyScannerRunning) {
        return {
            skipped: true,
            reason: 'A VRChat safety scan is already running. Try again after it finishes.'
        };
    }

    if (!MONITORED_VRCHAT_GROUP_ID) {
        return {
            skipped: true,
            reason: 'No monitored VRChat group is configured.'
        };
    }

    vrchatMemberGroupScanRunning = true;
    const startedAtMs = Date.now();
    const startedAt = new Date(startedAtMs).toISOString();
    let checked = 0;
    let failedMembers = 0;
    let rateLimited = false;
    let rateLimitRetryAfterMs = 0;

    try {

        const members = await fetchAllVrchatGroupMembers(MONITORED_VRCHAT_GROUP_ID);
        const uniqueGroupMap = new Map();
        const memberRecords = [];

        for (const member of members) {

            const userId = member.userId || member.user?.id;
            const displayName = member.user?.displayName || member.displayName || userId || 'Unknown user';

            if (!userId) continue;

            try {

                const publicGroups = await fetchVrchatUserGroups(userId);
                checked += 1;

                const normalizedGroups = publicGroups
                    .map(group => {
                        const id = getVrchatPublicGroupId(group);

                        if (!id) return null;

                        return {
                            id,
                            name: getVrchatPublicGroupName(group, id),
                            shortCode: group.shortCode || null,
                            description: group.description || null,
                            memberCount: group.memberCount || group.membershipCount || null,
                            url: `https://vrchat.com/home/group/${encodeURIComponent(id)}`
                        };
                    })
                    .filter(Boolean);

                memberRecords.push({
                    userId,
                    displayName,
                    profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`,
                    publicGroupCount: normalizedGroups.length,
                    publicGroups: normalizedGroups
                });

                for (const group of normalizedGroups) {

                    if (!uniqueGroupMap.has(group.id)) {
                        uniqueGroupMap.set(group.id, {
                            id: group.id,
                            name: group.name,
                            shortCode: group.shortCode,
                            description: group.description,
                            url: group.url,
                            memberIds: new Set(),
                            members: []
                        });
                    }

                    const entry = uniqueGroupMap.get(group.id);
                    entry.name = entry.name || group.name;
                    entry.description = entry.description || group.description;

                    if (!entry.memberIds.has(userId)) {
                        entry.memberIds.add(userId);
                        entry.members.push({
                            userId,
                            displayName
                        });
                    }

                }

            } catch (error) {

                if (isVrchatRateLimitError(error)) {
                    rateLimited = true;
                    rateLimitRetryAfterMs = error.retryAfterMs || VRCHAT_RATE_LIMIT_BACKOFF_MS;
                    console.warn(
                        `VRChat member group inventory stopped after ${checked}/${members.length} members because the API rate limit was reached.`
                    );
                    break;
                }

                failedMembers += 1;
                memberRecords.push({
                    userId,
                    displayName,
                    profileUrl: `https://vrchat.com/home/user/${encodeURIComponent(userId)}`,
                    publicGroupCount: 0,
                    publicGroups: [],
                    error: error.message
                });
                console.warn(`Unable to inventory public groups for ${displayName} (${userId}):`, error.message);

            }

            await wait(VRCHAT_MEMBER_GROUP_SCAN_DELAY_MS);

        }

        const uniqueGroups = [...uniqueGroupMap.values()]
            .map(group => ({
                id: group.id,
                name: group.name,
                shortCode: group.shortCode,
                description: group.description,
                url: group.url,
                memberCount: group.memberIds.size,
                members: group.members
            }))
            .sort((a, b) => b.memberCount - a.memberCount || a.name.localeCompare(b.name));
        const finishedAtMs = Date.now();

        return {
            skipped: false,
            groupId: MONITORED_VRCHAT_GROUP_ID,
            requestedBy,
            startedAt,
            finishedAt: new Date(finishedAtMs).toISOString(),
            durationMs: finishedAtMs - startedAtMs,
            totalMembers: members.length,
            checked,
            failedMembers,
            rateLimited,
            rateLimitRetryAfterMs,
            uniqueGroups,
            memberRecords
        };

    } finally {

        vrchatMemberGroupScanRunning = false;

    }

}

async function handleMemberGroupScanCommand(message) {

    if (!hasSafetyCommandAccess(message.member)) {
        return message.reply('No permission.');
    }

    const statusMessage = await message.reply(
        'Starting VRChat member group scan. This can take a while for large groups.'
    );

    try {

        const result = await runVrchatMemberGroupInventoryScan({
            requestedBy: message.author.id
        });

        if (result.skipped) {
            return statusMessage.edit(result.reason);
        }

        await sendVrchatMemberGroupScanReport(message.guild, result);
        await statusMessage.edit(
            `${formatVrchatMemberGroupScanResult(result)} Report sent to <#${VRCHAT_AUDIT_LOG_CHANNEL_ID}>.`
        );

    } catch (error) {

        await statusMessage.edit(`Member group scan failed: ${truncateText(error.message, 300)}`);

    }

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
            headers: getVrchatRequestHeaders()
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

        if ((response.status === 401 || response.status === 403) && !VRCHAT_AUTH_COOKIE) {
            throw new Error(
                'VRChat rejected the public group post watcher request. ' +
                'This group or endpoint may require authentication or your backend service.'
            );
        }

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
            headers: getVrchatRequestHeaders()
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

        if ((response.status === 401 || response.status === 403) && !VRCHAT_AUTH_COOKIE) {
            throw new Error(
                'VRChat rejected the public group instance watcher request. ' +
                'This group or endpoint may require authentication or your backend service.'
            );
        }

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
            headers: getVrchatRequestHeaders('image/*')
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

function getVrchatPostErrorCode(error) {
    return error?.cause?.code || error?.code || error?.cause?.errno || error?.errno || '';
}

function backoffVrchatPostWatcher(error) {

    const errorCode = getVrchatPostErrorCode(error);
    const isTransientNetworkError = [
        'ECONNRESET',
        'ETIMEDOUT',
        'EAI_AGAIN',
        'ENOTFOUND',
        'ECONNREFUSED',
        -104
    ].includes(errorCode);

    if (!isTransientNetworkError && !String(error?.message || '').includes('fetch failed')) {
        return false;
    }

    vrchatPostNextAllowedAt = Date.now() + VRCHAT_POST_ERROR_BACKOFF_MS;
    console.warn(
        `VRChat group post watcher hit a temporary network error (${errorCode || error.message}). ` +
        `Retrying in ${Math.round(VRCHAT_POST_ERROR_BACKOFF_MS / 1000)} seconds.`
    );

    return true;

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
                if (!backoffVrchatPostWatcher(error)) {
                    console.error('Failed to fetch VRChat group instances:', error);
                }
            }

        }

        for (const post of newPosts) {
            await sendVrchatGroupPost(post, openInstances);
        }

    } catch (error) {

        if (!backoffVrchatPostWatcher(error)) {
            console.error('VRChat group post watcher error:', error);
        }

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

function getVrchatAuditEntryKey(entry) {

    if (entry?.id) return String(entry.id);

    const stablePayload = JSON.stringify({
        eventType: entry?.eventType || null,
        createdAt: entry?.created_at || entry?.createdAt || null,
        actorId: entry?.actorId || null,
        targetId: entry?.targetId || null,
        data: entry?.data || null
    });

    return `fallback:${crypto.createHash('sha256').update(stablePayload).digest('hex')}`;

}

function getVrchatAuditEntryCreatedAt(entry) {
    return entry?.created_at || entry?.createdAt || null;
}

function getVrchatAuditEntryTimestamp(entry) {

    const value = Date.parse(getVrchatAuditEntryCreatedAt(entry) || '');
    return Number.isNaN(value) ? 0 : value;

}

function humanizeVrchatAuditEventType(eventType) {

    const raw = String(eventType || 'group.audit.event');
    const words = raw
        .split('.')
        .filter(Boolean)
        .map(word => word.replace(/([a-z])([A-Z])/g, '$1 $2'));

    return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' › ');

}

function flattenVrchatAuditData(value, prefix = '', output = [], depth = 0) {

    if (output.length >= 30 || depth > 4) return output;

    if (value === null || value === undefined) {
        if (prefix) output.push(`${prefix}: ${String(value)}`);
        return output;
    }

    if (Array.isArray(value)) {

        if (value.length === 0 && prefix) {
            output.push(`${prefix}: []`);
            return output;
        }

        value.slice(0, 10).forEach((item, index) => {
            flattenVrchatAuditData(item, prefix ? `${prefix}[${index}]` : `[${index}]`, output, depth + 1);
        });

        if (value.length > 10 && output.length < 30) {
            output.push(`${prefix || 'items'}: …and ${value.length - 10} more`);
        }

        return output;

    }

    if (typeof value === 'object') {

        const entries = Object.entries(value);

        if (entries.length === 0 && prefix) {
            output.push(`${prefix}: {}`);
            return output;
        }

        for (const [key, nestedValue] of entries) {
            const nestedPrefix = prefix ? `${prefix}.${key}` : key;
            flattenVrchatAuditData(nestedValue, nestedPrefix, output, depth + 1);
            if (output.length >= 30) break;
        }

        return output;

    }

    output.push(`${prefix || 'value'}: ${String(value)}`);
    return output;

}

function formatVrchatAuditEntryData(data) {

    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return 'No additional data.';
    }

    return truncateText(flattenVrchatAuditData(data).join('\n') || 'No additional data.', 1000);

}

function getVrchatAuditEmbedColor(eventType) {

    const normalized = String(eventType || '').toLowerCase();

    if (/(ban|kick|remove|warn|block|delete|decline)/.test(normalized)) return '#ED4245';
    if (/(join|invite|accept|create|add|assign)/.test(normalized)) return '#57F287';
    if (/(role|permission|update|edit|transfer)/.test(normalized)) return '#FEE75C';
    if (/(post|announcement|event|instance)/.test(normalized)) return '#5865F2';

    return '#2B90D9';

}

async function getVrchatNativeAuditDiscordChannel() {

    const cachedChannel = client.channels.cache.get(VRCHAT_AUDIT_LOG_CHANNEL_ID);
    const channel = cachedChannel || await client.channels.fetch(VRCHAT_AUDIT_LOG_CHANNEL_ID).catch(() => null);

    return channel?.isTextBased?.() && channel.send ? channel : null;

}

async function fetchVrchatGroupAuditLogs(groupId, {
    offset = 0,
    n = 100,
    startDate = null,
    endDate = null
} = {}) {

    const params = {
        offset,
        n: Math.max(1, Math.min(100, n))
    };

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    const response = await fetchVrchatApiJson(
        `/groups/${encodeURIComponent(groupId)}/auditLogs`,
        params
    );

    return {
        results: Array.isArray(response?.results) ? response.results : [],
        hasNext: response?.hasNext === true,
        totalCount: Number(response?.totalCount) || 0
    };

}

async function fetchVrchatAuditLogWindow(
    groupId,
    startDate = null,
    maxPages = VRCHAT_AUDIT_MAX_PAGES_PER_POLL,
    warnOnLimit = true
) {

    const collected = [];
    const endDate = new Date().toISOString();
    let offset = 0;
    let hasNext = false;

    for (let page = 0; page < maxPages; page++) {

        const response = await fetchVrchatGroupAuditLogs(groupId, {
            offset,
            n: 100,
            startDate,
            endDate
        });

        collected.push(...response.results);
        hasNext = response.hasNext;

        if (!hasNext || response.results.length === 0) break;

        offset += response.results.length;

    }

    if (hasNext && warnOnLimit) {
        console.warn(
            `VRChat audit mirror reached its ${maxPages}-page poll limit. ` +
            'Increase VRCHAT_AUDIT_MAX_PAGES_PER_POLL if the group generates more than this between polls.'
        );
    }

    const uniqueEntries = new Map();

    for (const entry of collected) {
        uniqueEntries.set(getVrchatAuditEntryKey(entry), entry);
    }

    return [...uniqueEntries.values()].sort((left, right) =>
        getVrchatAuditEntryTimestamp(left) - getVrchatAuditEntryTimestamp(right)
    );

}

async function sendVrchatNativeAuditEntry(channel, entry) {

    const eventType = String(entry?.eventType || 'group.audit.event');
    const actorName = entry?.actorDisplayName || 'Unknown actor';
    const actorId = entry?.actorId || 'Unknown';
    const targetId = entry?.targetId || 'None';
    const description = entry?.description || humanizeVrchatAuditEventType(eventType);
    const createdAt = getVrchatAuditEntryCreatedAt(entry);
    const parsedTimestamp = Date.parse(createdAt || '');

    const embed = new EmbedBuilder()
        .setColor(getVrchatAuditEmbedColor(eventType))
        .setTitle(truncateText(description, 256))
        .setDescription(`**${humanizeVrchatAuditEventType(eventType)}**`)
        .addFields(
            {
                name: 'Actor',
                value: `${truncateText(String(actorName), 180)}\n\`${truncateText(String(actorId), 180)}\``,
                inline: true
            },
            {
                name: 'Target',
                value: `\`${truncateText(String(targetId), 180)}\``,
                inline: true
            },
            {
                name: 'Event Type',
                value: `\`${truncateText(eventType, 180)}\``,
                inline: false
            },
            {
                name: 'Details',
                value: formatVrchatAuditEntryData(entry?.data),
                inline: false
            }
        )
        .setFooter({
            text: truncateText(
                `VRChat Group Audit Log • ${entry?.groupId || VRCHAT_AUDIT_GROUP_ID} • ${getVrchatAuditEntryKey(entry)}`,
                2048
            )
        });

    if (!Number.isNaN(parsedTimestamp)) {
        embed.setTimestamp(new Date(parsedTimestamp));
    } else {
        embed.setTimestamp();
    }

    await channel.send({
        embeds: [embed],
        allowedMentions: {
            parse: []
        }
    });

}

function rememberVrchatAuditEntry(state, entry) {

    const key = getVrchatAuditEntryKey(entry);
    const recentIds = new Set(state.recentIds || []);

    recentIds.add(key);
    state.recentIds = [...recentIds].slice(-VRCHAT_AUDIT_RECENT_ID_LIMIT);

    const createdAt = getVrchatAuditEntryCreatedAt(entry);
    const createdTimestamp = Date.parse(createdAt || '');
    const lastTimestamp = Date.parse(state.lastCreatedAt || '');

    if (!Number.isNaN(createdTimestamp) && (Number.isNaN(lastTimestamp) || createdTimestamp > lastTimestamp)) {
        state.lastCreatedAt = new Date(createdTimestamp).toISOString();
    }

}

async function checkVrchatAuditLogs({ seedOnly = false } = {}) {

    if (vrchatAuditPollRunning || Date.now() < vrchatAuditNextAllowedAt) return;

    vrchatAuditPollRunning = true;

    try {

        const channel = await getVrchatNativeAuditDiscordChannel();

        if (!channel) {
            console.warn(`VRChat audit-log Discord channel not found: ${VRCHAT_AUDIT_LOG_CHANNEL_ID}`);
            vrchatAuditNextAllowedAt = Date.now() + 5 * 60 * 1000;
            return;
        }

        const store = readVrcLoggerStore();
        let state = normalizeVrchatAuditMirrorState(store.auditLogMirror);

        if (state.groupId !== VRCHAT_AUDIT_GROUP_ID) {
            state = normalizeVrchatAuditMirrorState({
                groupId: VRCHAT_AUDIT_GROUP_ID
            });
        }

        let startDate = null;

        if (state.initialized && state.lastCreatedAt) {
            const lastTimestamp = Date.parse(state.lastCreatedAt);

            if (!Number.isNaN(lastTimestamp)) {
                startDate = new Date(Math.max(0, lastTimestamp - VRCHAT_AUDIT_OVERLAP_MS)).toISOString();
            }
        } else if (VRCHAT_AUDIT_BACKFILL_ON_FIRST_START) {
            startDate = new Date(
                Date.now() - VRCHAT_AUDIT_INITIAL_LOOKBACK_HOURS * 60 * 60 * 1000
            ).toISOString();
        }

        const seedWithoutBackfill = !state.initialized && !VRCHAT_AUDIT_BACKFILL_ON_FIRST_START;
        const entries = await fetchVrchatAuditLogWindow(
            VRCHAT_AUDIT_GROUP_ID,
            startDate,
            seedWithoutBackfill ? 1 : VRCHAT_AUDIT_MAX_PAGES_PER_POLL,
            !seedWithoutBackfill
        );
        const seenIds = new Set(state.recentIds || []);

        if (!state.initialized && !VRCHAT_AUDIT_BACKFILL_ON_FIRST_START) {

            for (const entry of entries) {
                rememberVrchatAuditEntry(state, entry);
            }

            if (!state.lastCreatedAt) {
                state.lastCreatedAt = new Date().toISOString();
            }

            state.groupId = VRCHAT_AUDIT_GROUP_ID;
            state.initialized = true;
            state.lastPolledAt = new Date().toISOString();
            saveVrchatAuditMirrorState(state);

            console.log(
                `VRChat audit-log mirror seeded ${entries.length} existing entr${entries.length === 1 ? 'y' : 'ies'}; ` +
                'new audit events will now be sent to Discord.'
            );
            return;

        }

        const newEntries = entries.filter(entry => !seenIds.has(getVrchatAuditEntryKey(entry)));
        let sentCount = 0;

        for (const entry of newEntries) {
            await sendVrchatNativeAuditEntry(channel, entry);
            rememberVrchatAuditEntry(state, entry);
            state.groupId = VRCHAT_AUDIT_GROUP_ID;
            state.initialized = true;
            state.lastPolledAt = new Date().toISOString();
            saveVrchatAuditMirrorState(state);
            sentCount += 1;
        }

        if (!state.initialized) {
            state.groupId = VRCHAT_AUDIT_GROUP_ID;
            state.initialized = true;
            state.lastCreatedAt = state.lastCreatedAt || new Date().toISOString();
        }

        state.lastPolledAt = new Date().toISOString();
        saveVrchatAuditMirrorState(state);

        if (sentCount > 0) {
            console.log(`Mirrored ${sentCount} VRChat group audit-log entr${sentCount === 1 ? 'y' : 'ies'} to Discord.`);
        } else if (seedOnly) {
            console.log('VRChat audit-log mirror is ready; no backfill entries needed sending.');
        }

    } catch (error) {

        if (isVrchatRateLimitError(error)) {
            const retryAfterMs = error.retryAfterMs || VRCHAT_RATE_LIMIT_BACKOFF_MS;
            vrchatAuditNextAllowedAt = Date.now() + retryAfterMs;
            console.warn(
                `VRChat audit-log mirror paused for about ${Math.max(1, Math.ceil(retryAfterMs / 60000))} minute(s) due to rate limiting.`
            );
        } else {
            vrchatAuditNextAllowedAt = Date.now() + 5 * 60 * 1000;
            console.error('VRChat audit-log mirror error:', error);
        }

    } finally {
        vrchatAuditPollRunning = false;
    }

}

function startVrchatAuditLogWatcher() {

    if (vrchatAuditWatcherStarted) return;

    const missingSettings = [];

    if (!VRCHAT_AUDIT_GROUP_ID) missingSettings.push('VRCHAT_AUDIT_GROUP_ID');
    if (!VRCHAT_AUTH_COOKIE) missingSettings.push('VRCHAT_AUTH_COOKIE');
    if (!VRCHAT_AUDIT_LOG_CHANNEL_ID) missingSettings.push('VRCHAT_AUDIT_LOG_CHANNEL_ID');

    if (missingSettings.length > 0) {
        console.warn(`VRChat audit-log mirror disabled. Missing: ${missingSettings.join(', ')}`);
        return;
    }

    vrchatAuditWatcherStarted = true;
    checkVrchatAuditLogs({ seedOnly: true });

    vrchatAuditPollInterval = setInterval(() => {
        checkVrchatAuditLogs();
    }, VRCHAT_AUDIT_POLL_INTERVAL_MS);

    console.log(
        `VRChat audit-log mirror started for ${VRCHAT_AUDIT_GROUP_ID}; ` +
        `sending every event type to Discord channel ${VRCHAT_AUDIT_LOG_CHANNEL_ID}.`
    );

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

async function logCommand(message) {

    if (!message.guild || !message.content.startsWith('!')) return;

    const logChannel = getLogChannel(message.guild);

    if (!logChannel) return;

    const sudoActor = message.sudoActor || null;
    const fields = [
        {
            name: sudoActor ? 'Executed As' : 'User',
            value: `${message.author.tag}`,
            inline: true
        },
        {
            name: sudoActor ? 'Executed-As User ID' : 'User ID',
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
    ];

    if (sudoActor) {
        fields.splice(
            2,
            0,
            {
                name: 'Sudo Operator',
                value: `${sudoActor.tag}`,
                inline: true
            },
            {
                name: 'Sudo Operator ID',
                value: `${sudoActor.id}`,
                inline: true
            }
        );
    }

    const commandEmbed = new EmbedBuilder()
        .setColor(sudoActor ? '#ED4245' : '#5865F2')
        .setTitle(sudoActor ? '🛡️ Sudo Command Executed' : '⚡ Command Used')
        .addFields(fields)
        .setTimestamp();

    logChannel.send({
        embeds: [commandEmbed]
    }).catch(() => {});

}

function getSudoMentionIds(content, expression) {

    return new Set(
        [...String(content || '').matchAll(expression)]
            .map(match => match[1])
            .filter(Boolean)
    );

}

function createSudoMentions(message, commandContent) {

    const userIds = getSudoMentionIds(commandContent, /<@!?(\d{17,20})>/g);
    const roleIds = getSudoMentionIds(commandContent, /<@&(\d{17,20})>/g);
    const channelIds = getSudoMentionIds(commandContent, /<#(\d{17,20})>/g);
    const originalMentions = message.mentions;

    return {
        users: originalMentions.users.filter(user => userIds.has(user.id)),
        members: originalMentions.members.filter(member => userIds.has(member.id)),
        roles: originalMentions.roles.filter(role => roleIds.has(role.id)),
        channels: originalMentions.channels.filter(channel => channelIds.has(channel.id)),
        everyone: originalMentions.everyone,
        repliedUser: originalMentions.repliedUser,
        crosspostedChannels: originalMentions.crosspostedChannels
    };

}

function createSudoMessage(message, targetMember, commandContent) {

    const sudoMentions = createSudoMentions(message, commandContent);

    return new Proxy(message, {
        get(target, property) {

            if (property === 'author') return targetMember.user;
            if (property === 'member') return targetMember;
            if (property === 'content') return commandContent;
            if (property === 'mentions') return sudoMentions;
            if (property === 'sudoActor') return message.author;
            if (property === 'sudoActorMember') return message.member;
            if (property === 'sudoOriginalMessage') return message;
            if (property === 'sudoOriginalContent') return message.content;

            const value = Reflect.get(target, property, target);

            return typeof value === 'function'
                ? value.bind(target)
                : value;

        }
    });

}

function getSudoUsage() {
    return 'Usage: `!sudo @user/userID <command> [arguments]`\nExample: `!sudo @user !rank`';
}

async function handleSudoCommand(message, args) {

    if (message.sudoActor) {
        return message.reply('Nested sudo commands are not allowed.');
    }

    if (message.author.id !== SUDO_USER_ID) {
        return message.reply('You are not authorized to use the sudo command.');
    }

    const targetArgument = args.shift();

    if (!targetArgument) {
        return message.reply(getSudoUsage());
    }

    const targetUserId = getUserIdFromArg(targetArgument);

    if (!targetUserId) {
        return message.reply(`I could not identify that member.\n${getSudoUsage()}`);
    }

    const targetMember = await message.guild.members.fetch(targetUserId).catch(() => null);

    if (!targetMember) {
        return message.reply('That Discord user is not currently a member of this server.');
    }

    if (targetMember.user.bot) {
        return message.reply('Sudo cannot execute commands as a bot account.');
    }

    let commandContent = args.join(' ').trim();

    if (!commandContent) {
        return message.reply(getSudoUsage());
    }

    if (!commandContent.startsWith('!')) {
        commandContent = `!${commandContent}`;
    }

    const delegatedCommand = commandContent.trim().split(/\s+/)[0].toLowerCase();

    if (delegatedCommand === '!sudo') {
        return message.reply('Nested sudo commands are not allowed.');
    }

    const sudoMessage = createSudoMessage(message, targetMember, commandContent);

    try {

        await handleMessageCreate(sudoMessage);
        await message.react('✅').catch(() => {});

    } catch (error) {

        console.error(
            `Sudo command error: operator=${message.author.id} target=${targetMember.id} command=${commandContent}`,
            error
        );

        await message.react('❌').catch(() => {});
        await message.reply(`Sudo command failed: ${truncateText(error.message || String(error), 500)}`);

    }

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

        recordInviteJoin(member, usedInvite);

        const channel = member.guild.systemChannel;

        if (channel) {

            if (usedInvite?.inviter) {

                await channel.send({
                    content: `📨 ${member.user.tag} joined using invite \`${usedInvite.code}\` from ${usedInvite.inviter.tag} (${usedInvite.inviter.id})`,
                    allowedMentions: {
                        parse: []
                    }
                });

            } else {

                await channel.send(
                    `📨 ${member.user.tag} joined the server.`
                );

            }

        }

        const logChannel = getLogChannel(member.guild);

        if (logChannel) {

            const inviteText = usedInvite?.inviter
                ? `\nInvite: \`${usedInvite.code}\`\nInviter: ${usedInvite.inviter.tag} (${usedInvite.inviter.id})`
                : '';

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('📥 Member Joined')
                .setDescription(`${member.user.tag} joined the server.${inviteText}`)
                .setThumbnail(member.user.displayAvatarURL())
                .setTimestamp();

            logChannel.send({
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
            });

});

// ==========================================
// VOICE CHANNEL LOGS
// ==========================================

client.on('voiceStateUpdate', async (oldState, newState) => {

    await musicSystem.handleVoiceStateUpdate(oldState, newState).catch(error => {
        console.error('Music voice-state handler error:', error);
    });

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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
            });

    }

    if (oldState.channel && !newState.channel) {

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔇 Voice Channel Left')
            .setDescription(`${member.user.tag} left ${oldState.channel}`)
            .setTimestamp();

        return logChannel.send({
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
            });

    }

});

// ==========================================
// ADVENTURER GUILD RPG
// ==========================================

const RPG_STORE_FILE = process.env.RPG_STORE_FILE || path.join(process.cwd(), 'adventurer-guild-rpg.json');
const RPG_HUNT_COOLDOWN_MS = 30 * 1000;
const RPG_DUNGEON_COOLDOWN_MS = 10 * 60 * 1000;
const RPG_BOSS_COOLDOWN_MS = 30 * 60 * 1000;
const RPG_MAX_PARTY_SIZE = 4;
const RPG_DUNGEON_DIFFICULTIES = {
    Normal: { enemy: 1, reward: 1 },
    Hard: { enemy: 1.35, reward: 1.45 },
    Nightmare: { enemy: 1.8, reward: 2.1 },
    Mythic: { enemy: 2.45, reward: 3.1 }
};

const RPG_RANKS = ['Bronze', 'Silver', 'Gold', 'Emerald', 'Diamond', 'Platinum'];
const RPG_RANK_REQUIREMENTS = {
    Silver: 500,
    Gold: 1500,
    Emerald: 4000,
    Diamond: 8500,
    Platinum: 15000
};
const RPG_RANK_COLORS = {
    Bronze: '#B87333',
    Silver: '#C0C0C0',
    Gold: '#F1C40F',
    Emerald: '#2ECC71',
    Diamond: '#5DADE2',
    Platinum: '#E5E4E2'
};
const RPG_RARITY_COLORS = {
    Common: '#95A5A6',
    Uncommon: '#2ECC71',
    Rare: '#3498DB',
    Epic: '#9B59B6',
    Legendary: '#F1C40F',
    Mythic: '#E74C3C'
};
const RPG_STAT_KEYS = ['strength', 'intelligence', 'defense', 'health', 'agility', 'stamina'];
const RPG_STAT_LABELS = {
    strength: '⚔️ Strength',
    intelligence: '🔮 Intelligence',
    defense: '🛡️ Defense',
    health: '❤️ Health',
    agility: '💨 Agility',
    stamina: '⚡ Stamina'
};
const RPG_EMOJIS = {
    ranks: {
        Bronze: '🥉',
        Silver: '🥈',
        Gold: '🥇',
        Emerald: '💚',
        Diamond: '💎',
        Platinum: '👑'
    },
    rarities: {
        Common: '⚪',
        Uncommon: '🟢',
        Rare: '🔵',
        Epic: '🟣',
        Legendary: '🟡',
        Mythic: '🔴'
    },
    statuses: {
        Burn: '🔥',
        Poison: '☠️',
        Bleed: '🩸',
        Freeze: '❄️',
        Stun: '💫',
        Shock: '⚡',
        Curse: '🌑',
        Shielded: '🛡️',
        Haste: '💨',
        'Defense Buff': '🛡️',
        'Defense Down': '💔',
        'Strength Buff': '💪',
        'Intelligence Buff': '🧠',
        Drain: '🩸',
        Heal: '💚'
    },
    contractTypes: {
        Hunt: '⚔️',
        Gathering: '🧺',
        Boss: '👑',
        Dungeon: '🏰',
        Dragon: '🐉',
        Emergency: '🚨'
    },
    difficulties: {
        Normal: '🟢',
        Hard: '🟠',
        Nightmare: '🟣',
        Mythic: '🔴'
    },
    actions: {
        attack: '⚔️',
        skill: '✨',
        defend: '🛡️',
        potion: '🧪',
        flee: '🏃'
    },
    enemies: {
        forest_wolf: '🐺',
        slime: '🟢',
        goblin: '👺',
        cave_bat: '🦇',
        armored_goblin: '🛡️',
        giant_spider: '🕷️',
        bandit: '🥷',
        forest_troll: '🧌',
        orc_warrior: '👹',
        basilisk: '🐍',
        ogre_brute: '🪨',
        shadow_beast: '🐈‍⬛',
        wyvern: '🐲',
        necromancer_apprentice: '💀',
        lesser_dragon: '🐉',
        ancient_construct: '🗿',
        frost_giant: '🥶',
        sky_guardian: '🪽',
        demon_general: '😈',
        ancient_dragon: '🐉'
    },
    dungeons: {
        small_cave: '🕳️',
        bandit_camp: '⛺',
        ancient_ruins: '🏛️',
        haunted_catacombs: '⚰️',
        crystal_dungeon: '💎',
        sky_fortress: '🏯',
        ancient_dragon_lair: '🌋'
    },
    resources: {
        hp: '❤️', mana: '💙', stamina: '⚡', gold: '🟡', exp: '✨', reputation: '🏰',
        statPoints: '📊', skillPoints: '🌟', durability: '🔧', level: '⭐', streak: '🔥'
    },
    npcs: {
        guildMaster: '🧙‍♂️', receptionist: '🧝‍♀️', quartermaster: '🧔', blacksmith: '👨‍🏭',
        alchemist: '🧪', scout: '🦅', bard: '🎻'
    },
    places: {
        guildHall: '🏰', contractBoard: '📜', tavern: '🍗', infirmary: '🏥', forge: '🔥',
        shop: '🏪', trainingYard: '🎯', dungeonGate: '🚪', trophyHall: '🏆'
    },
    events: {
        blessing: '✨', healingWind: '🌿', fallingRocks: '🪨', opening: '🎯', rally: '📣',
        treasure: '🎁', trap: '🪤', eclipse: '🌘', storm: '⛈️', campfire: '🔥'
    }
};

const RPG_FLAVOR_LINES = {
    battleStart: [
        'The guild seal flashes as steel leaves its sheath.',
        'A dangerous presence closes in. Stay alert, adventurer.',
        'The air grows heavy—the encounter has begun.',
        'Your contract seal glows. The target is near.',
        'Dust rises from the road as your enemy takes position.',
        'A distant horn sounds. There is no turning back now.'
    ],
    victory: [
        'The Guild Master will hear of this victory.',
        'Another legend is written into the guild archives.',
        'The battlefield falls silent. Your party stands victorious.',
        'A hard-earned victory—and better loot may await ahead.',
        'The contract seal burns gold: objective progress confirmed.',
        'Nearby scouts cheer as the danger finally passes.'
    ],
    guild: [
        'Fresh contracts have been pinned to the quest board.',
        'The tavern is loud, the forge is hot, and adventure waits.',
        'Guild clerks hurry between the contract board and reward counter.',
        'Veteran adventurers trade rumors near the great hearth.',
        'The city bells echo through the guild’s stained-glass windows.',
        'A bard is already turning yesterday’s victories into song.'
    ],
    attack: [
        'A clean opening appears between the enemy’s guard.',
        'Your weapon hums with practiced precision.',
        'The strike lands with a shower of sparks.',
        'The enemy staggers as your attack breaks through.'
    ],
    skill: [
        'Arcane symbols ignite around the battlefield.',
        'Your training takes over as the technique is unleashed.',
        'Power surges through your guild crest.',
        'The battlefield flashes with concentrated energy.'
    ],
    danger: [
        'The enemy’s pressure is rising—prepare for impact.',
        'A killing intent rolls across the battlefield.',
        'The guild crest warns of a dangerous incoming attack.',
        'The air distorts around the enemy’s next move.'
    ],
    loot: [
        'Something gleams beneath the settling dust.',
        'The guild appraisal seal identifies a useful material.',
        'A rare shimmer catches your eye among the remains.',
        'Your gathering pouch grows heavier.'
    ],
    forge: [
        'The blacksmith strikes the anvil and sparks fill the workshop.',
        'Molten metal glows beneath the forge hammer.',
        'The quartermaster checks every material twice.',
        'A newly sharpened blade sings against the whetstone.'
    ],
    shop: [
        'The alchemist lines up fresh bottles behind the counter.',
        'A tiny bell rings as the guild shop opens.',
        'The quartermaster has restocked the expedition shelves.',
        'Potion vapors curl through the air in bright colors.'
    ],
    contract: [
        'The receptionist stamps the contract with the guild seal.',
        'A scout marks the target’s last known location on your map.',
        'The parchment grows warm as the objective binds to your profile.',
        'The Guild Master expects a full report upon your return.'
    ]
};


const RPG_NPC_PROFILES = {
    receptionist: {
        name: 'Lady Seraphine Vale',
        title: 'Guild Receptionist',
        emoji: RPG_EMOJIS.npcs.receptionist,
        color: '#B03A78',
        personality: 'Calm, commanding, gently protective, impeccably organized, and fond of firm praise. She expects adventurers to listen the first time.',
    },
    guildMaster: {
        name: 'Guild Master Aldric Stonecrest',
        title: 'Guild Master',
        emoji: RPG_EMOJIS.npcs.guildMaster,
        color: '#7D6608',
        personality: 'A stern but honorable veteran who values discipline, courage, preparation, and protecting weaker adventurers.',
    },
    quartermaster: {
        name: 'Bram Ironledger',
        title: 'Guild Quartermaster',
        emoji: RPG_EMOJIS.npcs.quartermaster,
        color: '#7F8C8D',
        personality: 'Gruff, practical, obsessive about inventory records, secretly kind, and armed with endless dry jokes about broken equipment.',
    },
    blacksmith: {
        name: 'Hilda Emberforge',
        title: 'Guild Blacksmith',
        emoji: RPG_EMOJIS.npcs.blacksmith,
        color: '#A04000',
        personality: 'Loud, fearless, proud of honest craftsmanship, delighted by difficult materials, and generous with tough love.',
    },
    alchemist: {
        name: 'Mirelle Moonflask',
        title: 'Guild Alchemist',
        emoji: RPG_EMOJIS.npcs.alchemist,
        color: '#27AE60',
        personality: 'Bright, eccentric, deeply knowledgeable, easily excited by strange ingredients, and only slightly too casual about bubbling liquids.',
    },
    scout: {
        name: 'Kael Windstep',
        title: 'Guild Scout',
        emoji: RPG_EMOJIS.npcs.scout,
        color: '#1F618D',
        personality: 'Quiet, observant, efficient, hard to surprise, and prone to speaking in concise warnings that sound like prophecies.',
    },
    bard: {
        name: 'Lyra Goldstring',
        title: 'Guild Bard',
        emoji: RPG_EMOJIS.npcs.bard,
        color: '#8E44AD',
        personality: 'Theatrical, charming, playful, shamelessly dramatic, and always ready to turn ordinary guild business into a heroic legend.',
    }
};

const RPG_NPC_DIALOGUE = {
    receptionist: {
        greeting: [
            'Welcome to the Adventurer Guild. Give me your name, choose your path, and let me take care of the rest.',
            'You are safe inside these walls. Outside them, you will follow procedure and return when ordered.',
            'New adventurer paperwork is simple when you cooperate. Class, signature, guild crest—one at a time.',
            'I can already tell you are eager. Patience. A good adventurer learns the rules before breaking records.',
            'Come closer. I need to see the person whose name I am about to place in the Guild ledger.',
            'The Guild accepts courage, discipline, and a willingness to listen. I suspect you can manage all three.',
            'I will register you, equip you, and point you toward your first contract. You will not rush me.',
            'A new adventure begins at my desk, dear. Let us make sure yours begins correctly.'
        ],
        ambient: [
            'I have reorganized the contract board. Again. The scouts keep returning with inconveniently accurate reports.',
            'Your file is right where I left it. Unlike several adventurers I could name.',
            'The Guild Hall runs smoothly because I refuse to allow chaos near my desk.',
            'I noticed you the moment you entered. Adventurers carrying that much dust are difficult to miss.',
            'There is always another contract, but there is only one of you. Choose accordingly.',
            'I have tea, sealed reports, and exactly enough patience for one reckless decision.',
            'The Guild Master handles speeches. I handle everything that actually keeps the hall functioning.',
            'You may linger for a moment. Even heroes are allowed to breathe between disasters.',
            'I updated your record before you reached the counter. Yes, I am that efficient.',
            'Try not to look so nervous. I only become frightening when forms are incomplete.'
        ],
        recovery: [
            'You are going to drink a healing potion before leaving this hall. That is not a suggestion.',
            'Your health is far too low for another assignment. Sit down, breathe, and recover properly.',
            'I will not stamp a contract for someone who can barely stand. Heal first, then return to me.',
            'No, dear. The heroic limp is not convincing. Use a potion.',
            'You look exhausted. I am placing your paperwork on hold until you take care of yourself.',
            'The monsters can wait. Your recovery cannot.',
            'You came back alive, which was the first instruction. Now follow the second and restore your health.',
            'I need my adventurers capable, not merely stubborn. Recover before you leave.'
        ],
        contractsWaiting: [
            'Fresh {rank} contracts are ready. Choose one, and choose with your head rather than your ego.',
            'No active assignment is recorded under your name. Come to the board and let me find you suitable work.',
            'The {rank} board has been updated. Read every objective before you ask for my seal.',
            'You are currently unassigned. I can correct that whenever you are prepared.',
            'There are contracts waiting, dear. I suggest one that challenges you without burying you.',
            'The Guild has work for someone of your rank. Stand beside me and review the options carefully.',
            'Your file looks terribly empty without an active contract.',
            'Pick a contract you can finish. I prefer successful reports to dramatic excuses.'
        ],
        contractBoard: [
            'Read the rank, location, objective, and reward before selecting anything. I will know if you skipped a line.',
            'The board is organized by danger, not by how impressive the title sounds.',
            'Choose one assignment. The Guild does not permit adventurers to collect contracts like tavern coasters.',
            'I have marked the contracts suited to your current rank. The red seals deserve extra caution.',
            'Take your time. A contract accepted carelessly still becomes your responsibility.',
            'Every parchment on this board represents someone asking the Guild for help.',
            'The rewards are listed clearly, but survival remains your responsibility.',
            'Select the work that matches your strength, supplies, and common sense.'
        ],
        contractAccepted: [
            'Your contract for {contract} is registered, stamped, and sealed. You will return safely and report directly to me.',
            'The Guild ledger now lists {contract} as your active assignment. I expect careful work.',
            'Everything is in order. {contract} belongs to you until completion or formal abandonment.',
            'Contract accepted. I have marked the route and notified the scouts to expect you.',
            'The seal is active. Complete the objective, collect proof, and come straight back.',
            'Good choice. {contract} should test you without wasting your talents.',
            'Your signature is recorded. Do not make me send a retrieval party after you.',
            'The assignment is yours, dear. Make the Guild proud and make me worry as little as possible.'
        ],
        contractDenied: [
            'I cannot register that contract: {reason} Read the requirement again.',
            'The Guild ledger rejected the request. {reason}',
            'That assignment is not available to you right now. {reason}',
            'No. I will not stamp paperwork that violates Guild rules. {reason}',
            'You may dislike the answer, but it remains no. {reason}',
            'I am protecting both you and the Guild by refusing this request. {reason}',
            'Try again after correcting the problem: {reason}',
            'Do not pout at me, adventurer. The requirement exists for a reason: {reason}'
        ],
        contractAbandoned: [
            'I removed {contract} from your record. There is no penalty, but there will be no reward.',
            'The contract for {contract} has returned to the board. Regroup before choosing another.',
            'Your withdrawal from {contract} is recorded. A wise retreat is better than a foolish grave.',
            'Abandonment approved. I would rather process one cancelled contract than one casualty report.',
            'The seal has been broken and the assignment released.',
            'You made the decision; I handled the paperwork. Learn from it and move forward.',
            '{contract} is no longer your responsibility. Take a breath before accepting new work.',
            'No shame. Just better preparation next time.'
        ],
        contractCompleted: [
            'Excellent work. I verified {contract} and released every reward to your account.',
            'Your completion report for {contract} is approved. The Guild ledger has been updated.',
            'Contract confirmed: {contract}. Gold, experience, and reputation are recorded.',
            'You completed {contract} exactly as promised. Very good.',
            'The objective is verified and the seal has turned gold. I am pleased with you.',
            'Successful return, complete report, no missing paperwork. You are becoming one of my favorites.',
            '{contract} is officially closed. The Guild recognizes your service.',
            'You did well, dear. Take the praise before I assign you something harder.'
        ],
        saleReview: [
            '{item} is {rarity}. Look at me and confirm that you truly want to sell it.',
            'Rare materials are difficult to replace. I will not finalize this exchange without your certainty.',
            'I need a direct confirmation before placing {item} into the Guild exchange.',
            'This is valuable enough that I am giving you one final chance to reconsider.',
            'Do not click carelessly. {item} may be needed for stronger equipment later.',
            'I protect adventurers from monsters and regrettable financial decisions.',
            'Confirm only if the Gold matters more than the future recipe.',
            'Think carefully, dear. Once the exchange closes, the material belongs to the Guild.'
        ],
        sale: [
            'Exchange complete. I credited {gold} Gold for {quantity}× {item}.',
            'The Guild accepted {quantity}× {item}. Your purse is {gold} Gold heavier.',
            'Sale recorded and payment issued: {gold} Gold.',
            'Everything counted, valued, and entered correctly. Your payment is ready.',
            'The exchange is complete. Try not to spend all {gold} Gold on emergency potions.',
            'I approved the sale and updated your inventory ledger.',
            '{quantity}× {item} transferred successfully. Good business.',
            'Payment delivered. Sensible adventurers invest at least some of it in survival.'
        ],
        saleCancelled: [
            'Understood. I cancelled the exchange and returned every material to your inventory.',
            'The sale is cancelled. Nothing was removed.',
            'A cautious decision. Your materials remain under your name.',
            'No problem. I would rather cancel a sale than watch you regret it.',
            'The exchange window is closed and your inventory remains untouched.',
            'Good. You took the time to reconsider instead of acting impulsively.',
            'Cancellation recorded. Keep the material until you know what you need.',
            'Your valuables are safe, dear.'
        ],
        rankUp: [
            'Congratulations, {adventurer}. Every Guild record now shows your new {rank} rank.',
            'Your promotion paperwork is complete. From this moment forward, you are registered as {rank}.',
            'The Guild seal recognizes you as a {rank} adventurer. New responsibilities begin now.',
            'You earned this promotion. Stand proudly while I update the ledger.',
            'Your rank has changed, but my expectations have risen with it.',
            'The new badge suits you. Do not let it make you careless.',
            'Promotion approved and recorded. Very good, adventurer.',
            'You have grown stronger. I have noticed.'
        ],
        missionBoard: [
            'Daily and weekly work builds the habits that grand victories depend on.',
            'Small missions are not beneath you. Consistency is how legends are made.',
            'Review the objectives carefully. Progress is tracked automatically.',
            'The Guild rewards reliability, not just dramatic boss kills.',
            'Complete every requirement before asking me to release the bundle.',
            'I have prepared your current mission report. Keep the numbers moving.',
            'A disciplined adventurer checks the mission board before leaving the hall.',
            'These tasks may look ordinary. Their rewards are not.'
        ],
        missionClaimed: [
            'Your {mission} mission report is approved. I released the full reward bundle.',
            'The Guild ledger confirms every {mission} objective. Your rewards are ready.',
            'Mission verification complete. The {mission} payment has been added to your account.',
            'Every requirement is satisfied. Good work.',
            'You completed the entire {mission} list. That level of discipline pleases me.',
            'Rewards claimed and record updated. No missing signatures this time.',
            'The Guild appreciates consistency. I appreciate competent paperwork.',
            'Your {mission} duties are complete. Enjoy the reward before the next cycle begins.'
        ],
        classRegistered: [
            'Your {className} path is registered. I expect you to learn it properly, not merely look impressive.',
            'The Guild now recognizes you as a {className}. Your starter equipment is already assigned.',
            'Class selection confirmed. This path is permanent, so make it worthy of you.',
            'Your crest has accepted the {className} discipline.',
            'A {className}, then. Good. I have adjusted your file and training recommendations.',
            'Everything is official. You may begin acting like an adventurer now.',
            'Your chosen path is sealed into the Guild record.',
            'The Guild welcomes its newest {className}.'
        ],
        profile: [
            'Your record is current. I check it more often than you think.',
            'Level, rank, equipment, contract, title—everything is exactly where it belongs.',
            'Your profile tells me what you have done. Your next choice tells me who you are becoming.',
            'I corrected three tiny ledger errors before showing this to you. You are welcome.',
            'Review your resources before accepting difficult work.',
            'Your Guild record is respectable. Keep it that way.',
            'I have highlighted the areas that need your attention.',
            'There you are in ink and seal. Try to live up to the flattering parts.'
        ],
        party: [
            'Parties are limited to four. Choose companions who listen under pressure.',
            'A balanced party survives mistakes that would defeat a lone adventurer.',
            'I will register the group once every member accepts.',
            'Do not invite someone merely because they look heroic in the tavern.',
            'Party records are shared; loot remains individual.',
            'Protect one another. I dislike processing four casualty reports at once.',
            'A proper party needs trust, supplies, and someone willing to read the map.',
            'Bring everyone back, dear. That is an order.'
        ]
    },
    guildMaster: {
        greeting: [
            'Welcome to the Guild. Your rank begins at Bronze, but your conduct begins at professional.',
            'Every hero was once an unknown name at this gate.',
            'The Guild offers opportunity, not certainty. What you become is your decision.',
            'Choose your class with purpose. Training without purpose creates dangerous fools.',
            'You stand among adventurers now. Earn the crest you have been given.',
            'Courage brought you here. Discipline will carry you farther.',
            'The Guild protects the realm because its members protect one another.',
            'Begin humbly. Grow relentlessly.'
        ],
        ambient: [
            'The Guild is strongest when its newest members are properly prepared.',
            'Reputation is not fame. It is proof that others can trust you.',
            'A quiet hall means the scouts found trouble.',
            'Every trophy in this chamber cost someone sweat, blood, or both.',
            'The rank above you is earned through consistent service.',
            'Do not envy veterans. Study them.',
            'The Guild does not demand perfection. It demands responsibility.',
            'Strength without judgment is merely a larger mistake.'
        ],
        training: [
            'Unused stat and skill points are strength left sleeping.',
            'Invest according to your class, not your impatience.',
            'A Swordsman survives through balance. A Mage survives through control.',
            'Training is the battle you choose before the battle chooses you.',
            'Strengthen your weaknesses without neglecting your purpose.',
            'Every point spent should support a plan.',
            'Power earned but not mastered becomes a liability.',
            'Return to the training yard before your next difficult contract.'
        ],
        stats: [
            'Your attributes define what your equipment and skills can accomplish.',
            'Spend carefully. There are no heroic refunds for poor judgment.',
            'Strength and Intelligence shape offense; Health and Defense keep that offense alive.',
            'Agility decides who acts first and who avoids the grave.',
            'Stamina is not glamorous until it runs out.',
            'A balanced adventurer may lack spectacle but rarely lacks options.',
            'Build for the battles ahead, not only the monsters behind you.',
            'Numbers become instincts after enough training.'
        ],
        skills: [
            'A skill is a promise between training and execution.',
            'Unlock abilities you can support with your resources.',
            'Mastery comes from choosing the correct technique, not the loudest one.',
            'Every class path has purpose. Do not scatter your focus carelessly.',
            'Powerful skills mean nothing when used at the wrong moment.',
            'Build a reliable core before pursuing rare techniques.',
            'Learn one lesson completely before chasing three more.',
            'Your best skill is the one that keeps the party moving.'
        ],
        rankUp: [
            'Your service has earned recognition. Carry the new rank with humility.',
            'The badge changes today. The responsibility changed long ago.',
            'You have proven reliable under the duties of your former rank.',
            'Stand before the Guild and accept the weight of promotion.',
            'New contracts will test more than your damage numbers.',
            'The Guild entrusts you with greater danger because you have earned greater trust.',
            'Let the rank remind you how many people now depend on your judgment.',
            'Promotion is not the end of a climb. It is permission to begin a harder one.'
        ],
        bossWarning: [
            'Boss contracts punish weak preparation. Check supplies, equipment, and party readiness.',
            'A boss does not fight like an ordinary monster. Expect phases and changing patterns.',
            'Study the enemy intent and defend when strength alone will fail.',
            'Do not confuse courage with refusing to retreat.',
            'Rare rewards attract careless adventurers. Do not become one.',
            'If the target is above your level, strengthen yourself before challenging it.',
            'Bosses expose every weakness in a party.',
            'Enter with a plan for the final phase, not merely the first.'
        ],
        dungeonWarning: [
            'A dungeon is a campaign compressed into five rooms.',
            'Conserve potions and resources before the final chamber.',
            'The party leader sets the pace; every member bears the consequences.',
            'Difficulty increases rewards and punishes mistakes equally.',
            'A dungeon victory is earned room by room.',
            'Do not spend everything on the first enemy.',
            'Expect traps, changing conditions, and an exhausted final battle.',
            'Leave pride at the entrance. Bring preparation.'
        ],
        victory: [
            'Well fought. Record what worked before celebration erases the lesson.',
            'The Guild recognizes this victory.',
            'You protected the realm and strengthened your name.',
            'Victory earned through discipline deserves respect.',
            'Stand proud, then prepare for the next duty.',
            'Your enemy fell because your training held.',
            'A completed battle is proof. A completed contract is service.',
            'Let this success build confidence, not arrogance.'
        ],
        defeat: [
            'Defeat is information purchased painfully. Use it.',
            'Recover, repair, and return with a better plan.',
            'You survived. That means the lesson is still useful.',
            'There is no shame in falling. There is shame in learning nothing.',
            'Review the enemy pattern before challenging it again.',
            'Rest is part of training when the body has reached its limit.',
            'The Guild will not abandon you for one loss.',
            'Stand again when you are ready, not merely angry.'
        ],
        party: [
            'A party is a promise to protect more than yourself.',
            'The strongest member is not always the leader the group needs.',
            'Communicate before the battle becomes loud.',
            'Share responsibility, not blame.',
            'A balanced party turns individual talent into reliable victory.',
            'The leader begins the encounter; every member completes it.',
            'Know who can heal, defend, damage, and adapt.',
            'Four adventurers moving as one can challenge legends.'
        ],
        platinum: [
            'Platinum is not permission to rest. It is a vow to stand where others cannot.',
            'The realm now measures danger against your name.',
            'A hero at the highest rank becomes an example whether they wish to or not.',
            'Ancient threats will recognize your crest.',
            'Protect the Bronze adventurers watching you.',
            'Your rank shines because countless duties lie beneath it.',
            'The Guild salutes you, Platinum hero.',
            'Now prove the title belongs to your character as much as your power.'
        ]
    },
    quartermaster: {
        greeting: [
            'New adventurer? Fine. Starter pack on the counter. Sign twice and do not lose anything.',
            'I issued your gear by class, size, and expected likelihood of misuse.',
            'The pack contains essentials. The confidence is your own problem.',
            'Inventory rules are simple: own it, track it, do not eat unidentified materials.',
            'Your starter weapon is functional. Functional is generous at Bronze.',
            'I have registered every item under your Discord ID. Very modern. Very irritating.',
            'Take the potions first. Heroes always remember them after they are bleeding.',
            'Welcome to the Guild. Please return equipment cleaner than you found it.'
        ],
        ambient: [
            'Someone submitted a wet slime core without a container. I am still upset.',
            'The inventory ledger balances, which means disaster is due any minute.',
            'We are low on antidotes and high on adventurers who ignore poison.',
            'I locked the Mythic shelf after the bard tried to borrow a glowing crown.',
            'Your bag has room. That is not permission to fill it with rocks.',
            'Monster parts belong in containers, not coat pockets.',
            'A labeled potion is worth ten mysterious bottles.',
            'Equipment durability exists even when adventurers pretend otherwise.'
        ],
        inventory: [
            'Everything you own is sorted by type, rarity, and how likely it is to stain the counter.',
            'Check quantities before leaving. Hope is not a stackable resource.',
            'Weapons, armor, potions, materials, quest items—yes, I counted all of it.',
            'Your inventory page is current as of this exact second. Try not to ruin that.',
            'Rare items are marked clearly because apparently common sense needs color coding.',
            'Use pagination instead of dumping the entire bag on my desk.',
            'Stackable materials are grouped. Broken bottles are not.',
            'If something is missing, check whether you sold it before accusing the ledger.'
        ],
        equipment: [
            'Equipped items are the ones expected to take damage on your behalf.',
            'Durability is not decorative. Repair low gear before a boss notices.',
            'Your weapon and armor should support your class rather than your fashion crisis.',
            'An empty slot is wasted potential and an invitation to injury.',
            'Set bonuses reward planning. Random pieces reward optimism.',
            'Check upgrade levels before comparing raw item names.',
            'Accessories matter more at higher ranks.',
            'If the armor squeaks, the blacksmith wants to see it.'
        ],
        equipSuccess: [
            '{item} is equipped and entered into the active loadout.',
            'Loadout updated. Try not to immediately replace it.',
            'The {slot} slot now contains {item}.',
            'Good fit. Better stats. Fewer excuses.',
            '{item} is secured and ready for field use.',
            'Equipment change recorded.',
            'That item actually suits your build. I am pleasantly surprised.',
            'Active gear updated. Durability tracking begins now.'
        ],
        useItem: [
            '{item} removed from inventory and used successfully.',
            'One {item} consumed. Quantity adjusted.',
            'The ledger says you used it, so I hope it was worth saving.',
            'Item use recorded. See? Supplies work better outside the bag.',
            '{item} did its job. Remember that before the next emergency.',
            'Inventory updated after use.',
            'One less bottle to break in your pack.',
            'Resource restored. Ledger satisfied.'
        ],
        loot: [
            'New loot detected. I have already made room in the ledger.',
            'Bring the drops to the counter before the slime dries.',
            'Rare materials go in the reinforced drawer.',
            'Individual loot means individual responsibility.',
            'Count the parts now; arguments become louder after tavern drinks.',
            'I will sort the useful materials from the suspiciously organic ones.',
            'A full bag is good. A documented full bag is better.',
            'Do not sell anything until you check the blacksmith recipes.'
        ],
        lowStock: [
            'Your potion count is embarrassing.',
            'Buy supplies before the next contract unless you enjoy avoidable suffering.',
            'The bag has more empty slots than useful items.',
            'You are one difficult fight away from regretting this inventory.',
            'Stock health restoration, class resources, and status cures.',
            'A cheap potion costs less than a failed dungeon.',
            'The alchemist has supplies. Use them.',
            'Preparation is lighter than carrying a defeated party member.'
        ],
        advice: [
            'Repair before twenty percent durability, not after zero.',
            'Keep at least three useful potions for serious content.',
            'Do not sell Rare or better materials without checking recipes.',
            'Upgrade your weapon often; enemies rarely respect sentimental equipment.',
            'Use equipment made for your class.',
            'Sort by purpose: fight, recover, craft, sell.',
            'Gold in the purse does not block damage.',
            'A spare antidote is never exciting until it becomes essential.'
        ]
    },
    blacksmith: {
        greeting: [
            'Welcome to Emberforge. Starter steel today, dragon steel someday.',
            'Bring me materials and Gold. I will turn them into confidence with edges.',
            'Every legend needs a weapon. Every weapon needs someone who stops dropping it.',
            'I know your class by the way you stare at the weapon rack.',
            'The forge does not care about rank. It only respects good materials.',
            'Your starter gear will do. For now.',
            'Stand back from the sparks unless you want a very memorable haircut.',
            'Come back after your first hunt. Monster parts make better stories when hammered flat.'
        ],
        ambient: [
            'The anvil has been louder than the tavern all morning.',
            'I can smell low durability from across the hall.',
            'Someone tried to sharpen a staff. I sent them to the alchemist.',
            'Dragon scale does not melt. It negotiates.',
            'Every dent tells me exactly how badly you blocked.',
            'The best weapon is the one maintained before battle.',
            'I named the large hammer Diplomacy.',
            'The forge fire burns brighter when rare materials enter the room.'
        ],
        forgeOpen: [
            'Recipes are ready. Pick something worthy of the materials.',
            'Craft, upgrade, repair—three ways to stop blaming your equipment.',
            'Check the missing materials before asking me to perform miracles.',
            'The forge menu is open. Try not to drool on the Legendary recipes.',
            'Your class-compatible recipes are on the board.',
            'Gold pays for fuel. Monster parts pay for possibilities.',
            'I can improve what you carry or build what you deserve next.',
            'The anvil is waiting.'
        ],
        craftSuccess: [
            '{item} is finished. Listen to that balance.',
            'The final strike lands and {item} is born.',
            'Craft complete. That is real Guild workmanship.',
            'I turned your materials into something monsters will remember.',
            '{item} came out beautifully dangerous.',
            'Sparks settle. The new gear is yours.',
            'Another fine piece leaves my forge.',
            'Crafting complete. Try to earn a few respectable scratches.'
        ],
        craftDenied: [
            'No. A forge cannot replace missing {reason}.',
            'Bring me what the recipe asks for: {reason}',
            'I can work steel, bone, crystal, and scale. I cannot work excuses.',
            'The forge is ready. Your materials are not.',
            'Come back when you have {reason}.',
            'A missing ingredient makes an unfinished weapon.',
            'I will not weaken the craft by improvising the required parts.',
            'Gather properly, then return.'
        ],
        upgradeSuccess: [
            '{item} is now +{level}. The edge feels hungrier.',
            'Upgrade complete. The weapon has more bite now.',
            'I reinforced every weak point and improved the balance.',
            'That equipment just became worthy of a harder contract.',
            'The new upgrade level is locked in.',
            'Stronger, cleaner, and less forgiving to monsters.',
            'Another layer of craftsmanship added.',
            'Take it. I want to hear what it does to the next boss.'
        ],
        repairSuccess: [
            'Everything is restored to full durability.',
            'Dents removed, straps replaced, edge corrected.',
            'Your equipment can survive being mistreated again.',
            'Repair complete. Try blocking with the shield side next time.',
            'The gear is field-ready.',
            'I restored every equipped piece.',
            'Good as new, with better stories.',
            'Full durability. No excuses left.'
        ],
        repairNotNeeded: [
            'Your gear is already at full durability. Stop looking for reasons to spend Gold.',
            'Nothing needs repair. I checked twice.',
            'The equipment is fine. Go damage it responsibly.',
            'Full durability across the loadout.',
            'I appreciate the caution, but the forge has nothing to fix.',
            'Not a scratch worth charging for.',
            'Save the Gold for upgrades.',
            'Come back after something actually hits you.'
        ],
        missingMaterials: [
            'You are missing: {reason}',
            'The recipe cannot begin until you bring {reason}.',
            'Check your inventory. The forge needs {reason}.',
            'Almost enough is still not enough.',
            'The missing materials are the difference between equipment and expensive debris.',
            'Gather {reason}, then I will light the forge.',
            'I have the skill. You need the supplies.',
            'No substitutions for this recipe.'
        ],
        lowDurability: [
            'That gear will not survive another hard battle. Bring it here.',
            'I can hear the cracks from across the hall.',
            'Below twenty percent durability is not bravery. It is negligence.',
            'Repair now, or carry the pieces back later.',
            'Your equipment is begging for the forge.',
            'One heavy attack could finish that armor.',
            'Do not enter a boss room wearing a future pile of scrap.',
            'Hand it over before the next contract.'
        ]
    },
    alchemist: {
        greeting: [
            'New adventurer! You receive one professional recommendation: carry more potions than pride.',
            'Your starter bottles are stable, labeled, and only mildly magical.',
            'Class resources differ, but everyone benefits from not dying.',
            'I prepared health potions and the correct resource restoration for your class.',
            'Welcome! Please tell me immediately if your starter potion starts singing.',
            'The Guild says I must warn you not to drink unidentified liquids.',
            'A healthy adventurer is a repeat customer.',
            'Your aura is new. Very sparkly.'
        ],
        ambient: [
            'The blue potion tastes like blueberries because the first version tasted like lightning.',
            'I am testing a stamina blend that does not make boots smoke.',
            'Antidote sales rise every spider season.',
            'The cauldron is bubbling in perfect rhythm today.',
            'A Mage asked whether mana potions count as breakfast. Technically, no.',
            'The Strength Potion and Intelligence Potion are no longer allowed to share a shelf.',
            'If you hear giggling from the cabinet, do not open it.',
            'Everything for sale has passed at least one safety test.'
        ],
        shopOpen: [
            'The shelves are stocked with health, mana, stamina, cures, and confidence in bottles.',
            'Choose by need, not by the prettiest color.',
            'Potions are cheaper than defeat and lighter than regret.',
            'Fresh stock! The corks are secure and the labels are mostly accurate.',
            'I recommend carrying recovery for health and your class resource.',
            'Status cures become valuable exactly one turn after you decide not to buy them.',
            'The shop is open. Please keep swords away from the glassware.',
            'Tell me what hurts, what is empty, or what monster you expect.'
        ],
        purchaseSuccess: [
            '{quantity}× {item} purchased. Excellent choice.',
            'Payment accepted and bottles packed securely.',
            '{item} is now in your inventory. Do not forget it during battle.',
            'Purchase complete. Your survival odds just improved.',
            'I wrapped every bottle separately.',
            'Supplies delivered. The quartermaster will pretend not to be impressed.',
            'A wise investment in future breathing.',
            'Your potion pouch looks much healthier now.'
        ],
        purchaseDenied: [
            'You need more Gold for that purchase.',
            'The potion is available. Your purse is not cooperating.',
            'I cannot accept enthusiasm as currency.',
            'Come back with enough Gold and I will keep the stock ready.',
            'No credit. The last goblin promised to pay and never returned.',
            'You are short on Gold, not charm.',
            'Save a little more before buying that quantity.',
            'The Guild shop ledger refuses the transaction.'
        ],
        potionUse: [
            '{item} activates and restores your strength.',
            'The potion works exactly as intended. How refreshing.',
            'You used {item}. See? Carrying supplies was a good idea.',
            'The bottle empties and the magic settles into place.',
            'Recovery confirmed. Please recycle the vial.',
            '{item} has been consumed successfully.',
            'Your aura stabilizes after the potion takes effect.',
            'One bottle, one problem reduced.'
        ],
        lowHealth: [
            'Your health is low enough that even the red bottles look concerned.',
            'Please use a healing potion before accepting more danger.',
            'You are injured. I have remedies and very little patience for preventable collapse.',
            'Health first. Heroics second.',
            'A potion now may prevent an infirmary visit later.',
            'Your pulse says rest. Your face says stubborn. Listen to the pulse.',
            'I recommend immediate healing.',
            'The Guild Hall is the safest place to recover.'
        ],
        lowMana: [
            'Your mana is running dry. The blue shelf exists for a reason.',
            'A Mage without mana is a scholar holding a stick.',
            'Restore mana before relying on high-cost spells.',
            'Your aura is flickering at the edges.',
            'Mana potions are stocked by size and desperation.',
            'Do not enter a dungeon with an empty reservoir.',
            'The next spell may need more power than you have left.',
            'Refill now while nothing is trying to eat you.'
        ],
        statusCure: [
            'Status effects are easier to cure before they become a personality trait.',
            'Antidotes for poison, cures for burn and freeze—read the labels.',
            'Carry the cure that matches the monsters in your contract.',
            'A single bottle can save several miserable turns.',
            'Prevention is wonderful. Correct treatment is a close second.',
            'I keep every cure near the front for urgent customers.',
            'Do not wait until the screen is flashing red.',
            'The right cure turns panic into inconvenience.'
        ]
    },
    scout: {
        greeting: [
            'New adventurer. Learn the roads before you chase the monsters.',
            'Bronze routes are marked in green. Dangerous shortcuts are marked by missing signs.',
            'I will provide locations. You provide caution.',
            'The Guild map is useful, but terrain changes faster than ink.',
            'Listen to contract details. Targets leave patterns.',
            'Your first hunts should teach observation, not merely attack timing.',
            'Travel light enough to move and prepared enough to stop.',
            'The city gate is safe. Everything beyond it negotiates.'
        ],
        ambient: [
            'Wolf tracks crossed the northern trail before dawn.',
            'The wind from the mountains carries ash today.',
            'Three merchant wagons arrived late. Something blocked the eastern road.',
            'The ravens circle the old ruins again.',
            'Goblin campfires moved closer to the river.',
            'A wyvern shadow passed over the western farms.',
            'The forest is too quiet for this hour.',
            'I found claw marks higher than my head.'
        ],
        contractBoard: [
            'I confirmed the listed locations this morning.',
            'Some targets move. The contract location is where the trail begins.',
            'Recommended levels assume proper gear and sensible decisions.',
            'Gathering contracts still involve monsters more often than adventurers expect.',
            'The map markers are accurate within one bad surprise.',
            'Check the target and location before choosing supplies.',
            'Boss routes require more preparation and fewer speeches.',
            'I added fresh notes to every active region.'
        ],
        targetLocated: [
            'Your target was last seen near {location}.',
            'Fresh signs point toward {location}.',
            'The trail begins at {location}; expect movement beyond the marker.',
            'Scouts confirmed activity around {location}.',
            'Travel to {location} and look for disturbed ground.',
            'The target is using {location} as hunting territory.',
            'I marked the safest approach to {location}.',
            'Weather may obscure tracks near {location}, so move quickly.'
        ],
        huntStart: [
            'The trail is fresh. Move before the target changes direction.',
            'Stay downwind and watch the brush.',
            'Your contract seal matches the tracks ahead.',
            'The target is close enough that the birds have stopped singing.',
            'Do not charge the first shadow you see.',
            'I found a clean approach. Use it.',
            'Weapons ready. The hunt begins now.',
            'Follow the broken branches and listen for movement.'
        ],
        dungeonEntry: [
            'The entrance is stable. What waits inside is not.',
            'Five chambers. Conserve resources for the final door.',
            'The route map ends after the first major collapse.',
            'Mark your path so retreat remains possible.',
            'Dungeon air changes before traps activate.',
            'Keep the party close through narrow passages.',
            'The final chamber carries the strongest scent of danger.',
            'Difficulty changes enemy strength, not dungeon patience.'
        ],
        bossLocated: [
            '{enemy} has been sighted near {location}.',
            'The boss territory begins where ordinary tracks disappear.',
            'I found signs of a large target and several smaller creatures fleeing it.',
            'Expect the enemy to change behavior as it weakens.',
            'The route is marked, but the final approach offers little cover.',
            'A boss knows when it is being hunted.',
            'Do not enter the territory without a retreat plan.',
            'The target is waiting, whether it knows your name or not.'
        ],
        danger: [
            'Something ahead wants you to believe the road is clear.',
            'The wind changed. Prepare for contact.',
            'Heavy tracks overlap your route.',
            'I would draw a weapon now.',
            'The silence is wrong.',
            'Movement on the ridge.',
            'The target may be circling behind you.',
            'Take cover before checking the map.'
        ],
        return: [
            'You returned before the trail cooled. Good.',
            'I saw the Guild seal flash from the ridge.',
            'The road behind you is clear for now.',
            'Your report matches the signs I found.',
            'The target will not trouble that route again.',
            'You brought back useful information with the victory.',
            'Rest before the next trail.',
            'I will update the map with what you learned.'
        ]
    },
    bard: {
        greeting: [
            'A new adventurer! Wonderful. Please choose a class with a name that fits into a chorus.',
            'Your legend begins today, and I have already reserved the dramatic key change.',
            'Bronze rank is humble, but every epic needs an opening verse.',
            'Smile for the imaginary audience.',
            'The Guild has a new hero and the tavern has a new topic.',
            'Do something brave soon; I dislike writing songs about paperwork.',
            'I predict danger, triumph, and at least one badly timed potion.',
            'Welcome! Your life now has background music.'
        ],
        ambient: [
            'The tavern insists the Forest Troll is afraid of accordions. I am willing to test this.',
            'Someone polished the Platinum trophy. Suspicious behavior.',
            'The receptionist rejected my request to rename Emergency Contracts as Surprise Adventures.',
            'The blacksmith says my sword technique is offensive to swords.',
            'The alchemist created a potion that improves singing. The Guild Master confiscated it.',
            'A Bronze adventurer claimed to see a dragon. It was a large curtain.',
            'The scout returned with no story, so I invented three.',
            'Rumor says the Ancient Dragon snores loudly enough to cause earthquakes.',
            'The quartermaster has started charging me for broken lute strings.',
            'Tonight I debut The Ballad of the Adventurer Who Actually Bought Antidotes.'
        ],
        guildRumor: [
            'Rumor says the contract board hides one assignment that only appears for the truly prepared.',
            'The tavern is betting on which adventurer reaches the next rank first.',
            'A merchant brought crystal fragments from a dungeon no map currently lists.',
            'The Guild Master smiled once this week. Witnesses remain uncertain.',
            'The receptionist keeps a private list of adventurers who follow instructions.',
            'The forge produced sparks shaped like a dragon last night.',
            'Scouts heard singing beneath the haunted catacombs.',
            'A Mythic material changed shelves while nobody was looking.'
        ],
        profile: [
            'Your profile reads like the first half of an excellent ballad.',
            'Level, rank, title, equipment—very heroic. The empty potion slots are less poetic.',
            'Your active contract gives the story direction.',
            'That title will sound wonderful when shouted by a tavern crowd.',
            'The Guild record is factual. My version will be more flattering.',
            'Your progress bar is practically dramatic tension.',
            'A stronger weapon would improve both combat and visual storytelling.',
            'Every statistic is a verse waiting for a battle.'
        ],
        achievement: [
            'Achievement unlocked! I am adding percussion.',
            'The Guild archive records the deed; the tavern will exaggerate it by sunset.',
            'A fine accomplishment deserves a louder announcement.',
            'You earned that one without bribing the historian. Impressive.',
            'Another line added to your legend.',
            'The trophy hall has fresh gossip now.',
            'Your name just became easier to rhyme with victory.',
            'Celebrate properly. The next achievement is already jealous.'
        ],
        leaderboard: [
            'Behold the server heroes, ranked by numbers and tavern arguments.',
            'The leaderboard never lies, though it occasionally ruins friendships.',
            'These names currently dominate the Guild stories.',
            'Someone below you is training. Someone above you is nervous.',
            'Rankings change whenever a determined adventurer refuses to sleep.',
            'Gold, reputation, victories—every category tells a different legend.',
            'The top three receive medals. Everyone else receives motivation.',
            'Today’s champions are tomorrow’s dramatic rivals.'
        ],
        victory: [
            'Victory! Hold the pose while I remember the heroic version.',
            'The enemy falls, the music swells, and nobody mentions the panic halfway through.',
            'A magnificent ending to this battle.',
            'That critical hit deserves its own refrain.',
            'The Guild will hear of this before you reach the gate.',
            'Loot, applause, and a tasteful amount of exaggeration.',
            'Your legend just became louder.',
            'I knew the chorus needed a victory fanfare.'
        ],
        defeat: [
            'A temporary setback. Tragic second verses make final victories sweeter.',
            'The song is not over merely because this stanza hurt.',
            'Recover, return, and give me a better ending.',
            'Even legendary heroes occasionally become educational examples.',
            'The tavern will hear the tasteful version.',
            'Defeat provides character development, unfortunately.',
            'Rest now. Revenge later. Rhyming optional.',
            'I refuse to end your ballad here.'
        ],
        titleEquip: [
            'That title has excellent rhythm.',
            'A fine choice. I will announce it with unnecessary volume.',
            'The new title suits your current chapter.',
            'Wear it proudly until you unlock something even more dramatic.',
            'The tavern crowd will remember that one.',
            'Your introduction just became longer and therefore better.',
            'Title equipped. Trumpets are pending.',
            'I approve completely, which is obviously the highest honor.'
        ],
        party: [
            'Four adventurers, one party, and at least six conflicting plans.',
            'A party makes every victory louder and every mistake witnessed.',
            'Choose companions with complementary skills and compatible dramatic timing.',
            'Shared experience, individual loot, collective blame.',
            'The best parties move like choreography.',
            'Someone should lead, someone should defend, and someone should remember potions.',
            'A group adventure gives me multiple perspectives to misquote.',
            'Invite carefully. Legends travel faster in company.'
        ]
    }
};

const rpgNpcDialogueHistory = new Map();

function getRpgNpcProfile(npcId) {
    return RPG_NPC_PROFILES[npcId] || RPG_NPC_PROFILES.receptionist;
}

function getRpgNpcContext(player = null, context = {}) {
    const activeContract = player?.activeContract || {};
    return {
        adventurer: context.adventurer || player?.username || 'adventurer',
        rank: context.rank || (player ? `${getRpgRankEmoji(player.guildRank)} ${player.guildRank}` : 'Bronze'),
        className: context.className || player?.className || 'adventurer',
        level: context.level ?? player?.level ?? 1,
        gold: context.gold ?? player?.gold ?? 0,
        contract: context.contract || activeContract.name || 'your contract',
        location: context.location || activeContract.location || 'the marked location',
        item: context.item || 'the item',
        quantity: context.quantity ?? 1,
        reason: context.reason || 'the requirements are not satisfied',
        mission: context.mission || 'guild',
        enemy: context.enemy || 'the target',
        dungeon: context.dungeon || 'the dungeon',
        title: context.title || player?.equippedTitle || 'Rookie Adventurer',
        slot: context.slot || 'equipment',
        levelValue: context.levelValue ?? context.level ?? 1,
        ...context
    };
}

function renderRpgNpcTemplate(template, player = null, context = {}) {
    const values = getRpgNpcContext(player, context);
    return String(template || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(values[key] ?? ''));
}

function pickRpgNpcTemplate(npcId, event, player = null, context = {}) {
    const dialogue = RPG_NPC_DIALOGUE[npcId] || {};
    const values = dialogue[event] || dialogue.ambient || dialogue.greeting || ['The Guild is listening.'];
    const identity = player?.userId || context.userId || player?.username || context.adventurer || 'global';
    const guildId = player?.guildId || context.guildId || 'global';
    const historyKey = `${guildId}:${identity}:${npcId}:${event}`;
    const priorState = rpgNpcDialogueHistory.get(historyKey) || {
        remaining: [],
        lastIndex: null
    };
    let remaining = Array.isArray(priorState.remaining)
        ? [...priorState.remaining]
        : [];

    if (remaining.length === 0) {
        remaining = values.map((_, index) => index);

        for (let index = remaining.length - 1; index > 0; index--) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
        }

        if (
            remaining.length > 1 &&
            priorState.lastIndex !== null &&
            remaining[remaining.length - 1] === priorState.lastIndex
        ) {
            [remaining[0], remaining[remaining.length - 1]] = [
                remaining[remaining.length - 1],
                remaining[0]
            ];
        }
    }

    const index = remaining.pop() ?? 0;
    rpgNpcDialogueHistory.set(historyKey, {
        remaining,
        lastIndex: index
    });

    return renderRpgNpcTemplate(values[index], player, context);
}

function getRpgNpcLine(npcId, event = 'ambient', player = null, context = {}) {
    const profile = getRpgNpcProfile(npcId);
    const line = pickRpgNpcTemplate(npcId, event, player, context);
    return `${profile.emoji} **${profile.name} · ${profile.title}:** “${line}”`;
}

function getRpgReceptionistDialogue(event, context = {}, player = null) {
    return getRpgNpcLine('receptionist', event, player, context);
}

function getRpgGuildAmbientLine(player) {
    const options = [
        ['receptionist', 'ambient'],
        ['guildMaster', 'ambient'],
        ['quartermaster', 'ambient'],
        ['blacksmith', 'ambient'],
        ['alchemist', 'ambient'],
        ['scout', 'ambient'],
        ['bard', 'guildRumor']
    ];
    const [npcId, event] = options[Math.floor(Math.random() * options.length)];
    return getRpgNpcLine(npcId, event, player);
}

function buildRpgNpcRosterEmbed(player) {
    const lines = Object.entries(RPG_NPC_PROFILES).map(([npcId, profile]) =>
        `${profile.emoji} **${profile.name}** · *${profile.title}*\n└ ${profile.personality}`
    );
    return new EmbedBuilder()
        .setColor('#6C3483')
        .setTitle('🏰💬 Adventurer Guild Staff')
        .setDescription(`The Guild is filled with recurring characters who react to your progress, condition, contracts, purchases, victories, and mistakes.\n\n${lines.join('\n\n')}`.slice(0, 4096))
        .addFields({
            name: '🗣️ Talk to the Staff',
            value: 'Use the dropdown below or `!guildstaff npc-name`. Dialogue rotates with anti-repeat tracking, context, and each NPC’s personality.',
            inline: false
        })
        .setFooter({ text: 'Examples: !guildstaff receptionist · !guildstaff scout · !guildstaff bard' })
        .setTimestamp();
}

function buildRpgNpcSelectRow(player) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`rpg_npc:${player.guildId}:${player.userId}`)
            .setPlaceholder('💬 Choose a Guild staff member to speak with')
            .addOptions(...Object.entries(RPG_NPC_PROFILES).map(([npcId, profile]) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(profile.name.slice(0, 100))
                    .setDescription(profile.title.slice(0, 100))
                    .setEmoji(profile.emoji)
                    .setValue(npcId)
            ))
    );
}

function buildRpgNpcConversationEmbed(player, npcId) {
    const profile = getRpgNpcProfile(npcId);
    const contextEvent = npcId === 'receptionist'
        ? (player.activeContract ? 'profile' : 'contractsWaiting')
        : npcId === 'guildMaster'
            ? (player.statPoints > 0 || player.skillPoints > 0 ? 'training' : 'ambient')
            : npcId === 'quartermaster'
                ? 'inventory'
                : npcId === 'blacksmith'
                    ? (getRpgReadiness(player).label === 'Gear at Risk' ? 'lowDurability' : 'forgeOpen')
                    : npcId === 'alchemist'
                        ? (getRpgReadiness(player).label === 'Needs Recovery' ? 'lowHealth' : 'shopOpen')
                        : npcId === 'scout'
                            ? (player.activeContract ? 'targetLocated' : 'contractBoard')
                            : 'guildRumor';
    return new EmbedBuilder()
        .setColor(profile.color)
        .setTitle(`${profile.emoji} ${profile.name}`)
        .setDescription(`*${profile.title}*\n\n**Personality:** ${profile.personality}`)
        .addFields(
            { name: '👋 Greeting', value: getRpgNpcLine(npcId, 'greeting', player), inline: false },
            { name: '💬 Current Comment', value: getRpgNpcLine(npcId, contextEvent, player, {
                location: player.activeContract?.location,
                contract: player.activeContract?.name
            }), inline: false },
            { name: '🏰 Guild Chatter', value: getRpgNpcLine(npcId, 'ambient', player), inline: false }
        )
        .setFooter({ text: 'Select the same NPC again for fresh dialogue.' })
        .setTimestamp();
}

async function handleRpgGuildStaffCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const query = args.join(' ').trim().toLowerCase();
    const npcId = query
        ? Object.keys(RPG_NPC_PROFILES).find(id => {
            const profile = RPG_NPC_PROFILES[id];
            return id === query.replace(/\s+/g, '') ||
                profile.name.toLowerCase() === query ||
                profile.title.toLowerCase() === query ||
                profile.name.toLowerCase().includes(query) ||
                profile.title.toLowerCase().includes(query);
        })
        : null;
    if (query && !npcId) {
        return message.reply(`💬 Guild staff: ${Object.values(RPG_NPC_PROFILES).map(profile => `${profile.emoji} ${profile.name}`).join(' · ')}`);
    }
    if (npcId) {
        return message.channel.send({
            embeds: [buildRpgNpcConversationEmbed(player, npcId)],
            components: [buildRpgNpcSelectRow(player), buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)]
        });
    }
    await message.channel.send({
        embeds: [buildRpgNpcRosterEmbed(player)],
        components: [buildRpgNpcSelectRow(player), buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)]
    });
}


function pickRpgFlavor(category) {
    const values = RPG_FLAVOR_LINES[category] || [];
    return values.length ? values[Math.floor(Math.random() * values.length)] : '';
}

function getRpgHealthMood(current, maximum) {
    const ratio = Math.max(0, Math.min(1, Number(current || 0) / Math.max(1, Number(maximum || 1))));
    if (ratio <= 0) return { emoji: '💀', label: 'Defeated', color: '#2C3E50' };
    if (ratio <= 0.25) return { emoji: '🆘', label: 'Critical', color: '#C0392B' };
    if (ratio <= 0.5) return { emoji: '🩹', label: 'Wounded', color: '#E67E22' };
    if (ratio <= 0.8) return { emoji: '❤️‍🩹', label: 'Ready', color: '#F1C40F' };
    return { emoji: '💖', label: 'Excellent', color: '#2ECC71' };
}

function getRpgReadiness(player) {
    const derived = getRpgDerivedStats(player);
    const health = getRpgHealthMood(player.currentHp, derived.maxHp);
    const weaponId = player.equipment?.weapon;
    const armorId = player.equipment?.armor;
    const lowestDurability = Math.min(
        weaponId ? Number(player.gearDurability?.[weaponId] ?? 100) : 100,
        armorId ? Number(player.gearDurability?.[armorId] ?? 100) : 100
    );
    if (player.activeBattle) return { emoji: '⚔️', label: 'In Battle', detail: 'An encounter is already underway.' };
    if (health.label === 'Critical') return { emoji: '🏥', label: 'Needs Recovery', detail: 'Visit your inventory and use a health potion.' };
    if (lowestDurability <= 20) return { emoji: '🔨', label: 'Gear at Risk', detail: 'Repair your equipment before a difficult fight.' };
    if (!player.activeContract) return { emoji: '📜', label: 'Awaiting Contract', detail: 'Choose an assignment from the guild board.' };
    return { emoji: '🟢', label: 'Adventure Ready', detail: 'Your contract, health, and equipment are ready.' };
}

function getRpgGuildNpcLine(player) {
    const readiness = getRpgReadiness(player);
    if (readiness.label === 'Needs Recovery') {
        return getRpgNpcLine('receptionist', 'recovery', player);
    }
    if (readiness.label === 'Gear at Risk') {
        return getRpgNpcLine('blacksmith', 'lowDurability', player);
    }
    if (!player.activeContract) {
        return getRpgNpcLine('receptionist', 'contractsWaiting', player, {
            rank: `${getRpgRankEmoji(player.guildRank)} ${player.guildRank}`
        });
    }
    if (player.statPoints > 0 || player.skillPoints > 0) {
        return getRpgNpcLine('guildMaster', 'training', player);
    }
    const activeOptions = [
        ['scout', 'targetLocated', { location: player.activeContract.location }],
        ['receptionist', 'profile', {}],
        ['quartermaster', 'advice', {}],
        ['alchemist', player.className === 'Mage' && player.currentMana < getRpgDerivedStats(player).maxMana * 0.35 ? 'lowMana' : 'ambient', {}],
        ['bard', 'guildRumor', {}]
    ];
    const [npcId, event, context] = activeOptions[Math.floor(Math.random() * activeOptions.length)];
    return getRpgNpcLine(npcId, event, player, context);
}

function getRpgActivityStreakEmoji(days) {
    if (days >= 30) return '🌋';
    if (days >= 14) return '🔥';
    if (days >= 7) return '♨️';
    if (days >= 3) return '✨';
    return '🕯️';
}

function touchRpgPlayer(player, action = 'adventure') {
    if (!player) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (player.lastActiveDate !== today) {
        player.activityStreak = player.lastActiveDate === yesterday ? Math.max(1, Number(player.activityStreak || 0) + 1) : 1;
        player.lastActiveDate = today;
    }
    player.lastRpgAction = action;
    player.lastSeenAt = new Date().toISOString();
}

function getRpgEnemyAttackNames(enemy) {
    const attacks = {
        forest_wolf: ['Savage Bite', 'Rending Claw'], slime: ['Acid Splash', 'Body Slam'], goblin: ['Rusty Slash', 'Cheap Shot'],
        cave_bat: ['Echo Screech', 'Razor Wing'], armored_goblin: ['Shield Bash', 'Jagged Spear'], giant_spider: ['Venom Fang', 'Silk Snare'],
        bandit: ['Ambush Cut', 'Smoke Bomb'], forest_troll: ['Tree-Trunk Smash', 'Ground Pound'], orc_warrior: ['War Axe', 'Battle Roar'],
        basilisk: ['Petrifying Glare', 'Venom Tail'], ogre_brute: ['Crushing Fist', 'Boulder Swing'], shadow_beast: ['Umbral Claw', 'Night Pounce'],
        wyvern: ['Talon Dive', 'Gale Breath'], necromancer_apprentice: ['Soul Bolt', 'Grave Curse'], lesser_dragon: ['Flame Breath', 'Wing Slash'],
        ancient_construct: ['Rune Slam', 'Ancient Beam'], frost_giant: ['Glacial Hammer', 'Frozen Roar'], sky_guardian: ['Sky Lance', 'Judgment Gale'],
        demon_general: ['Hellblade', 'Abyssal Command'], ancient_dragon: ['Tail Swipe', 'Fire Breath', 'Wing Gust', 'Meteor Rain']
    };
    return attacks[enemy.id] || ['Savage Strike', 'Heavy Attack'];
}

function rollRpgEnemyIntent(enemy) {
    const names = getRpgEnemyAttackNames(enemy);
    let name = names[Math.floor(Math.random() * names.length)];
    if (enemy.id === 'ancient_dragon' && enemy.phase >= 3 && Math.random() < 0.45) name = 'Meteor Rain';
    const area = ['Meteor Rain', 'Wing Gust', 'Ground Pound', 'Quake', 'Frozen Roar'].includes(name);
    const heavy = /Crushing|Heavy|Hammer|Slam|Boulder|Meteor|Fire Breath|Hellblade|Tree-Trunk/i.test(name);
    const status = /Venom|Poison|Curse|Frozen|Glare|Acid|Silk|Screech/i.test(name);
    return {
        name,
        emoji: area ? '🌪️' : status ? (enemy.status ? getRpgStatusEmoji(enemy.status) : '🌀') : heavy ? '💥' : '⚔️',
        hint: area ? 'Targets the whole party' : status ? 'May inflict a status effect' : heavy ? 'High damage—Defend recommended' : 'A direct attack is coming',
        multiplier: area ? 0.65 : heavy ? 1.25 : 1,
        area,
        statusBoost: status ? 0.35 : 0.22
    };
}

function getRpgBattleMomentum(battle) {
    const value = Math.max(0, Math.min(10, Number(battle?.momentum || 0)));
    return {
        value,
        emoji: value >= 8 ? '🔥' : value >= 5 ? '⚡' : value >= 2 ? '✨' : '🗡️',
        multiplier: 1 + value * 0.02
    };
}

function triggerRpgBattleEvent(battle) {
    if (!battle || battle.turn < 2 || battle.lastEventTurn === battle.turn || Math.random() >= 0.18) return;
    battle.lastEventTurn = battle.turn;
    const aliveIds = battle.participants.filter(userId => battle.participantStates[userId]?.hp > 0);
    if (!aliveIds.length) return;
    const event = Math.floor(Math.random() * 5);
    if (event === 0) {
        battle.enemy.statuses.push({ name: 'Defense Down', turns: 2, power: 0 });
        battle.log.push(`${RPG_EMOJIS.events.opening} **Battlefield opening!** The enemy loses footing and suffers ${getRpgStatusEmoji('Defense Down')} **Defense Down**.`);
    } else if (event === 1) {
        for (const userId of aliveIds) {
            const player = getRpgPlayer(battle.guildId, userId);
            const state = battle.participantStates[userId];
            const derived = getRpgDerivedStats(player);
            const heal = Math.max(3, Math.round(derived.maxHp * 0.06));
            state.hp = Math.min(derived.maxHp, state.hp + heal);
        }
        battle.log.push(`${RPG_EMOJIS.events.healingWind} **A healing wind crosses the field!** Every adventurer recovers a little HP.`);
    } else if (event === 2) {
        battle.momentum = Math.min(10, Number(battle.momentum || 0) + 2);
        battle.log.push(`${RPG_EMOJIS.events.rally} **Guild rally!** A distant horn raises party momentum.`);
    } else if (event === 3) {
        const damage = Math.max(2, Math.round(battle.enemy.maxHp * 0.03));
        battle.enemy.hp = Math.max(0, battle.enemy.hp - damage);
        battle.log.push(`${RPG_EMOJIS.events.fallingRocks} **The terrain shifts!** Falling debris deals **${damage}** damage to ${getRpgEnemyEmoji(battle.enemy)} ${battle.enemy.name}.`);
    } else {
        for (const userId of aliveIds) {
            const player = getRpgPlayer(battle.guildId, userId);
            const state = battle.participantStates[userId];
            const derived = getRpgDerivedStats(player);
            const resourceKey = player.className === 'Mage' ? 'mana' : 'stamina';
            const maximum = player.className === 'Mage' ? derived.maxMana : derived.maxStamina;
            state[resourceKey] = Math.min(maximum, state[resourceKey] + Math.max(4, Math.round(maximum * 0.08)));
        }
        battle.log.push(`${RPG_EMOJIS.events.blessing} **The guild crest resonates!** Party resources recover slightly.`);
    }
}

function getRpgRankEmoji(rank) {
    return RPG_EMOJIS.ranks[rank] || '🏰';
}

function getRpgRarityEmoji(rarity) {
    return RPG_EMOJIS.rarities[rarity] || '⚪';
}

function getRpgStatusEmoji(statusName) {
    return RPG_EMOJIS.statuses[statusName] || '✨';
}

function getRpgContractEmoji(type) {
    return RPG_EMOJIS.contractTypes[type] || '📜';
}

function getRpgDifficultyEmoji(difficulty) {
    return RPG_EMOJIS.difficulties[difficulty] || '⚔️';
}

function getRpgEnemyEmoji(enemyOrId) {
    const id = typeof enemyOrId === 'string' ? enemyOrId : enemyOrId?.id;
    if (RPG_EMOJIS.enemies[id]) return RPG_EMOJIS.enemies[id];
    if (enemyOrId?.dragon) return '🐉';
    if (enemyOrId?.boss) return '👑';
    return '👾';
}

function getRpgDungeonEmoji(dungeonId) {
    return RPG_EMOJIS.dungeons[dungeonId] || '🏰';
}

function getRpgSkillEmoji(skillOrId) {
    const id = String(typeof skillOrId === 'string' ? skillOrId : skillOrId?.id || '').toLowerCase();
    if (/fire|flame|meteor/.test(id)) return '🔥';
    if (/ice|freeze|blizzard|frost/.test(id)) return '❄️';
    if (/spark|lightning|storm|shock/.test(id)) return '⚡';
    if (/stone|earth|quake/.test(id)) return '🪨';
    if (/wind|tornado/.test(id)) return '🌪️';
    if (/heal|holy|radiant/.test(id)) return '✨';
    if (/shadow|curse|drain/.test(id)) return '🌑';
    if (/mana|arcane|magic|blink/.test(id)) return '🔮';
    if (/poison/.test(id)) return '☠️';
    if (/guard|armor|barrier|shield/.test(id)) return '🛡️';
    if (/dash|step|lunge|haste/.test(id)) return '💨';
    if (/fang/.test(id)) return '🐺';
    if (/crushing|splitter|titan/.test(id)) return '💥';
    return '⚔️';
}

function getRpgItemEmoji(itemId, item = RPG_ITEMS?.[itemId]) {
    const id = String(itemId || '').toLowerCase();
    const name = String(item?.name || '').toLowerCase();
    if (/health_potion/.test(id)) return '❤️';
    if (/mana_potion/.test(id)) return '💙';
    if (/stamina_potion/.test(id)) return '⚡';
    if (/antidote/.test(id)) return '💚';
    if (/burn_cure/.test(id)) return '🔥';
    if (/freeze_cure/.test(id)) return '❄️';
    if (/strength_potion/.test(id)) return '💪';
    if (/intelligence_potion/.test(id)) return '🧠';
    if (/defense_potion/.test(id)) return '🛡️';
    if (/dagger/.test(id + name)) return '🗡️';
    if (/rapier/.test(id + name)) return '🤺';
    if (/cleaver/.test(id + name)) return '🪓';
    if (/sword|blade/.test(id + name)) return '⚔️';
    if (/staff|wand/.test(id + name)) return '🪄';
    if (/leather/.test(id)) return '🥋';
    if (/iron_guard/.test(id)) return '🛡️';
    if (/wolf_hunter/.test(id)) return '🐺';
    if (/goblin_slayer/.test(id)) return '👺';
    if (/orc_warrior/.test(id)) return '👹';
    if (/crystal_mage/.test(id)) return '💎';
    if (/shadow_hunter/.test(id)) return '🌑';
    if (/wyvern_scale/.test(id)) return '🐲';
    if (/dragon_scale_set/.test(id)) return '🐉';
    if (/platinum_hero/.test(id)) return '👑';
    const exact = {
        wolf_fang: '🦷', wolf_pelt: '🐺', slime_core: '🟢', goblin_ear: '👂', goblin_dagger: '🗡️',
        spider_fang: '🕷️', spider_silk: '🕸️', orc_tusk: '🦷', troll_bone: '🦴', ogre_horn: '🦏',
        basilisk_scale: '🐍', shadow_core: '🌑', wyvern_claw: '🐲', dragon_scale: '🐉', dragon_fang: '🦷',
        ancient_dragon_heart: '❤️‍🔥', ancient_core: '🔷', special_token: '🎟️'
    };
    return exact[id] || ({ weapon: '⚔️', armor: '🛡️', accessory: '💍', potion: '🧪', part: '🦴', material: '🧱' }[item?.type] || '📦');
}

function formatRpgItem(itemId, quantity = null) {
    const item = RPG_ITEMS[itemId];
    if (!item) return `📦 ${itemId}`;
    const quantityText = quantity === null ? '' : ` ×${quantity}`;
    return `${getRpgItemEmoji(itemId, item)} **${item.name}**${quantityText}`;
}

function buildRpgProgressBar(current, maximum, width = 12) {
    const max = Math.max(1, Number(maximum) || 1);
    const ratio = Math.max(0, Math.min(1, (Number(current) || 0) / max));
    const filled = Math.round(ratio * width);
    return `${'▰'.repeat(filled)}${'▱'.repeat(width - filled)}`;
}

function formatRpgStatusList(statuses = []) {
    return statuses.length
        ? statuses.map(status => `${getRpgStatusEmoji(status.name)} **${status.name}** · ${status.turns} turn${status.turns === 1 ? '' : 's'}`).join('\n')
        : '✨ None';
}

function getRpgContextTip(player) {
    if (!player.activeContract) return '📜 Tip: Visit !contracts and accept a contract before hunting.';
    if (player.currentHp < getRpgDerivedStats(player).maxHp * 0.4) return '❤️ Tip: Recover with !inventory use small_health_potion before your next fight.';
    if (player.statPoints > 0) return `📊 Tip: You have ${player.statPoints} unspent stat point(s). Use !stats.`;
    if (player.skillPoints > 0) return `✨ Tip: You have ${player.skillPoints} unspent skill point(s). Use !skills.`;
    return '🏰 Tip: Daily missions, parties, crafting, and rank promotions all accelerate your adventure.';
}

const RPG_CLASS_DATA = {
    Swordsman: {
        emoji: '⚔️',
        resource: 'stamina',
        paths: ['Daggers', 'Rapiers', 'One-handed Swords', 'Heavy Two-handed Swords'],
        baseStats: { strength: 6, intelligence: 1, defense: 5, health: 6, agility: 4, stamina: 6 },
        starterWeapon: 'iron_dagger',
        skills: [
            { id: 'quick_slash', name: 'Quick Slash', level: 1, cost: 8, power: 1.35 },
            { id: 'backstep', name: 'Backstep', level: 2, cost: 7, power: 0.75, effect: 'Haste' },
            { id: 'poison_edge', name: 'Poison Edge', level: 3, cost: 10, power: 1.15, effect: 'Poison' },
            { id: 'shadow_dash', name: 'Shadow Dash', level: 5, cost: 13, power: 1.6 },
            { id: 'twin_fang_combo', name: 'Twin Fang Combo', level: 7, cost: 16, power: 1.9, effect: 'Bleed' },
            { id: 'piercing_thrust', name: 'Piercing Thrust', level: 9, cost: 18, power: 2.1 },
            { id: 'counter_step', name: 'Counter Step', level: 11, cost: 15, power: 1.4, effect: 'Defense Buff' },
            { id: 'weak_point_strike', name: 'Weak Point Strike', level: 13, cost: 20, power: 2.4 },
            { id: 'flash_lunge', name: 'Flash Lunge', level: 15, cost: 22, power: 2.6, effect: 'Stun' },
            { id: 'cross_slash', name: 'Cross Slash', level: 18, cost: 24, power: 2.9, effect: 'Bleed' },
            { id: 'guard_break', name: 'Guard Break', level: 21, cost: 24, power: 2.5, effect: 'Defense Down' },
            { id: 'rising_blade', name: 'Rising Blade', level: 24, cost: 27, power: 3.2 },
            { id: 'blade_storm', name: 'Blade Storm', level: 28, cost: 32, power: 3.8, effect: 'Bleed' },
            { id: 'crushing_swing', name: 'Crushing Swing', level: 32, cost: 34, power: 4.1 },
            { id: 'earth_splitter', name: 'Earth Splitter', level: 36, cost: 38, power: 4.6, effect: 'Stun' },
            { id: 'armor_break', name: 'Armor Break', level: 41, cost: 40, power: 4.8, effect: 'Defense Down' },
            { id: 'titan_cleave', name: 'Titan Cleave', level: 48, cost: 48, power: 5.8, effect: 'Bleed' }
        ]
    },
    Mage: {
        emoji: '🔮',
        resource: 'mana',
        paths: ['Fire', 'Ice', 'Lightning', 'Earth', 'Wind', 'Light', 'Dark', 'Arcane'],
        baseStats: { strength: 1, intelligence: 7, defense: 3, health: 4, agility: 3, stamina: 2 },
        starterWeapon: 'apprentice_staff',
        skills: [
            { id: 'fireball', name: 'Fireball', level: 1, cost: 9, power: 1.4, effect: 'Burn' },
            { id: 'flame_burst', name: 'Flame Burst', level: 3, cost: 13, power: 1.8, effect: 'Burn' },
            { id: 'meteor_strike', name: 'Meteor Strike', level: 25, cost: 40, power: 4.7, effect: 'Burn' },
            { id: 'ice_shard', name: 'Ice Shard', level: 2, cost: 8, power: 1.25 },
            { id: 'freeze', name: 'Freeze', level: 7, cost: 16, power: 1.2, effect: 'Freeze' },
            { id: 'blizzard', name: 'Blizzard', level: 28, cost: 42, power: 4.4, effect: 'Freeze' },
            { id: 'spark_bolt', name: 'Spark Bolt', level: 4, cost: 11, power: 1.55, effect: 'Shock' },
            { id: 'chain_lightning', name: 'Chain Lightning', level: 13, cost: 24, power: 2.7, effect: 'Shock' },
            { id: 'storm_call', name: 'Storm Call', level: 34, cost: 46, power: 4.9, effect: 'Stun' },
            { id: 'stone_spike', name: 'Stone Spike', level: 5, cost: 12, power: 1.65 },
            { id: 'earth_armor', name: 'Earth Armor', level: 10, cost: 18, power: 0.6, effect: 'Defense Buff' },
            { id: 'quake', name: 'Quake', level: 31, cost: 44, power: 4.5, effect: 'Stun' },
            { id: 'wind_blade', name: 'Wind Blade', level: 6, cost: 13, power: 1.75, effect: 'Haste' },
            { id: 'tornado', name: 'Tornado', level: 30, cost: 43, power: 4.3 },
            { id: 'heal', name: 'Heal', level: 8, cost: 18, power: 0, effect: 'Heal' },
            { id: 'holy_shield', name: 'Holy Shield', level: 12, cost: 22, power: 0, effect: 'Shielded' },
            { id: 'radiant_beam', name: 'Radiant Beam', level: 20, cost: 31, power: 3.4 },
            { id: 'shadow_bolt', name: 'Shadow Bolt', level: 9, cost: 17, power: 2.0, effect: 'Curse' },
            { id: 'curse', name: 'Curse', level: 16, cost: 26, power: 1.8, effect: 'Curse' },
            { id: 'life_drain', name: 'Life Drain', level: 23, cost: 34, power: 3.0, effect: 'Drain' },
            { id: 'mana_burst', name: 'Mana Burst', level: 14, cost: 25, power: 2.8 },
            { id: 'blink', name: 'Blink', level: 18, cost: 21, power: 0.8, effect: 'Haste' },
            { id: 'magic_barrier', name: 'Magic Barrier', level: 22, cost: 30, power: 0, effect: 'Shielded' },
            { id: 'arcane_nova', name: 'Arcane Nova', level: 45, cost: 55, power: 6.0, effect: 'Shock' }
        ]
    }
};

const RPG_ITEMS = {
    small_health_potion: { name: 'Small Health Potion', type: 'potion', rarity: 'Common', price: 35, sell: 12, heal: 45 },
    medium_health_potion: { name: 'Medium Health Potion', type: 'potion', rarity: 'Uncommon', price: 85, sell: 30, heal: 100 },
    large_health_potion: { name: 'Large Health Potion', type: 'potion', rarity: 'Rare', price: 175, sell: 65, heal: 225 },
    small_mana_potion: { name: 'Small Mana Potion', type: 'potion', rarity: 'Common', price: 35, sell: 12, mana: 40 },
    medium_mana_potion: { name: 'Medium Mana Potion', type: 'potion', rarity: 'Uncommon', price: 85, sell: 30, mana: 90 },
    large_mana_potion: { name: 'Large Mana Potion', type: 'potion', rarity: 'Rare', price: 175, sell: 65, mana: 200 },
    stamina_potion: { name: 'Stamina Potion', type: 'potion', rarity: 'Uncommon', price: 70, sell: 25, stamina: 80 },
    antidote: { name: 'Antidote', type: 'potion', rarity: 'Common', price: 40, sell: 14, cures: ['Poison'] },
    burn_cure: { name: 'Burn Cure', type: 'potion', rarity: 'Common', price: 40, sell: 14, cures: ['Burn'] },
    freeze_cure: { name: 'Freeze Cure', type: 'potion', rarity: 'Common', price: 40, sell: 14, cures: ['Freeze'] },
    strength_potion: { name: 'Strength Potion', type: 'potion', rarity: 'Rare', price: 150, sell: 55, buff: 'Strength Buff' },
    intelligence_potion: { name: 'Intelligence Potion', type: 'potion', rarity: 'Rare', price: 150, sell: 55, buff: 'Intelligence Buff' },
    defense_potion: { name: 'Defense Potion', type: 'potion', rarity: 'Rare', price: 150, sell: 55, buff: 'Defense Buff' },

    iron_dagger: { name: 'Iron Dagger', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Common', attack: 5, price: 90, sell: 25 },
    wolf_fang_daggers: { name: 'Wolf Fang Daggers', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Uncommon', attack: 10, price: 240, sell: 80 },
    steel_rapier: { name: 'Steel Rapier', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Rare', attack: 17, price: 600, sell: 210 },
    knight_sword: { name: 'Knight Sword', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Rare', attack: 24, price: 1000, sell: 350 },
    orc_cleaver: { name: 'Orc Cleaver', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Epic', attack: 34, price: 1800, sell: 650 },
    ogre_greatsword: { name: 'Ogre Greatsword', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Epic', attack: 47, price: 3200, sell: 1150 },
    wyvern_blade: { name: 'Wyvern Blade', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Legendary', attack: 65, price: 6500, sell: 2400 },
    dragon_slayer_greatsword: { name: 'Dragon Slayer Greatsword', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Legendary', attack: 88, price: 11000, sell: 4200 },
    ancient_platinum_sword: { name: 'Ancient Platinum Sword', type: 'weapon', class: 'Swordsman', slot: 'weapon', rarity: 'Mythic', attack: 120, price: 22000, sell: 8500 },

    apprentice_staff: { name: 'Apprentice Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Common', attack: 5, price: 90, sell: 25 },
    slime_core_wand: { name: 'Slime Core Wand', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Uncommon', attack: 10, price: 240, sell: 80 },
    crystal_staff: { name: 'Crystal Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Rare', attack: 17, price: 600, sell: 210 },
    fire_mage_staff: { name: 'Fire Mage Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Rare', attack: 24, price: 1000, sell: 350 },
    frost_mage_staff: { name: 'Frost Mage Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Epic', attack: 34, price: 1800, sell: 650 },
    shadow_staff: { name: 'Shadow Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Epic', attack: 47, price: 3200, sell: 1150 },
    wyvern_bone_staff: { name: 'Wyvern Bone Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Legendary', attack: 65, price: 6500, sell: 2400 },
    dragon_heart_staff: { name: 'Dragon Heart Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Legendary', attack: 88, price: 11000, sell: 4200 },
    ancient_arcane_staff: { name: 'Ancient Arcane Staff', type: 'weapon', class: 'Mage', slot: 'weapon', rarity: 'Mythic', attack: 120, price: 22000, sell: 8500 },

    leather_adventurer_set: { name: 'Leather Adventurer Set', type: 'armor', slot: 'armor', rarity: 'Common', defense: 4, hp: 15, price: 120, sell: 35 },
    iron_guard_set: { name: 'Iron Guard Set', type: 'armor', slot: 'armor', rarity: 'Uncommon', defense: 9, hp: 30, price: 350, sell: 115 },
    wolf_hunter_set: { name: 'Wolf Hunter Set', type: 'armor', slot: 'armor', rarity: 'Uncommon', defense: 12, hp: 40, agility: 2, price: 550, sell: 180 },
    goblin_slayer_set: { name: 'Goblin Slayer Set', type: 'armor', slot: 'armor', rarity: 'Rare', defense: 18, hp: 55, strength: 2, price: 950, sell: 330 },
    orc_warrior_set: { name: 'Orc Warrior Set', type: 'armor', slot: 'armor', rarity: 'Epic', defense: 27, hp: 85, strength: 4, price: 1900, sell: 680 },
    crystal_mage_set: { name: 'Crystal Mage Set', type: 'armor', slot: 'armor', rarity: 'Rare', defense: 16, hp: 45, intelligence: 4, price: 1200, sell: 420 },
    shadow_hunter_set: { name: 'Shadow Hunter Set', type: 'armor', slot: 'armor', rarity: 'Epic', defense: 31, hp: 95, agility: 5, price: 2600, sell: 930 },
    wyvern_scale_set: { name: 'Wyvern Scale Set', type: 'armor', slot: 'armor', rarity: 'Legendary', defense: 43, hp: 145, price: 5200, sell: 1900 },
    dragon_scale_set: { name: 'Dragon Scale Set', type: 'armor', slot: 'armor', rarity: 'Legendary', defense: 58, hp: 210, price: 9800, sell: 3600 },
    platinum_hero_set: { name: 'Platinum Hero Set', type: 'armor', slot: 'armor', rarity: 'Mythic', defense: 82, hp: 320, strength: 7, intelligence: 7, price: 20000, sell: 7800 },

    wolf_fang: { name: 'Wolf Fang', type: 'part', rarity: 'Common', sell: 8 },
    wolf_pelt: { name: 'Wolf Pelt', type: 'part', rarity: 'Common', sell: 10 },
    slime_core: { name: 'Slime Core', type: 'part', rarity: 'Common', sell: 9 },
    goblin_ear: { name: 'Goblin Ear', type: 'part', rarity: 'Common', sell: 12 },
    goblin_dagger: { name: 'Goblin Dagger', type: 'part', rarity: 'Uncommon', sell: 30 },
    spider_fang: { name: 'Spider Fang', type: 'part', rarity: 'Common', sell: 14 },
    spider_silk: { name: 'Spider Silk', type: 'part', rarity: 'Uncommon', sell: 35 },
    orc_tusk: { name: 'Orc Tusk', type: 'part', rarity: 'Uncommon', sell: 42 },
    troll_bone: { name: 'Troll Bone', type: 'part', rarity: 'Rare', sell: 110 },
    ogre_horn: { name: 'Ogre Horn', type: 'part', rarity: 'Rare', sell: 140 },
    basilisk_scale: { name: 'Basilisk Scale', type: 'part', rarity: 'Rare', sell: 165 },
    shadow_core: { name: 'Shadow Core', type: 'part', rarity: 'Epic', sell: 320 },
    wyvern_claw: { name: 'Wyvern Claw', type: 'part', rarity: 'Epic', sell: 380 },
    dragon_scale: { name: 'Dragon Scale', type: 'part', rarity: 'Legendary', sell: 800 },
    dragon_fang: { name: 'Dragon Fang', type: 'part', rarity: 'Legendary', sell: 950 },
    ancient_dragon_heart: { name: 'Ancient Dragon Heart', type: 'part', rarity: 'Mythic', sell: 5000 },
    ancient_core: { name: 'Ancient Core', type: 'part', rarity: 'Legendary', sell: 750 },
    special_token: { name: 'Guild Token', type: 'material', rarity: 'Rare', sell: 100 }
};

const RPG_ENEMIES = {
    forest_wolf: { name: 'Forest Wolf', rank: 'Bronze', hp: 52, damage: 9, exp: 24, gold: 14, drops: [['wolf_fang', 0.75], ['wolf_pelt', 0.45]] },
    slime: { name: 'Slime', rank: 'Bronze', hp: 44, damage: 7, exp: 20, gold: 12, drops: [['slime_core', 0.8]] },
    goblin: { name: 'Goblin Scout', rank: 'Bronze', hp: 60, damage: 10, exp: 28, gold: 17, drops: [['goblin_ear', 0.8], ['goblin_dagger', 0.2]] },
    cave_bat: { name: 'Cave Bat', rank: 'Bronze', hp: 48, damage: 8, exp: 22, gold: 13, drops: [['wolf_pelt', 0.25]] },
    armored_goblin: { name: 'Armored Goblin', rank: 'Silver', hp: 105, damage: 16, exp: 48, gold: 32, drops: [['goblin_ear', 0.8], ['goblin_dagger', 0.4]] },
    giant_spider: { name: 'Giant Spider', rank: 'Silver', hp: 96, damage: 17, exp: 52, gold: 34, drops: [['spider_fang', 0.8], ['spider_silk', 0.5]], status: 'Poison' },
    bandit: { name: 'Bandit Raider', rank: 'Silver', hp: 115, damage: 18, exp: 56, gold: 38, drops: [['goblin_dagger', 0.35]] },
    forest_troll: { name: 'Forest Troll', rank: 'Silver', hp: 420, damage: 28, exp: 260, gold: 190, drops: [['troll_bone', 0.8]], boss: true },
    orc_warrior: { name: 'Orc Warrior', rank: 'Gold', hp: 175, damage: 25, exp: 86, gold: 58, drops: [['orc_tusk', 0.8]] },
    basilisk: { name: 'Basilisk', rank: 'Gold', hp: 195, damage: 28, exp: 96, gold: 66, drops: [['basilisk_scale', 0.7]], status: 'Stun' },
    ogre_brute: { name: 'Ogre Brute', rank: 'Gold', hp: 720, damage: 42, exp: 520, gold: 380, drops: [['ogre_horn', 0.85]], boss: true },
    shadow_beast: { name: 'Shadow Beast', rank: 'Emerald', hp: 285, damage: 38, exp: 145, gold: 105, drops: [['shadow_core', 0.55]], status: 'Curse' },
    wyvern: { name: 'Wyvern', rank: 'Emerald', hp: 340, damage: 43, exp: 170, gold: 125, drops: [['wyvern_claw', 0.65]] },
    necromancer_apprentice: { name: 'Necromancer Apprentice', rank: 'Emerald', hp: 1080, damage: 62, exp: 880, gold: 720, drops: [['shadow_core', 0.9]], boss: true, status: 'Curse' },
    lesser_dragon: { name: 'Lesser Dragon', rank: 'Diamond', hp: 520, damage: 62, exp: 260, gold: 210, drops: [['dragon_scale', 0.35], ['dragon_fang', 0.2]], status: 'Burn' },
    ancient_construct: { name: 'Ancient Construct', rank: 'Diamond', hp: 480, damage: 58, exp: 245, gold: 195, drops: [['ancient_core', 0.45]] },
    frost_giant: { name: 'Frost Giant', rank: 'Diamond', hp: 1750, damage: 88, exp: 1450, gold: 1250, drops: [['ancient_core', 0.85]], boss: true, status: 'Freeze' },
    sky_guardian: { name: 'Sky Fortress Guardian', rank: 'Platinum', hp: 760, damage: 90, exp: 390, gold: 350, drops: [['ancient_core', 0.5]] },
    demon_general: { name: "Demon Lord's General", rank: 'Platinum', hp: 2900, damage: 125, exp: 2600, gold: 2400, drops: [['ancient_core', 1]], boss: true, status: 'Curse' },
    ancient_dragon: { name: 'Ancient Dragon', rank: 'Platinum', hp: 5000, damage: 155, exp: 5000, gold: 5000, drops: [['ancient_dragon_heart', 1], ['dragon_scale', 1], ['dragon_fang', 1]], boss: true, dragon: true, status: 'Burn' }
};

const RPG_CONTRACTS = {
    Bronze: [
        { id: 'bronze_wolves', name: 'Hunt 8 Forest Wolves', type: 'Hunt', target: 'forest_wolf', amount: 8, location: 'Whispering Forest', level: 1, gold: 140, exp: 180, rep: 110 },
        { id: 'bronze_slimes', name: 'Defeat 6 Slimes', type: 'Hunt', target: 'slime', amount: 6, location: 'Greenfield Marsh', level: 1, gold: 115, exp: 145, rep: 90 },
        { id: 'bronze_goblin_ears', name: 'Collect 5 Goblin Ears', type: 'Gathering', target: 'goblin', drop: 'goblin_ear', amount: 5, location: 'Old Trade Road', level: 2, gold: 170, exp: 200, rep: 125 },
        { id: 'bronze_cave', name: 'Clear the Small Cave', type: 'Dungeon', dungeon: 'small_cave', amount: 1, location: 'Foothill Caverns', level: 3, gold: 250, exp: 310, rep: 175 }
    ],
    Silver: [
        { id: 'silver_goblins', name: 'Hunt 10 Armored Goblins', type: 'Hunt', target: 'armored_goblin', amount: 10, location: 'Ironwood Pass', level: 7, gold: 390, exp: 520, rep: 220 },
        { id: 'silver_troll', name: 'Defeat the Forest Troll', type: 'Boss', target: 'forest_troll', amount: 1, location: 'Trollwood Hollow', level: 10, gold: 650, exp: 760, rep: 350 },
        { id: 'silver_spider', name: 'Collect 6 Spider Fangs', type: 'Gathering', target: 'giant_spider', drop: 'spider_fang', amount: 6, location: 'Silken Ravine', level: 8, gold: 440, exp: 570, rep: 245 },
        { id: 'silver_bandit', name: 'Clear the Bandit Camp', type: 'Dungeon', dungeon: 'bandit_camp', amount: 1, location: 'Red Banner Camp', level: 11, gold: 750, exp: 900, rep: 390 }
    ],
    Gold: [
        { id: 'gold_orcs', name: 'Hunt 12 Orc Warriors', type: 'Hunt', target: 'orc_warrior', amount: 12, location: 'Ashen Frontier', level: 16, gold: 950, exp: 1250, rep: 420 },
        { id: 'gold_ogre', name: 'Defeat the Ogre Brute', type: 'Boss', target: 'ogre_brute', amount: 1, location: 'Broken Hills', level: 19, gold: 1400, exp: 1700, rep: 650 },
        { id: 'gold_scales', name: 'Collect 8 Basilisk Scales', type: 'Gathering', target: 'basilisk', drop: 'basilisk_scale', amount: 8, location: 'Petrified Basin', level: 18, gold: 1150, exp: 1450, rep: 500 },
        { id: 'gold_ruins', name: 'Clear the Ancient Ruins', type: 'Dungeon', dungeon: 'ancient_ruins', amount: 1, location: 'Forgotten Plateau', level: 21, gold: 1800, exp: 2200, rep: 760 }
    ],
    Emerald: [
        { id: 'emerald_shadows', name: 'Hunt 10 Shadow Beasts', type: 'Hunt', target: 'shadow_beast', amount: 10, location: 'Umbral Forest', level: 27, gold: 2100, exp: 2750, rep: 800 },
        { id: 'emerald_necromancer', name: 'Defeat the Necromancer Apprentice', type: 'Boss', target: 'necromancer_apprentice', amount: 1, location: 'Bone Spire', level: 31, gold: 3000, exp: 3900, rep: 1200 },
        { id: 'emerald_claws', name: 'Collect 6 Wyvern Claws', type: 'Gathering', target: 'wyvern', drop: 'wyvern_claw', amount: 6, location: 'Storm Cliffs', level: 29, gold: 2500, exp: 3200, rep: 930 },
        { id: 'emerald_catacombs', name: 'Clear the Haunted Catacombs', type: 'Dungeon', dungeon: 'haunted_catacombs', amount: 1, location: 'Gravewind Vale', level: 33, gold: 3900, exp: 5000, rep: 1450 }
    ],
    Diamond: [
        { id: 'diamond_dragons', name: 'Hunt 8 Lesser Dragons', type: 'Hunt', target: 'lesser_dragon', amount: 8, location: 'Dragonfall Range', level: 38, gold: 4800, exp: 6200, rep: 1500 },
        { id: 'diamond_giant', name: 'Defeat the Frost Giant', type: 'Boss', target: 'frost_giant', amount: 1, location: 'Frozen Crown', level: 42, gold: 7000, exp: 8800, rep: 2100 },
        { id: 'diamond_cores', name: 'Collect 5 Ancient Cores', type: 'Gathering', target: 'ancient_construct', drop: 'ancient_core', amount: 5, location: 'Crystal Expanse', level: 40, gold: 5700, exp: 7200, rep: 1750 },
        { id: 'diamond_crystal', name: 'Clear the Crystal Dungeon', type: 'Dungeon', dungeon: 'crystal_dungeon', amount: 1, location: 'Prismatic Depths', level: 44, gold: 8500, exp: 10500, rep: 2500 }
    ],
    Platinum: [
        { id: 'platinum_dragon', name: 'Defeat the Ancient Dragon', type: 'Dragon', target: 'ancient_dragon', amount: 1, location: 'Ancient Dragon Lair', level: 50, gold: 15000, exp: 18000, rep: 3500 },
        { id: 'platinum_general', name: "Defeat the Demon Lord's General", type: 'Boss', target: 'demon_general', amount: 1, location: 'Demon March', level: 52, gold: 12500, exp: 15500, rep: 3000 },
        { id: 'platinum_fortress', name: 'Clear the Sky Fortress', type: 'Dungeon', dungeon: 'sky_fortress', amount: 1, location: 'Cloudbreaker Heights', level: 54, gold: 16000, exp: 19500, rep: 3800 },
        { id: 'platinum_raid', name: 'Complete a Mythic Emergency Raid', type: 'Emergency', target: 'ancient_dragon', amount: 1, location: 'Guild Emergency Front', level: 56, gold: 20000, exp: 24000, rep: 4500 }
    ]
};

const RPG_DUNGEONS = {
    small_cave: { name: 'Small Cave', rank: 'Bronze', level: 3, enemies: ['cave_bat', 'slime', 'goblin', 'armored_goblin', 'forest_troll'], reward: { gold: 260, exp: 340 } },
    bandit_camp: { name: 'Bandit Camp', rank: 'Silver', level: 11, enemies: ['bandit', 'armored_goblin', 'bandit', 'forest_troll', 'ogre_brute'], reward: { gold: 800, exp: 980 } },
    ancient_ruins: { name: 'Ancient Ruins', rank: 'Gold', level: 21, enemies: ['orc_warrior', 'basilisk', 'orc_warrior', 'ogre_brute', 'necromancer_apprentice'], reward: { gold: 1900, exp: 2350 } },
    haunted_catacombs: { name: 'Haunted Catacombs', rank: 'Emerald', level: 33, enemies: ['shadow_beast', 'shadow_beast', 'wyvern', 'necromancer_apprentice', 'frost_giant'], reward: { gold: 4100, exp: 5200 } },
    crystal_dungeon: { name: 'Crystal Dungeon', rank: 'Diamond', level: 44, enemies: ['ancient_construct', 'lesser_dragon', 'ancient_construct', 'frost_giant', 'demon_general'], reward: { gold: 9000, exp: 11200 } },
    sky_fortress: { name: 'Sky Fortress', rank: 'Platinum', level: 54, enemies: ['sky_guardian', 'lesser_dragon', 'sky_guardian', 'demon_general', 'ancient_dragon'], reward: { gold: 17000, exp: 20500 } },
    ancient_dragon_lair: { name: 'Ancient Dragon Lair', rank: 'Platinum', level: 58, enemies: ['lesser_dragon', 'sky_guardian', 'lesser_dragon', 'demon_general', 'ancient_dragon'], reward: { gold: 22000, exp: 27000 } }
};

const RPG_RECIPES = {
    wolf_fang_daggers: { gold: 120, materials: { wolf_fang: 5, wolf_pelt: 2 } },
    slime_core_wand: { gold: 120, materials: { slime_core: 6 } },
    steel_rapier: { gold: 350, materials: { goblin_dagger: 3, spider_silk: 2 } },
    crystal_staff: { gold: 350, materials: { slime_core: 8, spider_silk: 3 } },
    orc_cleaver: { gold: 900, materials: { orc_tusk: 8, troll_bone: 2 } },
    frost_mage_staff: { gold: 900, materials: { basilisk_scale: 5, troll_bone: 2 } },
    wyvern_blade: { gold: 3200, materials: { wyvern_claw: 8, dragon_scale: 2 } },
    wyvern_bone_staff: { gold: 3200, materials: { wyvern_claw: 8, shadow_core: 4 } },
    dragon_slayer_greatsword: { gold: 7200, materials: { dragon_scale: 8, dragon_fang: 5 } },
    dragon_heart_staff: { gold: 7200, materials: { dragon_scale: 8, dragon_fang: 5 } },
    ancient_platinum_sword: { gold: 15000, materials: { ancient_dragon_heart: 1, ancient_core: 8 } },
    ancient_arcane_staff: { gold: 15000, materials: { ancient_dragon_heart: 1, ancient_core: 8 } },
    iron_guard_set: { gold: 180, materials: { wolf_pelt: 4, goblin_ear: 4 } },
    wolf_hunter_set: { gold: 300, materials: { wolf_pelt: 8, wolf_fang: 5 } },
    goblin_slayer_set: { gold: 550, materials: { goblin_ear: 10, goblin_dagger: 4 } },
    orc_warrior_set: { gold: 1100, materials: { orc_tusk: 10, ogre_horn: 2 } },
    crystal_mage_set: { gold: 900, materials: { basilisk_scale: 6, slime_core: 10 } },
    shadow_hunter_set: { gold: 1800, materials: { shadow_core: 6, wyvern_claw: 3 } },
    wyvern_scale_set: { gold: 3800, materials: { wyvern_claw: 10, dragon_scale: 4 } },
    dragon_scale_set: { gold: 7500, materials: { dragon_scale: 12, dragon_fang: 5 } },
    platinum_hero_set: { gold: 15000, materials: { ancient_dragon_heart: 1, ancient_core: 10, dragon_scale: 10 } }
};

let rpgStore = { players: {}, parties: {}, nextPartyId: 1 };
const rpgPendingSales = new Map();
const rpgPartyInvites = new Map();

function loadRpgStore() {
    if (!fs.existsSync(RPG_STORE_FILE)) return;
    try {
        const parsed = JSON.parse(fs.readFileSync(RPG_STORE_FILE, 'utf8'));
        rpgStore = {
            players: parsed?.players && typeof parsed.players === 'object' ? parsed.players : {},
            parties: parsed?.parties && typeof parsed.parties === 'object' ? parsed.parties : {},
            nextPartyId: Math.max(1, Number.parseInt(parsed?.nextPartyId || '1', 10) || 1)
        };
        console.log(`Loaded ${Object.keys(rpgStore.players).length} Adventurer Guild RPG profile(s).`);
    } catch (error) {
        console.error('Failed to load Adventurer Guild RPG data:', error);
    }
}

function saveRpgStore() {
    try {
        const tempFile = `${RPG_STORE_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(rpgStore, null, 2));
        fs.renameSync(tempFile, RPG_STORE_FILE);
    } catch (error) {
        console.error('Failed to save Adventurer Guild RPG data:', error);
    }
}

function getRpgPlayerKey(guildId, userId) {
    return `${guildId}:${userId}`;
}

function getRpgPlayer(guildId, userId) {
    return rpgStore.players[getRpgPlayerKey(guildId, userId)] || null;
}

function putRpgPlayer(player) {
    rpgStore.players[getRpgPlayerKey(player.guildId, player.userId)] = player;
}

function normalizeRpgPlayer(player) {
    if (!player) return null;
    player.inventory = player.inventory || {};
    player.gearUpgrades = player.gearUpgrades || {};
    player.gearDurability = player.gearDurability || {};
    player.equipment = player.equipment || { weapon: null, armor: null, accessory: null };
    player.stats = player.stats || { strength: 1, intelligence: 1, defense: 1, health: 1, agility: 1, stamina: 1 };
    player.unlockedSkills = Array.isArray(player.unlockedSkills) ? player.unlockedSkills : [];
    player.achievements = Array.isArray(player.achievements) ? player.achievements : [];
    player.titles = Array.isArray(player.titles) ? player.titles : ['Rookie Adventurer'];
    player.cooldowns = player.cooldowns || {};
    player.counters = player.counters || {};
    player.statPoints = Number(player.statPoints || 0);
    player.skillPoints = Number(player.skillPoints || 0);
    player.level = Math.max(1, Number(player.level || 1));
    player.exp = Math.max(0, Number(player.exp || 0));
    player.gold = Math.max(0, Number(player.gold || 0));
    player.guildReputation = Math.max(0, Number(player.guildReputation || 0));
    player.guildRank = RPG_RANKS.includes(player.guildRank) ? player.guildRank : 'Bronze';
    player.activityStreak = Math.max(0, Number(player.activityStreak || 0));
    player.lastActiveDate = player.lastActiveDate || null;
    player.lastRpgAction = player.lastRpgAction || 'joined the guild';
    player.lastSeenAt = player.lastSeenAt || player.createdAt || new Date().toISOString();
    return player;
}

function createRpgPlayer(guildId, user, className) {
    const classData = RPG_CLASS_DATA[className];
    const starterSkill = classData.skills[0];
    const player = normalizeRpgPlayer({
        guildId,
        userId: user.id,
        username: user.username,
        className,
        level: 1,
        exp: 0,
        gold: 150,
        guildRank: 'Bronze',
        guildReputation: 0,
        stats: { ...classData.baseStats },
        statPoints: 0,
        skillPoints: 1,
        unlockedSkills: [starterSkill.id],
        inventory: {
            [classData.starterWeapon]: 1,
            leather_adventurer_set: 1,
            small_health_potion: 3,
            ...(className === 'Mage' ? { small_mana_potion: 2 } : { stamina_potion: 2 })
        },
        gearUpgrades: {},
        gearDurability: { [classData.starterWeapon]: 100, leather_adventurer_set: 100 },
        equipment: { weapon: classData.starterWeapon, armor: 'leather_adventurer_set', accessory: null },
        activeContract: null,
        activeBattle: null,
        currentHp: 1,
        currentMana: 1,
        currentStamina: 1,
        cooldowns: {},
        counters: {
            monstersDefeated: 0,
            contractsCompleted: 0,
            partsSold: 0,
            itemsCrafted: 0,
            bossesDefeated: 0,
            dragonsDefeated: 0,
            dungeonClears: 0
        },
        daily: null,
        weekly: null,
        achievements: [],
        titles: ['Rookie Adventurer'],
        equippedTitle: 'Rookie Adventurer',
        partyId: null,
        activityStreak: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
        lastRpgAction: 'joined the guild',
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    });
    const derived = getRpgDerivedStats(player);
    player.currentHp = derived.maxHp;
    player.currentMana = derived.maxMana;
    player.currentStamina = derived.maxStamina;
    unlockRpgAchievement(player, 'Bronze Adventurer');
    putRpgPlayer(player);
    saveRpgStore();
    return player;
}

function getRpgItemUpgrade(player, itemId) {
    return Math.max(0, Number(player.gearUpgrades?.[itemId] || 0));
}

function getRpgEquippedItem(player, slot) {
    const itemId = player.equipment?.[slot];
    return itemId ? RPG_ITEMS[itemId] : null;
}

function getRpgDerivedStats(player) {
    normalizeRpgPlayer(player);
    const weaponId = player.equipment.weapon;
    const armorId = player.equipment.armor;
    const rawWeapon = getRpgEquippedItem(player, 'weapon');
    const rawArmor = getRpgEquippedItem(player, 'armor');
    const weapon = rawWeapon && Number(player.gearDurability?.[weaponId] ?? 100) > 0 ? rawWeapon : null;
    const armor = rawArmor && Number(player.gearDurability?.[armorId] ?? 100) > 0 ? rawArmor : null;
    const weaponUpgrade = getRpgItemUpgrade(player, weaponId);
    const armorUpgrade = getRpgItemUpgrade(player, armorId);
    const maxHp = 70 + player.level * 6 + player.stats.health * 12 + Number(armor?.hp || 0) + armorUpgrade * 12;
    const maxMana = player.className === 'Mage'
        ? 55 + player.level * 4 + player.stats.intelligence * 9
        : 20 + player.level * 2 + player.stats.intelligence * 3;
    const maxStamina = player.className === 'Swordsman'
        ? 55 + player.level * 4 + player.stats.stamina * 9
        : 30 + player.level * 2 + player.stats.stamina * 4;
    const attackStat = player.className === 'Mage' ? player.stats.intelligence : player.stats.strength;
    const attack = 7 + player.level * 2 + attackStat * 3 + Number(weapon?.attack || 0) + weaponUpgrade * 4;
    const defense = player.stats.defense * 2.2 + Number(armor?.defense || 0) + armorUpgrade * 3;
    const agility = player.stats.agility + Number(armor?.agility || 0);
    return {
        maxHp: Math.round(maxHp),
        maxMana: Math.round(maxMana),
        maxStamina: Math.round(maxStamina),
        attack: Math.round(attack),
        defense: Math.round(defense),
        agility,
        critChance: Math.min(0.35, 0.05 + agility * 0.006),
        dodgeChance: Math.min(0.28, agility * 0.005)
    };
}

function syncRpgResources(player, refill = false) {
    const derived = getRpgDerivedStats(player);
    if (refill) {
        player.currentHp = derived.maxHp;
        player.currentMana = derived.maxMana;
        player.currentStamina = derived.maxStamina;
    } else {
        player.currentHp = Math.min(derived.maxHp, Math.max(0, Number(player.currentHp || derived.maxHp)));
        player.currentMana = Math.min(derived.maxMana, Math.max(0, Number(player.currentMana ?? derived.maxMana)));
        player.currentStamina = Math.min(derived.maxStamina, Math.max(0, Number(player.currentStamina ?? derived.maxStamina)));
    }
    return derived;
}

function getRpgExpNeeded(level) {
    return Math.floor(100 * Math.pow(level, 1.35));
}

function addRpgInventory(player, itemId, quantity = 1) {
    if (!RPG_ITEMS[itemId] || quantity <= 0) return;
    player.inventory[itemId] = Math.max(0, Number(player.inventory[itemId] || 0)) + quantity;
}

function removeRpgInventory(player, itemId, quantity = 1) {
    const owned = Math.max(0, Number(player.inventory[itemId] || 0));
    if (quantity <= 0 || owned < quantity) return false;
    const remaining = owned - quantity;
    if (remaining > 0) player.inventory[itemId] = remaining;
    else delete player.inventory[itemId];
    return true;
}

function unlockRpgAchievement(player, achievement) {
    if (player.achievements.includes(achievement)) return false;
    player.achievements.push(achievement);
    const titleMap = {
        'Bronze Adventurer': 'Rookie Adventurer',
        'Silver Adventurer': 'Wolf Hunter',
        'Gold Adventurer': 'Goblin Slayer',
        'Dragon Hunter': 'Dragon Hunter',
        'Master Swordsman': 'Blade Master',
        'Master Mage': 'Arcane Master',
        'Dungeon Conqueror': 'Dungeon Explorer',
        'Platinum Hero': 'Platinum Hero'
    };
    const title = titleMap[achievement];
    if (title && !player.titles.includes(title)) player.titles.push(title);
    return true;
}

function addRpgExp(player, amount, logLines = []) {
    player.exp += Math.max(0, Math.floor(amount));
    let levels = 0;
    const oldLevel = player.level;
    while (player.exp >= getRpgExpNeeded(player.level)) {
        player.exp -= getRpgExpNeeded(player.level);
        player.level += 1;
        player.statPoints += 3;
        player.skillPoints += 1;
        levels += 1;
    }
    if (levels > 0) {
        syncRpgResources(player, true);
        const classEmoji = RPG_CLASS_DATA[player.className]?.emoji || '🧙';
        logLines.push(`🌟🎉 **LEVEL UP!** ${classEmoji} **${player.username}** advanced from **Lv.${oldLevel}** to **Lv.${player.level}**!`);
        logLines.push(`📊 **+${levels * 3} Stat Points** · 🌟 **+${levels} Skill Point${levels === 1 ? '' : 's'}** · ❤️ Resources fully restored.`);
        logLines.push(`📖 *A warm light surrounds your guild crest as new strength awakens.*`);
        if (player.className === 'Swordsman' && player.level >= 45) unlockRpgAchievement(player, 'Master Swordsman');
        if (player.className === 'Mage' && player.level >= 45) unlockRpgAchievement(player, 'Master Mage');
    }
    return levels;
}

function getRpgRankIndex(rank) {
    return Math.max(0, RPG_RANKS.indexOf(rank));
}

function canAccessRpgRank(playerRank, requiredRank) {
    return getRpgRankIndex(playerRank) >= getRpgRankIndex(requiredRank);
}

function getRpgContractByInput(player, input) {
    const contracts = RPG_CONTRACTS[player.guildRank] || [];
    const clean = String(input || '').trim().toLowerCase();
    if (!clean) return null;
    const number = Number.parseInt(clean, 10);
    if (Number.isFinite(number) && number >= 1 && number <= contracts.length) return contracts[number - 1];
    return contracts.find(contract => contract.id === clean || contract.name.toLowerCase() === clean || contract.name.toLowerCase().includes(clean));
}


function getRpgEnemy(enemyId, difficultyMultiplier = 1) {
    const base = RPG_ENEMIES[enemyId];
    if (!base) return null;
    return {
        id: enemyId,
        emoji: getRpgEnemyEmoji(enemyId),
        name: base.name,
        rank: base.rank,
        maxHp: Math.round(base.hp * difficultyMultiplier),
        hp: Math.round(base.hp * difficultyMultiplier),
        damage: Math.round(base.damage * (0.9 + difficultyMultiplier * 0.25)),
        exp: Math.round(base.exp * difficultyMultiplier),
        gold: Math.round(base.gold * difficultyMultiplier),
        drops: base.drops,
        boss: Boolean(base.boss),
        dragon: Boolean(base.dragon),
        status: base.status || null,
        phase: 1,
        statuses: []
    };
}

function createRpgParty(guildId, leaderId) {
    const id = String(rpgStore.nextPartyId++);
    rpgStore.parties[id] = { id, guildId, leaderId, members: [leaderId], createdAt: new Date().toISOString() };
    const leader = getRpgPlayer(guildId, leaderId);
    if (leader) leader.partyId = id;
    saveRpgStore();
    return rpgStore.parties[id];
}

function getRpgParty(player) {
    return player?.partyId ? rpgStore.parties[player.partyId] || null : null;
}

function cleanRpgParty(party) {
    if (!party) return;
    party.members = party.members.filter(userId => Boolean(getRpgPlayer(party.guildId, userId)));
    if (!party.members.includes(party.leaderId)) party.leaderId = party.members[0] || null;
    if (party.members.length <= 1) {
        for (const userId of party.members) {
            const player = getRpgPlayer(party.guildId, userId);
            if (player) player.partyId = null;
        }
        delete rpgStore.parties[party.id];
    }
}

function getRpgBattleOwner(guildId, userId) {
    const own = getRpgPlayer(guildId, userId);
    if (own?.activeBattle) return own;
    const party = getRpgParty(own);
    if (!party) return null;
    for (const memberId of party.members) {
        const member = getRpgPlayer(guildId, memberId);
        if (member?.activeBattle?.participants?.includes(userId)) return member;
    }
    return null;
}

function getRpgBattleParticipants(player) {
    const party = getRpgParty(player);
    if (!party || party.leaderId !== player.userId) return [player.userId];
    return party.members.slice(0, RPG_MAX_PARTY_SIZE);
}


function createRpgBattle(player, enemyId, options = {}) {
    const participants = getRpgBattleParticipants(player);
    const participantStates = {};
    for (const userId of participants) {
        const member = getRpgPlayer(player.guildId, userId);
        if (!member) continue;
        const derived = syncRpgResources(member, false);
        participantStates[userId] = {
            hp: Math.max(1, member.currentHp || derived.maxHp),
            mana: member.currentMana,
            stamina: member.currentStamina,
            defending: false,
            statuses: [],
            lastAction: null
        };
    }
    const enemy = getRpgEnemy(enemyId, options.difficultyMultiplier || 1);
    const battle = {
        id: crypto.randomBytes(5).toString('hex'),
        ownerId: player.userId,
        guildId: player.guildId,
        participants: Object.keys(participantStates),
        participantStates,
        enemy,
        type: options.type || 'hunt',
        dungeonId: options.dungeonId || null,
        dungeonRoom: options.dungeonRoom || 0,
        difficulty: options.difficulty || 'Normal',
        difficultyMultiplier: options.difficultyMultiplier || 1,
        createdAt: Date.now(),
        turn: 1,
        momentum: 0,
        lastEventTurn: 0,
        enemyIntent: rollRpgEnemyIntent(enemy),
        log: [
            `${getRpgEnemyEmoji(enemy)} **${enemy?.name || 'An enemy'} appears!**`,
            `📖 *${pickRpgFlavor('battleStart')}*`,
            `👁️ ${enemy?.name || 'The enemy'} studies the party...`
        ]
    };
    // Keep the displayed intent and the executed intent identical.
    battle.log[battle.log.length - 1] = `👁️ ${enemy?.name || 'The enemy'} is preparing **${battle.enemyIntent.name}**.`;
    player.activeBattle = battle;
    touchRpgPlayer(player, `entered battle with ${enemy?.name || enemyId}`);
    putRpgPlayer(player);
    saveRpgStore();
    return battle;
}

function getRpgStatusText(statuses = []) {
    return statuses.length > 0
        ? statuses.map(status => `${getRpgStatusEmoji(status.name)} ${status.name} (${status.turns})`).join(' • ')
        : '✨ None';
}


function buildRpgBattleEmbed(ownerPlayer) {
    const battle = ownerPlayer.activeBattle;
    if (!battle) return null;
    const enemy = battle.enemy;
    if (!battle.enemyIntent) battle.enemyIntent = rollRpgEnemyIntent(enemy);
    const enemyBar = buildRpgProgressBar(enemy.hp, enemy.maxHp, 16);
    const enemyMood = getRpgHealthMood(enemy.hp, enemy.maxHp);
    const momentum = getRpgBattleMomentum(battle);
    const partyLines = battle.participants.map(userId => {
        const player = getRpgPlayer(battle.guildId, userId);
        const state = battle.participantStates[userId];
        if (!player || !state) return null;
        const derived = getRpgDerivedStats(player);
        const resource = player.className === 'Mage'
            ? `💙 ${Math.round(state.mana)}/${derived.maxMana}`
            : `⚡ ${Math.round(state.stamina)}/${derived.maxStamina}`;
        const healthMood = getRpgHealthMood(state.hp, derived.maxHp);
        const stateIcon = state.hp <= 0 ? '💀' : state.defending ? '🛡️' : RPG_CLASS_DATA[player.className]?.emoji || '🧙';
        const statusText = state.statuses.length ? `\n└ ${getRpgStatusText(state.statuses)}` : '';
        return `${stateIcon} <@${userId}> · ${healthMood.emoji} ${Math.max(0, Math.round(state.hp))}/${derived.maxHp} · ${resource}${statusText}`;
    }).filter(Boolean);
    const phaseText = enemy.boss ? ` · Phase ${enemy.phase}` : '';
    const encounterText = battle.type === 'dungeon'
        ? `${getRpgDungeonEmoji(battle.dungeonId)} ${getRpgDifficultyEmoji(battle.difficulty)} ${battle.difficulty} · Room ${battle.dungeonRoom + 1}/5`
        : `${getRpgContractEmoji(battle.type === 'dragon' ? 'Dragon' : battle.type === 'boss' ? 'Boss' : 'Hunt')} ${String(battle.type).toUpperCase()}`;
    return new EmbedBuilder()
        .setColor(enemyMood.color || (enemy.dragon ? '#C0392B' : enemy.boss ? '#8E44AD' : RPG_RANK_COLORS[enemy.rank] || '#9B7A3C'))
        .setTitle(`${getRpgEnemyEmoji(enemy)} ${enemy.name}${phaseText}`)
        .setDescription([
            `${getRpgRankEmoji(enemy.rank)} **${enemy.rank} Encounter** · ${enemyMood.emoji} ${enemyMood.label}`,
            `❤️ **Enemy HP:** ${Math.max(0, Math.round(enemy.hp))}/${enemy.maxHp}`,
            `\`${enemyBar}\``,
            `${getRpgStatusEmoji('Shielded')} **Enemy Status:** ${getRpgStatusText(enemy.statuses)}`
        ].join('\n'))
        .addFields(
            { name: `${battle.enemyIntent.emoji} Enemy Intent`, value: `**${battle.enemyIntent.name}**\n${battle.enemyIntent.hint}`, inline: true },
            { name: `${momentum.emoji} Party Momentum`, value: `**${momentum.value}/10** · +${Math.round((momentum.multiplier - 1) * 100)}% damage\n\`${buildRpgProgressBar(momentum.value, 10, 10)}\``, inline: true },
            { name: '🛡️ Adventuring Party', value: partyLines.join('\n') || 'No active adventurers.', inline: false },
            { name: '📖 Live Battle Log', value: battle.log.slice(-9).join('\n').slice(0, 1024) || '⚔️ The battle begins.', inline: false },
            { name: '🔄 Turn', value: `**${battle.turn}**`, inline: true },
            { name: '🗺️ Encounter', value: encounterText, inline: true },
            { name: '🎯 Actions', value: '⚔️ Attack · ✨ Skill · 🛡️ Defend · 🧪 Potion · 🏃 Flee', inline: false }
        )
        .setFooter({ text: 'Read the enemy intent • Build momentum • Every action advances the battle.' })
        .setTimestamp();
}

function buildRpgBattleRows(ownerPlayer) {
    const battle = ownerPlayer.activeBattle;
    if (!battle) return [];
    const momentum = getRpgBattleMomentum(battle);
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`rpg_battle:${battle.id}:attack`).setLabel('Strike').setEmoji('⚔️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(`rpg_battle:${battle.id}:skill`).setLabel(momentum.value >= 8 ? 'Empowered Skill' : 'Skill').setEmoji(momentum.value >= 8 ? '🔥' : '✨').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`rpg_battle:${battle.id}:defend`).setLabel('Guard').setEmoji('🛡️').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`rpg_battle:${battle.id}:potion`).setLabel('Potion').setEmoji('🧪').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`rpg_battle:${battle.id}:flee`).setLabel('Retreat').setEmoji('🏃').setStyle(ButtonStyle.Danger)
        )
    ];
}

function addRpgStatus(targetStatuses, name, turns = 2, power = 0) {
    const existing = targetStatuses.find(status => status.name === name);
    if (existing) {
        existing.turns = Math.max(existing.turns, turns);
        existing.power = Math.max(existing.power || 0, power || 0);
    } else {
        targetStatuses.push({ name, turns, power });
    }
}


function tickRpgStatuses(battle) {
    const enemy = battle.enemy;
    let skipEnemy = false;
    for (const status of [...enemy.statuses]) {
        if (['Burn', 'Poison', 'Bleed', 'Curse', 'Shock'].includes(status.name)) {
            const damage = Math.max(2, Math.round(status.power || enemy.maxHp * 0.025));
            enemy.hp -= damage;
            battle.log.push(`${getRpgStatusEmoji(status.name)} **${status.name}** deals **${damage}** damage to ${getRpgEnemyEmoji(enemy)} ${enemy.name}.`);
        }
        if (['Freeze', 'Stun'].includes(status.name)) skipEnemy = true;
        status.turns -= 1;
        if (status.turns <= 0) battle.log.push(`✨ ${getRpgStatusEmoji(status.name)} **${status.name}** faded from ${enemy.name}.`);
    }
    enemy.statuses = enemy.statuses.filter(status => status.turns > 0);
    return skipEnemy;
}


function tickRpgPlayerStatuses(player, state, battle) {
    const derived = getRpgDerivedStats(player);
    let skipAction = false;
    for (const status of [...state.statuses]) {
        if (['Burn', 'Poison', 'Bleed', 'Curse', 'Shock'].includes(status.name)) {
            const damage = Math.max(2, Math.round(status.power || derived.maxHp * 0.035));
            state.hp = Math.max(0, state.hp - damage);
            battle.log.push(`${getRpgStatusEmoji(status.name)} **${player.username}** suffers **${damage}** damage from **${status.name}**.`);
        }
        if (['Freeze', 'Stun'].includes(status.name)) skipAction = true;
        status.turns -= 1;
    }
    state.statuses = state.statuses.filter(status => status.turns > 0);
    if (skipAction && state.hp > 0) battle.log.push(`🚫 **${player.username}** is unable to act this turn.`);
    return skipAction;
}

function getRpgBestSkill(player) {
    const classSkills = RPG_CLASS_DATA[player.className].skills;
    return [...classSkills]
        .filter(skill => player.unlockedSkills.includes(skill.id))
        .sort((left, right) => right.power - left.power)[0] || classSkills[0];
}


function useRpgBattlePotion(player, state, battle) {
    const derived = getRpgDerivedStats(player);
    const priority = state.hp < derived.maxHp * 0.55
        ? ['large_health_potion', 'medium_health_potion', 'small_health_potion']
        : player.className === 'Mage'
            ? ['large_mana_potion', 'medium_mana_potion', 'small_mana_potion']
            : ['stamina_potion'];
    const itemId = priority.find(id => Number(player.inventory[id] || 0) > 0);
    if (!itemId) return { ok: false, message: '🧪 Your potion pouch has nothing useful for the current situation.' };
    const item = RPG_ITEMS[itemId];
    removeRpgInventory(player, itemId, 1);
    const effects = [];
    if (item.heal) { state.hp = Math.min(derived.maxHp, state.hp + item.heal); effects.push(`❤️ +${item.heal} HP`); }
    if (item.mana) { state.mana = Math.min(derived.maxMana, state.mana + item.mana); effects.push(`💙 +${item.mana} Mana`); }
    if (item.stamina) { state.stamina = Math.min(derived.maxStamina, state.stamina + item.stamina); effects.push(`⚡ +${item.stamina} Stamina`); }
    if (item.buff) { addRpgStatus(state.statuses, item.buff, 3, 0); effects.push(`${getRpgStatusEmoji(item.buff)} ${item.buff}`); }
    battle.log.push(`${getRpgItemEmoji(itemId, item)} **${player.username}** uses **${item.name}** · ${effects.join(' · ') || 'restored'}.`);
    return { ok: true };
}


function applyRpgPlayerAction(ownerPlayer, actorPlayer, action) {
    const battle = ownerPlayer.activeBattle;
    const state = battle.participantStates[actorPlayer.userId];
    const derived = getRpgDerivedStats(actorPlayer);
    if (!state || state.hp <= 0) return { ok: false, message: '💀 You cannot act while defeated.' };
    const skipAction = tickRpgPlayerStatuses(actorPlayer, state, battle);
    if (state.hp <= 0) return { ok: true };
    if (skipAction) return { ok: true };
    state.defending = false;
    state.lastAction = action;
    const momentum = getRpgBattleMomentum(battle);
    const damageMultiplier = momentum.multiplier;
    if (action === 'attack') {
        const hasteBonus = state.statuses.some(status => status.name === 'Haste') ? 0.1 : 0;
        const critical = Math.random() < Math.min(0.6, derived.critChance + hasteBonus);
        const attackBuff = state.statuses.some(status => status.name === (actorPlayer.className === 'Mage' ? 'Intelligence Buff' : 'Strength Buff')) ? 1.25 : 1;
        const exposedBonus = battle.enemy.statuses.some(status => status.name === 'Defense Down') ? 1.2 : 1;
        let damage = Math.max(1, Math.round(derived.attack * attackBuff * exposedBonus * damageMultiplier * (0.85 + Math.random() * 0.3)));
        if (critical) damage = Math.round(damage * 1.65);
        battle.enemy.hp -= damage;
        battle.momentum = Math.min(10, momentum.value + (critical ? 2 : 1));
        const verb = actorPlayer.className === 'Mage' ? 'launches an arcane bolt' : ['slashes forward', 'strikes a weak point', 'carves through the guard'][Math.floor(Math.random() * 3)];
        battle.log.push(`${RPG_CLASS_DATA[actorPlayer.className].emoji} **${actorPlayer.username}** ${verb} for **${damage}** damage${critical ? ' 💥 **CRITICAL!**' : '.'}`);
        if (Math.random() < 0.2) battle.log.push(`📖 *${pickRpgFlavor('attack')}*`);
        return { ok: true };
    }
    if (action === 'skill') {
        const skill = getRpgBestSkill(actorPlayer);
        const resourceKey = RPG_CLASS_DATA[actorPlayer.className].resource;
        const resourceEmoji = resourceKey === 'mana' ? '💙' : '⚡';
        if (state[resourceKey] < skill.cost) return { ok: false, message: `${resourceEmoji} Not enough ${resourceKey} for **${skill.name}**. You need ${skill.cost}.` };
        state[resourceKey] -= skill.cost;
        battle.momentum = Math.min(10, momentum.value + 2);
        if (skill.effect === 'Heal') {
            const heal = Math.round(derived.maxHp * 0.32 + actorPlayer.stats.intelligence * 3);
            state.hp = Math.min(derived.maxHp, state.hp + heal);
            battle.log.push(`${getRpgSkillEmoji(skill)} **${actorPlayer.username}** casts **${skill.name}** and restores **${heal} HP**. ❤️`);
            return { ok: true };
        }
        if (skill.effect === 'Shielded' || skill.effect === 'Defense Buff' || skill.effect === 'Haste') addRpgStatus(state.statuses, skill.effect, 3, actorPlayer.level);
        const attackBuff = state.statuses.some(status => status.name === (actorPlayer.className === 'Mage' ? 'Intelligence Buff' : 'Strength Buff')) ? 1.25 : 1;
        const exposedBonus = battle.enemy.statuses.some(status => status.name === 'Defense Down') ? 1.2 : 1;
        const empowered = momentum.value >= 8 ? 1.2 : 1;
        let damage = Math.max(1, Math.round(derived.attack * attackBuff * exposedBonus * damageMultiplier * empowered * skill.power * (0.9 + Math.random() * 0.2)));
        if (skill.effect === 'Drain') state.hp = Math.min(derived.maxHp, state.hp + Math.round(damage * 0.35));
        battle.enemy.hp -= damage;
        if (skill.effect && !['Heal', 'Shielded', 'Defense Buff', 'Haste', 'Drain'].includes(skill.effect)) {
            addRpgStatus(battle.enemy.statuses, skill.effect, 2, Math.max(3, Math.round(damage * 0.12)));
        }
        battle.log.push(`${getRpgSkillEmoji(skill)} **${actorPlayer.username}** unleashes **${skill.name}** for **${damage}** damage${empowered > 1 ? ' 🔥 **EMPOWERED!**' : ''}${skill.effect ? ` · ${getRpgStatusEmoji(skill.effect)} **${skill.effect}**` : ''}.`);
        if (Math.random() < 0.25) battle.log.push(`📖 *${pickRpgFlavor('skill')}*`);
        return { ok: true };
    }
    if (action === 'defend') {
        state.defending = true;
        addRpgStatus(state.statuses, 'Defense Buff', 1, 0);
        battle.momentum = Math.min(10, momentum.value + 1);
        const intentHint = battle.enemyIntent?.name ? ` against **${battle.enemyIntent.name}**` : '';
        battle.log.push(`🛡️ **${actorPlayer.username}** raises their guard${intentHint}. Incoming damage will be reduced.`);
        return { ok: true };
    }
    if (action === 'potion') {
        battle.momentum = Math.max(0, momentum.value - 1);
        return useRpgBattlePotion(actorPlayer, state, battle);
    }
    if (action === 'flee') {
        const chance = Math.min(0.9, 0.45 + derived.agility * 0.015);
        if (Math.random() < chance && !battle.enemy.boss) {
            battle.log.push(`🏃💨 **${actorPlayer.username}** escapes through a narrow opening.`);
            ownerPlayer.activeBattle = null;
            return { ok: true, fled: true };
        }
        battle.momentum = Math.max(0, momentum.value - 2);
        battle.log.push(`🚫 **${actorPlayer.username}** tries to flee, but ${getRpgEnemyEmoji(battle.enemy)} **${battle.enemy.name}** blocks the path!`);
        return { ok: true };
    }
    return { ok: false, message: '❓ Unknown battle action.' };
}

function performRpgEnemyTurn(ownerPlayer, skipEnemy = false) {
    const battle = ownerPlayer.activeBattle;
    if (!battle || battle.enemy.hp <= 0) return;
    const enemyEmoji = getRpgEnemyEmoji(battle.enemy);
    const intent = battle.enemyIntent || rollRpgEnemyIntent(battle.enemy);
    if (skipEnemy) {
        battle.log.push(`${getRpgStatusEmoji('Freeze')} ${enemyEmoji} **${battle.enemy.name}** cannot execute **${intent.name}** this turn.`);
        battle.enemyIntent = rollRpgEnemyIntent(battle.enemy);
        return;
    }
    const alive = battle.participants.filter(userId => battle.participantStates[userId]?.hp > 0);
    if (alive.length === 0) return;
    if (intent.area && alive.length > 1) {
        battle.log.push(`${intent.emoji} ${enemyEmoji} **${battle.enemy.name} unleashes ${intent.name}!**`);
        for (const userId of alive) {
            const partyMember = getRpgPlayer(battle.guildId, userId);
            const partyState = battle.participantStates[userId];
            const partyDerived = getRpgDerivedStats(partyMember);
            let raw = battle.enemy.damage * intent.multiplier;
            if (battle.enemy.phase === 2) raw *= 1.2;
            if (battle.enemy.phase === 3) raw *= 1.45;
            let mitigation = partyDerived.defense * 0.2;
            if (partyState.defending) mitigation += raw * 0.5;
            if (partyState.statuses.some(status => status.name === 'Shielded')) mitigation += raw * 0.35;
            const areaDamage = Math.max(1, Math.round(raw - mitigation));
            partyState.hp = Math.max(0, partyState.hp - areaDamage);
            battle.log.push(`💥 **${partyMember.username}** takes **${areaDamage}** area damage.`);
            if (battle.enemy.status && Math.random() < intent.statusBoost) addRpgStatus(partyState.statuses, battle.enemy.status, 2, Math.max(3, Math.round(areaDamage * 0.12)));
        }
        battle.momentum = Math.max(0, Number(battle.momentum || 0) - 1);
        battle.enemyIntent = rollRpgEnemyIntent(battle.enemy);
        return;
    }
    const targetId = alive[Math.floor(Math.random() * alive.length)];
    const target = getRpgPlayer(battle.guildId, targetId);
    const state = battle.participantStates[targetId];
    const derived = getRpgDerivedStats(target);
    if (Math.random() < derived.dodgeChance) {
        battle.log.push(`💨 **${target.username}** reads **${intent.name}** and narrowly dodges!`);
        battle.momentum = Math.min(10, Number(battle.momentum || 0) + 1);
        battle.enemyIntent = rollRpgEnemyIntent(battle.enemy);
        return;
    }
    let raw = battle.enemy.damage * intent.multiplier * (0.85 + Math.random() * 0.3);
    if (battle.enemy.phase === 2) raw *= 1.25;
    if (battle.enemy.phase === 3) raw *= 1.55;
    let mitigation = derived.defense * 0.28;
    if (state.defending) mitigation += raw * 0.5;
    if (state.statuses.some(status => status.name === 'Shielded')) mitigation += raw * 0.35;
    if (state.statuses.some(status => status.name === 'Defense Buff')) mitigation += derived.defense * 0.25;
    const damage = Math.max(1, Math.round(raw - mitigation));
    state.hp = Math.max(0, state.hp - damage);
    battle.log.push(`${intent.emoji} ${enemyEmoji} **${battle.enemy.name}** uses **${intent.name}** on **${target.username}** for **${damage}** damage.`);
    if (battle.enemy.status && Math.random() < intent.statusBoost) {
        addRpgStatus(state.statuses, battle.enemy.status, 2, Math.max(2, Math.round(damage * 0.12)));
        battle.log.push(`${getRpgStatusEmoji(battle.enemy.status)} **${target.username}** is afflicted with **${battle.enemy.status}**.`);
    }
    if (state.hp <= 0) battle.log.push(`💀 **${target.username}** falls! The party must finish the fight without them.`);
    battle.momentum = Math.max(0, Number(battle.momentum || 0) - (intent.multiplier > 1 ? 2 : 1));
    for (const status of [...state.statuses]) status.turns -= 1;
    state.statuses = state.statuses.filter(status => status.turns > 0);
    battle.enemyIntent = rollRpgEnemyIntent(battle.enemy);
}

function updateRpgBossPhase(battle) {
    const enemy = battle.enemy;
    if (!enemy.boss) return;
    const ratio = enemy.hp / enemy.maxHp;
    const nextPhase = ratio <= 0.2 ? 3 : ratio <= 0.5 ? 2 : 1;
    if (nextPhase > enemy.phase) {
        enemy.phase = nextPhase;
        battle.log.push(nextPhase === 3
            ? `🔥🚨 ${getRpgEnemyEmoji(enemy)} **${enemy.name} enters an ENRAGED final phase!**`
            : `⚠️ ${getRpgEnemyEmoji(enemy)} **${enemy.name} changes attack patterns and grows stronger!**`);
    }
}

function damageRpgEquippedGear(player, amount = 1) {
    for (const slot of ['weapon', 'armor']) {
        const itemId = player.equipment?.[slot];
        if (!itemId) continue;
        const current = Number(player.gearDurability?.[itemId] ?? 100);
        player.gearDurability[itemId] = Math.max(0, current - Math.max(1, amount));
    }
}

function getRpgDropResults(enemy) {
    const drops = [];
    for (const [itemId, chance] of enemy.drops || []) {
        if (Math.random() <= chance) drops.push({ itemId, quantity: 1 + (Math.random() < 0.15 ? 1 : 0) });
    }
    return drops;
}

function getRpgTodayKey() {
    return new Date().toISOString().slice(0, 10);
}

function getRpgWeekKey() {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const day = Math.floor((now - first) / 86400000);
    return `${now.getUTCFullYear()}-W${String(Math.ceil((day + first.getUTCDay() + 1) / 7)).padStart(2, '0')}`;
}

function ensureRpgMissions(player, type) {
    const isDaily = type === 'daily';
    const key = isDaily ? getRpgTodayKey() : getRpgWeekKey();
    const existing = player[type];
    if (existing?.key === key) return existing;
    player[type] = isDaily
        ? {
            key,
            claimed: false,
            start: { ...player.counters },
            requirements: { monstersDefeated: 20, contractsCompleted: 3, partsSold: 10, dungeonClears: 1, itemsCrafted: 1 },
            rewards: { gold: 500, exp: 600, rep: 100, tokens: 1 }
        }
        : {
            key,
            claimed: false,
            start: { ...player.counters },
            startGuildReputation: player.guildReputation,
            requirements: { bossesDefeated: 3, contractsCompleted: 15, dungeonClears: 5, reputationEarned: 3000, dragonsDefeated: 1 },
            rewards: { gold: 3000, exp: 4000, rep: 500, tokens: 5 }
        };
    return player[type];
}

function getRpgMissionProgress(player, mission, key) {
    if (key === 'reputationEarned') return Math.max(0, player.guildReputation - Number(mission.startGuildReputation || 0));
    return Math.max(0, Number(player.counters[key] || 0) - Number(mission.start?.[key] || 0));
}

function completeRpgContractIfReady(player, trigger = {}) {
    const contract = player.activeContract;
    if (!contract) return [];
    if (trigger.enemyId && contract.target === trigger.enemyId && ['Hunt', 'Boss', 'Dragon', 'Emergency'].includes(contract.type)) {
        contract.progress = Math.min(contract.amount, Number(contract.progress || 0) + 1);
    }
    if (trigger.itemId && contract.drop === trigger.itemId && contract.type === 'Gathering') {
        contract.progress = Math.min(contract.amount, Number(contract.progress || 0) + Number(trigger.quantity || 1));
    }
    if (trigger.dungeonId && contract.dungeon === trigger.dungeonId && contract.type === 'Dungeon') {
        contract.progress = contract.amount;
    }
    if (Number(contract.progress || 0) < contract.amount) return [];
    const lines = [
        `📜 **Contract complete: ${contract.name}**`,
        `Rewards: 🟡 ${contract.gold} Gold • ✨ ${contract.exp} EXP • 🏰 ${contract.rep} Reputation`
    ];
    player.gold += contract.gold;
    player.guildReputation += contract.rep;
    addRpgExp(player, contract.exp, lines);
    player.counters.contractsCompleted = Number(player.counters.contractsCompleted || 0) + 1;
    if (player.counters.contractsCompleted === 1) unlockRpgAchievement(player, 'First Contract Completed');
    if (player.counters.contractsCompleted >= 100 && !player.titles.includes('Guild Champion')) player.titles.push('Guild Champion');
    lines.push(getRpgNpcLine('receptionist', 'contractCompleted', player, { contract: contract.name }));
    lines.push(getRpgNpcLine('scout', 'return', player, { contract: contract.name, location: contract.location }));
    player.activeContract = null;
    return lines;
}

function applyRpgVictoryRewards(ownerPlayer) {
    const battle = ownerPlayer.activeBattle;
    const enemy = battle.enemy;
    const participants = battle.participants.filter(userId => Boolean(getRpgPlayer(battle.guildId, userId)));
    const expEach = Math.max(1, Math.floor(enemy.exp / Math.max(1, participants.length)));
    const goldEach = Math.max(1, Math.floor(enemy.gold / Math.max(1, participants.length)));
    const sharedLog = [
        `🏆✨ ${getRpgEnemyEmoji(enemy)} **${enemy.name} was defeated!**`,
        `🎺 **VICTORY FANFARE!** The guild contract seal flashes gold.`,
        `📖 *${pickRpgFlavor('victory')}*`,
        getRpgNpcLine('bard', 'victory', ownerPlayer, { enemy: enemy.name }),
        getRpgNpcLine('guildMaster', 'victory', ownerPlayer, { enemy: enemy.name })
    ];
    for (const userId of participants) {
        const player = getRpgPlayer(battle.guildId, userId);
        const state = battle.participantStates[userId];
        if (!player || !state) continue;
        player.gold += goldEach;
        addRpgExp(player, expEach, sharedLog);
        player.counters.monstersDefeated = Number(player.counters.monstersDefeated || 0) + 1;
        damageRpgEquippedGear(player, enemy.boss ? 4 : battle.type === 'dungeon' ? 2 : 1);
        if (enemy.boss) player.counters.bossesDefeated = Number(player.counters.bossesDefeated || 0) + 1;
        if (enemy.dragon) {
            player.counters.dragonsDefeated = Number(player.counters.dragonsDefeated || 0) + 1;
            unlockRpgAchievement(player, 'Dragon Hunter');
        }
        const drops = getRpgDropResults(enemy);
        if (!drops.length) sharedLog.push(`🍃 **${player.username}** found no material drop this time.`);
        for (const drop of drops) {
            addRpgInventory(player, drop.itemId, drop.quantity);
            sharedLog.push(`🎁 **${player.username}** found ${formatRpgItem(drop.itemId, drop.quantity)} ${getRpgRarityEmoji(RPG_ITEMS[drop.itemId].rarity)}`);
            if (['Rare', 'Epic', 'Legendary', 'Mythic'].includes(RPG_ITEMS[drop.itemId].rarity)) sharedLog.push(`✨ *${pickRpgFlavor('loot')}*`);
            sharedLog.push(...completeRpgContractIfReady(player, { itemId: drop.itemId, quantity: drop.quantity }));
        }
        sharedLog.push(...completeRpgContractIfReady(player, { enemyId: enemy.id }));
        const derived = getRpgDerivedStats(player);
        player.currentHp = Math.max(1, Math.round(state.hp));
        player.currentMana = Math.min(derived.maxMana, Math.round(state.mana + derived.maxMana * 0.08));
        player.currentStamina = Math.min(derived.maxStamina, Math.round(state.stamina + derived.maxStamina * 0.12));
        putRpgPlayer(player);
    }
    sharedLog.push(`🟡 **${goldEach} Gold** · ✨ **${expEach} EXP** awarded to each adventurer.`);
    sharedLog.push(getRpgNpcLine('quartermaster', 'loot', ownerPlayer, { enemy: enemy.name }));
    return sharedLog;
}

function advanceRpgDungeon(ownerPlayer, rewardLog) {
    const battle = ownerPlayer.activeBattle;
    const dungeon = RPG_DUNGEONS[battle.dungeonId];
    if (!dungeon) return false;
    if (battle.dungeonRoom >= 4) {
        for (const userId of battle.participants) {
            const player = getRpgPlayer(battle.guildId, userId);
            if (!player) continue;
            const difficultyData = RPG_DUNGEON_DIFFICULTIES[battle.difficulty] || RPG_DUNGEON_DIFFICULTIES.Normal;
            const dungeonGold = Math.round(dungeon.reward.gold * difficultyData.reward);
            const dungeonExp = Math.round(dungeon.reward.exp * difficultyData.reward);
            player.gold += dungeonGold;
            addRpgExp(player, dungeonExp, rewardLog);
            player.counters.dungeonClears = Number(player.counters.dungeonClears || 0) + 1;
            if (player.counters.dungeonClears >= 1) unlockRpgAchievement(player, 'Dungeon Conqueror');
            rewardLog.push(...completeRpgContractIfReady(player, { dungeonId: battle.dungeonId }));
        }
        const difficultyData = RPG_DUNGEON_DIFFICULTIES[battle.difficulty] || RPG_DUNGEON_DIFFICULTIES.Normal;
        rewardLog.push(`${getRpgDungeonEmoji(battle.dungeonId)}🏆 **${getRpgDifficultyEmoji(battle.difficulty)} ${battle.difficulty} ${dungeon.name} cleared!**`);
        rewardLog.push(`🎁 Reward Chest · 🟡 ${Math.round(dungeon.reward.gold * difficultyData.reward)} Gold · ✨ ${Math.round(dungeon.reward.exp * difficultyData.reward)} EXP each.`);
        ownerPlayer.activeBattle = null;
        return false;
    }
    battle.dungeonRoom += 1;
    if (battle.dungeonRoom === 2) {
        const eventGold = 75 * (getRpgRankIndex(dungeon.rank) + 1);
        for (const userId of battle.participants) {
            const player = getRpgPlayer(battle.guildId, userId);
            if (player) player.gold += eventGold;
        }
        rewardLog.push(`🗝️✨ A hidden guild cache grants **${eventGold} Gold** to every party member.`);
    }
    const enemyId = dungeon.enemies[battle.dungeonRoom];
    battle.enemy = getRpgEnemy(enemyId, battle.difficultyMultiplier || 1);
    battle.turn += 1;
    battle.log = [...rewardLog.slice(-5), `🚪 Room ${battle.dungeonRoom + 1}/5 · ${getRpgEnemyEmoji(enemyId)} **${battle.enemy.name}** blocks the path.`];
    for (const userId of battle.participants) {
        const player = getRpgPlayer(battle.guildId, userId);
        const state = battle.participantStates[userId];
        if (!player || !state) continue;
        const derived = getRpgDerivedStats(player);
        state.hp = Math.min(derived.maxHp, Math.max(1, state.hp + Math.round(derived.maxHp * 0.18)));
        state.mana = Math.min(derived.maxMana, state.mana + Math.round(derived.maxMana * 0.15));
        state.stamina = Math.min(derived.maxStamina, state.stamina + Math.round(derived.maxStamina * 0.18));
    }
    return true;
}

function resolveRpgBattleRound(ownerPlayer, actorPlayer, action) {
    const actionResult = applyRpgPlayerAction(ownerPlayer, actorPlayer, action);
    if (!actionResult.ok || actionResult.fled || !ownerPlayer.activeBattle) return actionResult;
    const battle = ownerPlayer.activeBattle;
    const skipEnemy = tickRpgStatuses(battle);
    updateRpgBossPhase(battle);
    if (battle.enemy.hp <= 0) {
        const rewardLog = applyRpgVictoryRewards(ownerPlayer);
        if (battle.type === 'dungeon' && advanceRpgDungeon(ownerPlayer, rewardLog)) {
            saveRpgStore();
            return { ok: true, victory: true, continued: true };
        }
        if (ownerPlayer.activeBattle) ownerPlayer.activeBattle = null;
        saveRpgStore();
        return { ok: true, victory: true, rewardLog };
    }
    performRpgEnemyTurn(ownerPlayer, skipEnemy);
    triggerRpgBattleEvent(battle);
    battle.turn += 1;
    const alive = battle.participants.some(userId => battle.participantStates[userId]?.hp > 0);
    if (!alive) {
        battle.log.push('💀 The party has been defeated and returns to the guild infirmary.');
        for (const userId of battle.participants) {
            const player = getRpgPlayer(battle.guildId, userId);
            if (!player) continue;
            const derived = getRpgDerivedStats(player);
            player.currentHp = Math.max(1, Math.round(derived.maxHp * 0.35));
            player.currentMana = Math.round(derived.maxMana * 0.4);
            player.currentStamina = Math.round(derived.maxStamina * 0.4);
        }
        ownerPlayer.activeBattle = null;
        saveRpgStore();
        return { ok: true, defeat: true };
    }
    saveRpgStore();
    return { ok: true };
}


function buildRpgProfileEmbed(player, user = null) {
    normalizeRpgPlayer(player);
    const derived = syncRpgResources(player, false);
    const weaponId = player.equipment.weapon;
    const armorId = player.equipment.armor;
    const weapon = RPG_ITEMS[weaponId];
    const armor = RPG_ITEMS[armorId];
    const contract = player.activeContract;
    const expNeeded = getRpgExpNeeded(player.level);
    const nextRank = RPG_RANKS[getRpgRankIndex(player.guildRank) + 1];
    const rankRequirement = nextRank ? RPG_RANK_REQUIREMENTS[nextRank] : player.guildReputation;
    const healthMood = getRpgHealthMood(player.currentHp, derived.maxHp);
    const readiness = getRpgReadiness(player);
    const streak = Math.max(1, Number(player.activityStreak || 1));
    const recordVoice = Math.random() < 0.55
        ? getRpgNpcLine('receptionist', 'profile', player)
        : getRpgNpcLine('bard', 'profile', player);
    const embed = new EmbedBuilder()
        .setColor(RPG_RANK_COLORS[player.guildRank] || '#9B7A3C')
        .setTitle(`${RPG_CLASS_DATA[player.className]?.emoji || '🧙'} ${player.username} · ${getRpgRankEmoji(player.guildRank)} ${player.guildRank} Adventurer`)
        .setDescription(`🏅 **${player.equippedTitle}**\n${readiness.emoji} **${readiness.label}:** ${readiness.detail}\n${getRpgContextTip(player)}`);
    if (user?.displayAvatarURL) embed.setThumbnail(user.displayAvatarURL());
    return embed.addFields(
            { name: '🪪 Guild Identity', value: `🏅 **Title:** ${player.equippedTitle}\n${RPG_CLASS_DATA[player.className]?.emoji} **Class:** ${player.className}\n${getRpgRankEmoji(player.guildRank)} **Rank:** ${player.guildRank}`, inline: true },
            { name: '📈 Progression', value: `⭐ **Level:** ${player.level}\n✨ **EXP:** ${player.exp}/${expNeeded}\n\`${buildRpgProgressBar(player.exp, expNeeded)}\`\n🏰 **Rep:** ${player.guildReputation}${nextRank ? `/${rankRequirement}` : ' MAX'}`, inline: true },
            { name: `${healthMood.emoji} Resources · ${healthMood.label}`, value: `❤️ ${Math.round(player.currentHp)}/${derived.maxHp} \`${buildRpgProgressBar(player.currentHp, derived.maxHp, 8)}\`\n💙 ${Math.round(player.currentMana)}/${derived.maxMana}\n⚡ ${Math.round(player.currentStamina)}/${derived.maxStamina}\n🟡 ${player.gold} Gold`, inline: true },
            { name: '⚔️ Combat Power', value: `⚔️ Attack: **${derived.attack}**\n🛡️ Defense: **${derived.defense}**\n💥 Critical: **${Math.round(derived.critChance * 100)}%**\n💨 Dodge: **${Math.round(derived.dodgeChance * 100)}%**`, inline: true },
            { name: '🎒 Equipped Gear', value: `${weapon ? `${getRpgItemEmoji(weaponId, weapon)} **${weapon.name} +${getRpgItemUpgrade(player, weaponId)}** · 🔧 ${Number(player.gearDurability?.[weaponId] ?? 100)}%` : '⚔️ No weapon'}\n${armor ? `${getRpgItemEmoji(armorId, armor)} **${armor.name} +${getRpgItemUpgrade(player, armorId)}** · 🔧 ${Number(player.gearDurability?.[armorId] ?? 100)}%` : '🛡️ No armor'}`, inline: true },
            { name: `${getRpgActivityStreakEmoji(streak)} Adventure Pulse`, value: `🔥 **${streak}-day activity streak**\n🗣️ Last action: **${player.lastRpgAction || 'visited the guild'}**\n${player.partyId ? '🤝 Party ready' : '🧭 Adventuring solo'}`, inline: true },
            { name: '📜 Active Contract', value: contract ? `${getRpgContractEmoji(contract.type)} **${contract.name}**\n📍 ${contract.location}\nProgress: ${contract.progress || 0}/${contract.amount} \`${buildRpgProgressBar(contract.progress || 0, contract.amount, 10)}\`` : '📭 No active contract. Visit `!contracts`.', inline: false },
            { name: '💬 Guild Commentary', value: recordVoice, inline: false }
        )
        .setFooter({ text: `📊 ${player.statPoints} stat point(s) · 🌟 ${player.skillPoints} skill point(s) · 🎮 !helprpg · 💬 !guildstaff` })
        .setTimestamp();
}

function buildRpgClassSelectRow(guildId, userId) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`rpg_class:${guildId}:${userId}`)
            .setPlaceholder('⚔️ Choose the path that will define your legend')
            .addOptions(
                new StringSelectMenuOptionBuilder().setLabel('Swordsman').setEmoji('⚔️').setDescription('Melee weapons, stamina, defense, agility, and weapon paths.').setValue('Swordsman'),
                new StringSelectMenuOptionBuilder().setLabel('Mage').setEmoji('🔮').setDescription('Mana, elemental magic, healing, barriers, and ranged attacks.').setValue('Mage')
            )
    );
}


async function handleRpgStartCommand(message) {
    const existing = getRpgPlayer(message.guild.id, message.author.id);
    if (existing) {
        await message.reply({
            content: `📚 The Guild already has your adventurer record.\n\n${getRpgNpcLine('receptionist', 'profile', existing)}`,
            embeds: [buildRpgProfileEmbed(existing, message.author)]
        });
        return;
    }
    const previewContext = { adventurer: message.author.username, userId: message.author.id, guildId: message.guild.id };
    const embed = new EmbedBuilder()
        .setColor('#9B7A3C')
        .setTitle('🏰✨ Welcome to the Adventurer Guild')
        .setDescription(`🔔 The guild doors open. **Welcome, rookie adventurer.** Choose the path that will define your legend.\n\n${getRpgNpcLine('receptionist', 'greeting', null, previewContext)}\n\n${getRpgNpcLine('guildMaster', 'greeting', null, previewContext)}`)
        .addFields(
            { name: '⚔️ Swordsman', value: '🗡️ Melee weapons\n⚡ Stamina skills\n🛡️ Blocking and defense\n💨 Dodging and critical strikes', inline: true },
            { name: '🔮 Mage', value: '🪄 Elemental magic\n💙 Mana-powered skills\n✨ Healing and shields\n🌪️ Long-range spellcasting', inline: true },
            { name: '🎁 Starter Pack', value: `A starter weapon, Leather Adventurer Set, potions, **150 Gold**, and your first class skill.\n\n${getRpgNpcLine('quartermaster', 'greeting', null, previewContext)}`, inline: false }
        )
        .setFooter({ text: '⚠️ Class selection is permanent for this profile.' })
        .setTimestamp();
    await message.channel.send({ embeds: [embed], components: [buildRpgClassSelectRow(message.guild.id, message.author.id)] });
}

async function handleRpgProfileCommand(message, args) {
    const target = message.mentions.users.first() || message.author;
    const player = getRpgPlayer(message.guild.id, target.id);
    if (!player) return message.reply(target.id === message.author.id ? 'Use `!start` to create your adventurer first.' : 'That member has no RPG profile.');
    const sub = String(args[0] || '').toLowerCase();
    if (target.id === message.author.id && sub === 'title') {
        const titleName = args.slice(1).join(' ').trim();
        const found = player.titles.find(title => title.toLowerCase() === titleName.toLowerCase());
        if (!found) return message.reply(`Unknown title. Your titles: ${player.titles.join(', ')}`);
        player.equippedTitle = found;
        saveRpgStore();
        return message.reply(`🏅 Your equipped title is now **${found}**.\n\n${getRpgNpcLine('bard', 'titleEquip', player, { title: found })}\n\n${getRpgNpcLine('receptionist', 'profile', player)}`);
    }
    await message.channel.send({ embeds: [buildRpgProfileEmbed(player, target)] });
}

async function handleRpgClassCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const data = RPG_CLASS_DATA[player.className];
    const unlocked = data.skills.filter(skill => player.unlockedSkills.includes(skill.id));
    await message.channel.send({
        embeds: [new EmbedBuilder()
            .setColor(player.className === 'Mage' ? '#6F4E9C' : '#B87333')
            .setTitle(`${data.emoji} ${player.className} Class Path`)
            .setDescription(`${getRpgNpcLine('guildMaster', 'skills', player)}\n\n🛤️ **Paths:** ${data.paths.map(path => `**${path}**`).join(' · ')}`)
            .addFields(
                { name: '✅ Unlocked Skills', value: unlocked.map(skill => `${getRpgSkillEmoji(skill)} **${skill.name}** · ${skill.cost} ${data.resource === 'mana' ? '💙 Mana' : '⚡ Stamina'}`).join('\n') || '🔒 None', inline: false },
                { name: '🔓 Upcoming Skills', value: data.skills.filter(skill => !player.unlockedSkills.includes(skill.id)).slice(0, 6).map(skill => `${getRpgSkillEmoji(skill)} Lv.${skill.level} · **${skill.name}**`).join('\n') || '👑 Every class skill is unlocked.', inline: false }
            )
            .setFooter({ text: '✨ Use !skills to inspect and unlock abilities.' })
            .setTimestamp()]
    });
}

async function handleRpgStatsCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const stat = String(args[0] || '').toLowerCase();
    const amount = Math.max(1, Number.parseInt(args[1] || '1', 10) || 1);
    if (stat) {
        if (!RPG_STAT_KEYS.includes(stat)) return message.reply(`📊 Choose a stat: ${RPG_STAT_KEYS.map(key => RPG_STAT_LABELS[key]).join(' · ')}`);
        if (player.statPoints < amount) return message.reply(`📊 You only have **${player.statPoints}** stat point(s).\n\n${getRpgNpcLine('guildMaster', 'stats', player)}`);
        if (amount > 100) return message.reply('⚠️ You may spend at most 100 points at once.');
        player.stats[stat] += amount;
        player.statPoints -= amount;
        syncRpgResources(player, false);
        saveRpgStore();
        await message.reply(`✨ ${RPG_STAT_LABELS[stat]} increased by **${amount}**! New value: **${player.stats[stat]}**.\n\n${getRpgNpcLine('guildMaster', 'stats', player)}`);
        return;
    }
    const descriptions = {
        strength: 'increases melee damage', intelligence: 'increases magic damage and max mana', defense: 'reduces damage taken',
        health: 'increases maximum HP', agility: 'increases dodge and critical chance', stamina: 'increases stamina and physical skill usage'
    };
    await message.channel.send({ embeds: [new EmbedBuilder()
        .setColor('#D4AC0D')
        .setTitle('📊✨ Adventurer Stat Crystal')
        .setDescription(`${getRpgNpcLine('guildMaster', 'stats', player)}\n\n${RPG_STAT_KEYS.map(key => `${RPG_STAT_LABELS[key]} · **${player.stats[key]}**\n└ ${descriptions[key]}`).join('\n\n')}`)
        .setFooter({ text: `${player.statPoints} unspent point(s) · !stats stat amount` })
        .setTimestamp()] });
}

async function handleRpgSkillsCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const classData = RPG_CLASS_DATA[player.className];
    const skills = classData.skills;
    if (String(args[0] || '').toLowerCase() === 'unlock') {
        const query = args.slice(1).join(' ').trim().toLowerCase();
        const index = Number.parseInt(query, 10);
        const skill = Number.isFinite(index) ? skills[index - 1] : skills.find(entry => entry.id === query.replace(/\s+/g, '_') || entry.name.toLowerCase() === query);
        if (!skill) return message.reply('🔍 Skill not found. Use `!skills` to view your skill tree.');
        if (player.unlockedSkills.includes(skill.id)) return message.reply(`✅ ${getRpgSkillEmoji(skill)} **${skill.name}** is already unlocked.`);
        if (player.level < skill.level) return message.reply(`🔒 You must reach **Level ${skill.level}** to unlock ${getRpgSkillEmoji(skill)} **${skill.name}**.\n\n${getRpgNpcLine('guildMaster', 'skills', player)}`);
        if (player.skillPoints < 1) return message.reply(`✨ You do not have a skill point available.\n\n${getRpgNpcLine('guildMaster', 'training', player)}`);
        player.skillPoints -= 1;
        player.unlockedSkills.push(skill.id);
        saveRpgStore();
        return message.reply(`🌟 New ability unlocked: ${getRpgSkillEmoji(skill)} **${skill.name}**!\n\n${getRpgNpcLine('guildMaster', 'skills', player)}`);
    }
    await message.channel.send({ embeds: [new EmbedBuilder()
        .setColor(player.className === 'Mage' ? '#6F4E9C' : '#B87333')
        .setTitle(`${classData.emoji}✨ ${player.className} Skill Tree`)
        .setDescription(`${getRpgNpcLine('guildMaster', 'skills', player)}\n\n${skills.map((skill, index) => {
            const state = player.unlockedSkills.includes(skill.id) ? '✅' : player.level >= skill.level ? '🔓' : '🔒';
            const resourceEmoji = classData.resource === 'mana' ? '💙' : '⚡';
            return `${state} ${getRpgSkillEmoji(skill)} **${index + 1}. ${skill.name}** · Lv.${skill.level} · ${resourceEmoji} ${skill.cost}${skill.effect ? ` · ${getRpgStatusEmoji(skill.effect)} ${skill.effect}` : ''}`;
        }).join('\n')}`.slice(0, 4096))
        .setFooter({ text: `${player.skillPoints} skill point(s) · !skills unlock number-or-name` })
        .setTimestamp()] });
}

function buildRpgGuildEmbed(player) {
    const nextRank = RPG_RANKS[getRpgRankIndex(player.guildRank) + 1];
    const requirement = nextRank ? RPG_RANK_REQUIREMENTS[nextRank] : null;
    const readiness = getRpgReadiness(player);
    const streak = Math.max(1, Number(player.activityStreak || 1));
    return new EmbedBuilder()
        .setColor(RPG_RANK_COLORS[player.guildRank])
        .setTitle(`🏰✨ Adventurer Guild Hall · ${getRpgRankEmoji(player.guildRank)} ${player.guildRank}`)
        .setDescription(`🔔 Welcome, **${player.equippedTitle} ${player.username}**. ${pickRpgFlavor('guild')}\n\n${getRpgGuildNpcLine(player)}\n\n${getRpgGuildAmbientLine(player)}`)
        .addFields(
            { name: '📜 Guild Record', value: `${getRpgRankEmoji(player.guildRank)} Rank: **${player.guildRank}**\n🏰 Reputation: **${player.guildReputation}**${nextRank ? `/${requirement}\n\`${buildRpgProgressBar(player.guildReputation, requirement)}\`` : ' · MAX'}`, inline: true },
            { name: '🎯 Current Contract', value: player.activeContract ? `${getRpgContractEmoji(player.activeContract.type)} **${player.activeContract.name}**\n${player.activeContract.progress || 0}/${player.activeContract.amount} complete` : '📭 None accepted.', inline: true },
            { name: `${readiness.emoji} Adventure Readiness`, value: `**${readiness.label}**\n${readiness.detail}`, inline: true },
            { name: '🧭 Guild Services', value: '📜 Contract Board · 🎒 Quartermaster · 🧪 Alchemist · 🔨 Forge · 🪪 Records', inline: false },
            { name: `${getRpgActivityStreakEmoji(streak)} Living World`, value: `🔥 ${streak}-day activity streak · ${RPG_EMOJIS.npcs.bard} Guild rumors change every visit · 🎲 Random events can occur during battle`, inline: false },
            { name: '💬 Meet the Guild Staff', value: '`!guildstaff` opens the complete NPC roster. Select anyone repeatedly to hear fresh, context-aware dialogue.', inline: false },
            { name: '💡 Guild Assistant', value: getRpgContextTip(player), inline: false }
        )
        .setFooter({ text: 'Use the navigation and quick-action buttons below.' })
        .setTimestamp();
}

function buildRpgGuildNavigationRow(player) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rpg_menu:${player.guildId}:${player.userId}:contracts`).setLabel('Contracts').setEmoji('📜').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`rpg_menu:${player.guildId}:${player.userId}:inventory`).setLabel('Inventory').setEmoji('🎒').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rpg_menu:${player.guildId}:${player.userId}:shop`).setLabel('Shop').setEmoji('🧪').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`rpg_menu:${player.guildId}:${player.userId}:blacksmith`).setLabel('Forge').setEmoji('🔨').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rpg_menu:${player.guildId}:${player.userId}:profile`).setLabel('Profile').setEmoji('🪪').setStyle(ButtonStyle.Secondary)
    );
}

function buildRpgGuildQuickRow(player) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rpg_quick:${player.guildId}:${player.userId}:hunt`).setLabel('Hunt').setEmoji('⚔️').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId(`rpg_quick:${player.guildId}:${player.userId}:daily`).setLabel('Daily').setEmoji('☀️').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`rpg_quick:${player.guildId}:${player.userId}:weekly`).setLabel('Weekly').setEmoji('🌙').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`rpg_quick:${player.guildId}:${player.userId}:party`).setLabel('Party').setEmoji('🤝').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`rpg_quick:${player.guildId}:${player.userId}:refresh`).setLabel('Refresh').setEmoji('🔄').setStyle(ButtonStyle.Secondary)
    );
}


async function handleRpgGuildCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    touchRpgPlayer(player, 'visited the Guild Hall');
    saveRpgStore();
    await message.channel.send({ embeds: [buildRpgGuildEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
}

function buildRpgContractsEmbed(player) {
    const contracts = RPG_CONTRACTS[player.guildRank] || [];
    const npcIntro = [
        getRpgNpcLine('receptionist', 'contractBoard', player),
        getRpgNpcLine('scout', 'contractBoard', player)
    ].join('\n\n');
    const contractText = contracts.map((contract, index) => [
        `${getRpgContractEmoji(contract.type)} **${index + 1}. ${contract.name}**`,
        `🏷️ ${contract.type} · ⭐ Recommended Lv.${contract.level} · 📍 ${contract.location}`,
        `🎯 Objective: ${contract.amount} · 🟡 ${contract.gold} Gold · ✨ ${contract.exp} EXP · 🏰 ${contract.rep} Rep`
    ].join('\n')).join('\n\n');
    return new EmbedBuilder()
        .setColor(RPG_RANK_COLORS[player.guildRank])
        .setTitle(`📜 ${getRpgRankEmoji(player.guildRank)} ${player.guildRank} Guild Contract Board`)
        .setDescription(`${npcIntro}\n\n${contractText}`.slice(0, 4096))
        .setFooter({ text: player.activeContract ? `📌 Active: ${player.activeContract.name}` : 'Select below or use !accept number.' })
        .setTimestamp();
}

function buildRpgContractSelectRow(player) {
    const contracts = RPG_CONTRACTS[player.guildRank] || [];
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`rpg_contract:${player.guildId}:${player.userId}`)
            .setPlaceholder('📜 Select a guild contract to accept')
            .addOptions(contracts.map(contract => new StringSelectMenuOptionBuilder()
                .setLabel(contract.name.slice(0, 100))
                .setDescription(`${contract.type} · Lv.${contract.level} · ${contract.rep} Reputation`.slice(0, 100))
                .setValue(contract.id)
                .setEmoji(getRpgContractEmoji(contract.type))))
    );
}


async function handleRpgContractsCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const components = [];
    if (!player.activeContract) components.push(buildRpgContractSelectRow(player));
    components.push(buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player));
    await message.channel.send({ embeds: [buildRpgContractsEmbed(player)], components });
}

function acceptRpgContract(player, contract) {
    if (player.activeContract) return { ok: false, message: `You already have an active contract: **${player.activeContract.name}**.` };
    if (player.level + 5 < contract.level) return { ok: false, message: `Warning: this contract is far above your current level. Reach level ${contract.level - 5} before accepting it.` };
    player.activeContract = { ...contract, progress: 0, acceptedAt: Date.now() };
    saveRpgStore();
    return { ok: true };
}


async function handleRpgAcceptCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const contract = getRpgContractByInput(player, args.join(' '));
    if (!contract) {
        return message.reply(`📜 Choose a contract number from \`!contracts\`, for example \`!accept 1\`.\n\n${getRpgNpcLine('receptionist', 'contractsWaiting', player, { rank: `${getRpgRankEmoji(player.guildRank)} ${player.guildRank}` })}`);
    }
    const result = acceptRpgContract(player, contract);
    if (!result.ok) {
        return message.reply(`⚠️ ${result.message}\n\n${getRpgNpcLine('receptionist', 'contractDenied', player, { reason: result.message })}`);
    }
    await message.channel.send({ embeds: [new EmbedBuilder()
        .setColor(RPG_RANK_COLORS[player.guildRank])
        .setTitle(`${getRpgContractEmoji(contract.type)} Contract Accepted!`)
        .setDescription(`📜 **${contract.name}**\n📍 Travel to **${contract.location}**\n🎯 Complete **${contract.amount}** objective(s).\n\n${getRpgNpcLine('receptionist', 'contractAccepted', player, { contract: contract.name })}\n\n${getRpgNpcLine('scout', 'targetLocated', player, { contract: contract.name, location: contract.location })}`)
        .addFields({ name: '🎁 Completion Rewards', value: `🟡 ${contract.gold} Gold · ✨ ${contract.exp} EXP · 🏰 ${contract.rep} Reputation`, inline: false })
        .setFooter({ text: 'The Guild Receptionist added the sealed contract to your profile.' })
        .setTimestamp()] });
}

async function handleRpgAbandonCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (!player.activeContract) {
        return message.reply(`📭 You do not have an active contract.\n\n${getRpgNpcLine('receptionist', 'contractsWaiting', player, { rank: `${getRpgRankEmoji(player.guildRank)} ${player.guildRank}` })}`);
    }
    const name = player.activeContract.name;
    player.activeContract = null;
    saveRpgStore();
    await message.reply(`📜💨 You abandoned **${name}**. The guild issued no rewards or penalties.\n\n${getRpgNpcLine('receptionist', 'contractAbandoned', player, { contract: name })}\n\n${getRpgNpcLine('guildMaster', 'defeat', player)}`);
}

function checkRpgCooldown(player, key, duration) {
    const now = Date.now();
    const readyAt = Number(player.cooldowns[key] || 0);
    if (readyAt > now) return readyAt - now;
    player.cooldowns[key] = now + duration;
    return 0;
}

function formatRpgDuration(milliseconds) {
    const seconds = Math.max(1, Math.ceil(milliseconds / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

async function sendRpgBattleMessage(message, ownerPlayer) {
    await message.channel.send({ embeds: [buildRpgBattleEmbed(ownerPlayer)], components: buildRpgBattleRows(ownerPlayer) });
}

async function handleRpgHuntCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (getRpgBattleOwner(message.guild.id, message.author.id)) return message.reply('⚔️ You are already in battle. Use `!battle` to return to the fight.');
    if (!player.activeContract) return message.reply(`📜 Accept a guild contract first with \`!contracts\`.\n\n${getRpgNpcLine('receptionist', 'contractsWaiting', player)}`);
    if (!['Hunt', 'Gathering'].includes(player.activeContract.type)) return message.reply(`This is a **${player.activeContract.type}** contract. Use the matching command such as **!boss** or **!dungeon**.`);
    const party = getRpgParty(player);
    if (party && party.leaderId !== player.userId) return message.reply('Only the party leader can begin a shared hunt.');
    const remaining = checkRpgCooldown(player, 'hunt', RPG_HUNT_COOLDOWN_MS);
    if (remaining) return message.reply(`⏳ Your hunt cooldown ends in **${formatRpgDuration(remaining)}**.`);
    const battle = createRpgBattle(player, player.activeContract.target, { type: 'hunt' });
    battle.log.push(`📜 Contract progress: ${player.activeContract.progress || 0}/${player.activeContract.amount}`);
    battle.log.push(getRpgNpcLine('scout', 'huntStart', player, { location: player.activeContract.location }));
    saveRpgStore();
    await sendRpgBattleMessage(message, player);
}

async function handleRpgBattleCommand(message, args) {
    const ownerPlayer = getRpgBattleOwner(message.guild.id, message.author.id);
    if (!ownerPlayer) return message.reply('⚔️ You do not have an active battle. Use `!hunt`, `!boss`, or `!dungeon`.');
    const action = String(args[0] || '').toLowerCase();
    if (['attack', 'skill', 'defend', 'potion', 'flee'].includes(action)) {
        const actor = getRpgPlayer(message.guild.id, message.author.id);
        const result = resolveRpgBattleRound(ownerPlayer, actor, action);
        if (!result.ok) return message.reply(result.message);
        if (result.victory && !ownerPlayer.activeBattle) {
            await message.channel.send({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle('🏆✨ Victory!').setDescription((result.rewardLog || ['Victory!']).join('\n').slice(0, 4096)).setTimestamp()] });
            return;
        }
        if (result.defeat || result.fled) {
            const line = result.defeat
                ? `${getRpgNpcLine('guildMaster', 'defeat', actor)}\n\n${getRpgNpcLine('receptionist', 'recovery', actor)}`
                : getRpgNpcLine('scout', 'return', actor);
            return message.reply(`${result.defeat ? '💀 The party was defeated and returned to the guild.' : '🏃 You escaped the battle.'}\n\n${line}`);
        }
    }
    if (ownerPlayer.activeBattle) await sendRpgBattleMessage(message, ownerPlayer);
}

function getRpgInventoryPages(player) {
    const groups = [
        ['Weapons', item => item.type === 'weapon'],
        ['Armor & Accessories', item => item.type === 'armor' || item.type === 'accessory'],
        ['Potions', item => item.type === 'potion'],
        ['Monster Parts & Materials', item => item.type === 'part' || item.type === 'material']
    ];
    return groups.map(([title, predicate]) => ({
        title,
        items: Object.entries(player.inventory)
            .filter(([itemId, quantity]) => quantity > 0 && RPG_ITEMS[itemId] && predicate(RPG_ITEMS[itemId]))
            .map(([itemId, quantity]) => ({ itemId, quantity, ...RPG_ITEMS[itemId] }))
    }));
}


function buildRpgInventoryEmbed(player, page = 0) {
    const pages = getRpgInventoryPages(player);
    const normalized = Math.min(Math.max(Number(page) || 0, 0), pages.length - 1);
    const data = pages[normalized];
    const lines = data.items.map(item => {
        const upgrade = getRpgItemUpgrade(player, item.itemId);
        const rarity = `${getRpgRarityEmoji(item.rarity)} ${item.rarity}`;
        const details = item.type === 'weapon' ? `⚔️ ${item.attack || 0} ATK` : item.type === 'armor' ? `🛡️ ${item.defense || 0} DEF` : item.type === 'potion' ? '🧪 Consumable' : `🟡 ${item.sell || 0} sell`;
        return `${getRpgItemEmoji(item.itemId, item)} **${item.name}** ×${item.quantity}${upgrade ? ` · ⚒️ +${upgrade}` : ''}\n└ ${rarity} · ${details}`;
    });
    const quartermasterLine = getRpgNpcLine('quartermaster', 'inventory', player);
    return new EmbedBuilder()
        .setColor(data.items[0] ? RPG_RARITY_COLORS[data.items[0].rarity] || '#8E6E3B' : '#8E6E3B')
        .setTitle(`🎒✨ ${data.title}`)
        .setDescription(`${quartermasterLine}\n\n${lines.join('\n\n') || '📭 This inventory section is empty.'}`.slice(0, 4096))
        .setFooter({ text: `Page ${normalized + 1}/${pages.length} · 🟡 ${player.gold} Gold · !inventory use item` })
        .setTimestamp();
}

function buildRpgInventoryRow(player, page = 0) {
    const max = getRpgInventoryPages(player).length - 1;
    const normalized = Math.min(Math.max(Number(page) || 0, 0), max);
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`rpg_inv:${player.guildId}:${player.userId}:${Math.max(0, normalized - 1)}`).setLabel('Previous').setEmoji('⬅️').setStyle(ButtonStyle.Secondary).setDisabled(normalized === 0),
        new ButtonBuilder().setCustomId(`rpg_inv:${player.guildId}:${player.userId}:${Math.min(max, normalized + 1)}`).setLabel('Next').setEmoji('➡️').setStyle(ButtonStyle.Primary).setDisabled(normalized === max)
    );
}

async function handleRpgInventoryCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (String(args[0] || '').toLowerCase() === 'use') {
        const query = args.slice(1).join(' ').toLowerCase().trim();
        const itemId = Object.keys(player.inventory).find(id => id === query.replace(/\s+/g, '_') || RPG_ITEMS[id]?.name.toLowerCase() === query);
        const item = RPG_ITEMS[itemId];
        if (!item || item.type !== 'potion') return message.reply(`🧪 You do not own that potion.\n\n${getRpgNpcLine('quartermaster', 'inventory', player)}`);
        if (getRpgBattleOwner(message.guild.id, message.author.id)) return message.reply('🧪 Use the **Potion** battle button during combat.');
        const derived = getRpgDerivedStats(player);
        removeRpgInventory(player, itemId, 1);
        if (item.heal) player.currentHp = Math.min(derived.maxHp, player.currentHp + item.heal);
        if (item.mana) player.currentMana = Math.min(derived.maxMana, player.currentMana + item.mana);
        if (item.stamina) player.currentStamina = Math.min(derived.maxStamina, player.currentStamina + item.stamina);
        saveRpgStore();
        return message.reply(`${getRpgItemEmoji(itemId, item)}✨ Used **${item.name}**.\n\n${getRpgNpcLine('alchemist', 'potionUse', player, { item: item.name })}\n\n${getRpgNpcLine('quartermaster', 'useItem', player, { item: item.name })}`);
    }
    const page = Math.max(0, (Number.parseInt(args[0] || '1', 10) || 1) - 1);
    await message.channel.send({ embeds: [buildRpgInventoryEmbed(player, page)], components: [buildRpgInventoryRow(player, page)] });
}

async function handleRpgEquipmentCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (String(args[0] || '').toLowerCase() === 'equip') {
        const query = args.slice(1).join(' ').toLowerCase().trim();
        const itemId = Object.keys(player.inventory).find(id => id === query.replace(/\s+/g, '_') || RPG_ITEMS[id]?.name.toLowerCase() === query);
        const item = RPG_ITEMS[itemId];
        if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return message.reply(`🎒 You do not own that equippable item.\n\n${getRpgNpcLine('quartermaster', 'equipment', player)}`);
        if (item.class && item.class !== player.className) return message.reply(`🚫 Only a ${RPG_CLASS_DATA[item.class]?.emoji || '🧙'} **${item.class}** can equip that item.`);
        player.equipment[item.slot] = itemId;
        if (!Object.prototype.hasOwnProperty.call(player.gearDurability, itemId)) player.gearDurability[itemId] = 100;
        syncRpgResources(player, false);
        saveRpgStore();
        return message.reply(`${getRpgItemEmoji(itemId, item)}✨ Equipped **${item.name}** in your **${item.slot}** slot.\n\n${getRpgNpcLine('quartermaster', 'equipSuccess', player, { item: item.name, slot: item.slot })}`);
    }
    const weaponId = player.equipment.weapon;
    const armorId = player.equipment.armor;
    const weapon = RPG_ITEMS[weaponId];
    const armor = RPG_ITEMS[armorId];
    await message.channel.send({ embeds: [new EmbedBuilder().setColor('#7F8C8D').setTitle('🛡️⚔️ Equipped Adventurer Gear')
        .setDescription(getRpgNpcLine('quartermaster', 'equipment', player))
        .addFields(
            { name: '⚔️ Weapon', value: weapon ? `${getRpgItemEmoji(weaponId, weapon)} **${weapon.name} +${getRpgItemUpgrade(player, weaponId)}**\n💥 Attack: ${weapon.attack || 0} · 🔧 Durability: ${Number(player.gearDurability?.[weaponId] ?? 100)}%\n${getRpgRarityEmoji(weapon.rarity)} ${weapon.rarity}` : '📭 None', inline: true },
            { name: '🛡️ Armor', value: armor ? `${getRpgItemEmoji(armorId, armor)} **${armor.name} +${getRpgItemUpgrade(player, armorId)}**\n🛡️ Defense: ${armor.defense || 0} · 🔧 Durability: ${Number(player.gearDurability?.[armorId] ?? 100)}%\n${getRpgRarityEmoji(armor.rarity)} ${armor.rarity}` : '📭 None', inline: true }
        ).setFooter({ text: 'Equip owned gear with !equipment equip item-name' }).setTimestamp()] });
}

async function handleRpgShopCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (String(args[0] || '').toLowerCase() === 'buy') {
        const quantity = Math.max(1, Math.min(99, Number.parseInt(args.at(-1) || '1', 10) || 1));
        const queryParts = args.slice(1, Number.isFinite(Number.parseInt(args.at(-1), 10)) ? -1 : undefined);
        const query = queryParts.join(' ').toLowerCase().trim();
        const itemId = Object.keys(RPG_ITEMS).find(id => RPG_ITEMS[id].type === 'potion' && (id === query.replace(/\s+/g, '_') || RPG_ITEMS[id].name.toLowerCase() === query));
        const item = RPG_ITEMS[itemId];
        if (!item) return message.reply(`🔍 Potion not found. Use \`!shop\` to view supplies.\n\n${getRpgNpcLine('alchemist', 'shopOpen', player)}`);
        const cost = item.price * quantity;
        if (player.gold < cost) return message.reply(`🪙 You need **${cost} Gold**, but only have **${player.gold}**.\n\n${getRpgNpcLine('alchemist', 'purchaseDenied', player, { item: item.name, quantity, gold: cost })}`);
        player.gold -= cost;
        addRpgInventory(player, itemId, quantity);
        saveRpgStore();
        return message.reply(`${getRpgItemEmoji(itemId, item)}🛍️ Purchased **${quantity}× ${item.name}** for **${cost} Gold**. 🟡\n\n${getRpgNpcLine('alchemist', 'purchaseSuccess', player, { item: item.name, quantity, gold: cost })}`);
    }
    await message.channel.send({ embeds: [buildRpgShopEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
}

function buildRpgShopEmbed(player) {
    const potions = Object.entries(RPG_ITEMS).filter(([, item]) => item.type === 'potion');
    const stock = potions.map(([id, item]) => `${getRpgItemEmoji(id, item)} **${item.name}** · ${getRpgRarityEmoji(item.rarity)} ${item.rarity}\n🟡 ${item.price} Gold · \`!shop buy ${id} 1\``).join('\n\n');
    return new EmbedBuilder()
        .setColor('#27AE60')
        .setTitle('🧪✨ Guild Alchemist Shop')
        .setDescription(`${getRpgNpcLine('alchemist', 'shopOpen', player)}\n\n${stock}`.slice(0, 4096))
        .setFooter({ text: `Your purse: 🟡 ${player.gold} Gold · Stock refreshes continuously.` })
        .setTimestamp();
}

function getRpgRecipeText(recipe) {
    return Object.entries(recipe.materials).map(([id, quantity]) => `${getRpgItemEmoji(id, RPG_ITEMS[id])} ${quantity}× ${RPG_ITEMS[id]?.name || id}`).join(' · ');
}


async function handleRpgBlacksmithCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const action = String(args[0] || '').toLowerCase();
    if (action === 'craft') {
        const query = args.slice(1).join(' ').toLowerCase().trim();
        const itemId = Object.keys(RPG_RECIPES).find(id => id === query.replace(/\s+/g, '_') || RPG_ITEMS[id]?.name.toLowerCase() === query);
        const recipe = RPG_RECIPES[itemId];
        const item = RPG_ITEMS[itemId];
        if (!recipe || !item) return message.reply(`📜 Recipe not found. Use \`!blacksmith\` to view recipes.\n\n${getRpgNpcLine('blacksmith', 'forgeOpen', player)}`);
        if (item.class && item.class !== player.className) return message.reply(`🚫 That recipe is intended for ${RPG_CLASS_DATA[item.class]?.emoji || '🧙'} **${item.class}** adventurers.`);
        if (player.gold < recipe.gold) return message.reply(`🟡 You need **${recipe.gold} Gold** to light the forge.\n\n${getRpgNpcLine('blacksmith', 'craftDenied', player, { reason: `${recipe.gold} Gold` })}`);
        const missing = Object.entries(recipe.materials).filter(([id, quantity]) => Number(player.inventory[id] || 0) < quantity);
        if (missing.length) {
            const missingText = missing.map(([id, quantity]) => `${getRpgItemEmoji(id, RPG_ITEMS[id])} ${quantity - Number(player.inventory[id] || 0)}× ${RPG_ITEMS[id].name}`).join(' · ');
            return message.reply(`📦 Missing materials: ${missingText}\n\n${getRpgNpcLine('blacksmith', 'missingMaterials', player, { reason: missingText })}`);
        }
        player.gold -= recipe.gold;
        for (const [id, quantity] of Object.entries(recipe.materials)) removeRpgInventory(player, id, quantity);
        addRpgInventory(player, itemId, 1);
        if (!Object.prototype.hasOwnProperty.call(player.gearDurability, itemId) && ['weapon', 'armor'].includes(item.type)) player.gearDurability[itemId] = 100;
        player.counters.itemsCrafted = Number(player.counters.itemsCrafted || 0) + 1;
        if (player.counters.itemsCrafted === 1) unlockRpgAchievement(player, 'First Crafted Weapon');
        saveRpgStore();
        return message.reply(`🔨🔥 The forge erupts in sparks—${getRpgItemEmoji(itemId, item)} **${item.name}** has been crafted!\n\n${getRpgNpcLine('blacksmith', 'craftSuccess', player, { item: item.name })}`);
    }
    if (action === 'upgrade') {
        const slot = String(args[1] || 'weapon').toLowerCase();
        if (!['weapon', 'armor'].includes(slot)) return message.reply('⚒️ Use `!blacksmith upgrade weapon` or `!blacksmith upgrade armor`.');
        const itemId = player.equipment[slot];
        if (!itemId) return message.reply(`📭 You have no equipped ${slot}.\n\n${getRpgNpcLine('quartermaster', 'equipment', player)}`);
        const level = getRpgItemUpgrade(player, itemId);
        if (level >= 15) return message.reply(`👑 That gear is already at the **+15** upgrade limit.\n\n${getRpgNpcLine('blacksmith', 'ambient', player)}`);
        const cost = 100 * (level + 1) * (getRpgRankIndex(player.guildRank) + 1);
        if (player.gold < cost) return message.reply(`🟡 Upgrading costs **${cost} Gold**.\n\n${getRpgNpcLine('blacksmith', 'craftDenied', player, { reason: `${cost} Gold` })}`);
        player.gold -= cost;
        player.gearUpgrades[itemId] = level + 1;
        player.counters.itemsCrafted = Number(player.counters.itemsCrafted || 0) + 1;
        saveRpgStore();
        return message.reply(`⚒️✨ ${getRpgItemEmoji(itemId, RPG_ITEMS[itemId])} **${RPG_ITEMS[itemId].name}** is now **+${level + 1}**!\n\n${getRpgNpcLine('blacksmith', 'upgradeSuccess', player, { item: RPG_ITEMS[itemId].name, level: level + 1 })}`);
    }
    if (action === 'repair') {
        const equippedIds = ['weapon', 'armor'].map(slot => player.equipment[slot]).filter(Boolean);
        const missing = equippedIds.reduce((total, itemId) => total + Math.max(0, 100 - Number(player.gearDurability?.[itemId] ?? 100)), 0);
        if (missing <= 0) return message.reply(`🔧✨ Your equipped gear is already at full durability.\n\n${getRpgNpcLine('blacksmith', 'repairNotNeeded', player)}`);
        const cost = missing * 2 * (getRpgRankIndex(player.guildRank) + 1);
        if (player.gold < cost) return message.reply(`🟡 Repairing your equipped gear costs **${cost} Gold**.\n\n${getRpgNpcLine('blacksmith', 'craftDenied', player, { reason: `${cost} Gold` })}`);
        player.gold -= cost;
        for (const itemId of equippedIds) player.gearDurability[itemId] = 100;
        saveRpgStore();
        return message.reply(`🔧✨ The blacksmith restored your equipped gear to **100% durability** for **${cost} Gold**.\n\n${getRpgNpcLine('blacksmith', 'repairSuccess', player)}`);
    }
    await message.channel.send({ embeds: [buildRpgBlacksmithEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
}

function buildRpgBlacksmithEmbed(player) {
    const recipes = Object.entries(RPG_RECIPES).filter(([id]) => !RPG_ITEMS[id].class || RPG_ITEMS[id].class === player.className).slice(0, 18);
    const recipeText = recipes.map(([id, recipe]) => `${getRpgItemEmoji(id, RPG_ITEMS[id])} **${RPG_ITEMS[id].name}** · ${getRpgRarityEmoji(RPG_ITEMS[id].rarity)} ${RPG_ITEMS[id].rarity}\n🟡 ${recipe.gold} Gold · ${getRpgRecipeText(recipe)}\n\`!blacksmith craft ${id}\``).join('\n\n');
    return new EmbedBuilder()
        .setColor('#A04000')
        .setTitle('🔨🔥 Guild Blacksmith Forge')
        .setDescription(`${getRpgNpcLine('blacksmith', 'forgeOpen', player)}\n\n${recipeText}`.slice(0, 4096))
        .setFooter({ text: '⚒️ Upgrade: !blacksmith upgrade weapon/armor · 🔧 Repair: !blacksmith repair' })
        .setTimestamp();
}

async function executeRpgSale(messageOrInteraction, player, itemId, quantity) {
    const item = RPG_ITEMS[itemId];
    if (!item || !['part', 'material'].includes(item.type)) {
        return {
            ok: false,
            message: `🏰 Only monster parts and materials can be sold at the guild exchange.\n\n${getRpgNpcLine('receptionist', 'saleCancelled', player)}`
        };
    }
    const owned = Number(player.inventory[itemId] || 0);
    const sellQuantity = quantity === 'all' ? owned : Math.max(1, Number(quantity || 1));
    if (owned < sellQuantity) {
        return {
            ok: false,
            message: `🎒 You only own **${owned}× ${item.name}**.\n\n${getRpgNpcLine('receptionist', 'saleCancelled', player)}`
        };
    }
    removeRpgInventory(player, itemId, sellQuantity);
    const value = item.sell * sellQuantity;
    player.gold += value;
    player.counters.partsSold = Number(player.counters.partsSold || 0) + sellQuantity;
    if (player.counters.partsSold >= 1) unlockRpgAchievement(player, 'First Monster Part Sold');
    saveRpgStore();
    return {
        ok: true,
        message: `🏰🪙 Sold ${getRpgItemEmoji(itemId, item)} **${sellQuantity}× ${item.name}** for **${value} Gold**. 🟡\n\n${getRpgNpcLine('receptionist', 'sale', player, { item: item.name, quantity: sellQuantity, gold: value })}\n\n${getRpgNpcLine('quartermaster', 'loot', player, { item: item.name, quantity: sellQuantity })}`
    };
}

async function handleRpgSellCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (String(args[0] || '').toLowerCase() === 'allcommon') {
        let total = 0;
        let quantity = 0;
        for (const [itemId, owned] of Object.entries({ ...player.inventory })) {
            const item = RPG_ITEMS[itemId];
            if (!item || !['part', 'material'].includes(item.type) || item.rarity !== 'Common') continue;
            total += item.sell * owned;
            quantity += owned;
            removeRpgInventory(player, itemId, owned);
        }
        player.gold += total;
        player.counters.partsSold = Number(player.counters.partsSold || 0) + quantity;
        if (quantity > 0) unlockRpgAchievement(player, 'First Monster Part Sold');
        saveRpgStore();
        return message.reply(quantity
            ? `🟡 Sold **${quantity} common parts** for **${total} Gold**.\n\n${getRpgNpcLine('receptionist', 'sale', player, { item: 'common monster parts', quantity, gold: total })}`
            : `You have no common monster parts to sell.\n\n${getRpgNpcLine('receptionist', 'saleCancelled', player)}`);
    }
    const possibleQuantity = args.at(-1);
    const quantity = possibleQuantity === 'all' ? 'all' : Math.max(1, Number.parseInt(possibleQuantity || '1', 10) || 1);
    const hasQuantity = possibleQuantity === 'all' || Number.isFinite(Number.parseInt(possibleQuantity, 10));
    const query = args.slice(0, hasQuantity ? -1 : undefined).join(' ').toLowerCase().trim();
    const itemId = Object.keys(player.inventory).find(id => id === query.replace(/\s+/g, '_') || RPG_ITEMS[id]?.name.toLowerCase() === query);
    const item = RPG_ITEMS[itemId];
    if (!item) {
        return message.reply(`Use \`!sell item-name quantity\` or \`!sell allcommon\`.\n\n${getRpgNpcLine('receptionist', 'saleCancelled', player)}`);
    }
    if (['Rare', 'Epic', 'Legendary', 'Mythic'].includes(item.rarity)) {
        const token = crypto.randomBytes(5).toString('hex');
        rpgPendingSales.set(token, {
            guildId: message.guild.id,
            userId: message.author.id,
            itemId,
            quantity,
            expiresAt: Date.now() + 60000
        });
        return message.reply({
            content: `⚠️ **${item.name}** is ${item.rarity}. Confirm this sale?\n\n${getRpgNpcLine('receptionist', 'saleReview', player, { item: item.name, rarity: item.rarity })}`,
            components: [new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`rpg_sale:${token}:yes`).setLabel('Confirm Sale').setEmoji('🪙').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`rpg_sale:${token}:no`).setLabel('Keep Material').setEmoji('🛡️').setStyle(ButtonStyle.Secondary)
            )]
        });
    }
    const result = await executeRpgSale(message, player, itemId, quantity);
    await message.reply(result.message);
}

async function handleRpgRankupCommand(message) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const index = getRpgRankIndex(player.guildRank);
    const nextRank = RPG_RANKS[index + 1];
    if (!nextRank) return message.reply(`👑🏆 You already hold the highest guild rank: **Platinum**.\n\n${getRpgNpcLine('guildMaster', 'platinum', player)}`);
    const required = RPG_RANK_REQUIREMENTS[nextRank];
    if (player.guildReputation < required) {
        return message.reply(`🏰 You need **${required} Guild Reputation** to reach ${getRpgRankEmoji(nextRank)} ${nextRank}. Current: **${player.guildReputation}**.\n\n${getRpgNpcLine('guildMaster', 'training', player)}`);
    }
    player.guildRank = nextRank;
    player.gold += 500 * (index + 1);
    player.statPoints += 5;
    player.skillPoints += 2;
    unlockRpgAchievement(player, `${nextRank} Adventurer`);
    if (nextRank === 'Platinum') unlockRpgAchievement(player, 'Platinum Hero');
    saveRpgStore();
    await message.channel.send({ content: '🎺✨ **A guild-wide fanfare echoes through the hall!**', embeds: [new EmbedBuilder()
        .setColor(RPG_RANK_COLORS[nextRank])
        .setTitle(`🏰 ${getRpgRankEmoji(nextRank)} Guild Rank Promotion!`)
        .setDescription(`The Guild Master raises the ceremonial seal.\n\n**${player.username} is now a ${nextRank}-rank adventurer!**\n\n${getRpgNpcLine('guildMaster', nextRank === 'Platinum' ? 'platinum' : 'rankUp', player, { rank: nextRank })}\n\n${getRpgNpcLine('receptionist', 'rankUp', player, { adventurer: player.username, rank: `${getRpgRankEmoji(nextRank)} ${nextRank}` })}\n\n${getRpgNpcLine('bard', 'achievement', player, { rank: nextRank })}`)
        .addFields(
            { name: '🎁 Promotion Rewards', value: `🟡 ${500 * (index + 1)} Gold\n📊 5 stat points\n✨ 2 skill points\n🔓 New ${nextRank} contracts`, inline: true },
            { name: '📖 Guild Record', value: `🏅 Achievement: **${nextRank} Adventurer**\n${nextRank === 'Platinum' ? '👑 Title unlocked: **Platinum Hero**' : '⚔️ Stronger threats now await.'}`, inline: true }
        )
        .setFooter({ text: 'The Guild Master approved the promotion, and the Receptionist updated the guild ledger.' })
        .setTimestamp()] });
}

function buildRpgMissionEmbed(player, type) {
    const mission = ensureRpgMissions(player, type);
    const labelMap = {
        monstersDefeated: ['⚔️', 'Defeat monsters'], contractsCompleted: ['📜', 'Complete contracts'], partsSold: ['🦴', 'Sell monster parts'], dungeonClears: ['🏰', 'Clear dungeons'], itemsCrafted: ['🔨', 'Craft or upgrade items'],
        bossesDefeated: ['👑', 'Defeat bosses'], reputationEarned: ['🏰', 'Earn Guild Reputation'], dragonsDefeated: ['🐉', 'Defeat dragon enemies']
    };
    const lines = Object.entries(mission.requirements).map(([key, required]) => {
        const progress = Math.min(required, getRpgMissionProgress(player, mission, key));
        const [emoji, label] = labelMap[key] || ['🎯', key];
        return `${progress >= required ? '✅' : '⬜'} ${emoji} **${label}:** ${progress}/${required} \`${buildRpgProgressBar(progress, required, 8)}\``;
    });
    const complete = Object.entries(mission.requirements).every(([key, required]) => getRpgMissionProgress(player, mission, key) >= required);
    return new EmbedBuilder()
        .setColor(type === 'daily' ? '#3498DB' : '#8E44AD')
        .setTitle(type === 'daily' ? '☀️📜 Daily Guild Missions' : '🌙📜 Weekly Guild Missions')
        .setDescription(`${getRpgNpcLine('receptionist', 'missionBoard', player, { mission: type })}\n\n${lines.join('\n')}`.slice(0, 4096))
        .addFields({ name: '🎁 Reward Bundle', value: `🟡 ${mission.rewards.gold} Gold · ✨ ${mission.rewards.exp} EXP · 🏰 ${mission.rewards.rep} Rep · 🎟️ ${mission.rewards.tokens} Guild Token(s)`, inline: false })
        .setFooter({ text: mission.claimed ? '✅ Rewards already claimed.' : complete ? `🎁 Ready! Use !${type} claim` : 'Progress updates automatically as you play.' })
        .setTimestamp();
}

async function handleRpgMissionCommand(message, type, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const mission = ensureRpgMissions(player, type);
    if (String(args[0] || '').toLowerCase() === 'claim') {
        if (mission.claimed) return message.reply(`Your ${type} rewards are already claimed.\n\n${getRpgNpcLine('receptionist', 'missionBoard', player, { mission: type })}`);
        const complete = Object.entries(mission.requirements).every(([key, required]) => getRpgMissionProgress(player, mission, key) >= required);
        if (!complete) return message.reply(`Complete every ${type} mission before claiming the bundle.\n\n${getRpgNpcLine('receptionist', 'missionBoard', player, { mission: type })}`);
        mission.claimed = true;
        player.gold += mission.rewards.gold;
        player.guildReputation += mission.rewards.rep;
        addRpgInventory(player, 'special_token', mission.rewards.tokens);
        const lines = [];
        addRpgExp(player, mission.rewards.exp, lines);
        saveRpgStore();
        return message.reply(`🎁 Claimed ${type} rewards: ${mission.rewards.gold} Gold, ${mission.rewards.exp} EXP, ${mission.rewards.rep} Reputation, and ${mission.rewards.tokens} Guild Token(s).\n\n${getRpgNpcLine('receptionist', 'missionClaimed', player, { mission: type })}\n\n${getRpgNpcLine('bard', 'achievement', player, { mission: type })}`);
    }
    saveRpgStore();
    await message.channel.send({ embeds: [buildRpgMissionEmbed(player, type)] });
}

function getRpgDungeonByInput(input) {
    const query = String(input || '').toLowerCase().trim();
    if (!query) return null;
    const numeric = Number.parseInt(query, 10);
    const list = Object.entries(RPG_DUNGEONS);
    if (Number.isFinite(numeric) && numeric >= 1 && numeric <= list.length) return { id: list[numeric - 1][0], ...list[numeric - 1][1] };
    const found = list.find(([id, dungeon]) => id === query.replace(/\s+/g, '_') || dungeon.name.toLowerCase() === query);
    return found ? { id: found[0], ...found[1] } : null;
}


async function handleRpgDungeonCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (!args.length) {
        const available = Object.entries(RPG_DUNGEONS).filter(([, dungeon]) => canAccessRpgRank(player.guildRank, dungeon.rank));
        const dungeonList = available.map(([id, dungeon], index) => `${getRpgDungeonEmoji(id)} **${index + 1}. ${dungeon.name}** · ${getRpgRankEmoji(dungeon.rank)} ${dungeon.rank}\n⭐ Recommended Lv.${dungeon.level} · 🎁 🟡 ${dungeon.reward.gold} / ✨ ${dungeon.reward.exp}\n\`!dungeon ${id} Normal\``).join('\n\n');
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor('#34495E')
            .setTitle('🏰🗺️ Guild Dungeon Registry')
            .setDescription(`${getRpgNpcLine('scout', 'dungeonEntry', player)}\n\n${getRpgNpcLine('guildMaster', 'dungeonWarning', player)}\n\n${dungeonList}`.slice(0, 4096))
            .addFields({ name: '⚔️ Difficulties', value: Object.keys(RPG_DUNGEON_DIFFICULTIES).map(name => `${getRpgDifficultyEmoji(name)} ${name}`).join(' · '), inline: false })
            .setFooter({ text: 'Five rooms: enemies, a random event, mini-boss, final boss, and reward chest.' })
            .setTimestamp()] });
    }
    if (getRpgBattleOwner(message.guild.id, message.author.id)) return message.reply('⚔️ Finish your current battle first.');
    const party = getRpgParty(player);
    if (party && party.leaderId !== player.userId) return message.reply('👑 Only the party leader can enter a shared dungeon.');
    const dungeon = getRpgDungeonByInput(args[0]);
    const difficultyName = Object.keys(RPG_DUNGEON_DIFFICULTIES).find(name => name.toLowerCase() === String(args[1] || 'Normal').toLowerCase()) || 'Normal';
    const difficultyData = RPG_DUNGEON_DIFFICULTIES[difficultyName];
    if (!dungeon || !canAccessRpgRank(player.guildRank, dungeon.rank)) return message.reply(`🔒 That dungeon is not available at your rank.\n\n${getRpgNpcLine('guildMaster', 'dungeonWarning', player)}`);
    if (player.level + 5 < dungeon.level) return message.reply(`⚠️ Reach at least **Level ${dungeon.level - 5}** before entering ${getRpgDungeonEmoji(dungeon.id)} **${dungeon.name}**.\n\n${getRpgNpcLine('guildMaster', 'training', player)}`);
    const remaining = checkRpgCooldown(player, 'dungeon', RPG_DUNGEON_COOLDOWN_MS);
    if (remaining) return message.reply(`⏳ Dungeon entry is available in **${formatRpgDuration(remaining)}**.`);
    const rankScale = 1 + getRpgRankIndex(dungeon.rank) * 0.08;
    createRpgBattle(player, dungeon.enemies[0], { type: 'dungeon', dungeonId: dungeon.id, dungeonRoom: 0, difficulty: difficultyName, difficultyMultiplier: rankScale * difficultyData.enemy });
    player.activeBattle.log.push(`${getRpgDungeonEmoji(dungeon.id)} ${getRpgDifficultyEmoji(difficultyName)} The party enters **${difficultyName} ${dungeon.name}**.`);
    player.activeBattle.log.push(getRpgNpcLine('scout', 'dungeonEntry', player, { dungeon: dungeon.name }));
    player.activeBattle.log.push(getRpgNpcLine('guildMaster', 'dungeonWarning', player, { dungeon: dungeon.name }));
    saveRpgStore();
    await sendRpgBattleMessage(message, player);
}

function getRpgBossesForPlayer(player) {
    return Object.entries(RPG_ENEMIES).filter(([, enemy]) => enemy.boss && canAccessRpgRank(player.guildRank, enemy.rank));
}


async function handleRpgBossCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    if (!args.length) {
        const bosses = getRpgBossesForPlayer(player);
        const bossList = bosses.map(([id, boss], index) => `${getRpgEnemyEmoji(id)} **${index + 1}. ${boss.name}** · ${getRpgRankEmoji(boss.rank)} ${boss.rank}\n❤️ ${boss.hp} HP · 💥 ${boss.damage} Damage · 🎁 ${boss.drops.map(([drop]) => `${getRpgItemEmoji(drop, RPG_ITEMS[drop])} ${RPG_ITEMS[drop]?.name}`).join(', ')}\n\`!boss ${id}\``).join('\n\n');
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor('#922B21')
            .setTitle('👑🔥 Guild Boss Contract Registry')
            .setDescription(`${getRpgNpcLine('guildMaster', 'bossWarning', player)}\n\n${getRpgNpcLine('scout', 'bossLocated', player, { enemy: 'the listed targets', location: 'their marked territories' })}\n\n${bossList}`.slice(0, 4096))
            .setFooter({ text: 'Bosses have phase changes, stronger attacks, status effects, and rare drops.' })
            .setTimestamp()] });
    }
    if (getRpgBattleOwner(message.guild.id, message.author.id)) return message.reply('⚔️ Finish your current battle first.');
    const party = getRpgParty(player);
    if (party && party.leaderId !== player.userId) return message.reply('👑 Only the party leader can begin a shared boss fight.');
    const query = args.join(' ').toLowerCase().trim();
    const bosses = getRpgBossesForPlayer(player);
    const numeric = Number.parseInt(query, 10);
    const entry = Number.isFinite(numeric) ? bosses[numeric - 1] : bosses.find(([id, boss]) => id === query.replace(/\s+/g, '_') || boss.name.toLowerCase() === query);
    if (!entry) return message.reply(`🔒 That boss is unavailable at your current rank.\n\n${getRpgNpcLine('guildMaster', 'bossWarning', player)}`);
    const remaining = checkRpgCooldown(player, 'boss', RPG_BOSS_COOLDOWN_MS);
    if (remaining) return message.reply(`⏳ Boss contracts are available in **${formatRpgDuration(remaining)}**.`);
    createRpgBattle(player, entry[0], { type: entry[1].dragon ? 'dragon' : 'boss' });
    player.activeBattle.log.push(`🚨 ${getRpgEnemyEmoji(entry[0])} **BOSS CONTRACT ENGAGED!**`);
    player.activeBattle.log.push(getRpgNpcLine('scout', 'bossLocated', player, { enemy: entry[1].name, location: player.activeContract?.location || 'the marked territory' }));
    player.activeBattle.log.push(getRpgNpcLine('guildMaster', 'bossWarning', player, { enemy: entry[1].name }));
    saveRpgStore();
    await sendRpgBattleMessage(message, player);
}

async function handleRpgLeaderboardCommand(message, args) {
    const category = String(args[0] || 'level').toLowerCase();
    const categories = {
        level: ['level', '⭐ Highest Level', '⭐'], reputation: ['guildReputation', '🏰 Guild Reputation', '🏰'], contracts: ['counters.contractsCompleted', '📜 Contracts Completed', '📜'],
        bosses: ['counters.bossesDefeated', '👑 Bosses Defeated', '👑'], dragons: ['counters.dragonsDefeated', '🐉 Dragons Defeated', '🐉'], gold: ['gold', '🟡 Richest Adventurers', '🟡'], dungeons: ['counters.dungeonClears', '🏰 Dungeon Clears', '🏰']
    };
    const selected = categories[category] || categories.level;
    const getValue = player => selected[0].split('.').reduce((value, key) => value?.[key], player) || 0;
    const players = Object.values(rpgStore.players).filter(player => player.guildId === message.guild.id).sort((a, b) => getValue(b) - getValue(a)).slice(0, 10);
    const viewer = getRpgPlayer(message.guild.id, message.author.id);
    const medals = ['🥇', '🥈', '🥉'];
    const rankingText = players.map((player, index) => `${medals[index] || `**${index + 1}.**`} ${RPG_CLASS_DATA[player.className]?.emoji || '🧙'} <@${player.userId}> · ${getRpgRankEmoji(player.guildRank)} ${player.guildRank}\n└ ${selected[2]} **${getValue(player)}**`).join('\n\n') || '📭 No adventurers have joined yet.';
    await message.channel.send({ embeds: [new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle(`🏆 ${selected[1]} Leaderboard`)
        .setDescription(`${getRpgNpcLine('bard', 'leaderboard', viewer, { guildId: message.guild.id, userId: message.author.id, adventurer: message.author.username })}\n\n${rankingText}`.slice(0, 4096))
        .setFooter({ text: 'Categories: level · reputation · contracts · bosses · dragons · gold · dungeons' })
        .setTimestamp()] });
}

async function handleRpgPartyCommand(message, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const action = String(args[0] || '').toLowerCase();
    let party = getRpgParty(player);
    if (!action || action === 'status') {
        if (!party) return message.reply(`🧭 You are not in a party. Use \`!party invite @user\` to create one.\n\n${getRpgNpcLine('bard', 'party', player)}`);
        cleanRpgParty(party);
        saveRpgStore();
        const partyList = party.members.map(id => {
            const member = getRpgPlayer(message.guild.id, id);
            return `${id === party.leaderId ? '👑' : RPG_CLASS_DATA[member?.className]?.emoji || '⚔️'} <@${id}> · ${member ? `${getRpgRankEmoji(member.guildRank)} ${member.guildRank} · ⭐ Lv.${member.level}` : 'Unknown'}`;
        }).join('\n');
        return message.channel.send({ embeds: [new EmbedBuilder()
            .setColor('#16A085')
            .setTitle('🤝⚔️ Adventurer Party')
            .setDescription(`${getRpgNpcLine('guildMaster', 'party', player)}\n\n${getRpgNpcLine('bard', 'party', player)}\n\n${partyList}`.slice(0, 4096))
            .addFields({ name: '🎯 Party Benefits', value: 'Shared boss and dungeon progress · Split EXP · Individual loot drops', inline: false })
            .setFooter({ text: `${party.members.length}/${RPG_MAX_PARTY_SIZE} members · Only the leader starts shared encounters.` })
            .setTimestamp()] });
    }
    if (action === 'invite') {
        const target = message.mentions.users.first();
        if (!target || target.bot || target.id === message.author.id) return message.reply('🤝 Mention another adventurer: `!party invite @user`.');
        const targetPlayer = getRpgPlayer(message.guild.id, target.id);
        if (!targetPlayer) return message.reply('🏰 That member must use `!start` first.');
        if (targetPlayer.partyId) return message.reply('🤝 That adventurer is already in a party.');
        if (!party) party = createRpgParty(message.guild.id, message.author.id);
        if (party.leaderId !== message.author.id) return message.reply('👑 Only the party leader can invite members.');
        if (party.members.length >= RPG_MAX_PARTY_SIZE) return message.reply('🚫 Your party is full.');
        const token = crypto.randomBytes(5).toString('hex');
        rpgPartyInvites.set(target.id, { token, guildId: message.guild.id, partyId: party.id, inviterId: message.author.id, expiresAt: Date.now() + 120000 });
        return message.channel.send({ content: `📨 ${target}, ${RPG_CLASS_DATA[player.className]?.emoji || '⚔️'} **${message.author.username}** invited you to an adventurer party!\n\n${getRpgNpcLine('receptionist', 'party', player)}`, components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`rpg_party:${token}:yes`).setLabel('Join Party').setEmoji('🤝').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`rpg_party:${token}:no`).setLabel('Decline').setEmoji('✖️').setStyle(ButtonStyle.Secondary)
        )] });
    }
    if (action === 'accept') {
        const invite = rpgPartyInvites.get(message.author.id);
        if (!invite || invite.expiresAt < Date.now()) return message.reply('⌛ You have no active party invitation.');
        const targetParty = rpgStore.parties[invite.partyId];
        if (!targetParty || targetParty.members.length >= RPG_MAX_PARTY_SIZE) return message.reply('🚫 That party is no longer available.');
        targetParty.members.push(message.author.id);
        player.partyId = targetParty.id;
        rpgPartyInvites.delete(message.author.id);
        saveRpgStore();
        return message.reply(`🤝✨ You joined the adventurer party!\n\n${getRpgNpcLine('guildMaster', 'party', player)}`);
    }
    if (action === 'leave') {
        if (!party) return message.reply('🤝 You are not in a party.');
        party.members = party.members.filter(id => id !== message.author.id);
        player.partyId = null;
        if (party.leaderId === message.author.id) party.leaderId = party.members[0] || null;
        cleanRpgParty(party);
        saveRpgStore();
        return message.reply(`🚪 You left the adventurer party.\n\n${getRpgNpcLine('bard', 'party', player)}`);
    }
    if (action === 'kick') {
        if (!party || party.leaderId !== message.author.id) return message.reply('👑 Only the party leader can remove members.');
        const target = message.mentions.users.first();
        if (!target || target.id === message.author.id || !party.members.includes(target.id)) return message.reply('🎯 Mention a party member to remove.');
        party.members = party.members.filter(id => id !== target.id);
        const targetPlayer = getRpgPlayer(message.guild.id, target.id);
        if (targetPlayer) targetPlayer.partyId = null;
        saveRpgStore();
        return message.reply(`🚪 Removed **${target.username}** from the party.\n\n${getRpgNpcLine('guildMaster', 'party', player)}`);
    }
    await message.reply('🤝 Party commands: `!party` · `!party invite @user` · `!party accept` · `!party leave` · `!party kick @user`.');
}

async function handleRpgAchievementsCommand(message, showTitles = false) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    if (!player) return message.reply('🏰 Use `!start` first.');
    const values = showTitles ? player.titles : player.achievements;
    const achievementEmoji = value => /Dragon/.test(value) ? '🐉' : /Dungeon/.test(value) ? '🏰' : /Mage|Arcane/.test(value) ? '🔮' : /Swordsman|Blade/.test(value) ? '⚔️' : /Platinum/.test(value) ? '👑' : /Gold/.test(value) ? '🥇' : /Silver/.test(value) ? '🥈' : /Bronze|First/.test(value) ? '🥉' : '🏆';
    const list = values.length ? values.map(value => `${value === player.equippedTitle ? '👑' : achievementEmoji(value)} **${value}**${value === player.equippedTitle ? ' · Equipped' : ''}`).join('\n') : '🔒 No entries unlocked yet.';
    await message.channel.send({ embeds: [new EmbedBuilder()
        .setColor(showTitles ? '#D4AC0D' : '#7D3C98')
        .setTitle(showTitles ? '🏅✨ Adventurer Titles' : '🏆✨ Adventurer Achievements')
        .setDescription(`${getRpgNpcLine('bard', showTitles ? 'titleEquip' : 'achievement', player)}\n\n${list}`.slice(0, 4096))
        .setFooter({ text: showTitles ? 'Equip one with !profile title title-name' : 'Achievements and titles unlock automatically as your legend grows.' })
        .setTimestamp()] });
}

async function handleRpgInteraction(interaction) {
    const customId = interaction.customId;
    if (interaction.isStringSelectMenu() && customId.startsWith('rpg_npc:')) {
        const [, guildId, userId] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) {
            return interaction.reply({ content: '🔒 This Guild staff conversation belongs to another adventurer.', ephemeral: true });
        }
        const player = getRpgPlayer(guildId, userId);
        const npcId = interaction.values[0];
        if (!player || !RPG_NPC_PROFILES[npcId]) {
            return interaction.reply({ content: '💬 That Guild staff member is unavailable.', ephemeral: true });
        }
        touchRpgPlayer(player, `spoke with ${RPG_NPC_PROFILES[npcId].name}`);
        saveRpgStore();
        return interaction.update({
            embeds: [buildRpgNpcConversationEmbed(player, npcId)],
            components: [buildRpgNpcSelectRow(player), buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)]
        });
    }
    if (interaction.isStringSelectMenu() && customId.startsWith('rpg_class:')) {
        const [, guildId, userId] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) return interaction.reply({ content: 'This class selection belongs to another adventurer.', ephemeral: true });
        if (getRpgPlayer(guildId, userId)) return interaction.reply({ content: 'Your adventurer profile already exists.', ephemeral: true });
        const className = interaction.values[0];
        if (!RPG_CLASS_DATA[className]) return interaction.reply({ content: 'Invalid class selection.', ephemeral: true });
        const player = createRpgPlayer(guildId, interaction.user, className);
        return interaction.update({ content: `🎺✨ Welcome to the Adventurer Guild, **${interaction.user.username}**! Your legend begins now.\n\n${getRpgNpcLine('receptionist', 'classRegistered', player, { className })}\n\n${getRpgNpcLine('quartermaster', 'greeting', player)}`, embeds: [buildRpgProfileEmbed(player, interaction.user)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
    }
    if (interaction.isStringSelectMenu() && customId.startsWith('rpg_contract:')) {
        const [, guildId, userId] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) {
            return interaction.reply({ content: 'This contract board belongs to another adventurer.', ephemeral: true });
        }
        const player = getRpgPlayer(guildId, userId);
        const contract = (RPG_CONTRACTS[player?.guildRank] || []).find(entry => entry.id === interaction.values[0]);
        if (!player || !contract) return interaction.reply({ content: 'The contract is no longer available.', ephemeral: true });
        const result = acceptRpgContract(player, contract);
        if (!result.ok) {
            return interaction.reply({
                content: `${result.message}

${getRpgNpcLine('receptionist', 'contractDenied', player, { reason: result.message })}`,
                ephemeral: true
            });
        }
        return interaction.update({
            embeds: [new EmbedBuilder()
                .setColor(RPG_RANK_COLORS[player.guildRank])
                .setTitle(`${getRpgContractEmoji(contract.type)}✨ Contract Accepted!`)
                .setDescription(`📜 **${contract.name}**
📍 ${contract.location}
🎯 Objective: ${contract.amount}
🎁 🟡 ${contract.gold} · ✨ ${contract.exp} EXP · 🏰 ${contract.rep} Rep

${getRpgNpcLine('receptionist', 'contractAccepted', player, { contract: contract.name })}\n\n${getRpgNpcLine('scout', 'targetLocated', player, { contract: contract.name, location: contract.location })}`)
                .setTimestamp()],
            components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)]
        });
    }
    if (!interaction.isButton()) return false;
    if (customId.startsWith('rpg_menu:')) {
        const [, guildId, userId, action] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) return interaction.reply({ content: '🔒 This Guild Hall menu belongs to another adventurer.', ephemeral: true });
        const player = getRpgPlayer(guildId, userId);
        if (!player) return interaction.reply({ content: '🏰 RPG profile not found. Use !start.', ephemeral: true });
        if (action === 'contracts') {
            const components = [];
            if (!player.activeContract) components.push(buildRpgContractSelectRow(player));
            components.push(buildRpgGuildNavigationRow(player));
            return interaction.update({ embeds: [buildRpgContractsEmbed(player)], components });
        }
        if (action === 'inventory') return interaction.update({ embeds: [buildRpgInventoryEmbed(player, 0)], components: [buildRpgInventoryRow(player, 0), buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        if (action === 'shop') return interaction.update({ embeds: [buildRpgShopEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        if (action === 'blacksmith') return interaction.update({ embeds: [buildRpgBlacksmithEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        if (action === 'profile') return interaction.update({ embeds: [buildRpgProfileEmbed(player, interaction.user)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        return interaction.update({ embeds: [buildRpgGuildEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
    }
    if (customId.startsWith('rpg_quick:')) {
        const [, guildId, userId, action] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) return interaction.reply({ content: '🔒 These quick actions belong to another adventurer.', ephemeral: true });
        const player = getRpgPlayer(guildId, userId);
        if (!player) return interaction.reply({ content: '🏰 RPG profile not found. Use !start.', ephemeral: true });
        touchRpgPlayer(player, `used the ${action} quick action`);
        if (action === 'refresh') {
            saveRpgStore();
            return interaction.update({ embeds: [buildRpgGuildEmbed(player)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        }
        if (action === 'daily' || action === 'weekly') {
            saveRpgStore();
            return interaction.update({ embeds: [buildRpgMissionEmbed(player, action)], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        }
        if (action === 'party') {
            const party = getRpgParty(player);
            const description = party
                ? party.members.map(id => {
                    const member = getRpgPlayer(guildId, id);
                    return `${id === party.leaderId ? '👑' : RPG_CLASS_DATA[member?.className]?.emoji || '⚔️'} <@${id}> · ${member ? `${getRpgRankEmoji(member.guildRank)} ${member.guildRank} · ⭐ Lv.${member.level}` : 'Unknown'}`;
                }).join('\n')
                : '🧭 You are adventuring solo. Use `!party invite @user` to form a party of up to four players.';
            saveRpgStore();
            return interaction.update({ embeds: [new EmbedBuilder().setColor('#16A085').setTitle('🤝⚔️ Party Camp').setDescription(`${getRpgNpcLine('bard', 'party', player)}\n\n${description}`.slice(0, 4096)).setFooter({ text: party ? `${party.members.length}/${RPG_MAX_PARTY_SIZE} members` : 'Parties share encounters, EXP, and individual loot.' }).setTimestamp()], components: [buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
        }
        if (action === 'hunt') {
            if (getRpgBattleOwner(guildId, userId)) return interaction.reply({ content: '⚔️ You are already in battle. Use `!battle` or return to the active battle message.', ephemeral: true });
            if (!player.activeContract) return interaction.reply({ content: '📜 Accept a Hunt or Gathering contract first.', ephemeral: true });
            if (!['Hunt', 'Gathering'].includes(player.activeContract.type)) return interaction.reply({ content: `🧭 This is a ${player.activeContract.type} contract. Use the matching boss or dungeon command.`, ephemeral: true });
            const party = getRpgParty(player);
            if (party && party.leaderId !== player.userId) return interaction.reply({ content: '👑 Only the party leader can start a shared hunt.', ephemeral: true });
            const remaining = checkRpgCooldown(player, 'hunt', RPG_HUNT_COOLDOWN_MS);
            if (remaining) return interaction.reply({ content: `⏳ Hunt ready in **${formatRpgDuration(remaining)}**.`, ephemeral: true });
            const battle = createRpgBattle(player, player.activeContract.target, { type: 'hunt' });
            battle.log.push(`📜 Contract progress: ${player.activeContract.progress || 0}/${player.activeContract.amount}`);
            saveRpgStore();
            return interaction.update({ embeds: [buildRpgBattleEmbed(player)], components: buildRpgBattleRows(player) });
        }
    }
    if (customId.startsWith('rpg_battle:')) {
        const [, battleId, action] = customId.split(':');
        const ownerPlayer = getRpgBattleOwner(interaction.guildId, interaction.user.id);
        if (!ownerPlayer?.activeBattle || ownerPlayer.activeBattle.id !== battleId) return interaction.reply({ content: 'That battle has ended or you are not a participant.', ephemeral: true });
        const actor = getRpgPlayer(interaction.guildId, interaction.user.id);
        const result = resolveRpgBattleRound(ownerPlayer, actor, action);
        if (!result.ok) return interaction.reply({ content: result.message, ephemeral: true });
        if (result.victory && !ownerPlayer.activeBattle) {
            return interaction.update({ embeds: [new EmbedBuilder().setColor('#F1C40F').setTitle('🏆✨ Victory!').setDescription((result.rewardLog || ['Victory!']).join('\n').slice(0, 4096))], components: [] });
        }
        if (result.defeat || result.fled || !ownerPlayer.activeBattle) {
            return interaction.update({ content: result.defeat ? `💀🏥 The party was defeated and carried back to the Guild.\n\n${getRpgNpcLine('guildMaster', 'defeat', actor)}\n\n${getRpgNpcLine('receptionist', 'recovery', actor)}` : `🏃💨 The encounter has ended.\n\n${getRpgNpcLine('scout', 'return', actor)}`, embeds: [], components: [] });
        }
        return interaction.update({ embeds: [buildRpgBattleEmbed(ownerPlayer)], components: buildRpgBattleRows(ownerPlayer) });
    }
    if (customId.startsWith('rpg_inv:')) {
        const [, guildId, userId, page] = customId.split(':');
        if (interaction.user.id !== userId || interaction.guildId !== guildId) return interaction.reply({ content: 'This inventory belongs to another adventurer.', ephemeral: true });
        const player = getRpgPlayer(guildId, userId);
        if (!player) return interaction.reply({ content: 'RPG profile not found.', ephemeral: true });
        return interaction.update({ embeds: [buildRpgInventoryEmbed(player, page)], components: [buildRpgInventoryRow(player, page), buildRpgGuildNavigationRow(player), buildRpgGuildQuickRow(player)] });
    }
    if (customId.startsWith('rpg_sale:')) {
        const [, token, answer] = customId.split(':');
        const sale = rpgPendingSales.get(token);
        if (!sale || sale.expiresAt < Date.now() || sale.userId !== interaction.user.id || sale.guildId !== interaction.guildId) {
            return interaction.reply({ content: 'That sale confirmation expired.', ephemeral: true });
        }
        rpgPendingSales.delete(token);
        const player = getRpgPlayer(sale.guildId, sale.userId);
        if (answer !== 'yes') {
            return interaction.update({
                content: `🛑 Sale cancelled. Your materials are safe.

${getRpgNpcLine('receptionist', 'saleCancelled', player)}`,
                components: []
            });
        }
        const result = await executeRpgSale(interaction, player, sale.itemId, sale.quantity);
        return interaction.update({ content: result.message, components: [] });
    }
    if (customId.startsWith('rpg_party:')) {
        const [, token, answer] = customId.split(':');
        const invite = rpgPartyInvites.get(interaction.user.id);
        if (!invite || invite.token !== token || invite.expiresAt < Date.now()) return interaction.reply({ content: 'That party invitation expired.', ephemeral: true });
        rpgPartyInvites.delete(interaction.user.id);
        if (answer !== 'yes') return interaction.update({ content: '✖️ Party invitation declined.', components: [] });
        const party = rpgStore.parties[invite.partyId];
        const player = getRpgPlayer(invite.guildId, interaction.user.id);
        if (!party || !player || party.members.length >= RPG_MAX_PARTY_SIZE || player.partyId) return interaction.reply({ content: 'The party is no longer available.', ephemeral: true });
        party.members.push(interaction.user.id);
        player.partyId = party.id;
        saveRpgStore();
        return interaction.update({ content: `🤝 **${interaction.user.username}** joined the adventurer party.\n\n${getRpgNpcLine('guildMaster', 'party', player)}`, components: [] });
    }
    return false;
}

const RPG_UNIQUE_COMMANDS = new Set([
    '!start', '!class', '!stats', '!skills', '!guild', '!guildstaff', '!contracts', '!accept', '!abandon', '!hunt', '!battle',
    '!inventory', '!equipment', '!shop', '!blacksmith', '!rankup', '!weekly', '!dungeon', '!boss', '!party', '!achievements', '!titles'
]);
const RPG_OVERLAPPING_COMMANDS = new Set(['!profile', '!daily', '!sell', '!leaderboard']);

async function routeRpgCommand(message, command, args) {
    const player = getRpgPlayer(message.guild.id, message.author.id);
    const explicitRpg = String(args[0] || '').toLowerCase() === 'rpg';
    if (!RPG_UNIQUE_COMMANDS.has(command) && !(RPG_OVERLAPPING_COMMANDS.has(command) && (player || explicitRpg))) return false;
    if (explicitRpg) args = args.slice(1);
    if (player) { touchRpgPlayer(player, command.slice(1)); saveRpgStore(); }
    switch (command) {
        case '!start': await handleRpgStartCommand(message); break;
        case '!profile': await handleRpgProfileCommand(message, args); break;
        case '!class': await handleRpgClassCommand(message); break;
        case '!stats': await handleRpgStatsCommand(message, args); break;
        case '!skills': await handleRpgSkillsCommand(message, args); break;
        case '!guild': await handleRpgGuildCommand(message); break;
        case '!guildstaff': await handleRpgGuildStaffCommand(message, args); break;
        case '!contracts': await handleRpgContractsCommand(message); break;
        case '!accept': await handleRpgAcceptCommand(message, args); break;
        case '!abandon': await handleRpgAbandonCommand(message); break;
        case '!hunt': await handleRpgHuntCommand(message); break;
        case '!battle': await handleRpgBattleCommand(message, args); break;
        case '!inventory': await handleRpgInventoryCommand(message, args); break;
        case '!equipment': await handleRpgEquipmentCommand(message, args); break;
        case '!shop': await handleRpgShopCommand(message, args); break;
        case '!blacksmith': await handleRpgBlacksmithCommand(message, args); break;
        case '!sell': await handleRpgSellCommand(message, args); break;
        case '!rankup': await handleRpgRankupCommand(message); break;
        case '!daily': await handleRpgMissionCommand(message, 'daily', args); break;
        case '!weekly': await handleRpgMissionCommand(message, 'weekly', args); break;
        case '!dungeon': await handleRpgDungeonCommand(message, args); break;
        case '!boss': await handleRpgBossCommand(message, args); break;
        case '!leaderboard': await handleRpgLeaderboardCommand(message, args); break;
        case '!party': await handleRpgPartyCommand(message, args); break;
        case '!achievements': await handleRpgAchievementsCommand(message, false); break;
        case '!titles': await handleRpgAchievementsCommand(message, true); break;
        default: return false;
    }
    return true;
}


// ==========================================
// PAGINATED HELP DIRECTORY
// ==========================================

function buildRpgHelpEmbed() {

    return new EmbedBuilder()
        .setColor('#9B7A3C')
        .setTitle('📜✨ Adventurer Guild RPG Command List')
        .setDescription('🔔 Welcome, adventurer. Every command below opens another path through the Guild.')
        .addFields(
            {
                name: '🧭 Start & Character',
                value: [
                    '`!start` — Create your profile and choose Swordsman or Mage.',
                    '`!profile` — View your level, resources, rank, gear, and contract.',
                    '`!profile title name` — Equip an unlocked title.',
                    '`!class` — View your class paths and unlocked abilities.',
                    '`!stats [stat] [amount]` — View or spend stat points.',
                    '`!skills [unlock] [name/number]` — View or unlock class skills.',
                    '`!achievements` / `!titles` — View earned achievements and titles.'
                ].join('\n'),
                inline: false
            },
            {
                name: '🏛️ Guild & Contracts',
                value: [
                    '`!guild` — Open the Adventurer Guild hall.',
                    '`!guildstaff [npc]` — Meet and talk with the Guild NPC cast.',
                    '`!contracts` — View rank-appropriate contracts and selection menu.',
                    '`!accept number` — Accept one main contract.',
                    '`!abandon` — Abandon your active contract.',
                    '`!rankup` — Request promotion when reputation is high enough.'
                ].join('\n'),
                inline: false
            },
            {
                name: '⚔️ Combat & Challenges',
                value: [
                    '`!hunt` — Hunt a monster for your active contract.',
                    '`!battle [attack/skill/defend/potion/flee]` — Resume or act in battle.',
                    '`!boss [boss]` — View or start multi-phase boss fights.',
                    '`!dungeon [dungeon] [difficulty]` — Enter a five-room dungeon.',
                    '`!party ...` — Create a party of up to four adventurers.'
                ].join('\n'),
                inline: false
            },
            {
                name: '🎒 Inventory, Shop & Crafting',
                value: [
                    '`!inventory [page]` / `!inventory use item` — Browse or use stored supplies.',
                    '`!equipment [equip item]` — View or equip owned gear.',
                    '`!shop [buy item quantity]` — Buy potions and combat supplies.',
                    '`!blacksmith [craft/upgrade/repair]` — Craft and improve equipment.',
                    '`!sell item quantity` / `!sell allcommon` — Sell monster parts.'
                ].join('\n'),
                inline: false
            },
            {
                name: '✨ Missions & Competition',
                value: [
                    '`!daily [claim]` — View or claim daily mission rewards.',
                    '`!weekly [claim]` — View or claim weekly mission rewards.',
                    '`!leaderboard [category]` — Compare level, reputation, wealth, bosses, dragons, contracts, or dungeon clears.'
                ].join('\n'),
                inline: false
            },
            {
                name: '📖 Help',
                value: [
                    '`!help` — Open the complete bot command directory.',
                    '`!helprpg` — Show this RPG command list.',
                    '`!howrpg` — Open the beginner gameplay guide.',
                ].join('\n'),
                inline: false
            }
        )
        .setFooter({
            text: 'Adventurer Guild Archives • Start with !start, then accept a Bronze contract.'
        });

}

async function sendRpgHelp(message) {

    await message.channel.send({
        embeds: [buildRpgHelpEmbed()],
        allowedMentions: {
            parse: []
        }
    });

}

function buildHowRpgEmbed() {

    return new EmbedBuilder()
        .setColor('#6F4E9C')
        .setTitle('🏰✨ How to Play the Adventurer Guild RPG')
        .setDescription('🔔 Welcome, new adventurer. Follow this glowing quest path to learn the main gameplay loop one step at a time.')
        .addFields(
            {
                name: '1️⃣ Start Your Adventure',
                value: 'Use `!start` to create your adventurer profile and choose your class.',
                inline: false
            },
            {
                name: '2️⃣ Choose Your Class',
                value: [
                    '**Swordsman:** melee weapons, stamina, blocking, dodging, and weapon skill trees.',
                    '**Mage:** mana, spells, elemental magic, healing, shields, and ranged attacks.'
                ].join('\n'),
                inline: false
            },
            {
                name: '3️⃣ Visit the Guild',
                value: 'Use `!guild` to open the Adventurer Guild menu. Use `!contracts` to view contracts available for your current guild rank.',
                inline: false
            },
            {
                name: '4️⃣ Accept a Contract',
                value: 'Use `!accept` to accept a contract. You can only have one main contract active at a time.',
                inline: false
            },
            {
                name: '5️⃣ Hunt Monsters',
                value: 'Use `!hunt` to fight monsters related to your contract. Battles use embeds and buttons for **Basic Attack**, **Skill**, **Defend**, **Use Potion**, and **Flee**.',
                inline: false
            },
            {
                name: '6️⃣ Collect Rewards',
                value: 'Defeating monsters gives **EXP**, **Gold**, and monster parts. Sell parts with `!sell` or save them for crafting at the blacksmith.',
                inline: false
            },
            {
                name: '7️⃣ Level Up',
                value: 'Gain EXP to level up and earn stat points and skill points. Use `!stats` to improve your character and `!skills` to unlock new abilities.',
                inline: false
            },
            {
                name: '8️⃣ Upgrade Gear',
                value: 'Use `!blacksmith` to craft and upgrade weapons and armor. Stronger gear prepares you for harder monsters, bosses, dungeons, and dragons.',
                inline: false
            },
            {
                name: '9️⃣ Rank Up',
                value: 'Complete contracts to earn Guild Reputation. Use `!rankup` when you have enough reputation to advance through **Bronze → Silver → Gold → Emerald → Diamond → Platinum**.',
                inline: false
            },
            {
                name: '🔟 Take on Bigger Challenges',
                value: 'As you grow stronger, unlock dungeons, bosses, dragon hunts, daily missions, weekly missions, titles, achievements, and leaderboards.',
                inline: false
            },
            {
                name: '🗺️ Main Gameplay Loop',
                value: '**Start → Choose Class → Accept Contract → Hunt Monsters → Get Loot → Level Up → Craft Gear → Rank Up → Fight Bosses and Dragons**',
                inline: false
            },
            {
                name: '💡 Beginner Tips',
                value: [
                    '• Start with Bronze contracts.',
                    '• Buy potions before difficult fights.',
                    '• Do not sell rare monster parts unless you are sure you do not need them.',
                    '• Upgrade your weapon often.',
                    '• Spend stat points based on your class.',
                    '• Swordsmen should focus on Strength, Defense, Health, Agility, and Stamina.',
                    '• Mages should focus on Intelligence, Mana, Health, and Defense.',
                    '• Use `!helprpg` anytime you forget the commands.'
                ].join('\n'),
                inline: false
            }
        )
        .setFooter({
            text: 'Every legendary hero began with a Bronze contract.'
        });

}

async function sendHowRpgGuide(message) {

    await message.channel.send({
        embeds: [buildHowRpgEmbed()],
        allowedMentions: {
            parse: []
        }
    });

}

const HELP_CATEGORIES = [
    {
        title: 'Start Here',
        emoji: '📘',
        description: 'General public commands and useful server information.',
        commands: [
            '`!help` — Open this paginated command directory.',
            '`!ping` — Show the bot and API latency.',
            '`!aboutbot` — Show information about this bot and its VRCLogger features.',
            '`!vrchat` / `!vrc` — Show the VRChat community information panel.',
            '`!ask [question]` — Ask the configured Gemini assistant a question.',
            '`!profile [@user/userID]` — Show a member community profile.',
            '`!avatar [@user/userID]` — Show a member avatar.',
            '`!userinfo [@user/userID]` — Show Discord account and server membership information.',
            '`!serverinfo` — Show information and statistics for this Discord server.',
            '`!staffapply [details]` — Submit a staff application.',
            '`!suggest idea` — Submit a community suggestion.'
        ]
    },
    {
        title: 'Community & Invites',
        emoji: '🌐',
        description: 'Invite tracking, events, engagement systems, configuration, and staff workflows.',
        commands: [
            '`!myinvites` — Show your tracked Discord invite count.',
            '`!invites [@user/userID]` — Show another member\'s tracked invite count.',
            '`!leaderboard` — Show the Discord invite leaderboard.',
            '`!inviteinfo CODE` — Show information about a Discord invite code.',
            '`!whoinvited @member/userID` — Show who invited a tracked member.',
            '`!event` / `!vrcevent` — Create, list, and manage VRChat community events.',
            '`!rsvp eventId yes/no/maybe` — Respond to a community event.',
            '`!onboarding` / `!welcome-setup [#channel]` — Send the onboarding panel.',
            '`!config` — Show community-system configuration and status.',
            '`!note @user/userID note` — Add a staff note to a member.',
            '`!notes @user/userID` — View staff notes for a member.',
            '`!case id` — View a moderation or ticket case.',
            '`!cases [@user/userID]` — List cases, optionally filtered to a member.',
            '`!editcase id reason` — Edit a case reason.',
            '`!automod help/on/off/block/unblock` — Configure automatic moderation.',
            '`!staffpanel` — Open the staff operations panel.',
            '`!reopen caseId [reason]` — Reopen a recorded case or workflow.',
            '`!temprole @user/userID @role duration` — Give a role temporarily.',
            '`!giveaway create/end/reroll ...` — Create and manage giveaways.',
            '`!poll question | option 1 | option 2` — Create a button-based poll.',
            '`!reactionrole` / `!rr` / `!reactionroles` / `!rrmulti` — Create single or multi-role reaction messages.',
            '`!rank [@user/userID]` — Show XP and level information.',
            '`!toplevels` / `!levelboard` / `!levels [page]` — Show the paginated XP leaderboard.',
            '`!synclevels` / `!levelsync` / `!backfilllevels [max-per-channel]` — Backfill XP from message history.'
        ]
    },
    {
        title: 'Adventurer Guild RPG',
        emoji: '⚔️',
        description: 'Complete fantasy RPG gameplay with persistent profiles, contracts, combat, loot, crafting, rank progression, missions, dungeons, bosses, and parties.',
        commands: [
            '`!start` — Create an adventurer and choose Swordsman or Mage.',
            '`!profile [title name]` — View your RPG profile or equip a title.',
            '`!class` — View class paths and unlocked skills.',
            '`!stats [stat] [amount]` — View or spend stat points.',
            '`!skills [unlock] [name/number]` — View or unlock skills.',
            '`!guild` — Open the Adventurer Guild hall.',
            '`!guildstaff [npc]` — Meet the named Guild NPCs and cycle their dialogue.',
            '`!contracts` — Browse contracts for your current rank.',
            '`!accept number` — Accept a contract.',
            '`!abandon` — Abandon the active contract.',
            '`!hunt` — Begin a contract monster encounter.',
            '`!battle [attack/skill/defend/potion/flee]` — Resume or act in battle.',
            '`!inventory [page]` / `!inventory use item` — Browse or use inventory items.',
            '`!equipment [equip item]` — View or equip gear.',
            '`!shop [buy item quantity]` — Buy guild supplies.',
            '`!blacksmith [craft/upgrade/repair]` — Craft and improve gear.',
            '`!sell item quantity` / `!sell allcommon` — Sell monster parts.',
            '`!rankup` — Promote from Bronze through Platinum.',
            '`!daily [claim]` / `!weekly [claim]` — View or claim missions.',
            '`!dungeon [name] [Normal/Hard/Nightmare/Mythic]` — Enter a dungeon.',
            '`!boss [name]` — View or fight available bosses.',
            '`!party [invite/accept/leave/kick]` — Manage a four-player party.',
            '`!achievements` / `!titles` — View unlocked honors.',
            '`!leaderboard [level/reputation/contracts/bosses/dragons/gold/dungeons]` — View RPG rankings.',
            '`!helprpg` — Open the focused RPG command list.',
            '`!howrpg` — Open the beginner gameplay guide.'
        ]
    },
    {
        title: 'VRChat Verification',
        emoji: '🔐',
        description: 'Link Discord members to VRChat profiles and manage verified-member data.',
        commands: [
            '`!vrcverify` / `!verifyvrc VRChatName-or-profile` — Start VRChat profile-code verification.',
            '`!vrcconfirm` / `!confirmvrc [VRChatName-or-profile]` — Confirm the profile code and grant the verified role.',
            '`!vrclinked` / `!vrcwhois [@user/userID]` — Show a member\'s linked VRChat account.',
            '`!syncnick` / `!syncnickname` — Sync your Discord nickname to your verified VRChat display name.',
            '`!vrcverifyconfig` / `!vrcverifierconfig` — Configure verified roles, logs, and verification behavior.',
            '`!vrcunverify @user/userID` — Remove a stored VRChat verification.'
        ]
    },
    {
        title: 'VRChat Safety & Administration',
        emoji: '🛡️',
        description: 'Restricted VRChat group safety, moderation, blacklist, staff, and API administration tools.',
        commands: [
            '`!safetyscan` / `!vrchatscan help/status/run/blacklist/stop` — Manage the VRChat safety scanner.',
            '`!stopscan` / `!stopsafetyscan` / `!cancelscan` — Stop the active safety scan.',
            '`!scanblacklist` / `!scanblacklisted` / `!blacklistscan` — Scan members against blacklisted VRChat groups.',
            '`!scanmembergroups` / `!vrcmembergroups` / `!scanvrcgroups` — Report members\' public VRChat group memberships.',
            '`!blacklistgroup` / `!vrcblacklist` / `!blacklistvrcgroup group [details]` — Add or manage a blacklisted VRChat group.',
            '`!vrcaccountstatus` / `!vrcauthstatus` / `!vrccookiestatus` — Check the authenticated VRChat account and cookie.',
            '`!vrccheck user` — Look up a VRChat user for moderation workflows.',
            '`!vrcban user [reason]` — Ban a user from the configured VRChat group.',
            '`!vrcunban user [reason]` — Remove a VRChat group ban.',
            '`!vrckick user [reason]` — Kick a user from a VRChat group instance or workflow.',
            '`!vrcuserbl ...` — Manage the VRChat user blacklist.',
            '`!vrcavibl ...` — Manage the VRChat avatar blacklist.',
            '`!vrcgroupsbl ...` — Manage the VRChat group blacklist.',
            '`!vrcaddstaff ...` — Add a VRChat staff record.',
            '`!vrcremovestaff ...` — Remove a VRChat staff record.',
            '`!vrcupdatestaff` / `!vcrupdatestaff ...` — Update a VRChat staff record.',
            '`!vrcaddadmin ...` — Add a VRChat administrator record.',
            '`!vrcremoveadmin ...` — Remove a VRChat administrator record.',
            '`!vrcmanageapikey ...` — Manage VRChat staff API keys.'
        ]
    },
    {
        title: 'Tickets',
        emoji: '🎫',
        description: 'Open, configure, manage, document, and close private support tickets.',
        commands: [
            '`!ticket` / `!new` / `!openticket [type] [reason]` — Open a support ticket.',
            '`!appeal [reason]` — Open an appeal ticket.',
            '`!ticketsetup` / `!ticketpanel` / `!setup-ticket [#channel] [message]` — Create the ticket button panel.',
            '`!ticketconfig` / `!ticketsconfig ...` — View or edit ticket roles, category, logs, and numbering.',
            '`!rateticket` / `!ticketrating 1-5 [comment]` — Rate an open ticket.',
            '`!close` / `!ticketclose` / `!closeticket [reason or rating]` — Save a transcript and close the ticket.',
            '`!transcript` / `!tickettranscript [reason]` — Send a ticket transcript to the configured log channel.',
            '`!claim` — Claim the current ticket.',
            '`!unclaim` — Release the current ticket claim.',
            '`!add` / `!ticketadd @user/userID` — Add a member to the current ticket.',
            '`!remove` / `!ticketremove @user/userID` — Remove a member from the current ticket.',
            '`!rename` / `!ticketrename name` — Rename the current ticket channel.',
            '`!escalate` / `!admin [reason]` — Escalate the current ticket to administrators.'
        ]
    },
    {
        title: 'Waifu Game & Economy',
        emoji: '💖',
        description: 'Waifu cards, coins, collections, trading, selling, and administrator tools.',
        commands: [
            '`!waifuhelp` / `!haremhelp` — Show the waifu game guide.',
            '`!daily` / `!waifudaily` — Claim the daily coin reward.',
            '`!coins` / `!balance` / `!waifubalance [@user/userID]` — Show a waifu coin balance.',
            '`!pay` / `!paycoins` / `!paymoney @user/userID amount` — Transfer coins to another member.',
            '`!pull` / `!waifupull` — Spend coins to pull a waifu card.',
            '`!adminpull` / `!maxpull` / `!givewaifu [@user/userID]` — Administrator card-granting tools.',
            '`!waifuodds` / `!odds` — Show rarity odds and values.',
            '`!waifus` / `!harem` / `!collection [@user/userID] [page]` — Show a card collection.',
            '`!waifu id` — Show one waifu card.',
            '`!sell` / `!sellwaifu` / `!sellcard` / `!waifusell id` — Sell a card for coins.',
            '`!trade` / `!waifutrade ...` — Start or manage a waifu trade.',
            '`!givecoins` / `!givemoney` / `!givewaifumoney @user/userID amount` — Administrator coin-granting tools.'
        ]
    },
    {
        title: 'Fun & Social',
        emoji: '🎉',
        description: 'Lightweight games, random responses, and social commands.',
        commands: [
            '`!coinflip` — Flip a coin.',
            '`!roll [sides]` — Roll a die with the requested number of sides.',
            '`!8ball question` — Ask the magic 8-ball.',
            '`!rps rock/paper/scissors` — Play rock-paper-scissors.',
            '`!joke` — Send a random joke.',
            '`!fact` — Send a random fun fact.',
            '`!compliment [@user/userID]` — Compliment a member.',
            '`!roast [@user/userID]` — Send a light, friendly roast.',
            '`!rate thing` — Generate a deterministic rating.',
            '`!ship @user/userID @user/userID` — Generate a compatibility score.',
            '`!choose option 1 | option 2 | option 3` — Choose one supplied option.'
        ]
    },
    {
        title: 'Music',
        emoji: '🎵',
        description: 'Persistent Lavalink playback, queue, playlists, DJ controls, filters, and a synchronized button panel.',
        commands: [
            '`!play` / `!p song-or-link` — Search, play, or queue a track, album, or playlist.',
            '`!join` / `!leave` / `!dc` — Connect or disconnect the voice player.',
            '`!pause` / `!resume` / `!stop` / `!skip` / `!previous` — Control playback.',
            '`!seek` / `!forward` / `!backward duration` — Change playback position.',
            '`!queue [page]` / `!q` / `!nowplaying` / `!np` — Inspect playback and the queue.',
            '`!remove` / `!skipto` / `!clearqueue` / `!shuffle` / `!move` — Edit the upcoming queue.',
            '`!volume amount` / `!loop off|track|queue` / `!autoplay on|off|status` — Change player behavior.',
            '`!filter preset` / `!filters` / `!equalizer ...` / `!speed rate` — Apply safe audio effects.',
            '`!lyrics [song]` / `!spotify URL` — Look up lyrics or import Spotify metadata.',
            '`!playlist ...` / `!serverplaylist ...` — Manage persistent personal or shared playlists.',
            '`!dj ...` / `!247 ...` / `!musicsettings ...` — Configure permissions and persistence.',
            '`!musicpanel setup|remove|refresh|status` — Manage the synchronized music panel.'
        ]
    },
    {
        title: 'Discord Roles & Moderation',
        emoji: '🔨',
        description: 'Restricted Discord verification, role, moderation, cleanup, and audit commands.',
        commands: [
            '`!setup-roles` — Create the verification-role button.',
            '`!addrole @user/userID @role` — Add a role to a member.',
            '`!removerole @user/userID @role` — Remove a role from a member.',
            '`!warn @user/userID [reason]` — Warn a member; the configured threshold triggers a timeout.',
            '`!resetwarns` / `!resetwarnings @user/userID` — Reset a member\'s warning count.',
            '`!ban @user/userID [reason]` — Ban a Discord member.',
            '`!kick @user/userID [reason]` — Kick a Discord member.',
            '`!timeout @user/userID [minutes]` — Time out a Discord member.',
            '`!untimeout @user/userID` — Remove a Discord timeout.',
            '`!mute @user/userID` — Add the configured Muted role.',
            '`!unmute @user/userID` — Remove the configured Muted role.',
            '`!purge [amount]` — Bulk-delete recent messages in the current channel.',
            '`!massdelete user_id` — Delete a user\'s messages across accessible channels.',
            '`!log [amount] messages` — Copy recent messages to the bot log channel.',
            '`!sudo @user/userID command` — Owner-restricted: run a command through a selected member context.'
        ]
    },
    {
        title: 'Bot Owner & Diagnostics',
        emoji: '⚙️',
        description: 'Commands restricted to configured bot owners or operational administrators.',
        commands: [
            '`!uptime` — Show the current process uptime.',
            '`!reloadcmd` — Reload local VRCLogger safety data and command datastore.',
            '`!restart` — Exit the process so the host can restart the bot.'
        ]
    }
];

function normalizeHelpPageIndex(pageIndex) {

    const parsedPage = Number.parseInt(pageIndex, 10);

    if (!Number.isFinite(parsedPage)) return 0;

    return Math.min(Math.max(parsedPage, 0), HELP_CATEGORIES.length - 1);

}

function buildHelpEmbed(pageIndex = 0) {

    const normalizedPage = normalizeHelpPageIndex(pageIndex);
    const category = HELP_CATEGORIES[normalizedPage];
    const description = [
        category.description,
        '',
        ...category.commands
    ].join('\n').slice(0, 4096);

    return new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle(`${category.emoji} ${category.title}`.slice(0, 256))
        .setDescription(description)
        .setFooter({
            text: `Command Directory | Page ${normalizedPage + 1} of ${HELP_CATEGORIES.length}`
        });

}

function buildHelpNavigationRow(requesterId, pageIndex = 0) {

    const normalizedPage = normalizeHelpPageIndex(pageIndex);
    const lastPage = HELP_CATEGORIES.length - 1;

    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`help_page:${requesterId}:${Math.max(0, normalizedPage - 1)}`)
            .setLabel('Previous Page')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(normalizedPage === 0),
        new ButtonBuilder()
            .setCustomId(`help_page:${requesterId}:${Math.min(lastPage, normalizedPage + 1)}`)
            .setLabel('Next Page')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(normalizedPage === lastPage)
    );

}


async function sendHelpDirectory(message, pageIndex = 0) {

    const normalizedPage = normalizeHelpPageIndex(pageIndex);

    try {
        await message.channel.send({
            embeds: [buildHelpEmbed(normalizedPage)],
            components: [buildHelpNavigationRow(message.author.id, normalizedPage)]
        });
    } catch (error) {
        console.error('Failed to send paginated help menu:', {
            message: error?.message,
            code: error?.code,
            status: error?.status,
            rawError: error?.rawError
        });

        await message.channel.send({
            embeds: [buildHelpEmbed(normalizedPage)]
        });
    }

}

async function handleHelpPageButton(interaction) {

    const [, requesterId, requestedPage] = interaction.customId.split(':');

    if (interaction.user.id !== requesterId) {
        await interaction.reply({
            content: 'Only the member who opened this help menu can change its pages. Run `!help` to open your own menu.',
            ephemeral: true
        });
        return;
    }

    const normalizedPage = normalizeHelpPageIndex(requestedPage);

    await interaction.update({
        embeds: [buildHelpEmbed(normalizedPage)],
        components: [buildHelpNavigationRow(requesterId, normalizedPage)]
    });

}

// ==========================================
// MESSAGE COMMANDS
// ==========================================

async function handleMessageCreate(message) {

    if (message.author.bot || message.webhookId) return;
    if (!message.guild) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift()?.toLowerCase();

    if (command === '!howrpg') {
        await sendHowRpgGuide(message);
        return;
    }

    if (command === '!sudo') {
        await handleSudoCommand(message, args);
        return;
    }

    await logCommand(message);

    if (await routeRpgCommand(message, command, args)) {
        return;
    }

    if (await musicSystem.handlePrefixCommand(message, command, args)) {
        return;
    }

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

    if (command === '!aboutbot') {
        await handleAboutBotCommand(message);
        return;
    }

    if (command === '!uptime') {
        await handleUptimeCommand(message);
        return;
    }

    if (command === '!reloadcmd') {
        await handleReloadCmdCommand(message);
        return;
    }

    if (command === '!restart') {
        await handleRestartCommand(message);
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

    if (command === '!adminpull' || command === '!maxpull' || command === '!givewaifu') {
        await handleAdminWaifuPullCommand(message, args);
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

    if (command === '!helprpg') {
        await sendRpgHelp(message);
        return;
    }

    if (command === '!help') {
        await sendHelpDirectory(message, 0);
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

    if (command === '!safetyscan' || command === '!vrchatscan') {
        await handleSafetyScanMessageCommand(message, args);
        return;
    }

    if (command === '!stopscan' || command === '!stopsafetyscan' || command === '!cancelscan') {
        await handleStopSafetyScanCommand(message);
        return;
    }

    if (command === '!scanblacklist' || command === '!scanblacklisted' || command === '!blacklistscan') {
        await handleBlacklistOnlySafetyScanCommand(message);
        return;
    }

    if (command === '!scanmembergroups' || command === '!vrcmembergroups' || command === '!scanvrcgroups') {
        await handleMemberGroupScanCommand(message, args);
        return;
    }

    if (command === '!blacklistgroup' || command === '!vrcblacklist' || command === '!blacklistvrcgroup') {
        await handleVrchatBlacklistGroupCommand(message, args);
        return;
    }

    if (command === '!vrcaccountstatus' || command === '!vrcauthstatus' || command === '!vrccookiestatus') {
        await handleVrcAccountStatusCommand(message, args);
        return;
    }

    if (command === '!vrccheck') {
        await handleVrcCheckCommand(message, args);
        return;
    }

    if (command === '!vrcban') {
        await handleVrcModerationActionCommand(message, args, 'ban');
        return;
    }

    if (command === '!vrcunban') {
        await handleVrcModerationActionCommand(message, args, 'unban');
        return;
    }

    if (command === '!vrckick') {
        await handleVrcModerationActionCommand(message, args, 'kick');
        return;
    }

    if (command === '!vrcuserbl') {
        await handleVrcLoggerBlacklistCommand(message, args, 'user');
        return;
    }

    if (command === '!vrcavibl') {
        await handleVrcLoggerBlacklistCommand(message, args, 'avatar');
        return;
    }

    if (command === '!vrcgroupsbl') {
        await handleVrcLoggerBlacklistCommand(message, args, 'group');
        return;
    }

    if (command === '!vrcaddstaff') {
        await handleVrcStaffCommand(message, args, 'add');
        return;
    }

    if (command === '!vrcremovestaff') {
        await handleVrcStaffCommand(message, args, 'remove');
        return;
    }

    if (command === '!vrcupdatestaff' || command === '!vcrupdatestaff') {
        await handleVrcStaffCommand(message, args, 'update');
        return;
    }

    if (command === '!vrcaddadmin') {
        await handleVrcAdminCommand(message, args, true);
        return;
    }

    if (command === '!vrcremoveadmin') {
        await handleVrcAdminCommand(message, args, false);
        return;
    }

    if (command === '!vrcmanageapikey') {
        await handleVrcManageApiKeyCommand(message, args);
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

    if (command === '!whoinvited') {

        const targetUser = await resolveUserFromArgs(message, args);
        const targetUserId = targetUser?.id || getUserIdFromArg(args[0]);

        if (!targetUserId) {
            return message.reply('Usage: `!whoinvited @member/userID`');
        }

        let record = inviteJoinRecords.get(getInviteJoinKey(message.guild.id, targetUserId));
        const targetLabel = targetUser
            ? `${targetUser.tag} (${targetUser.id})`
            : `User ID ${targetUserId}`;

        if (!record && targetUser) {
            const statusMessage = await message.reply({
                content: `No saved invite record found for ${targetLabel}. Searching recent join logs...`,
                allowedMentions: {
                    parse: []
                }
            });

            record = await findInviteJoinRecordFromLogs(message.guild, targetUser);

            await statusMessage.delete().catch(() => {});
        }

        await message.channel.send({
            content: formatInviteJoinRecord(record, targetLabel),
            allowedMentions: {
                parse: []
            }
        });
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
                embeds: [embed],
                allowedMentions: {
                    parse: []
                }
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

client.on('messageCreate', (message) => {
    void handleMessageCreate(message).catch((error) => {
        console.error('Message create handler error:', error);
    });
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

    if (interaction.isChatInputCommand()) {
        await handleSlashCommand(interaction);
        return;
    }

    if ((interaction.isButton() || interaction.isStringSelectMenu()) && interaction.customId.startsWith('rpg_')) {
        await handleRpgInteraction(interaction);
        return;
    }

    if ((interaction.isButton() || interaction.isStringSelectMenu()) && interaction.customId.startsWith('music:')) {
        await musicSystem.handleInteraction(interaction);
        return;
    }

    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('help_page:')) {
        await handleHelpPageButton(interaction);
        return;
    }

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

let gracefulShutdownStarted = false;

async function gracefulShutdown(signal) {
    if (gracefulShutdownStarted) return;
    gracefulShutdownStarted = true;
    console.log(`Received ${signal}; saving music sessions before shutdown.`);
    await musicSystem.shutdown().catch(error => {
        console.error('Music shutdown save failed:', error);
    });
    client.destroy();
}

process.once('SIGINT', () => {
    void gracefulShutdown('SIGINT').finally(() => process.exit(0));
});

process.once('SIGTERM', () => {
    void gracefulShutdown('SIGTERM').finally(() => process.exit(0));
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

if (require.main === module) {
    client.login(TOKEN);
}

module.exports = { client, musicSystem };
