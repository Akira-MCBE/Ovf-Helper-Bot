'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MUSIC_SCHEMA_VERSION = 2;
const DEFAULT_FILTER = 'off';
const LOOP_MODES = new Set(['off', 'track', 'queue']);
const BOOLEAN_WORDS = new Map([
    ['on', true],
    ['off', false],
    ['true', true],
    ['false', false],
    ['yes', true],
    ['no', false]
]);

const MUSIC_ALIASES = new Map([
    ['!p', '!play'],
    ['!np', '!nowplaying'],
    ['!q', '!queue'],
    ['!dc', '!leave'],
    ['!disconnect', '!leave'],
    ['!clear', '!clearqueue'],
    ['!prev', '!previous'],
    ['!24/7', '!247'],
    ['!clearfilter', '!filter'],
    ['!voteskip', '!skip'],
    ['!pl-create', '!playlist:create'],
    ['!pl-delete', '!playlist:delete'],
    ['!pl-info', '!playlist:info'],
    ['!pl-list', '!playlist:list'],
    ['!pl-play', '!playlist:play'],
    ['!pl-playshuffle', '!playlist:shuffle'],
    ['!pl-removeduplicate', '!playlist:removeduplicates'],
    ['!pl-removetrack', '!playlist:removetrack'],
    ['!pl-savecurrent', '!playlist:savecurrent'],
    ['!pl-savequeue', '!playlist:savequeue'],
    ['!sp-play', '!serverplaylist:play'],
    ['!sp-savequeue', '!serverplaylist:savequeue']
]);

const MUSIC_COMMANDS = new Set([
    '!play', '!join', '!leave', '!pause', '!resume', '!stop', '!skip', '!forceskip',
    '!previous', '!seek', '!forward', '!backward', '!volume', '!nowplaying', '!queue',
    '!remove', '!skipto', '!clearqueue', '!shuffle', '!move', '!loop', '!autoplay',
    '!lyrics', '!247', '!musicpanel', '!filter', '!filters', '!equalizer', '!speed',
    '!dj', '!playlist', '!serverplaylist', '!spotify', '!musicsettings',
    '!8d', '!bass', '!bassboost', '!chipmunk', '!earrape', '!karaoke', '!nightcore',
    '!pop', '!radio', '!slowmo', '!soft', '!treblebass'
]);

const FILTER_PRESETS = Object.freeze({
    '8d': {
        rotation: { rotationHz: 0.18 }
    },
    bass: {
        equalizer: [
            { band: 0, gain: 0.20 }, { band: 1, gain: 0.16 }, { band: 2, gain: 0.10 }
        ]
    },
    bassboost: {
        equalizer: [
            { band: 0, gain: 0.30 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.18 },
            { band: 3, gain: 0.08 }
        ]
    },
    chipmunk: {
        timescale: { speed: 1.05, pitch: 1.35, rate: 1.0 }
    },
    earrape: {
        equalizer: [
            { band: 0, gain: 0.22 }, { band: 1, gain: 0.22 }, { band: 2, gain: 0.18 },
            { band: 3, gain: 0.16 }, { band: 4, gain: 0.14 }, { band: 5, gain: 0.12 }
        ],
        distortion: {
            sinOffset: 0.15,
            sinScale: 0.85,
            cosOffset: 0.10,
            cosScale: 0.80,
            tanOffset: 0.05,
            tanScale: 0.65,
            offset: 0.05,
            scale: 0.85
        }
    },
    karaoke: {
        karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220.0, filterWidth: 100.0 }
    },
    nightcore: {
        timescale: { speed: 1.18, pitch: 1.18, rate: 1.0 }
    },
    pop: {
        equalizer: [
            { band: 0, gain: -0.05 }, { band: 1, gain: 0.08 }, { band: 2, gain: 0.12 },
            { band: 5, gain: 0.10 }, { band: 8, gain: 0.08 }, { band: 12, gain: 0.10 }
        ]
    },
    radio: {
        equalizer: [
            { band: 0, gain: -0.20 }, { band: 1, gain: -0.12 }, { band: 2, gain: 0.06 },
            { band: 3, gain: 0.12 }, { band: 4, gain: 0.10 }, { band: 10, gain: -0.10 },
            { band: 13, gain: -0.18 }, { band: 14, gain: -0.22 }
        ],
        lowPass: { smoothing: 12.0 }
    },
    slowmo: {
        timescale: { speed: 0.82, pitch: 0.92, rate: 1.0 }
    },
    soft: {
        equalizer: [
            { band: 0, gain: -0.05 }, { band: 1, gain: -0.04 }, { band: 8, gain: -0.05 },
            { band: 12, gain: -0.08 }, { band: 14, gain: -0.10 }
        ],
        lowPass: { smoothing: 18.0 }
    },
    speed: {
        timescale: { speed: 1.25, pitch: 1.0, rate: 1.0 }
    },
    treblebass: {
        equalizer: [
            { band: 0, gain: 0.18 }, { band: 1, gain: 0.14 }, { band: 2, gain: 0.08 },
            { band: 10, gain: 0.08 }, { band: 12, gain: 0.12 }, { band: 14, gain: 0.16 }
        ]
    }
});

function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
}

function newId() {
    return typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : crypto.randomBytes(16).toString('hex');
}

function safeText(value, maximum = 2000) {
    return String(value == null ? '' : value)
        .replace(/@/g, '@\u200b')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .slice(0, maximum);
}

function normalizeName(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();
}

function playlistKey(value) {
    return `p:${normalizeName(value)}`;
}

function parseBooleanWord(value) {
    return BOOLEAN_WORDS.get(String(value || '').trim().toLowerCase());
}

function parseDuration(value) {
    const text = String(value || '').trim().toLowerCase();
    if (!text) return null;

    if (/^\d+(?:\.\d+)?$/.test(text)) {
        const seconds = Number(text);
        return Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds * 1000) : null;
    }

    if (/^\d{1,3}:\d{1,2}(?::\d{1,2})?$/.test(text)) {
        const parts = text.split(':').map(Number);
        if (parts.some(part => !Number.isFinite(part)) || parts.slice(1).some(part => part > 59)) return null;
        const seconds = parts.length === 3
            ? (parts[0] * 3600) + (parts[1] * 60) + parts[2]
            : (parts[0] * 60) + parts[1];
        return seconds * 1000;
    }

    const tokenPattern = /(\d+(?:\.\d+)?)\s*(ms|h|m|s)/g;
    let total = 0;
    let consumed = '';
    let match;

    while ((match = tokenPattern.exec(text)) !== null) {
        const amount = Number(match[1]);
        const unit = match[2];
        if (!Number.isFinite(amount)) return null;
        total += unit === 'h'
            ? amount * 3600000
            : unit === 'm'
                ? amount * 60000
                : unit === 's'
                    ? amount * 1000
                    : amount;
        consumed += match[0].replace(/\s+/g, '');
    }

    if (!consumed || consumed !== text.replace(/\s+/g, '')) return null;
    return Math.round(total);
}

