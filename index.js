const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    ActivityType
} = require('discord.js');

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

const VRCHAT_SERVER_NAME = process.env.VRCHAT_SERVER_NAME || 'VRChat Community';
const VRCHAT_COMMUNITY_LINK = process.env.VRCHAT_COMMUNITY_LINK || 'Check the pinned channels for current VRChat links.';

const AUTO_ROLE_ID = '1507583292537442374';
const REACTION_ROLE_ID = '1466511922332438674';
const MASS_DELETE_PAGE_SIZE = 100;
const BULK_DELETE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const MASS_DELETE_STATUS_INTERVAL_MS = 10 * 1000;

const MOD_ROLE_IDS = [
    '1466511901117649089',
    '1466511905525862443'
];

// LOG CHANNEL
const LOG_CHANNEL_ID = '1507595180121788427';

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
                            text: 'You are a helpful AI assistant for a VRChat Discord community. Keep replies friendly, concise, appropriate for the server, and aligned with the community rules.'
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
                    temperature: 0.7,
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

async function sendAskResponse(message, question) {

    if (!question || !question.trim()) {
        return message.reply('⚠️ Ask a question. Example: `!ask how do I make a Discord bot?`');
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
**Focus:** VRChat meetups, worlds, avatars, events, and community hangouts.
**Link:** ${VRCHAT_COMMUNITY_LINK}
**Reminder:** Use the Discord channels for event planning, world suggestions, avatar help, and support.`
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
🔹 \`!ask [question]\` - Ask the VRChat community bot a question.
🔹 \`!myinvites\` - Shows your invite count.
🔹 \`!invites [@user/userID]\` - Shows a user's invite count.
🔹 \`!leaderboard\` - Shows invite leaderboard.
🔹 \`!inviteinfo CODE\` - Shows invite code info.
🔹 \`!vrchat\` / \`!vrc\` - Shows VRChat community info.`
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
                text: 'VRChat Community Bot **made by Bqbblz**',
                iconURL: client.user.displayAvatarURL()
            })
            .setTimestamp();

        await message.channel.send({
            embeds: [helpEmbed]
        });

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
// BUTTON ROLE HANDLER
// ==========================================

client.on('interactionCreate', async (interaction) => {

    if (!interaction.isButton()) return;

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