function formatDuration(milliseconds) {
    const value = Math.max(0, Number(milliseconds) || 0);
    if (!value) return '0:00';
    const totalSeconds = Math.floor(value / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return hours
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isUrl(value) {
    try {
        const parsed = new URL(String(value || ''));
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

function hasSearchPrefix(value) {
    return /^(?:yt|ytm|sc|sp|dz|am)search:/i.test(String(value || ''));
}

function normalizeTrack(track = {}, requesterId = null, options = {}) {
    const info = track.info || {};
    const pluginInfo = track.pluginInfo || track.plugin || {};
    const uri = String(info.uri || track.uri || track.url || options.originalUrl || '');
    const author = String(info.author || track.author || track.artist || 'Unknown artist');
    const title = String(info.title || track.title || 'Unknown title');
    const source = String(info.sourceName || track.source || options.source || 'unknown').toLowerCase();
    const identifier = String(info.identifier || track.identifier || '');
    const duration = Math.max(0, Number(info.length || info.duration || track.length || track.duration || 0));

    return {
        id: String(track.id || options.id || newId()),
        encoded: track.encoded || track.track || options.encoded || null,
        title,
        author,
        duration,
        uri,
        artworkUrl: info.artworkUrl || track.artworkUrl || pluginInfo.artworkUrl || null,
        source,
        providerId: identifier || null,
        originalProvider: String(options.originalProvider || track.originalProvider || source || 'unknown'),
        originalUrl: String(options.originalUrl || track.originalUrl || uri || ''),
        requesterId: String(requesterId || track.requesterId || options.requesterId || ''),
        requestedAt: Number(track.requestedAt || options.requestedAt || Date.now()),
        isrc: info.isrc || track.isrc || pluginInfo.isrc || null,
        isStream: Boolean(info.isStream || track.isStream),
        isSeekable: info.isSeekable !== false && track.isSeekable !== false && !Boolean(info.isStream || track.isStream),
        album: track.album || pluginInfo.albumName || pluginInfo.album || null,
        playlist: options.playlist || track.playlist || null,
        autoplay: Boolean(options.autoplay || track.autoplay),
        nodeName: options.nodeName || track.nodeName || null
    };
}

function serializeTrack(track) {
    if (!track) return null;
    const normalized = normalizeTrack(track, track.requesterId, { id: track.id });
    return {
        ...normalized,
        encoded: null,
        nodeName: null
    };
}

function trackDeduplicationKeys(track) {
    const keys = [];
    if (track.providerId) keys.push(`provider:${track.source}:${String(track.providerId).toLowerCase()}`);
    if (track.uri) keys.push(`uri:${String(track.uri).toLowerCase().replace(/\/$/, '')}`);
    if (track.isrc) keys.push(`isrc:${String(track.isrc).toLowerCase()}`);
    keys.push(`text:${normalizeName(track.title)}|${normalizeName(track.author)}`);
    return keys;
}

function removeDuplicateTracks(tracks) {
    const usedKeys = new Set();
    const kept = [];

    for (const track of tracks) {
        const keys = trackDeduplicationKeys(track);
        if (keys.some(key => usedKeys.has(key))) continue;
        keys.forEach(key => usedKeys.add(key));
        kept.push(track);
    }

    return kept;
}

function shuffleArray(values, random = Math.random) {
    const shuffled = values.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const replacementIndex = Math.floor(random() * (index + 1));
        [shuffled[index], shuffled[replacementIndex]] = [shuffled[replacementIndex], shuffled[index]];
    }
    return shuffled;
}

function defaultGuildSettings(defaultVolume, hardMaxVolume, defaultIdleTimeoutMs) {
    return {
        enabled247: false,
        idleTimeoutMs: defaultIdleTimeoutMs,
        defaultVolume,
        maxVolume: hardMaxVolume,
        announce: true,
        djOnly: false,
        autoplayDefault: false,
        djRoleIds: [],
        djUserIds: [],
        panelChannelId: null,
        panelMessageId: null,
        panelGeneration: null,
        adminChannelId: null
    };
}

class GuildMusicQueue {
    constructor(guildId, settings, options = {}) {
        this.guildId = String(guildId);
        this.player = null;
        this.playerGeneration = 0;
        this.voiceChannelId = options.voiceChannelId || null;
        this.textChannelId = options.textChannelId || null;
        this.currentTrack = options.currentTrack ? normalizeTrack(options.currentTrack) : null;
        this.upcoming = Array.isArray(options.upcoming) ? options.upcoming.map(track => normalizeTrack(track)) : [];
        this.history = Array.isArray(options.history) ? options.history.map(track => normalizeTrack(track)) : [];
        this.position = Math.max(0, Number(options.position || 0));
        this.paused = Boolean(options.paused);
        this.volume = clamp(Number(options.volume || settings.defaultVolume), 0, settings.maxVolume);
        this.loopMode = LOOP_MODES.has(options.loopMode) ? options.loopMode : 'off';
        this.autoplay = options.autoplay == null ? settings.autoplayDefault : Boolean(options.autoplay);
        this.enabled247 = options.enabled247 == null ? settings.enabled247 : Boolean(options.enabled247);
        this.filterPreset = options.filterPreset || DEFAULT_FILTER;
        this.customEqualizer = Array.isArray(options.customEqualizer) ? options.customEqualizer : [];
        this.customFilterState = options.customFilterState && typeof options.customFilterState === 'object'
            ? options.customFilterState
            : {};
        this.lastControllerId = options.lastControllerId || null;
        this.nodeName = options.nodeName || null;
        this.voiceState = 'disconnected';
        this.recoveryState = 'idle';
        this.playing = false;
        this.stopped = false;
        this.destroyed = false;
        this.pendingEndAction = null;
        this.retryCounts = new Map();
        this.skipVotes = new Set();
        this.idleTimer = null;
        this.idleToken = 0;
        this.panelUpdateTimer = null;
        this.panelGeneration = settings.panelGeneration || newId().replace(/-/g, '').slice(0, 12);
        this.lastPanelUpdate = 0;
    }

    add(track) {
        this.upcoming.push(normalizeTrack(track));
        return this.upcoming[this.upcoming.length - 1];
    }

    addMany(tracks) {
        const added = tracks.map(track => normalizeTrack(track));
        this.upcoming.push(...added);
        return added;
    }

    insert(position, track) {
        const index = clamp(Number(position) - 1, 0, this.upcoming.length);
        const normalized = normalizeTrack(track);
        this.upcoming.splice(index, 0, normalized);
        return normalized;
    }

    remove(position) {
        const index = Number(position) - 1;
        if (!Number.isInteger(index) || index < 0 || index >= this.upcoming.length) return null;
        return this.upcoming.splice(index, 1)[0] || null;
    }

    clear() {
        const count = this.upcoming.length;
        this.upcoming = [];
        return count;
    }

    shuffle(random = Math.random) {
        this.upcoming = shuffleArray(this.upcoming, random);
        return this.upcoming;
    }

    skipTo(position) {
        const index = Number(position) - 1;
        if (!Number.isInteger(index) || index < 0 || index >= this.upcoming.length) return null;
        const selected = this.upcoming[index];
        this.upcoming = this.upcoming.slice(index);
        return selected;
    }

    move(from, to) {
        const fromIndex = Number(from) - 1;
        const toIndex = Number(to) - 1;
        if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return null;
        if (fromIndex < 0 || fromIndex >= this.upcoming.length || toIndex < 0 || toIndex >= this.upcoming.length) return null;
        const [track] = this.upcoming.splice(fromIndex, 1);
        this.upcoming.splice(toIndex, 0, track);
        return track;
    }

    pushHistory(track, maximum) {
        if (!track) return;
        this.history.unshift(normalizeTrack(track));
        if (this.history.length > maximum) this.history.length = maximum;
    }

    serialize() {
        return {
            guildId: this.guildId,
            voiceChannelId: this.voiceChannelId,
            textChannelId: this.textChannelId,
            currentTrack: serializeTrack(this.currentTrack),
            upcoming: this.upcoming.map(serializeTrack),
            history: this.history.map(serializeTrack),
            position: this.position,
            paused: this.paused,
            volume: this.volume,
            loopMode: this.loopMode,
            autoplay: this.autoplay,
            enabled247: this.enabled247,
            filterPreset: this.filterPreset,
            customEqualizer: this.customEqualizer,
            customFilterState: this.customFilterState,
            lastControllerId: this.lastControllerId,
            savedAt: Date.now()
        };
    }
}

class JsonMusicRepository {
    constructor(filePath, defaults) {
        this.filePath = filePath;
        this.defaults = defaults;
        this.data = this.emptyData();
        this.loaded = false;
        this.saveTimer = null;
    }

    emptyData() {
        return {
            schemaVersion: MUSIC_SCHEMA_VERSION,
            migrations: {},
            guildSettings: {},
            personalPlaylists: {},
            serverPlaylists: {},
            sessions: {},
            statistics: { guilds: {}, users: {} }
        };
    }

    load() {
        if (this.loaded) return;
        this.loaded = true;
        if (!fs.existsSync(this.filePath)) {
            this.migrateLegacyFiles();
            this.flush();
            return;
        }

        try {
            const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
            this.data = this.migrateSchema(parsed);
        } catch (error) {
            const corruptPath = `${this.filePath}.corrupt-${Date.now()}`;
            try {
                fs.copyFileSync(this.filePath, corruptPath);
            } catch {}
            console.error(`Music store could not be read; preserved a copy at ${corruptPath}:`, error);
            this.data = this.emptyData();
        }

        this.migrateLegacyFiles();
        this.flush();
    }

    migrateSchema(input) {
        const base = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
        const migrated = {
            ...this.emptyData(),
            ...base,
            migrations: base.migrations || {},
            guildSettings: base.guildSettings || base.settings || {},
            personalPlaylists: base.personalPlaylists || base.playlists || {},
            serverPlaylists: base.serverPlaylists || {},
            sessions: base.sessions || {},
            statistics: {
                guilds: base.statistics?.guilds || {},
                users: base.statistics?.users || {}
            },
            schemaVersion: MUSIC_SCHEMA_VERSION
        };

        for (const [guildId, value] of Object.entries(migrated.guildSettings)) {
            const normalizedSettings = {
                ...this.defaults,
                ...(value && typeof value === 'object' ? value : {})
            };
            normalizedSettings.djRoleIds = Array.isArray(normalizedSettings.djRoleIds) ? normalizedSettings.djRoleIds.map(String) : [];
            normalizedSettings.djUserIds = Array.isArray(normalizedSettings.djUserIds) ? normalizedSettings.djUserIds.map(String) : [];
            migrated.guildSettings[guildId] = normalizedSettings;
        }

        for (const root of [migrated.personalPlaylists, migrated.serverPlaylists]) {
            for (const [ownerId, playlists] of Object.entries(root)) {
                const normalizedPlaylists = {};
                for (const [legacyKey, playlist] of Object.entries(playlists || {})) {
                    if (!playlist || typeof playlist !== 'object') continue;
                    const name = String(playlist.name || legacyKey.replace(/^p:/, '')).trim();
                    if (!name) continue;
                    normalizedPlaylists[playlistKey(name)] = { ...playlist, name };
                }
                root[ownerId] = normalizedPlaylists;
            }
        }

        return migrated;
    }

    migrateLegacyFiles() {
        const directory = path.dirname(this.filePath);
        const candidates = ['music-settings.json', 'playlists.json', 'music-playlists.json', 'music-sessions.json'];
        let migratedRecords = 0;
        let skippedRecords = 0;

        for (const filename of candidates) {
            const sourcePath = path.join(directory, filename);
            if (sourcePath === this.filePath || !fs.existsSync(sourcePath) || this.data.migrations[sourcePath]) continue;

            try {
                const legacy = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
                if (filename === 'music-settings.json' && legacy && typeof legacy === 'object') {
                    for (const [guildId, settings] of Object.entries(legacy)) {
                        if (!settings || typeof settings !== 'object') {
                            skippedRecords += 1;
                            continue;
                        }
                        this.data.guildSettings[guildId] = { ...this.defaults, ...settings };
                        migratedRecords += 1;
                    }
                } else if (filename.includes('playlist') && legacy && typeof legacy === 'object') {
                    for (const [userId, playlists] of Object.entries(legacy)) {
                        if (!playlists || typeof playlists !== 'object') {
                            skippedRecords += 1;
                            continue;
                        }
                        this.data.personalPlaylists[userId] ||= {};
                        for (const [name, value] of Object.entries(playlists)) {
                            const tracks = Array.isArray(value) ? value : value?.tracks;
                            if (!Array.isArray(tracks)) {
                                skippedRecords += 1;
                                continue;
                            }
                            const key = playlistKey(name);
                            this.data.personalPlaylists[userId][key] = {
                                name: String(name),
                                creatorId: userId,
                                createdAt: Number(value?.createdAt || Date.now()),
                                updatedAt: Date.now(),
                                tracks: tracks.map(serializeTrack).filter(Boolean)
                            };
                            migratedRecords += 1;
                        }
                    }
                } else if (filename === 'music-sessions.json' && legacy && typeof legacy === 'object') {
                    Object.assign(this.data.sessions, legacy);
                    migratedRecords += Object.keys(legacy).length;
                }

                this.data.migrations[sourcePath] = {
                    completedAt: Date.now(),
                    sourcePreserved: true
                };
            } catch (error) {
                skippedRecords += 1;
                console.warn(`Skipped legacy music file ${sourcePath}: ${error.message}`);
            }
        }

        if (migratedRecords || skippedRecords) {
            console.log(`Music migration complete: ${migratedRecords} migrated, ${skippedRecords} skipped; legacy files preserved.`);
        }
    }

    getSettings(guildId) {
        const id = String(guildId);
        this.data.guildSettings[id] ||= { ...this.defaults };
        return this.data.guildSettings[id];
    }

    updateSettings(guildId, updates) {
        const current = this.getSettings(guildId);
        this.data.guildSettings[String(guildId)] = { ...current, ...updates };
        this.scheduleSave();
        return this.data.guildSettings[String(guildId)];
    }

    scheduleSave(delay = 250) {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this.flush();
        }, delay);
        if (typeof this.saveTimer.unref === 'function') this.saveTimer.unref();
    }

    flush() {
        if (!this.loaded) return;
        const directory = path.dirname(this.filePath);
        const temporaryPath = `${this.filePath}.tmp-${process.pid}`;
        try {
            fs.mkdirSync(directory, { recursive: true });
            fs.writeFileSync(temporaryPath, JSON.stringify(this.data, null, 2));
            try {
                fs.renameSync(temporaryPath, this.filePath);
            } catch {
                fs.copyFileSync(temporaryPath, this.filePath);
                fs.unlinkSync(temporaryPath);
            }
        } catch (error) {
            console.error('Failed to save music data:', error);
            try {
                if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
            } catch {}
        }
    }
}

class MusicSystem {
    constructor(options) {
        this.client = options.client;
        this.discord = options.discord;
        this.getShoukaku = options.getShoukaku;
        this.getNodes = options.getNodes;
        this.getNodeName = options.getNodeName;
        this.preferNode = options.preferNode;
        this.markNodeUnhealthy = options.markNodeUnhealthy || (() => {});
        this.isTicketChannel = options.isTicketChannel || (() => false);
        this.enabled = options.enabled;
        this.players = new Map();
        this.locks = new Map();
        this.cooldowns = new Map();
        this.restoreAttempts = new Map();
        this.failoverTimers = new Map();
        this.metrics = {
            commands: 0,
            tracksResolved: 0,
            resolutionFailures: 0,
            playbackFailures: 0,
            stuckTracks: 0,
            nodeRecoveries: 0,
            activePlayers: 0
        };

        this.config = {
            storeFile: process.env.MUSIC_STORE_FILE || path.join(process.cwd(), 'music-data.json'),
            defaultVolume: clamp(Number.parseInt(process.env.MUSIC_DEFAULT_VOLUME || '35', 10) || 35, 1, 100),
            hardMaxVolume: clamp(Number.parseInt(process.env.MUSIC_HARD_MAX_VOLUME || '100', 10) || 100, 25, 100),
            idleTimeoutMs: clamp(Number.parseInt(process.env.MUSIC_IDLE_TIMEOUT_MS || '300000', 10) || 300000, 30000, 3600000),
            historyLimit: clamp(Number.parseInt(process.env.MUSIC_HISTORY_LIMIT || '50', 10) || 50, 5, 500),
            maxQueueSize: clamp(Number.parseInt(process.env.MUSIC_MAX_QUEUE_SIZE || '500', 10) || 500, 10, 2000),
            maxImportSize: clamp(Number.parseInt(process.env.MUSIC_MAX_IMPORT_TRACKS || '100', 10) || 100, 1, 500),
            maxPlaylistsPerUser: clamp(Number.parseInt(process.env.MUSIC_MAX_PLAYLISTS_PER_USER || '20', 10) || 20, 1, 100),
            maxTracksPerPlaylist: clamp(Number.parseInt(process.env.MUSIC_MAX_TRACKS_PER_PLAYLIST || '200', 10) || 200, 1, 1000),
            maxServerPlaylists: clamp(Number.parseInt(process.env.MUSIC_MAX_SERVER_PLAYLISTS || '30', 10) || 30, 1, 200),
            maxServerPlaylistTracks: clamp(Number.parseInt(process.env.MUSIC_MAX_SERVER_PLAYLIST_TRACKS || '500', 10) || 500, 1, 2000),
            searchPrefixes: Array.from(new Set((process.env.MUSIC_SEARCH_FALLBACK_PREFIXES || 'ytsearch,scsearch,ytmsearch')
                .split(',')
                .map(value => value.trim().replace(/:$/, '').toLowerCase())
                .filter(Boolean))),
            lyricsUrl: process.env.MUSIC_LYRICS_PROVIDER_URL || 'https://lrclib.net/api/search',
            spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
            spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
            autoplayHistorySize: clamp(Number.parseInt(process.env.MUSIC_AUTOPLAY_HISTORY_SIZE || '25', 10) || 25, 5, 100),
            trackRetryLimit: clamp(Number.parseInt(process.env.MUSIC_TRACK_RETRY_LIMIT || '1', 10) || 1, 0, 3),
            panelDebounceMs: clamp(Number.parseInt(process.env.MUSIC_PANEL_DEBOUNCE_MS || '750', 10) || 750, 250, 5000)
        };

        this.repository = new JsonMusicRepository(
            this.config.storeFile,
            defaultGuildSettings(this.config.defaultVolume, this.config.hardMaxVolume, this.config.idleTimeoutMs)
        );
    }

    load() {
        this.repository.load();
        console.log(`Music store ready (schema ${MUSIC_SCHEMA_VERSION}).`);
    }

    getSettings(guildId) {
        return this.repository.getSettings(guildId);
    }

    getQueue(guildId, create = true) {
        const id = String(guildId);
        if (!this.players.has(id) && create) {
            this.players.set(id, new GuildMusicQueue(id, this.getSettings(id)));
            this.metrics.activePlayers = this.players.size;
        }
        return this.players.get(id) || null;
    }

    serialize(guildId, operation) {
        const id = String(guildId);
        const previous = this.locks.get(id) || Promise.resolve();
        const result = previous.catch(() => {}).then(operation);
        const settled = result.finally(() => {
            if (this.locks.get(id) === settled) this.locks.delete(id);
        });
        this.locks.set(id, settled);
        return result;
    }

    nodeName(node) {
        return this.getNodeName(node) || 'Lavalink';
    }

    availableNodes(guildId) {
        return (this.getNodes(guildId) || []).filter(Boolean);
    }

    isAvailable() {
        return Boolean(this.enabled && this.getShoukaku() && this.availableNodes(null).length);
    }

    extractTracks(result) {
        if (!result) return { tracks: [], playlistName: null, selectedTrack: null };
        if (Array.isArray(result.tracks)) {
            return {
                tracks: result.tracks,
                playlistName: result.playlistInfo?.name || null,
                selectedTrack: result.playlistInfo?.selectedTrack ?? null
            };
        }
        if (result.loadType === 'track' && result.data) {
            return { tracks: [result.data], playlistName: null, selectedTrack: null };
        }
        if (result.loadType === 'playlist' && Array.isArray(result.data?.tracks)) {
            return {
                tracks: result.data.tracks,
                playlistName: result.data.info?.name || 'Playlist',
                selectedTrack: result.data.info?.selectedTrack ?? null
            };
        }
        if (result.loadType === 'search' && Array.isArray(result.data)) {
            return { tracks: result.data, playlistName: null, selectedTrack: null };
        }
        return { tracks: [], playlistName: null, selectedTrack: null };
    }

    async resolve(query, requesterId, guildId, options = {}) {
        const submitted = String(query || '').trim();
        if (!submitted) throw this.userError('Give me a song name or supported URL.');
        const nodes = this.availableNodes(guildId);
        if (!nodes.length) {
            throw this.userError('No working Lavalink node is connected. Check the Lavalink environment variables and node source plugins.');
        }

        const queries = isUrl(submitted) || hasSearchPrefix(submitted)
            ? [submitted]
            : this.config.searchPrefixes.map(prefix => `${prefix}:${submitted}`);
        const failures = [];
        const startedAt = Date.now();

        for (const node of nodes) {
            const nodeName = this.nodeName(node);
            const failuresBeforeNode = failures.length;
            for (const searchQuery of queries) {
                try {
                    const result = await node.rest.resolve(searchQuery);
                    const extracted = this.extractTracks(result);
                    let sourceTracks = extracted.tracks;
                    if (!options.allowMultipleSearch && !extracted.playlistName && !isUrl(submitted) && sourceTracks.length > 1) {
                        sourceTracks = sourceTracks.slice(0, 1);
                    }
                    const limited = sourceTracks.slice(0, options.maximum || this.config.maxImportSize);
                    const tracks = limited
                        .map(track => normalizeTrack(track, requesterId, {
                            nodeName,
                            originalUrl: isUrl(submitted) ? submitted : '',
                            originalProvider: this.inferSubmittedProvider(submitted),
                            playlist: extracted.playlistName
                        }))
                        .filter(track => track.encoded || track.uri);

                    if (!tracks.length) continue;
                    this.preferNode(guildId, nodeName);
                    this.metrics.tracksResolved += tracks.length;
                    return {
                        tracks,
                        nodeName,
                        playlistName: extracted.playlistName,
                        loaded: tracks.length,
                        skipped: Math.max(0, sourceTracks.length - limited.length),
                        failed: 0,
                        latencyMs: Date.now() - startedAt
                    };
                } catch (error) {
                    failures.push({ nodeName, searchQuery, error });
                    console.warn(`Music resolve failed on ${nodeName} for ${safeText(searchQuery, 160)}: ${error?.status || error?.message || 'unknown error'}`);
                }
            }
            if (failures.length - failuresBeforeNode === queries.length) {
                const nodeFailures = failures.slice(failuresBeforeNode);
                const shouldBackOff = nodeFailures.some(item => {
                    const status = Number(item.error?.status || 0);
                    return status === 401 || status === 403 || status >= 500 || /ENOTFOUND|ECONN|timeout/i.test(String(item.error?.code || item.error?.message || ''));
                });
                if (shouldBackOff) this.markNodeUnhealthy(nodeName, 'track resolution failed');
            }
        }

        this.metrics.resolutionFailures += 1;
        const statuses = Array.from(new Set(failures.map(item => item.error?.status).filter(Boolean)));
        const statusText = statuses.length ? ` (node response ${statuses.join('/')})` : '';
        throw this.userError(`I could not find a playable result${statusText}. The source may be private, unavailable, region-locked, or unsupported by the Lavalink node.`);
    }

    inferSubmittedProvider(query) {
        const value = String(query || '').toLowerCase();
        if (value.includes('spotify.com')) return 'spotify';
        if (value.includes('music.apple.com')) return 'applemusic';
        if (value.includes('soundcloud.com') || value.startsWith('scsearch:')) return 'soundcloud';
        if (value.includes('youtube.com') || value.includes('youtu.be') || /^ytm?search:/.test(value)) return 'youtube';
        return isUrl(value) ? 'url' : 'search';
    }

    async resolveStoredTrack(track, guildId, requesterId = null) {
        const metadataOnlyProvider = ['spotify', 'applemusic'].includes(String(track.originalProvider || '').toLowerCase());
        const candidate = metadataOnlyProvider
            ? `${track.author} ${track.title}`
            : track.originalUrl || track.uri || `${track.author} ${track.title}`;
        const result = await this.resolve(candidate, requesterId || track.requesterId, guildId, { maximum: 1 });
        return {
            ...result.tracks[0],
            id: track.id || result.tracks[0].id,
            requesterId: requesterId || track.requesterId || result.tracks[0].requesterId,
            requestedAt: track.requestedAt || result.tracks[0].requestedAt,
            autoplay: Boolean(track.autoplay)
        };
    }

    async resolveCollection(tracks, guildId, requesterId, loadingMessage = null) {
        const input = tracks.slice(0, this.config.maxImportSize);
        const resolved = new Array(input.length);
        let cursor = 0;
        let failed = 0;
        const workers = Array.from({ length: Math.min(4, input.length) }, async () => {
            while (cursor < input.length) {
                const index = cursor;
                cursor += 1;
                try {
                    resolved[index] = await this.resolveStoredTrack(input[index], guildId, requesterId);
                } catch {
                    failed += 1;
                }
                if (loadingMessage && index > 0 && index % 10 === 0) {
                    await loadingMessage.edit({
                        content: `Resolving tracks: ${Math.min(index + 1, input.length)}/${input.length}...`,
                        allowedMentions: { parse: [] }
                    }).catch(() => {});
                }
            }
        });
        await Promise.all(workers);
        return {
            tracks: resolved.filter(Boolean),
            loaded: resolved.filter(Boolean).length,
            skipped: Math.max(0, tracks.length - input.length),
            failed
        };
    }

    async connect(queue, guild, voiceChannel, nodeName = null) {
        const shoukaku = this.getShoukaku();
        if (!this.enabled || !shoukaku) throw this.userError('Music is disabled or Lavalink is not configured.');
        if (!voiceChannel) throw this.userError('Join a voice channel first.');

        const currentNodeName = queue.player ? this.nodeName(queue.player.node) : null;
        if (queue.player && queue.voiceChannelId === voiceChannel.id && (!nodeName || currentNodeName === nodeName)) {
            return queue.player;
        }

        queue.playerGeneration += 1;
        const generation = queue.playerGeneration;
        if (queue.player) {
            queue.player.removeAllListeners();
            try {
                await shoukaku.leaveVoiceChannel(guild.id);
            } catch {}
            queue.player = null;
        }

        if (nodeName) this.preferNode(guild.id, nodeName);
        queue.voiceState = 'connecting';
        queue.voiceChannelId = voiceChannel.id;
        queue.nodeName = nodeName || queue.nodeName;
        queue.destroyed = false;

        const player = await shoukaku.joinVoiceChannel({
            guildId: guild.id,
            channelId: voiceChannel.id,
            shardId: guild.shardId ?? 0,
            deaf: true
        });

        if (generation !== queue.playerGeneration || queue.destroyed) {
            try {
                await shoukaku.leaveVoiceChannel(guild.id);
            } catch {}
            throw this.userError('The player changed while the voice connection was being created. Try again.');
        }

        queue.player = player;
        queue.nodeName = this.nodeName(player.node);
        queue.voiceState = 'connected';
        this.attachPlayerEvents(queue, player, generation);
        await player.setGlobalVolume(queue.volume);
        await this.applyCurrentFilters(queue).catch(error => {
            console.warn(`Could not restore filters for guild ${guild.id}: ${error.message}`);
        });

        if (voiceChannel.type === this.discord.ChannelType.GuildStageVoice) {
            const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
            if (botMember?.voice) await botMember.voice.setSuppressed(false).catch(() => {});
        }
        this.cancelIdleTimer(queue);
        this.persistSession(queue);
        return player;
    }

    attachPlayerEvents(queue, player, generation) {
        const valid = () => this.players.get(queue.guildId) === queue &&
            queue.player === player &&
            queue.playerGeneration === generation &&
            !queue.destroyed;
        const eventMatchesCurrent = event => {
            const eventEncoded = event?.track?.encoded || event?.track;
            return !eventEncoded || !queue.currentTrack?.encoded || eventEncoded === queue.currentTrack.encoded;
        };

        player.on('start', () => {
            if (!valid()) return;
            queue.playing = true;
            queue.paused = false;
            queue.voiceState = 'connected';
            queue.retryCounts.delete(queue.currentTrack?.id);
            this.schedulePanelUpdate(queue);
            this.persistSession(queue);
        });

        player.on('update', state => {
            if (!valid()) return;
            queue.position = Math.max(0, Number(state?.position || player.position || 0));
        });

        player.on('end', event => {
            if (!valid() || !eventMatchesCurrent(event) || event?.reason === 'replaced') return;
            void this.serialize(queue.guildId, async () => {
                if (!valid()) return;
                await this.finishTrack(queue, queue.pendingEndAction || 'completed');
            }).catch(error => console.error('Track-end handling failed:', error));
        });

        player.on('exception', event => {
            if (!valid() || !eventMatchesCurrent(event)) return;
            console.error(`Track exception in guild ${queue.guildId}:`, event);
            void this.serialize(queue.guildId, async () => {
                if (!valid()) return;
                this.metrics.playbackFailures += 1;
                await this.recoverBrokenTrack(queue, 'failed');
            }).catch(error => console.error('Track-exception recovery failed:', error));
        });

        player.on('stuck', event => {
            if (!valid() || !eventMatchesCurrent(event)) return;
            console.error(`Track stuck in guild ${queue.guildId}:`, event);
            void this.serialize(queue.guildId, async () => {
                if (!valid()) return;
                this.metrics.stuckTracks += 1;
                await this.recoverBrokenTrack(queue, 'stuck');
            }).catch(error => console.error('Track-stuck recovery failed:', error));
        });

        player.on('closed', event => {
            if (!valid()) return;
            queue.voiceState = 'closed';
            queue.playing = false;
            console.warn(`Music voice connection closed for guild ${queue.guildId}: ${event?.code || 'unknown'}`);
            this.persistSession(queue);
        });
    }

    async recoverBrokenTrack(queue, reason) {
        const failedTrack = queue.currentTrack;
        if (!failedTrack) return this.playNext(queue);
        const attempts = queue.retryCounts.get(failedTrack.id) || 0;
        if (attempts < this.config.trackRetryLimit) {
            queue.retryCounts.set(failedTrack.id, attempts + 1);
            try {
                const refreshed = await this.resolveStoredTrack(failedTrack, queue.guildId);
                queue.currentTrack = refreshed;
                await this.playTrack(queue, refreshed, queue.position);
                return;
            } catch (error) {
                console.warn(`Track retry failed for guild ${queue.guildId}: ${error.message}`);
            }
        }

        await this.sendToTextChannel(queue, `${reason === 'stuck' ? 'The track got stuck' : 'The track failed'} and was skipped.`);
        await this.finishTrack(queue, reason);
    }

    async playTrack(queue, track, resumePosition = 0) {
        if (!queue.player) throw this.userError('The voice player is not connected.');
        let playable = track;
        const currentNodeName = this.nodeName(queue.player.node);
        if (!playable.encoded || (playable.nodeName && playable.nodeName !== currentNodeName)) {
            playable = await this.resolveStoredTrack(playable, queue.guildId);
        }

        queue.currentTrack = playable;
        queue.position = Math.max(0, Number(resumePosition || 0));
        queue.playing = true;
        queue.stopped = false;
        queue.pendingEndAction = null;
        queue.skipVotes.clear();
        await queue.player.playTrack({ track: { encoded: playable.encoded } });
        await queue.player.setGlobalVolume(queue.volume);
        if (queue.position > 0 && playable.isSeekable) {
            await queue.player.seekTo(clamp(queue.position, 0, Math.max(0, playable.duration - 1000)));
        }
        if (queue.paused) await queue.player.setPaused(true);
        this.recordUsage(queue, playable);
        if (this.getSettings(queue.guildId).announce) await this.announceNowPlaying(queue);
        this.schedulePanelUpdate(queue);
        this.persistSession(queue);
    }

    async playNext(queue) {
        if (!queue || queue.destroyed || !queue.player) return;
        this.cancelIdleTimer(queue);
        let nextTrack = queue.upcoming.shift() || null;
        if (!nextTrack && queue.autoplay) nextTrack = await this.createAutoplayTrack(queue);
        if (!nextTrack) {
            queue.currentTrack = null;
            queue.position = 0;
            queue.playing = false;
            queue.paused = false;
            queue.skipVotes.clear();
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            if (this.getSettings(queue.guildId).announce) await this.sendToTextChannel(queue, 'The music queue is finished.');
            this.scheduleIdleTimer(queue);
            return;
        }

        try {
            await this.playTrack(queue, nextTrack);
        } catch (error) {
            this.metrics.playbackFailures += 1;
            console.error(`Failed to start track in guild ${queue.guildId}:`, error);
            await this.sendToTextChannel(queue, `Could not play **${safeText(nextTrack.title, 120)}**. Trying the next track.`);
            queue.currentTrack = null;
            await this.playNext(queue);
        }
    }

    async finishTrack(queue, action) {
        const finished = queue.currentTrack;
        queue.pendingEndAction = null;
        queue.currentTrack = null;
        queue.position = 0;
        queue.playing = false;
        queue.paused = false;
        queue.skipVotes.clear();

        if (finished && action !== 'stop' && action !== 'previous') {
            queue.pushHistory(finished, this.config.historyLimit);
            if (queue.loopMode === 'track' && action === 'completed') {
                queue.upcoming.unshift({ ...finished, id: newId() });
            } else if (queue.loopMode === 'queue') {
                queue.upcoming.push({ ...finished, id: newId() });
            }
        }

        if (action === 'stop') {
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            return;
        }
        await this.playNext(queue);
    }

    async createAutoplayTrack(queue) {
        const seed = queue.history[0] || queue.currentTrack;
        if (!seed) return null;
        const recent = [seed, ...queue.history.slice(0, this.config.autoplayHistorySize), ...queue.upcoming];
        const usedKeys = new Set(recent.flatMap(trackDeduplicationKeys));
        const query = `${seed.author} ${seed.title} related`;
        try {
            const result = await this.resolve(query, this.client.user.id, queue.guildId, { maximum: 10, allowMultipleSearch: true });
            const candidate = result.tracks.find(track => !trackDeduplicationKeys(track).some(key => usedKeys.has(key)));
            return candidate ? { ...candidate, id: newId(), autoplay: true } : null;
        } catch {
            return null;
        }
    }

    userError(message) {
        const error = new Error(message);
        error.userMessage = message;
        return error;
    }

    isAdministrator(member) {
        return Boolean(member?.permissions?.has(this.discord.PermissionsBitField.Flags.Administrator) ||
            member?.permissions?.has(this.discord.PermissionsBitField.Flags.ManageGuild));
    }

    isDj(member, settings = null) {
        if (!member) return false;
        if (this.isAdministrator(member)) return true;
        const guildSettings = settings || this.getSettings(member.guild.id);
        if (guildSettings.djUserIds.includes(member.id)) return true;
        return guildSettings.djRoleIds.some(roleId => member.roles?.cache?.has(roleId));
    }

    authorizeMember(member, queue, options = {}) {
        if (!member) return { ok: false, message: 'I could not verify your server membership.' };
        const settings = this.getSettings(member.guild.id);
        const administrator = this.isAdministrator(member);
        const dj = this.isDj(member, settings);
        const voiceChannelId = member.voice?.channelId;

        if (options.requireVoice !== false && !voiceChannelId && !administrator) {
            return { ok: false, message: 'Join a voice channel first.' };
        }
        if (queue?.voiceChannelId && voiceChannelId !== queue.voiceChannelId && !administrator) {
            return { ok: false, message: 'You must be in the same voice channel as the bot.' };
        }
        if (options.dj && !dj) {
            return { ok: false, message: 'That control is restricted to configured DJs or server managers.' };
        }
        if (settings.djOnly && options.control && !dj) {
            return { ok: false, message: 'DJ-only mode is enabled for that control.' };
        }
        return { ok: true, administrator, dj, settings };
    }

    checkCooldown(message, command) {
        const secondsByCommand = {
            '!play': 3,
            '!lyrics': 8,
            '!spotify': 12,
            '!musicpanel': 5,
            '!filter': 2,
            '!equalizer': 2,
            '!playlist': 3,
            '!serverplaylist': 3
        };
        const duration = secondsByCommand[command] || 0;
        if (!duration || this.isAdministrator(message.member)) return null;
        const key = `${message.guild.id}:${message.author.id}:${command}`;
        const remaining = (this.cooldowns.get(key) || 0) - Date.now();
        if (remaining > 0) return Math.ceil(remaining / 1000);
        this.cooldowns.set(key, Date.now() + duration * 1000);
        return null;
    }

    normalizeCommand(command, args) {
        let canonical = MUSIC_ALIASES.get(command) || command;
        const rewrittenArgs = args.slice();
        if (canonical.includes(':')) {
            const [base, subcommand] = canonical.split(':');
            canonical = base;
            rewrittenArgs.unshift(subcommand);
        }
        if (canonical === '!filter' && command === '!clearfilter') rewrittenArgs.unshift('clear');
        if (canonical !== '!speed' && Object.prototype.hasOwnProperty.call(FILTER_PRESETS, canonical.slice(1))) {
            rewrittenArgs.unshift(canonical.slice(1));
            canonical = '!filter';
        }
        return { canonical, args: rewrittenArgs };
    }

    async handlePrefixCommand(message, rawCommand, rawArgs) {
        if (!rawCommand) return false;
        const normalized = this.normalizeCommand(rawCommand, rawArgs || []);
        const command = normalized.canonical;
        const args = normalized.args;
        if (!MUSIC_COMMANDS.has(command)) return false;
        if (command === '!remove' && this.isTicketChannel(message.channel)) return false;

        this.metrics.commands += 1;
        const cooldown = this.checkCooldown(message, command);
        if (cooldown) {
            await this.reply(message, `Please wait ${cooldown}s before using that music command again.`);
            return true;
        }

        try {
            switch (command) {
                case '!play': await this.commandPlay(message, args); break;
                case '!spotify': await this.commandSpotify(message, args); break;
                case '!join': await this.commandJoin(message); break;
                case '!leave': await this.commandLeave(message); break;
                case '!pause': await this.commandPause(message, true); break;
                case '!resume': await this.commandPause(message, false); break;
                case '!stop': await this.commandStop(message); break;
                case '!skip': await this.commandSkip(message, false); break;
                case '!forceskip': await this.commandSkip(message, true); break;
                case '!previous': await this.commandPrevious(message); break;
                case '!seek': await this.commandSeek(message, args, 'absolute'); break;
                case '!forward': await this.commandSeek(message, args, 'forward'); break;
                case '!backward': await this.commandSeek(message, args, 'backward'); break;
                case '!volume': await this.commandVolume(message, args); break;
                case '!nowplaying': await this.commandNowPlaying(message); break;
                case '!queue': await this.commandQueue(message, args); break;
                case '!remove': await this.commandRemove(message, args); break;
                case '!skipto': await this.commandSkipTo(message, args); break;
                case '!clearqueue': await this.commandClearQueue(message); break;
                case '!shuffle': await this.commandShuffle(message); break;
                case '!move': await this.commandMove(message, args); break;
                case '!loop': await this.commandLoop(message, args); break;
                case '!autoplay': await this.commandAutoplay(message, args); break;
                case '!247': await this.command247(message, args); break;
                case '!lyrics': await this.commandLyrics(message, args); break;
                case '!musicpanel': await this.commandMusicPanel(message, args); break;
                case '!filter': await this.commandFilter(message, args); break;
                case '!filters': await this.commandFilters(message); break;
                case '!equalizer': await this.commandEqualizer(message, args); break;
                case '!speed': await this.commandSpeed(message, args); break;
                case '!dj': await this.commandDj(message, args); break;
                case '!playlist': await this.commandPlaylist(message, args, false); break;
                case '!serverplaylist': await this.commandPlaylist(message, args, true); break;
                case '!musicsettings': await this.commandMusicSettings(message, args); break;
                default: return false;
            }
        } catch (error) {
            const errorId = newId().slice(0, 8);
            console.error(`Music command failure ${errorId} (${command}) in guild ${message.guild.id}:`, error);
            await this.reply(message, `${error.userMessage || 'The music command failed.'} Error ID: ${errorId}`).catch(() => {});
        }
        return true;
    }

    async commandPlay(message, args) {
        const query = args.join(' ').trim();
        if (!query) throw this.userError('Usage: `!play <song name or URL>`');
        const access = this.authorizeMember(message.member, this.getQueue(message.guild.id, false), { requireVoice: true });
        if (!access.ok) throw this.userError(access.message);
        const voiceChannel = message.member.voice.channel;
        await this.ensureVoicePermissions(message.guild, voiceChannel);

        const loading = await this.reply(message, 'Searching for a playable source...');
        let result;
        try {
            if (this.isSpotifyUrl(query) && this.config.spotifyClientId && this.config.spotifyClientSecret) {
                result = await this.resolveSpotifyImport(query, message.author.id, message.guild.id, loading);
            } else {
                result = await this.resolve(query, message.author.id, message.guild.id);
            }
        } catch (error) {
            await loading.edit({ content: safeText(error.userMessage || error.message), allowedMentions: { parse: [] } }).catch(() => {});
            return;
        }

        await this.serialize(message.guild.id, async () => {
            const queue = this.getQueue(message.guild.id);
            if (queue.upcoming.length + result.tracks.length > this.config.maxQueueSize) {
                throw this.userError(`The queue limit is ${this.config.maxQueueSize} tracks.`);
            }
            queue.textChannelId = message.channel.id;
            queue.lastControllerId = message.author.id;
            await this.connect(queue, message.guild, voiceChannel, result.nodeName);
            const wasIdle = !queue.currentTrack && !queue.playing;
            queue.addMany(result.tracks);
            this.persistSession(queue);
            if (wasIdle) await this.playNext(queue);
            const collection = result.playlistName || result.tracks.length > 1;
            const summary = collection
                ? `Added ${result.loaded} track(s)${result.playlistName ? ` from **${safeText(result.playlistName, 120)}**` : ''}. Skipped: ${result.skipped || 0}. Failed: ${result.failed || 0}.`
                : `Added **${safeText(result.tracks[0].title, 160)}** by ${safeText(result.tracks[0].author, 100)}.`;
            await loading.edit({ content: summary, allowedMentions: { parse: [] } });
        });
    }

    async commandJoin(message) {
        const access = this.authorizeMember(message.member, this.getQueue(message.guild.id, false), { requireVoice: true });
        if (!access.ok) throw this.userError(access.message);
        const channel = message.member.voice.channel;
        await this.ensureVoicePermissions(message.guild, channel);
        await this.serialize(message.guild.id, async () => {
            const queue = this.getQueue(message.guild.id);
            queue.textChannelId = message.channel.id;
            await this.connect(queue, message.guild, channel);
        });
        await this.reply(message, `Connected to **${safeText(channel.name, 100)}**.`);
    }

    async commandLeave(message) {
        const queue = this.getQueue(message.guild.id, false);
        if (!queue) throw this.userError('There is no active music player.');
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => this.destroyPlayer(queue, true));
        await this.reply(message, 'Disconnected and cleared the music session.');
    }

    async commandPause(message, paused) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => {
            if (!queue.currentTrack) throw this.userError('Nothing is currently playing.');
            await queue.player.setPaused(paused);
            queue.paused = paused;
            queue.lastControllerId = message.author.id;
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
        });
        await this.reply(message, paused ? 'Playback paused.' : 'Playback resumed.');
    }

    async commandStop(message) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => {
            queue.clear();
            queue.stopped = true;
            queue.pendingEndAction = 'stop';
            queue.currentTrack = null;
            queue.playing = false;
            queue.paused = false;
            queue.position = 0;
            queue.skipVotes.clear();
            if (queue.player) await queue.player.stopTrack().catch(() => {});
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            this.scheduleIdleTimer(queue);
        });
        await this.reply(message, 'Playback stopped and the upcoming queue was cleared.');
    }

    async commandSkip(message, force) {
        const queue = this.requireActiveQueue(message.guild.id);
        if (!queue.currentTrack) throw this.userError('Nothing is currently playing.');
        const access = this.authorizeMember(message.member, queue, { control: false, dj: force });
        if (!access.ok) throw this.userError(access.message);

        const immediate = force || access.dj || queue.currentTrack.requesterId === message.author.id;
        if (!immediate) {
            const channel = message.guild.channels.cache.get(queue.voiceChannelId);
            const listeners = channel?.members?.filter(member => !member.user.bot) || new Map();
            const required = Math.max(1, Math.ceil(listeners.size / 2));
            queue.skipVotes.add(message.author.id);
            if (queue.skipVotes.size < required) {
                await this.reply(message, `Skip vote added: ${queue.skipVotes.size}/${required}.`);
                return;
            }
        }

        await this.serialize(message.guild.id, async () => {
            queue.pendingEndAction = 'skip';
            await queue.player.stopTrack();
        });
        await this.reply(message, 'Skipped the current track.');
    }

    async commandPrevious(message) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => {
            const previous = queue.history.shift();
            if (!previous) throw this.userError('There is no previous track in history.');
            if (queue.currentTrack) queue.upcoming.unshift({ ...queue.currentTrack, id: newId() });
            queue.upcoming.unshift({ ...previous, id: newId() });
            queue.pendingEndAction = 'previous';
            if (queue.player && queue.currentTrack) await queue.player.stopTrack();
            else await this.playNext(queue);
            this.persistSession(queue);
        });
        await this.reply(message, 'Returning to the previous track.');
    }

    async commandSeek(message, args, mode) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        if (!queue.currentTrack) throw this.userError('Nothing is currently playing.');
        if (!queue.currentTrack.isSeekable || queue.currentTrack.isStream) throw this.userError('That livestream is not seekable.');
        const amount = parseDuration(args[0]);
        if (amount == null) throw this.userError(`Usage: \`!${mode === 'absolute' ? 'seek' : mode} <90|1:30|1h2m3s>\``);
        await this.serialize(message.guild.id, async () => {
            const current = Math.max(0, Number(queue.player.position || queue.position || 0));
            const target = mode === 'forward' ? current + amount : mode === 'backward' ? current - amount : amount;
            const maximum = Math.max(0, queue.currentTrack.duration - 500);
            queue.position = clamp(target, 0, maximum);
            await queue.player.seekTo(queue.position);
            this.persistSession(queue);
        });
        await this.reply(message, `Playback position: **${formatDuration(queue.position)}**.`);
    }

    async commandVolume(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const amount = Number.parseInt(args[0], 10);
        const settings = this.getSettings(message.guild.id);
        if (!Number.isInteger(amount) || amount < 0 || amount > settings.maxVolume) {
            throw this.userError(`Volume must be between 0 and ${settings.maxVolume}.`);
        }
        const highVolume = amount > Math.max(70, settings.defaultVolume);
        const access = this.authorizeMember(message.member, queue, { control: true, dj: settings.djOnly && highVolume });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => {
            queue.volume = amount;
            await queue.player.setGlobalVolume(amount);
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
        });
        await this.reply(message, `Volume set to **${amount}%**.`);
    }

    async commandNowPlaying(message) {
        const queue = this.getQueue(message.guild.id, false);
        if (!queue?.currentTrack) throw this.userError('Nothing is currently playing.');
        await message.channel.send({
            embeds: [this.buildNowPlayingEmbed(queue)],
            allowedMentions: { parse: [] }
        });
    }

    async commandQueue(message, args) {
        const queue = this.getQueue(message.guild.id, false);
        if (!queue || (!queue.currentTrack && !queue.upcoming.length)) throw this.userError('The music queue is empty.');
        const pageSize = 10;
        const pages = Math.max(1, Math.ceil(queue.upcoming.length / pageSize));
        const page = clamp(Number.parseInt(args[0], 10) || 1, 1, pages);
        const start = (page - 1) * pageSize;
        const lines = queue.upcoming.slice(start, start + pageSize).map((track, index) => {
            const auto = track.autoplay ? ' [Autoplay]' : '';
            return `${start + index + 1}. **${safeText(track.title, 80)}** - ${safeText(track.author, 60)} (${formatDuration(track.duration)})${auto}`;
        });
        const now = queue.currentTrack
            ? `Now: **${safeText(queue.currentTrack.title, 100)}** - ${safeText(queue.currentTrack.author, 80)}`
            : 'Now: nothing playing';
        const embed = new this.discord.EmbedBuilder()
            .setColor('#1DB954')
            .setTitle('Music Queue')
            .setDescription(`${now}\n\n${lines.join('\n') || 'No upcoming tracks.'}`.slice(0, 4096))
            .setFooter({ text: `Page ${page}/${pages} | ${queue.upcoming.length} upcoming | Loop ${queue.loopMode}` });
        await message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
    }

    async commandRemove(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        const removed = await this.serialize(message.guild.id, async () => {
            const track = queue.remove(Number.parseInt(args[0], 10));
            if (!track) throw this.userError('Give a valid one-based queue position.');
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            return track;
        });
        await this.reply(message, `Removed **${safeText(removed.title, 150)}**.`);
    }

    async commandSkipTo(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(message.guild.id, async () => {
            const selected = queue.skipTo(Number.parseInt(args[0], 10));
            if (!selected) throw this.userError('Give a valid one-based queue position.');
            queue.pendingEndAction = 'skip';
            if (queue.currentTrack) await queue.player.stopTrack();
            else await this.playNext(queue);
            this.persistSession(queue);
        });
        await this.reply(message, 'Skipped to the selected queue track.');
    }

    async commandClearQueue(message) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        const count = await this.serialize(message.guild.id, async () => {
            const removed = queue.clear();
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            return removed;
        });
        await this.reply(message, `Cleared ${count} upcoming track(s).`);
    }

    async commandShuffle(message) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        if (queue.upcoming.length < 2) throw this.userError('At least two upcoming tracks are needed to shuffle.');
        await this.serialize(message.guild.id, async () => {
            queue.shuffle();
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
        });
        await this.reply(message, `Shuffled ${queue.upcoming.length} upcoming tracks.`);
    }

    async commandMove(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        const track = await this.serialize(message.guild.id, async () => {
            const moved = queue.move(Number.parseInt(args[0], 10), Number.parseInt(args[1], 10));
            if (!moved) throw this.userError('Usage: `!move <from position> <to position>`');
            this.persistSession(queue);
            return moved;
        });
        await this.reply(message, `Moved **${safeText(track.title, 120)}**.`);
    }

    async commandLoop(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        const mode = String(args[0] || '').toLowerCase();
        if (!LOOP_MODES.has(mode)) throw this.userError('Usage: `!loop <off|track|queue>`');
        await this.serialize(message.guild.id, async () => {
            queue.loopMode = mode;
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
        });
        await this.reply(message, `Loop mode set to **${mode}**.`);
    }

    async commandAutoplay(message, args) {
        const queue = this.getQueue(message.guild.id);
        const action = String(args[0] || 'status').toLowerCase();
        if (action === 'status') {
            await this.reply(message, `Autoplay is **${queue.autoplay ? 'on' : 'off'}**.`);
            return;
        }
        const enabled = parseBooleanWord(action);
        if (enabled == null) throw this.userError('Usage: `!autoplay <on|off|status>`');
        const access = this.authorizeMember(message.member, queue, { control: true });
        if (!access.ok) throw this.userError(access.message);
        await this.serialize(queue.guildId, async () => {
            queue.autoplay = enabled;
            this.persistSession(queue);
            this.schedulePanelUpdate(queue);
            if (enabled && queue.player && !queue.currentTrack && !queue.upcoming.length) await this.playNext(queue);
        });
        await this.reply(message, `Autoplay is now **${enabled ? 'on' : 'off'}**.`);
    }

    async command247(message, args) {
        const queue = this.getQueue(message.guild.id);
        const action = String(args[0] || 'status').toLowerCase();
        if (action === 'status') {
            await this.reply(message, `24/7 mode is **${queue.enabled247 ? 'on' : 'off'}**.`);
            return;
        }
        const enabled = parseBooleanWord(action);
        if (enabled == null) throw this.userError('Usage: `!247 <on|off|status>`');
        const access = this.authorizeMember(message.member, queue, { control: true, dj: true });
        if (!access.ok) throw this.userError(access.message);
        if (enabled && !queue.voiceChannelId) {
            const channel = message.member.voice.channel;
            if (!channel) throw this.userError('Join the voice channel that should be restored first.');
            await this.ensureVoicePermissions(message.guild, channel);
            queue.textChannelId = message.channel.id;
            await this.connect(queue, message.guild, channel);
        }
        queue.enabled247 = enabled;
        this.repository.updateSettings(message.guild.id, { enabled247: enabled });
        if (enabled) this.persistSession(queue);
        else {
            delete this.repository.data.sessions[message.guild.id];
            this.repository.scheduleSave();
            this.scheduleIdleTimer(queue);
        }
        await this.reply(message, `24/7 mode is now **${enabled ? 'on' : 'off'}**.`);
    }

    async commandLyrics(message, args) {
        const queue = this.getQueue(message.guild.id, false);
        const query = args.join(' ').trim() || (queue?.currentTrack ? `${queue.currentTrack.author} ${queue.currentTrack.title}` : '');
        if (!query) throw this.userError('Give a song name, or play a track first.');
        const url = new URL(this.config.lyricsUrl);
        url.searchParams.set('q', query);
        let response;
        try {
            response = await fetch(url, {
                headers: { 'User-Agent': 'DiscordMusicBot/2.0' },
                signal: AbortSignal.timeout(10000)
            });
        } catch {
            throw this.userError('The lyrics provider is unavailable right now.');
        }
        if (!response.ok) throw this.userError(`The lyrics provider returned ${response.status}.`);
        const payload = await response.json();
        const result = Array.isArray(payload) ? payload.find(item => item?.plainLyrics) : payload;
        const lyrics = safeText(result?.plainLyrics || result?.lyrics || '', 20000);
        if (!lyrics) throw this.userError('No plain-text lyrics were found; the track may be instrumental or unavailable.');
        const chunks = this.chunkText(lyrics, 3800).slice(0, 6);
        for (let index = 0; index < chunks.length; index += 1) {
            const embed = new this.discord.EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(safeText(`${result.trackName || query} - Lyrics`, 256))
                .setDescription(chunks[index])
                .setFooter({ text: `Page ${index + 1}/${chunks.length} | Source: LRCLIB (plain text)` });
            await message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
        }
    }

    async commandFilters(message) {
        await this.reply(message, `Available filters: ${Object.keys(FILTER_PRESETS).map(name => `\`${name}\``).join(', ')}. Use \`!filter clear\` to reset.`);
    }

    async commandFilter(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const requested = String(args[0] || '').toLowerCase();
        if (!requested) throw this.userError('Usage: `!filter <preset|clear>`');
        const settings = this.getSettings(message.guild.id);
        const access = this.authorizeMember(message.member, queue, {
            control: true,
            dj: settings.djOnly || requested === 'earrape'
        });
        if (!access.ok) throw this.userError(access.message);
        if (requested === 'clear' || requested === 'off') {
            await this.serialize(queue.guildId, () => this.applyFilter(queue, 'off', {}));
            await this.reply(message, 'Audio filters cleared.');
            return;
        }
        const preset = FILTER_PRESETS[requested];
        if (!preset) throw this.userError('Unknown filter. Use `!filters` to list available presets.');
        await this.serialize(queue.guildId, () => this.applyFilter(queue, requested, preset));
        const warning = requested === 'earrape'
            ? ' Hearing-safety warning: this effect can sound harsh; the bot keeps it inside the configured volume limit.'
            : '';
        await this.reply(message, `Applied the **${requested}** filter.${warning}`);
    }

    async commandEqualizer(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const settings = this.getSettings(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true, dj: settings.djOnly });
        if (!access.ok) throw this.userError(access.message);
        const action = String(args[0] || '').toLowerCase();
        if (action === 'reset') {
            await this.serialize(queue.guildId, async () => {
                queue.customEqualizer = [];
                await this.applyFilter(queue, 'off', {});
            });
            await this.reply(message, 'Equalizer reset.');
            return;
        }
        if (action === 'preset') {
            await this.commandFilter(message, args.slice(1));
            return;
        }
        if (action === 'band') {
            const band = Number.parseInt(args[1], 10);
            const gain = Number.parseFloat(args[2]);
            if (!Number.isInteger(band) || band < 0 || band > 14 || !Number.isFinite(gain) || gain < -0.25 || gain > 0.35) {
                throw this.userError('Usage: `!equalizer band <0-14> <gain -0.25 to 0.35>`');
            }
            await this.serialize(queue.guildId, async () => {
                const bands = queue.customEqualizer.filter(item => item.band !== band);
                bands.push({ band, gain });
                bands.sort((left, right) => left.band - right.band);
                queue.customEqualizer = bands;
                await this.applyFilter(queue, 'custom', { equalizer: bands });
            });
            await this.reply(message, `Equalizer band ${band} set to ${gain}.`);
            return;
        }
        throw this.userError('Usage: `!equalizer <preset name|band band gain|reset>`');
    }

    async commandSpeed(message, args) {
        const queue = this.requireActiveQueue(message.guild.id);
        const settings = this.getSettings(message.guild.id);
        const access = this.authorizeMember(message.member, queue, { control: true, dj: settings.djOnly });
        if (!access.ok) throw this.userError(access.message);
        const rate = Number.parseFloat(args[0]);
        if (!Number.isFinite(rate) || rate < 0.5 || rate > 2.0) throw this.userError('Speed must be between 0.5 and 2.0.');
        await this.serialize(queue.guildId, () => this.applyFilter(queue, 'custom-speed', { timescale: { speed: rate, pitch: 1.0, rate: 1.0 } }));
        await this.reply(message, `Playback speed set to **${rate}x**.`);
    }

    async applyFilter(queue, name, payload) {
        if (!queue.player || typeof queue.player.setFilters !== 'function') {
            throw this.userError('This Lavalink client or server does not support filters.');
        }
        const safePayload = JSON.parse(JSON.stringify(payload || {}));
        await queue.player.setFilters(safePayload);
        queue.filterPreset = name;
        queue.customFilterState = safePayload;
        if (name !== 'custom') queue.customEqualizer = [];
        this.persistSession(queue);
        this.schedulePanelUpdate(queue);
    }

    async applyCurrentFilters(queue) {
        if (!queue.player || typeof queue.player.setFilters !== 'function') return;
        if (queue.filterPreset === 'off') return queue.player.setFilters({});
        if (queue.filterPreset === 'custom') return queue.player.setFilters({ equalizer: queue.customEqualizer });
        const preset = FILTER_PRESETS[queue.filterPreset];
        if (preset) return queue.player.setFilters(JSON.parse(JSON.stringify(preset)));
        if (queue.customFilterState) return queue.player.setFilters(JSON.parse(JSON.stringify(queue.customFilterState)));
    }

    async commandDj(message, args) {
        if (!this.isAdministrator(message.member)) throw this.userError('Manage Server permission is required.');
        const action = String(args[0] || 'status').toLowerCase();
        const settings = this.getSettings(message.guild.id);
        if (action === 'status' || action === 'list') {
            const roles = settings.djRoleIds.map(id => `<@&${id}>`).join(', ') || 'None';
            const users = settings.djUserIds.map(id => `<@${id}>`).join(', ') || 'None';
            await message.channel.send({
                content: `DJ-only mode: **${settings.djOnly ? 'on' : 'off'}**\nDJ roles: ${roles}\nDJ users: ${users}`,
                allowedMentions: { parse: [] }
            });
            return;
        }
        if (action === 'toggle') {
            const enabled = parseBooleanWord(args[1]);
            if (enabled == null) throw this.userError('Usage: `!dj toggle <on|off>`');
            this.repository.updateSettings(message.guild.id, { djOnly: enabled });
            await this.reply(message, `DJ-only mode is now **${enabled ? 'on' : 'off'}**.`);
            return;
        }
        const id = this.extractDiscordId(args[1]);
        if (!id) throw this.userError(`Usage: \`!dj ${action} <mention or ID>\``);
        if (action === 'addrole' || action === 'removerole') {
            const roleIds = new Set(settings.djRoleIds);
            action === 'addrole' ? roleIds.add(id) : roleIds.delete(id);
            this.repository.updateSettings(message.guild.id, { djRoleIds: [...roleIds] });
        } else if (action === 'adduser' || action === 'removeuser') {
            const userIds = new Set(settings.djUserIds);
            action === 'adduser' ? userIds.add(id) : userIds.delete(id);
            this.repository.updateSettings(message.guild.id, { djUserIds: [...userIds] });
        } else {
            throw this.userError('Usage: `!dj <addrole|removerole|adduser|removeuser|toggle|status|list>`');
        }
        await this.reply(message, 'DJ configuration updated.');
    }

    async commandMusicPanel(message, args) {
        const action = String(args[0] || 'status').toLowerCase();
        const settings = this.getSettings(message.guild.id);
        if (action === 'status') {
            await this.reply(message, settings.panelChannelId
                ? `Music panel: <#${settings.panelChannelId}>${settings.panelMessageId ? `, message ${settings.panelMessageId}` : ''}.`
                : 'No music panel is configured.');
            return;
        }
        if (!this.isDj(message.member, settings)) throw this.userError('DJ or Manage Server permission is required.');
        if (action === 'remove') {
            await this.deletePanelMessage(message.guild, settings);
            this.repository.updateSettings(message.guild.id, {
                panelChannelId: null,
                panelMessageId: null,
                panelGeneration: null
            });
            await this.reply(message, 'Music panel removed.');
            return;
        }
        if (!['setup', 'refresh'].includes(action)) throw this.userError('Usage: `!musicpanel <setup|remove|refresh|status>`');
        const queue = this.getQueue(message.guild.id);
        queue.textChannelId ||= message.channel.id;
        if (action === 'setup') {
            await this.deletePanelMessage(message.guild, settings);
            queue.panelGeneration = newId().replace(/-/g, '').slice(0, 12);
            this.repository.updateSettings(message.guild.id, {
                panelChannelId: message.channel.id,
                panelMessageId: null,
                panelGeneration: queue.panelGeneration
            });
        }
        await this.updatePanel(queue, true);
        await this.reply(message, 'Music panel updated.');
    }

    buildPanelComponents(queue) {
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = this.discord;
        const prefix = `music:${queue.guildId}:${queue.panelGeneration}:`;
        const active = Boolean(queue.currentTrack);
        const rowOne = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${prefix}previous`).setLabel('Previous').setStyle(ButtonStyle.Secondary).setDisabled(!queue.history.length),
            new ButtonBuilder().setCustomId(`${prefix}${queue.paused ? 'resume' : 'pause'}`).setLabel(queue.paused ? 'Resume' : 'Pause').setStyle(ButtonStyle.Primary).setDisabled(!active),
            new ButtonBuilder().setCustomId(`${prefix}skip`).setLabel('Skip').setStyle(ButtonStyle.Primary).setDisabled(!active),
            new ButtonBuilder().setCustomId(`${prefix}stop`).setLabel('Stop').setStyle(ButtonStyle.Danger).setDisabled(!active && !queue.upcoming.length),
            new ButtonBuilder().setCustomId(`${prefix}loop`).setLabel(`Loop: ${queue.loopMode}`).setStyle(ButtonStyle.Secondary)
        );
        const rowTwo = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${prefix}shuffle`).setLabel('Shuffle').setStyle(ButtonStyle.Secondary).setDisabled(queue.upcoming.length < 2),
            new ButtonBuilder().setCustomId(`${prefix}queue`).setLabel(`Queue: ${queue.upcoming.length}`).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${prefix}volume`).setLabel(`Volume: ${queue.volume}`).setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`${prefix}autoplay`).setLabel(`Autoplay: ${queue.autoplay ? 'on' : 'off'}`).setStyle(queue.autoplay ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
        const filterMenu = new StringSelectMenuBuilder()
            .setCustomId(`${prefix}filter`)
            .setPlaceholder(`Filter: ${queue.filterPreset}`)
            .addOptions([
                new StringSelectMenuOptionBuilder().setLabel('Clear filters').setValue('off'),
                ...Object.keys(FILTER_PRESETS).slice(0, 24).map(name => new StringSelectMenuOptionBuilder().setLabel(name).setValue(name))
            ]);
        return [rowOne, rowTwo, new ActionRowBuilder().addComponents(filterMenu)];
    }

    buildNowPlayingEmbed(queue) {
        const track = queue.currentTrack;
        const duration = track?.duration || 0;
        const position = clamp(Number(queue.player?.position || queue.position || 0), 0, duration || Number.MAX_SAFE_INTEGER);
        const progress = this.progressBar(position, duration, 16);
        const embed = new this.discord.EmbedBuilder()
            .setColor('#1DB954')
            .setTitle(track ? safeText(track.title, 256) : 'Nothing Playing')
            .setDescription(track
                ? `${safeText(track.author, 160)}\n${progress} ${formatDuration(position)} / ${track.isStream ? 'Live' : formatDuration(duration)}`
                : 'Add a track with `!play <song or URL>`.')
            .addFields(
                { name: 'Source', value: safeText(track?.source || 'None', 50), inline: true },
                { name: 'Queue', value: String(queue.upcoming.length), inline: true },
                { name: 'Volume', value: `${queue.volume}%`, inline: true },
                { name: 'Loop', value: queue.loopMode, inline: true },
                { name: 'Autoplay', value: queue.autoplay ? 'On' : 'Off', inline: true },
                { name: 'Filter', value: queue.filterPreset, inline: true }
            )
            .setFooter({ text: track?.requesterId ? `Requested by ${track.requesterId}` : 'Music panel' });
        if (track?.artworkUrl) embed.setThumbnail(track.artworkUrl);
        if (track?.uri) embed.setURL(track.uri);
        return embed;
    }

    schedulePanelUpdate(queue) {
        if (queue.panelUpdateTimer) clearTimeout(queue.panelUpdateTimer);
        queue.panelUpdateTimer = setTimeout(() => {
            queue.panelUpdateTimer = null;
            void this.updatePanel(queue).catch(error => console.warn(`Music panel update failed for ${queue.guildId}: ${error.message}`));
        }, this.config.panelDebounceMs);
        if (typeof queue.panelUpdateTimer.unref === 'function') queue.panelUpdateTimer.unref();
    }

    async updatePanel(queue, force = false) {
        const settings = this.getSettings(queue.guildId);
        if (!settings.panelChannelId) return;
        const guild = this.client.guilds.cache.get(queue.guildId);
        const channel = guild?.channels.cache.get(settings.panelChannelId) || await guild?.channels.fetch(settings.panelChannelId).catch(() => null);
        if (!channel?.isTextBased()) return;
        queue.panelGeneration = settings.panelGeneration || queue.panelGeneration;
        const payload = {
            embeds: [this.buildNowPlayingEmbed(queue)],
            components: this.buildPanelComponents(queue),
            allowedMentions: { parse: [] }
        };
        let panelMessage = null;
        if (settings.panelMessageId) panelMessage = await channel.messages.fetch(settings.panelMessageId).catch(() => null);
        if (panelMessage) {
            await panelMessage.edit(payload);
        } else if (force || queue.currentTrack || settings.panelChannelId) {
            panelMessage = await channel.send(payload);
            this.repository.updateSettings(queue.guildId, {
                panelMessageId: panelMessage.id,
                panelGeneration: queue.panelGeneration
            });
        }
        queue.lastPanelUpdate = Date.now();
    }

    async deletePanelMessage(guild, settings) {
        if (!settings.panelChannelId || !settings.panelMessageId) return;
        const channel = guild.channels.cache.get(settings.panelChannelId) || await guild.channels.fetch(settings.panelChannelId).catch(() => null);
        const panel = await channel?.messages?.fetch(settings.panelMessageId).catch(() => null);
        if (panel) await panel.delete().catch(() => {});
    }

    async handleInteraction(interaction) {
        if ((!interaction.isButton() && !interaction.isStringSelectMenu()) || !interaction.customId.startsWith('music:')) return false;
        const [, guildId, generation, action] = interaction.customId.split(':');
        if (!interaction.guild || interaction.guild.id !== guildId) {
            await interaction.reply({ content: 'That music panel belongs to another server.', ephemeral: true });
            return true;
        }
        const queue = this.getQueue(guildId, false);
        const settings = this.getSettings(guildId);
        if (!queue || generation !== settings.panelGeneration || generation !== queue.panelGeneration) {
            await interaction.reply({ content: 'This music panel is no longer active. Run `!musicpanel refresh`.', ephemeral: true });
            return true;
        }
        const djActions = new Set(['stop', 'loop', 'autoplay', 'filter']);
        const selectedFilter = action === 'filter' ? interaction.values?.[0] : null;
        const access = this.authorizeMember(interaction.member, queue, {
            control: true,
            dj: (settings.djOnly && djActions.has(action)) || selectedFilter === 'earrape'
        });
        if (!access.ok) {
            await interaction.reply({ content: access.message, ephemeral: true });
            return true;
        }
        await interaction.deferUpdate();
        try {
            await this.serialize(guildId, async () => {
                switch (action) {
                    case 'previous': {
                        const previous = queue.history.shift();
                        if (!previous) return;
                        if (queue.currentTrack) queue.upcoming.unshift({ ...queue.currentTrack, id: newId() });
                        queue.upcoming.unshift({ ...previous, id: newId() });
                        queue.pendingEndAction = 'previous';
                        if (queue.currentTrack) await queue.player.stopTrack();
                        else await this.playNext(queue);
                        break;
                    }
                    case 'pause': await queue.player.setPaused(true); queue.paused = true; break;
                    case 'resume': await queue.player.setPaused(false); queue.paused = false; break;
                    case 'skip': queue.pendingEndAction = 'skip'; await queue.player.stopTrack(); break;
                    case 'stop':
                        queue.clear();
                        queue.pendingEndAction = 'stop';
                        if (queue.currentTrack) await queue.player.stopTrack();
                        else await this.finishTrack(queue, 'stop');
                        break;
                    case 'loop': queue.loopMode = queue.loopMode === 'off' ? 'track' : queue.loopMode === 'track' ? 'queue' : 'off'; break;
                    case 'shuffle': queue.shuffle(); break;
                    case 'queue': break;
                    case 'volume': {
                        const values = [25, 50, 75, 100].filter(value => value <= settings.maxVolume);
                        queue.volume = values.find(value => value > queue.volume) || values[0] || settings.maxVolume;
                        await queue.player.setGlobalVolume(queue.volume);
                        break;
                    }
                    case 'autoplay': queue.autoplay = !queue.autoplay; break;
                    case 'filter': {
                        const selected = interaction.values?.[0] || 'off';
                        await this.applyFilter(queue, selected, selected === 'off' ? {} : FILTER_PRESETS[selected]);
                        break;
                    }
                }
                queue.lastControllerId = interaction.user.id;
                this.persistSession(queue);
            });
            if (action === 'queue') {
                const preview = queue.upcoming.slice(0, 10).map((track, index) => `${index + 1}. ${safeText(track.title, 80)}`).join('\n') || 'No upcoming tracks.';
                await interaction.followUp({ content: preview, ephemeral: true, allowedMentions: { parse: [] } });
            }
            await this.updatePanel(queue, true);
        } catch (error) {
            await interaction.followUp({ content: error.userMessage || 'That panel control failed.', ephemeral: true }).catch(() => {});
        }
        return true;
    }

    getPlaylistContainer(message, shared) {
        const root = shared ? this.repository.data.serverPlaylists : this.repository.data.personalPlaylists;
        const ownerId = shared ? message.guild.id : message.author.id;
        root[ownerId] ||= {};
        return root[ownerId];
    }

    parsePlaylistName(args, action) {
        if (action === 'removetrack') return args.slice(1, -1).join(' ').trim();
        return args.slice(1).join(' ').trim();
    }

    async commandPlaylist(message, args, shared) {
        const action = String(args[0] || 'list').toLowerCase();
        const container = this.getPlaylistContainer(message, shared);
        const noun = shared ? 'server playlist' : 'playlist';
        const settings = this.getSettings(message.guild.id);
        const canModifyShared = !shared || this.isDj(message.member, settings);
        const modifying = new Set(['create', 'delete', 'removetrack', 'removeduplicates', 'savecurrent', 'savequeue', 'rename']);
        if (shared && modifying.has(action) && !canModifyShared) throw this.userError('DJ or Manage Server permission is required to modify server playlists.');

        if (action === 'list') {
            const values = Object.values(container);
            const description = values.length
                ? values.slice(0, 50).map(item => `**${safeText(item.name, 80)}** - ${item.tracks.length} track(s)`).join('\n')
                : `No ${noun}s saved.`;
            const embed = new this.discord.EmbedBuilder()
                .setColor('#1DB954')
                .setTitle(shared ? 'Server Playlists' : 'Your Playlists')
                .setDescription(description.slice(0, 4096));
            await message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
            return;
        }

        if (action === 'rename') {
            const joined = args.slice(1).join(' ');
            const separator = joined.indexOf('|');
            if (separator < 1) throw this.userError(`Usage: \`!${shared ? 'serverplaylist' : 'playlist'} rename <old name> | <new name>\``);
            const oldName = joined.slice(0, separator).trim();
            const newName = joined.slice(separator + 1).trim();
            const oldKey = normalizeName(oldName);
            const newKey = this.validatePlaylistName(newName);
            const playlist = container[oldKey];
            if (!playlist) throw this.userError(`${noun} not found.`);
            if (container[newKey]) throw this.userError(`A ${noun} with that name already exists.`);
            delete container[oldKey];
            container[newKey] = { ...playlist, name: newName, updatedAt: Date.now() };
            this.repository.scheduleSave();
            await this.reply(message, `Renamed **${safeText(oldName, 80)}** to **${safeText(newName, 80)}**.`);
            return;
        }

        const name = this.parsePlaylistName(args, action);
        const key = this.validatePlaylistName(name);
        let playlist = container[key];

        if (action === 'create') {
            const maximum = shared ? this.config.maxServerPlaylists : this.config.maxPlaylistsPerUser;
            if (playlist) throw this.userError(`That ${noun} already exists.`);
            if (Object.keys(container).length >= maximum) throw this.userError(`The limit is ${maximum} ${noun}s.`);
            container[key] = {
                name,
                creatorId: message.author.id,
                guildId: shared ? message.guild.id : null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tracks: []
            };
            this.repository.scheduleSave();
            await this.reply(message, `Created ${noun} **${safeText(name, 80)}**.`);
            return;
        }

        if (!playlist && !['savecurrent', 'savequeue'].includes(action)) throw this.userError(`${noun} not found.`);

        if (action === 'delete') {
            delete container[key];
            this.repository.scheduleSave();
            await this.reply(message, `Deleted ${noun} **${safeText(playlist.name, 80)}**.`);
            return;
        }

        if (action === 'info') {
            const duration = playlist.tracks.reduce((total, track) => total + (Number(track.duration) || 0), 0);
            const embed = new this.discord.EmbedBuilder()
                .setColor('#1DB954')
                .setTitle(safeText(playlist.name, 256))
                .addFields(
                    { name: 'Tracks', value: String(playlist.tracks.length), inline: true },
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Created', value: new Date(playlist.createdAt).toLocaleDateString(), inline: true }
                )
                .setDescription(playlist.tracks.slice(0, 20).map((track, index) => `${index + 1}. ${safeText(track.title, 80)} - ${safeText(track.author, 60)}`).join('\n') || 'Empty playlist.');
            await message.channel.send({ embeds: [embed], allowedMentions: { parse: [] } });
            return;
        }

        if (action === 'removetrack') {
            const position = Number.parseInt(args[args.length - 1], 10) - 1;
            if (!Number.isInteger(position) || position < 0 || position >= playlist.tracks.length) throw this.userError('Give a valid one-based track position.');
            const [removed] = playlist.tracks.splice(position, 1);
            playlist.updatedAt = Date.now();
            this.repository.scheduleSave();
            await this.reply(message, `Removed **${safeText(removed.title, 100)}** from **${safeText(playlist.name, 80)}**.`);
            return;
        }

        if (action === 'removeduplicates') {
            const before = playlist.tracks.length;
            playlist.tracks = removeDuplicateTracks(playlist.tracks);
            playlist.updatedAt = Date.now();
            this.repository.scheduleSave();
            await this.reply(message, `Removed ${before - playlist.tracks.length} duplicate track(s).`);
            return;
        }

        if (action === 'savecurrent' || action === 'savequeue') {
            const queue = this.getQueue(message.guild.id, false);
            if (!queue) throw this.userError('There is no active music queue.');
            const selected = action === 'savecurrent'
                ? [queue.currentTrack].filter(Boolean)
                : [queue.currentTrack, ...queue.upcoming].filter(Boolean);
            if (!selected.length) throw this.userError('There are no tracks to save.');
            if (!playlist) {
                const maximum = shared ? this.config.maxServerPlaylists : this.config.maxPlaylistsPerUser;
                if (Object.keys(container).length >= maximum) throw this.userError(`The limit is ${maximum} ${noun}s.`);
                playlist = container[key] = {
                    name,
                    creatorId: message.author.id,
                    guildId: shared ? message.guild.id : null,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    tracks: []
                };
            }
            const trackLimit = shared ? this.config.maxServerPlaylistTracks : this.config.maxTracksPerPlaylist;
            const combined = [...playlist.tracks, ...selected.map(serializeTrack)];
            if (combined.length > trackLimit) throw this.userError(`That ${noun} can contain at most ${trackLimit} tracks.`);
            playlist.tracks = combined;
            playlist.updatedAt = Date.now();
            this.repository.scheduleSave();
            await this.reply(message, `Saved ${selected.length} track(s) to **${safeText(name, 80)}**.`);
            return;
        }

        if (action === 'play' || action === 'shuffle') {
            const access = this.authorizeMember(message.member, this.getQueue(message.guild.id, false), { requireVoice: true });
            if (!access.ok) throw this.userError(access.message);
            if (!playlist.tracks.length) throw this.userError(`That ${noun} is empty.`);
            const loading = await this.reply(message, `Resolving ${playlist.tracks.length} saved track(s)...`);
            const sourceTracks = action === 'shuffle' ? shuffleArray(playlist.tracks) : playlist.tracks;
            const imported = await this.resolveCollection(sourceTracks, message.guild.id, message.author.id, loading);
            await this.serialize(message.guild.id, async () => {
                const queue = this.getQueue(message.guild.id);
                if (queue.upcoming.length + imported.tracks.length > this.config.maxQueueSize) throw this.userError('The imported tracks would exceed the queue limit.');
                queue.textChannelId = message.channel.id;
                await this.ensureVoicePermissions(message.guild, message.member.voice.channel);
                await this.connect(queue, message.guild, message.member.voice.channel, imported.tracks[0]?.nodeName);
                const idle = !queue.currentTrack;
                queue.addMany(imported.tracks);
                if (idle) await this.playNext(queue);
                this.persistSession(queue);
            });
            await loading.edit({
                content: `Loaded ${imported.loaded}; skipped ${imported.skipped}; failed ${imported.failed}.`,
                allowedMentions: { parse: [] }
            });
            return;
        }

        throw this.userError(`Usage: \`!${shared ? 'serverplaylist' : 'playlist'} <create|delete|info|list|play|shuffle|removetrack|removeduplicates|savecurrent|savequeue|rename>\``);
    }

    validatePlaylistName(name) {
        const value = String(name || '').trim();
        if (!value || value.length > 60 || /[\r\n\u0000-\u001F]/.test(value)) throw this.userError('Playlist names must be 1-60 safe text characters.');
        return playlistKey(value);
    }

    async commandMusicSettings(message, args) {
        if (!this.isAdministrator(message.member)) throw this.userError('Manage Server permission is required.');
        const action = String(args[0] || 'status').toLowerCase();
        const settings = this.getSettings(message.guild.id);
        if (action === 'status' || !args.length) {
            await this.reply(message, [
                `24/7: **${settings.enabled247 ? 'on' : 'off'}**`,
                `Idle timeout: **${formatDuration(settings.idleTimeoutMs)}**`,
                `Default volume: **${settings.defaultVolume}%**`,
                `Maximum volume: **${settings.maxVolume}%**`,
                `Announcements: **${settings.announce ? 'on' : 'off'}**`,
                `DJ-only: **${settings.djOnly ? 'on' : 'off'}**`,
                `Autoplay default: **${settings.autoplayDefault ? 'on' : 'off'}**`
            ].join('\n'));
            return;
        }
        if (action === 'reset') {
            this.repository.data.guildSettings[message.guild.id] = defaultGuildSettings(this.config.defaultVolume, this.config.hardMaxVolume, this.config.idleTimeoutMs);
            this.repository.scheduleSave();
            await this.reply(message, 'Music settings reset to defaults.');
            return;
        }

        const updates = {};
        if (action === 'idletimeout') {
            const duration = parseDuration(args[1]);
            if (duration == null || duration < 30000 || duration > 3600000) throw this.userError('Idle timeout must be between 30s and 1h.');
            updates.idleTimeoutMs = duration;
        } else if (action === 'defaultvolume' || action === 'maxvolume') {
            const amount = Number.parseInt(args[1], 10);
            if (!Number.isInteger(amount) || amount < 1 || amount > this.config.hardMaxVolume) throw this.userError(`Volume must be 1-${this.config.hardMaxVolume}.`);
            updates[action === 'defaultvolume' ? 'defaultVolume' : 'maxVolume'] = amount;
        } else if (['247', 'announce', 'djonly', 'autoplay'].includes(action)) {
            const enabled = parseBooleanWord(args[1]);
            if (enabled == null) throw this.userError(`Usage: \`!musicsettings ${action} <on|off>\``);
            const key = action === '247'
                ? 'enabled247'
                : action === 'autoplay'
                    ? 'autoplayDefault'
                    : action === 'djonly'
                        ? 'djOnly'
                        : action;
            updates[key] = enabled;
        } else {
            throw this.userError('Usage: `!musicsettings <247|idletimeout|defaultvolume|maxvolume|announce|djonly|autoplay|reset>`');
        }
        this.repository.updateSettings(message.guild.id, updates);
        const queue = this.getQueue(message.guild.id, false);
        if (queue) {
            if (updates.enabled247 != null) queue.enabled247 = updates.enabled247;
            if (updates.autoplayDefault != null && !queue.currentTrack) queue.autoplay = updates.autoplayDefault;
            if (updates.maxVolume != null && queue.volume > updates.maxVolume) {
                queue.volume = updates.maxVolume;
                await queue.player?.setGlobalVolume(queue.volume).catch(() => {});
            }
            this.persistSession(queue);
        }
        await this.reply(message, 'Music settings updated.');
    }

    isSpotifyUrl(value) {
        try {
            return new URL(value).hostname.toLowerCase().endsWith('spotify.com');
        } catch {
            return false;
        }
    }

    parseSpotifyUrl(value) {
        try {
            const parsed = new URL(value);
            if (!parsed.hostname.toLowerCase().endsWith('spotify.com')) return null;
            const parts = parsed.pathname.split('/').filter(Boolean);
            const offset = parts[0]?.startsWith('intl-') ? 1 : 0;
            const type = parts[offset];
            const id = parts[offset + 1];
            return ['track', 'album', 'playlist'].includes(type) && /^[A-Za-z0-9]+$/.test(id || '') ? { type, id } : null;
        } catch {
            return null;
        }
    }

    async getSpotifyToken() {
        if (!this.config.spotifyClientId || !this.config.spotifyClientSecret) {
            throw this.userError('Spotify metadata import is not configured. Set `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`.');
        }
        if (this.spotifyToken?.expiresAt > Date.now() + 30000) return this.spotifyToken.value;
        const credentials = Buffer.from(`${this.config.spotifyClientId}:${this.config.spotifyClientSecret}`).toString('base64');
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials',
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) throw this.userError(`Spotify authentication failed (${response.status}). Check the configured credentials.`);
        const payload = await response.json();
        this.spotifyToken = {
            value: payload.access_token,
            expiresAt: Date.now() + (Number(payload.expires_in || 3600) * 1000)
        };
        return this.spotifyToken.value;
    }

    async spotifyFetch(endpoint) {
        const token = await this.getSpotifyToken();
        const requestUrl = /^https:\/\//i.test(endpoint) ? endpoint : `https://api.spotify.com/v1${endpoint}`;
        const response = await fetch(requestUrl, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(15000)
        });
        if (response.status === 429) throw this.userError(`Spotify rate-limited the import. Try again in ${response.headers.get('retry-after') || 'a few'} seconds.`);
        if (response.status === 401) {
            this.spotifyToken = null;
            throw this.userError('Spotify credentials expired or were rejected.');
        }
        if (response.status === 404) throw this.userError('That Spotify item is private, deleted, or unavailable.');
        if (!response.ok) throw this.userError(`Spotify metadata request failed (${response.status}).`);
        return response.json();
    }

    spotifyTrackMetadata(track) {
        if (!track?.name) return null;
        const artists = Array.isArray(track.artists) ? track.artists.map(item => item.name).filter(Boolean) : [];
        return normalizeTrack({
            title: track.name,
            author: artists.join(', ') || 'Unknown artist',
            duration: track.duration_ms,
            uri: track.external_urls?.spotify || '',
            artworkUrl: track.album?.images?.[0]?.url || null,
            source: 'spotify',
            providerId: track.id,
            isrc: track.external_ids?.isrc || null,
            album: track.album?.name || null,
            isSeekable: true
        }, null, {
            originalProvider: 'spotify',
            originalUrl: track.external_urls?.spotify || ''
        });
    }

    async getSpotifyMetadata(url) {
        const parsed = this.parseSpotifyUrl(url);
        if (!parsed) throw this.userError('Use a Spotify track, album, or playlist URL.');
        if (parsed.type === 'track') {
            const track = this.spotifyTrackMetadata(await this.spotifyFetch(`/tracks/${parsed.id}`));
            return { name: track.title, tracks: [track] };
        }
        if (parsed.type === 'album') {
            const album = await this.spotifyFetch(`/albums/${parsed.id}`);
            const items = [...(album.tracks?.items || [])];
            let next = album.tracks?.next;
            while (next && items.length < this.config.maxImportSize) {
                const page = await this.spotifyFetch(next);
                items.push(...(page.items || []));
                next = page.next;
            }
            const tracks = items.slice(0, this.config.maxImportSize).map(track => this.spotifyTrackMetadata({
                    ...track,
                    album: { name: album.name, images: album.images },
                    external_urls: track.external_urls || album.external_urls
                })).filter(Boolean);
            return { name: album.name, tracks };
        }

        const playlist = await this.spotifyFetch(`/playlists/${parsed.id}?fields=name,tracks.items(track(id,name,duration_ms,artists,album,external_urls,external_ids)),tracks.next`);
        const items = [...(playlist.tracks?.items || [])];
        let next = playlist.tracks?.next;
        while (next && items.length < this.config.maxImportSize) {
            const page = await this.spotifyFetch(next);
            items.push(...(page.items || []));
            next = page.next;
        }
        const tracks = items.slice(0, this.config.maxImportSize).map(item => this.spotifyTrackMetadata(item.track)).filter(Boolean);
        return { name: playlist.name, tracks };
    }

    async resolveSpotifyImport(url, requesterId, guildId, loadingMessage) {
        const metadata = await this.getSpotifyMetadata(url);
        const imported = await this.resolveCollection(metadata.tracks, guildId, requesterId, loadingMessage);
        return {
            ...imported,
            playlistName: metadata.tracks.length > 1 ? metadata.name : null,
            nodeName: imported.tracks[0]?.nodeName || null
        };
    }

    async commandSpotify(message, args) {
        const url = args[0];
        if (!url || !this.isSpotifyUrl(url)) throw this.userError('Usage: `!spotify <Spotify track, album, or playlist URL>`');
        const access = this.authorizeMember(message.member, this.getQueue(message.guild.id, false), { requireVoice: true });
        if (!access.ok) throw this.userError(access.message);
        const loading = await this.reply(message, 'Loading Spotify metadata and resolving playable sources...');
        const result = await this.resolveSpotifyImport(url, message.author.id, message.guild.id, loading);
        await this.serialize(message.guild.id, async () => {
            const queue = this.getQueue(message.guild.id);
            queue.textChannelId = message.channel.id;
            await this.ensureVoicePermissions(message.guild, message.member.voice.channel);
            await this.connect(queue, message.guild, message.member.voice.channel, result.nodeName);
            const idle = !queue.currentTrack;
            queue.addMany(result.tracks);
            if (idle) await this.playNext(queue);
            this.persistSession(queue);
        });
        await loading.edit({
            content: `Spotify metadata import complete. Loaded ${result.loaded}; skipped ${result.skipped}; failed ${result.failed}. Audio is played from sources supported by Lavalink, not streamed from Spotify.`,
            allowedMentions: { parse: [] }
        });
    }

    requireActiveQueue(guildId) {
        const queue = this.getQueue(guildId, false);
        if (!queue?.player) throw this.userError('There is no active music player.');
        return queue;
    }

    async ensureVoicePermissions(guild, channel) {
        if (!channel) throw this.userError('Join a voice channel first.');
        const botMember = guild.members.me || await guild.members.fetchMe().catch(() => null);
        if (!botMember) throw this.userError('I could not inspect my voice permissions.');
        const permissions = channel.permissionsFor(botMember);
        if (!permissions?.has(this.discord.PermissionsBitField.Flags.ViewChannel) ||
            !permissions?.has(this.discord.PermissionsBitField.Flags.Connect)) {
            throw this.userError('I need View Channel and Connect permission in that voice channel.');
        }
        if (channel.type !== this.discord.ChannelType.GuildStageVoice &&
            !permissions.has(this.discord.PermissionsBitField.Flags.Speak)) {
            throw this.userError('I need Speak permission in that voice channel.');
        }
        if (channel.userLimit && channel.members.size >= channel.userLimit && !channel.members.has(this.client.user.id)) {
            throw this.userError('That voice channel is full.');
        }
    }

    async reply(message, content) {
        return message.reply({ content: safeText(content, 2000), allowedMentions: { parse: [] } });
    }

    async sendToTextChannel(queue, content) {
        const guild = this.client.guilds.cache.get(queue.guildId);
        const channel = guild?.channels.cache.get(queue.textChannelId) || await guild?.channels.fetch(queue.textChannelId).catch(() => null);
        if (channel?.isTextBased()) {
            await channel.send({ content: safeText(content, 2000), allowedMentions: { parse: [] } }).catch(() => {});
        }
    }

    async announceNowPlaying(queue) {
        const guild = this.client.guilds.cache.get(queue.guildId);
        const channel = guild?.channels.cache.get(queue.textChannelId) || await guild?.channels.fetch(queue.textChannelId).catch(() => null);
        if (!channel?.isTextBased()) return;
        await channel.send({ embeds: [this.buildNowPlayingEmbed(queue)], allowedMentions: { parse: [] } }).catch(() => {});
    }

    chunkText(text, maximum) {
        const chunks = [];
        let remaining = String(text || '');
        while (remaining.length > maximum) {
            let split = remaining.lastIndexOf('\n', maximum);
            if (split < maximum * 0.5) split = maximum;
            chunks.push(remaining.slice(0, split));
            remaining = remaining.slice(split).replace(/^\n/, '');
        }
        if (remaining) chunks.push(remaining);
        return chunks;
    }

    extractDiscordId(value) {
        const match = String(value || '').match(/\d{16,22}/);
        return match?.[0] || null;
    }

    progressBar(position, duration, width) {
        if (!duration) return 'Live';
        const filled = clamp(Math.round((position / duration) * width), 0, width);
        return `[${'='.repeat(Math.max(0, filled - 1))}${filled ? '>' : ''}${'-'.repeat(width - filled)}]`;
    }

    recordUsage(queue, track) {
        const guildStats = this.repository.data.statistics.guilds[queue.guildId] ||= {
            tracksPlayed: 0,
            playbackFailures: 0,
            sources: {},
            artists: {}
        };
        const sourceKey = `$${safeText(track.source, 80)}`;
        const artistKey = `$${safeText(track.author, 160)}`;
        guildStats.tracksPlayed += 1;
        guildStats.sources[sourceKey] = (guildStats.sources[sourceKey] || 0) + 1;
        guildStats.artists[artistKey] = (guildStats.artists[artistKey] || 0) + 1;
        if (track.requesterId) {
            const userStats = this.repository.data.statistics.users[track.requesterId] ||= { tracksRequested: 0, sources: {}, artists: {} };
            userStats.tracksRequested += 1;
            userStats.sources[sourceKey] = (userStats.sources[sourceKey] || 0) + 1;
            userStats.artists[artistKey] = (userStats.artists[artistKey] || 0) + 1;
        }
        this.repository.scheduleSave(1000);
    }

    persistSession(queue) {
        if (!queue) return;
        if (queue.enabled247) this.repository.data.sessions[queue.guildId] = queue.serialize();
        else delete this.repository.data.sessions[queue.guildId];
        this.repository.scheduleSave();
    }

    scheduleIdleTimer(queue) {
        this.cancelIdleTimer(queue);
        if (!queue || queue.enabled247 || queue.currentTrack || queue.upcoming.length || !queue.player) return;
        const timeout = this.getSettings(queue.guildId).idleTimeoutMs;
        const token = ++queue.idleToken;
        queue.idleTimer = setTimeout(() => {
            queue.idleTimer = null;
            void this.serialize(queue.guildId, async () => {
                if (queue.idleToken !== token || queue.enabled247 || queue.currentTrack || queue.upcoming.length) return;
                await this.destroyPlayer(queue, false);
            }).catch(error => console.error(`Idle disconnect failed for ${queue.guildId}:`, error));
        }, timeout);
        if (typeof queue.idleTimer.unref === 'function') queue.idleTimer.unref();
    }

    cancelIdleTimer(queue) {
        if (!queue) return;
        queue.idleToken += 1;
        if (queue.idleTimer) clearTimeout(queue.idleTimer);
        queue.idleTimer = null;
    }

    async destroyPlayer(queue, removeState) {
        if (!queue) return;
        const failoverTimer = this.failoverTimers.get(queue.guildId);
        if (failoverTimer) clearTimeout(failoverTimer);
        this.failoverTimers.delete(queue.guildId);
        this.cancelIdleTimer(queue);
        if (queue.panelUpdateTimer) clearTimeout(queue.panelUpdateTimer);
        queue.destroyed = true;
        queue.playerGeneration += 1;
        queue.player?.removeAllListeners();
        const shoukaku = this.getShoukaku();
        if (shoukaku) await shoukaku.leaveVoiceChannel(queue.guildId).catch(() => {});
        queue.player = null;
        queue.voiceState = 'disconnected';
        queue.playing = false;
        if (removeState) {
            queue.currentTrack = null;
            queue.upcoming = [];
            queue.history = [];
            queue.enabled247 = false;
            this.repository.updateSettings(queue.guildId, { enabled247: false });
            delete this.repository.data.sessions[queue.guildId];
            this.players.delete(queue.guildId);
            this.metrics.activePlayers = this.players.size;
        } else if (queue.enabled247) {
            this.persistSession(queue);
        } else {
            this.players.delete(queue.guildId);
            this.metrics.activePlayers = this.players.size;
        }
        this.repository.scheduleSave();
    }

    async handleVoiceStateUpdate(oldState, newState) {
        const guild = newState.guild || oldState.guild;
        const queue = guild ? this.getQueue(guild.id, false) : null;
        if (!queue) return;
        const memberId = newState.id || oldState.id;

        if (memberId === this.client.user.id) {
            if (oldState.channelId && !newState.channelId) {
                queue.player = null;
                queue.voiceState = 'disconnected';
                queue.playing = false;
                this.persistSession(queue);
                if (queue.enabled247) await this.recoverSession(guild.id);
                else await this.destroyPlayer(queue, false);
            } else if (newState.channelId && newState.channelId !== oldState.channelId) {
                queue.voiceChannelId = newState.channelId;
                this.persistSession(queue);
                this.schedulePanelUpdate(queue);
            }
            return;
        }

        if (oldState.channelId === queue.voiceChannelId || newState.channelId === queue.voiceChannelId) {
            queue.skipVotes.forEach(userId => {
                const channel = guild.channels.cache.get(queue.voiceChannelId);
                if (!channel?.members.has(userId)) queue.skipVotes.delete(userId);
            });
            const channel = guild.channels.cache.get(queue.voiceChannelId);
            const humanListeners = channel?.members?.filter(member => !member.user.bot).size || 0;
            if (humanListeners > 0) this.cancelIdleTimer(queue);
            else if (!queue.enabled247) this.scheduleIdleTimer(queue);
        }
    }

    async restorePersistentSessions() {
        if (!this.isAvailable()) return;
        for (const guildId of Object.keys(this.repository.data.sessions)) {
            await this.recoverSession(guildId).catch(error => {
                console.error(`Music session restore failed for guild ${guildId}:`, error);
            });
        }
    }

    async recoverSession(guildId) {
        const saved = this.repository.data.sessions[guildId];
        if (!saved?.enabled247 || !saved.voiceChannelId) return;
        const attempts = this.restoreAttempts.get(guildId) || 0;
        if (attempts >= 3) {
            await this.notifyPermanentRestoreFailure(guildId, saved);
            return;
        }
        this.restoreAttempts.set(guildId, attempts + 1);
        const delay = attempts ? Math.min(8000, 1000 * (2 ** attempts)) : 0;
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
        const guild = this.client.guilds.cache.get(guildId) || await this.client.guilds.fetch(guildId).catch(() => null);
        const voiceChannel = guild?.channels.cache.get(saved.voiceChannelId) || await guild?.channels.fetch(saved.voiceChannelId).catch(() => null);
        if (!guild || !voiceChannel?.isVoiceBased()) {
            console.error(`Cannot restore music session for guild ${guildId}; voice channel ${saved.voiceChannelId} is unavailable.`);
            return;
        }

        await this.serialize(guildId, async () => {
            const queue = new GuildMusicQueue(guildId, this.getSettings(guildId), saved);
            queue.recoveryState = 'restoring';
            this.players.set(guildId, queue);
            this.metrics.activePlayers = this.players.size;
            await this.ensureVoicePermissions(guild, voiceChannel);
            await this.connect(queue, guild, voiceChannel);
            const restoreTracks = [saved.currentTrack, ...(saved.upcoming || [])].filter(Boolean);
            const resolved = await this.resolveCollection(restoreTracks, guildId, this.client.user.id);
            queue.upcoming = resolved.tracks;
            queue.currentTrack = null;
            queue.position = Number(saved.position || 0);
            const position = queue.position;
            queue.recoveryState = 'restored';
            if (queue.upcoming.length) {
                const first = queue.upcoming.shift();
                await this.playTrack(queue, first, position);
            }
            this.restoreAttempts.delete(guildId);
            this.metrics.nodeRecoveries += 1;
            this.persistSession(queue);
        });
    }

    async notifyPermanentRestoreFailure(guildId, saved) {
        const settings = this.getSettings(guildId);
        console.error(`Music restoration permanently failed for guild ${guildId}, voice ${saved.voiceChannelId}, text ${saved.textChannelId}.`);
        const guild = this.client.guilds.cache.get(guildId);
        const channelId = settings.adminChannelId || saved.textChannelId;
        const channel = guild?.channels.cache.get(channelId);
        if (channel?.isTextBased()) {
            await channel.send({
                content: `The persistent music session could not be restored after three attempts. Check voice permissions and Lavalink health.`,
                allowedMentions: { parse: [] }
            }).catch(() => {});
        }
    }

    async handleNodeReady() {
        this.metrics.nodeRecoveries += 1;
        for (const queue of this.players.values()) {
            if (queue.recoveryState === 'waiting-for-node') {
                await this.recoverActivePlayer(queue).catch(error => {
                    console.error(`Active player recovery failed for guild ${queue.guildId}:`, error);
                });
            }
        }
        await this.restorePersistentSessions();
    }

    async handleNodeUnavailable(nodeName) {
        for (const queue of this.players.values()) {
            const activeNodeName = queue.player ? this.nodeName(queue.player.node) : queue.nodeName;
            if (activeNodeName !== nodeName) continue;
            queue.recoveryState = 'waiting-for-node';
            queue.position = Number(queue.player?.position || queue.position || 0);
            this.persistSession(queue);
            if (this.failoverTimers.has(queue.guildId)) continue;
            const timer = setTimeout(() => {
                this.failoverTimers.delete(queue.guildId);
                void this.recoverActivePlayer(queue).catch(error => {
                    console.error(`Lavalink failover failed for guild ${queue.guildId}:`, error);
                });
            }, 1500);
            if (typeof timer.unref === 'function') timer.unref();
            this.failoverTimers.set(queue.guildId, timer);
        }
    }

    async recoverActivePlayer(queue) {
        if (!queue || queue.destroyed || !this.players.has(queue.guildId)) return;
        const nodes = this.availableNodes(queue.guildId);
        if (!nodes.length) {
            queue.recoveryState = 'waiting-for-node';
            return;
        }
        const guild = this.client.guilds.cache.get(queue.guildId) || await this.client.guilds.fetch(queue.guildId).catch(() => null);
        const voiceChannel = guild?.channels.cache.get(queue.voiceChannelId) || await guild?.channels.fetch(queue.voiceChannelId).catch(() => null);
        if (!guild || !voiceChannel?.isVoiceBased()) {
            queue.recoveryState = 'failed';
            return;
        }
        await this.serialize(queue.guildId, async () => {
            const current = queue.currentTrack;
            const position = Number(queue.player?.position || queue.position || 0);
            const paused = queue.paused;
            queue.recoveryState = 'failing-over';
            await this.connect(queue, guild, voiceChannel, this.nodeName(nodes[0]));
            if (current) {
                queue.paused = paused;
                await this.playTrack(queue, current, position);
                if (paused) {
                    await queue.player.setPaused(true);
                    queue.paused = true;
                }
            } else if (queue.upcoming.length) {
                await this.playNext(queue);
            }
            queue.recoveryState = 'recovered';
            this.metrics.nodeRecoveries += 1;
            this.persistSession(queue);
        });
    }

    async shutdown() {
        for (const timer of this.failoverTimers.values()) clearTimeout(timer);
        this.failoverTimers.clear();
        for (const queue of this.players.values()) {
            queue.position = Number(queue.player?.position || queue.position || 0);
            this.persistSession(queue);
        }
        this.repository.flush();
    }
}

function createMusicSystem(options) {
    return new MusicSystem(options);
}

module.exports = {
    createMusicSystem,
    MusicSystem,
    GuildMusicQueue,
    JsonMusicRepository,
    parseDuration,
    formatDuration,
    normalizeTrack,
    serializeTrack,
    removeDuplicateTracks,
    shuffleArray,
    FILTER_PRESETS,
    MUSIC_ALIASES,
    defaultGuildSettings,
    trackDeduplicationKeys
};
