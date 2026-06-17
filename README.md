# 🤖 Ovf Helper Bot

A comprehensive Discord bot for the OverFlow VRChat community featuring moderation, verification, music, gaming, and community engagement tools.

## 📋 Overview

**Ovf Helper Bot** is a feature-rich Discord bot built with Discord.js 14 and powered by Shoukaku for Lavalink music support. It provides comprehensive community management tools including ticket support systems, VRChat verification, waifu collection game, moderation, XP tracking, events, and more.

### Core Technologies
- **Discord.js** v14.15.3 - Modern Discord bot framework
- **Shoukaku** v4.3.0 - Lavalink music connector
- **Node.js** - JavaScript runtime

---

## ✨ Key Features

### 🎫 Ticket Support System
- Create and manage support tickets with custom categories
- Role-based access control (support staff, admins)
- Ticket logging and transcript generation
- Multiple ticket types: general, report, partnership, appeal, admin

### 🔐 VRChat Verification
- VRChat account verification with time-limited codes
- Automatic role assignment upon successful verification
- Verification tracking and member status

### 🎵 Music System
- High-quality music playback via Lavalink
- Queue management and playback controls
- Volume control and track skipping

### 🎮 Waifu Collection Game
- Pull random waifu cards with 5 rarity tiers (Common → Mythic)
- Coin-based economy with daily claims
- Trading system with cooldown protection
- Sell cards for coins
- Leaderboards and statistics

### 📝 Moderation Suite
- Member warnings and timeout management
- Moderation case tracking with unique case IDs
- Staff notes for member annotations
- Auto-moderation with customizable rules
- Bulk message deletion and purge commands

### 📊 XP & Leveling System
- Message-based XP gain with automatic tracking
- Level progression and rank calculations
- Server-wide leaderboards
- Per-member XP and message statistics

### 🎪 Community Features
- **Event Management** - Create and RSVP for community events
- **Polls** - Create multiple-choice polls with voting
- **Reaction Roles** - Allow self-assignment of roles via reactions
- **Invite Tracking** - Monitor server invites and sources
- **Suggestions** - Community suggestion system
- **Activity Logging** - Comprehensive audit trail for all server actions

### 🛡️ Anti-Raid Protection
- Rapid join detection (>5 joins in 60s)
- Spam message detection (>6 messages in 10s)
- Rate limiting and automatic restrictions
- Member behavior monitoring

### 🎁 Utility Features
- User profile viewing with moderation history
- Member onboarding guides
- Staff applications via ticket system
- Temporary role assignment with auto-removal
- Server configuration and settings

---

## 🎮 Commands

### 🎫 Ticket Commands

#### User Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `!ticket` | `!ticket [type]` | Create a support ticket (general/report/partnership/appeal/admin) |
| `!ticketclose` | `!ticketclose [reason]` | Close your ticket with optional reason |

#### Admin Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `!ticketconfig list` | `!ticketconfig list` | View all ticket configuration settings |
| `!ticketconfig support add` | `!ticketconfig support add @role` | Add a support staff role |
| `!ticketconfig support remove` | `!ticketconfig support remove @role` | Remove a support staff role |
| `!ticketconfig admin add` | `!ticketconfig admin add @role` | Add an admin role |
| `!ticketconfig admin remove` | `!ticketconfig admin remove @role` | Remove an admin role |
| `!ticketconfig category` | `!ticketconfig category <id>` | Set ticket creation category |
| `!ticketconfig logs` | `!ticketconfig logs #channel` | Set ticket logging channel |
| `!ticketconfig reset` | `!ticketconfig reset` | Reset to default configuration |
| `!ticketsetup` | `!ticketsetup [#channel] [prompt]` | Create ticket panel in a channel |

---

### 🔐 Verification Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!vrcverify` | `!vrcverify VRChatUsername` | Start VRChat verification process |
| `!vrcconfirm` | `!vrcconfirm` | Confirm VRChat verification with code in bio |
| `!onboarding` | `!onboarding [#channel]` | Create onboarding guide message |

---

### 🎵 Music Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!play` | `!play <song/url>` | Play a song or add to queue |
| `!queue` | `!queue` | View current music queue |
| `!skip` | `!skip` | Skip to next song |
| `!pause` | `!pause` | Pause playback |
| `!resume` | `!resume` | Resume playback |
| `!stop` | `!stop` | Stop music and clear queue |
| `!volume` | `!volume <0-100>` | Set playback volume |

---

### 🎮 Waifu Game Commands

#### Player Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `!daily` | `!daily` | Claim daily coins (cooldown-based) |
| `!coins` | `!coins [@user]` | Check coin balance and collection size |
| `!pay` | `!pay @user <amount>` | Send coins to another user |
| `!pull` | `!pull` | Spend 500 coins to pull a waifu card |
| `!waifus` | `!waifus [@user] [page]` | View collection (paginated) |
| `!waifu` | `!waifu <number-or-id>` | View specific waifu card |
| `!sellwaifu` | `!sellwaifu <number-or-id>` | Sell a card for coins |
| `!trade` | `!trade @user <yours> \| <theirs>` | Trade cards and coins with another user |
| `!waifuodds` | `!waifuodds` | Show rarity distribution odds |
| `!waifu help` | `!waifu help` | Display waifu game guide |

#### Admin Commands
| Command | Usage | Description |
|---------|-------|-------------|
| `!givecoins` | `!givecoins @user <amount>` | Give coins to a user |
| `!adminpull` | `!adminpull [@user] [shiny]` | Create a max-rarity waifu card |

**Rarity Tiers:** Common (50%) → Rare (30%) → Epic (12%) → Legendary (7%) → Mythic (1%)

---

### 🛡️ Moderation Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!warn` | `!warn @user [reason]` | Issue a warning to member |
| `!unwarn` | `!unwarn @user <warning-id>` | Remove a specific warning |
| `!timeout` | `!timeout @user <duration> [reason]` | Timeout a member (1m/1h/1d/etc) |
| `!kick` | `!kick @user [reason]` | Kick member from server |
| `!ban` | `!ban @user [reason]` | Ban member from server |
| `!purge` | `!purge <count>` | Delete recent messages (max 100) |
| `!bulkdelete` | `!bulkdelete [age-days]` | Delete old messages (default 14 days) |

---

### 📋 Case Management Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!case` | `!case <case-id>` | View details of a specific case |
| `!cases` | `!cases [@user] [page]` | View all cases for a user |
| `!note` | `!note @user <note-text>` | Add private staff note on member |
| `!notes` | `!notes @user` | View all staff notes for member |
| `!reopen` | `!reopen <case-id>` | Reopen a closed ticket case |

---

### 👤 User Profile Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!profile` | `!profile [@user]` | View member profile and moderation history |
| `!whois` | `!whois [@user]` | Get user information and details |

---

### 📊 XP & Leveling Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!xp` | `!xp [@user]` | Check XP and current level |
| `!toplevels` | `!toplevels [page]` | View server-wide XP leaderboard |

---

### 🎪 Community Commands

#### Events
| Command | Usage | Description |
|---------|-------|-------------|
| `!event create` | `!event create <title> \| <time> \| [description]` | Create a community event |
| `!event list` | `!event list` | View all active events |
| `!event ping` | `!event ping <event-id>` | Ping event RSVPs |

#### Polls
| Command | Usage | Description |
|---------|-------|-------------|
| `!poll` | `!poll <question> \| <option1> \| <option2>...` | Create a poll with up to 10 options |

#### Invite Tracking
- Automatically tracks server invites and sources
- Displays invite source when member joins
- Monitor which invites have the most uses

---

### 📝 Configuration Commands

| Command | Usage | Description |
|---------|-------|-------------|
| `!setlogs` | `!setlogs #channel` | Set the logging channel for all server activities |

---

### 🎯 Staff Application

| Command | Usage | Description |
|---------|-------|-------------|
| `!staffapply` | `!staffapply [details]` | Apply for staff position (creates ticket) |

---

### ⏱️ Temporary Roles

| Command | Usage | Description |
|---------|-------|-------------|
| `!temprole` | `!temprole @user @role <duration>` | Assign role for specified duration (1h/1d/7d/etc) |

---

### 📣 Community Info

| Command | Usage | Description |
|---------|-------|-------------|
| `!vrchat` or `!vrc` | `!vrchat` | Display OverFlow VRChat community information |

---

## 🗂️ Data & Configuration Files

The bot uses JSON files for persistent data storage:

| File | Purpose |
|------|---------|
| `ticket-config.json` | Ticket system settings per guild |
| `ticket-records.json` | Open ticket tracking |
| `cases.json` | Moderation case records |
| `xp.json` | XP and leveling data |
| `staff-notes.json` | Private staff annotations |
| `vrc-verifier-config.json` | VRChat verification settings |
| `vrc-verification-records.json` | Member verification status |
| `waifu-game.json` | Waifu collection and coin data |
| `events.json` | Community event records |
| `polls.json` | Active poll data |
| `temp-roles.json` | Temporary role assignments |
| `community-config.json` | General server settings |
| `app-config.json` | Application-wide configuration |

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** 16.9.0 or higher
- **Discord bot token** (create at [Discord Developer Portal](https://discord.com/developers/applications))
- **Lavalink server** (for music features, optional)

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Akira-MCBE/Ovf-Helper-Bot.git
   cd Ovf-Helper-Bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create a `.env` file in the root directory:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   LAVALINK_URL=localhost:2333
   LAVALINK_PASSWORD=youshallnotpass
   ```

4. **Start the bot:**
   ```bash
   npm start
   ```

### Bot Permissions

Ensure your bot has the following permissions in Discord:
- **Administrator** (recommended for full functionality) OR
- **Send Messages**
- **Embed Links**
- **Manage Messages**
- **Manage Members**
- **Manage Roles**
- **Manage Channels**
- **View Audit Log**
- **Moderate Members**
- **Manage Webhooks**

---

## ⚙️ Configuration

### Ticket System Setup

1. Run `!ticketconfig list` to see current settings
2. Add support roles: `!ticketconfig support add @role`
3. Add admin roles: `!ticketconfig admin add @role`
4. Set category: `!ticketconfig category <category-id>`
5. Set logs: `!ticketconfig logs #channel`
6. Create panel: `!ticketsetup #channel "Your prompt text"`

### Logging Setup

- Use `!setlogs #channel` to enable comprehensive logging
- Logs include: member joins/leaves, message edits/deletes, voice channel activity, command usage, moderation actions

### VRChat Verification

1. Configure verification role and settings
2. Users start with `!vrcverify VRChatUsername`
3. Users place code in VRChat bio and use `!vrcconfirm`

---

## 🔒 Security & Best Practices

- **Admin-Only Commands:** Ticket setup and configuration require Administrator permissions
- **Role-Based Access:** Support and admin roles can be configured per server
- **Audit Trail:** All moderation actions are logged with timestamps and user info
- **Anti-Spam:** Built-in rate limiting and message spam detection
- **Invite Tracking:** Monitor server growth and invite sources
- **Verification:** VRChat account verification prevents impersonation

---

## 🎮 Game Features Details

### Waifu Collection System
- **Pull System:** Spend 500 coins to get a random waifu card
- **Rarity System:** 5 tiers with different pull odds
- **Trading:** Trade cards and coins with other members
- **Daily Rewards:** Claim daily coins with cooldown
- **Marketplace:** Sell cards for coins based on rarity

### XP System
- **Passive Gains:** Earn XP by sending messages in server
- **Leaderboards:** Compete for top spots
- **Level Progression:** Track your rank progression
- **Stats Tracking:** Messages sent and total XP earned

---

## 📊 Logging & Audit Trail

The bot logs the following events:

✅ Member joins (with invite source)  
✅ Member leaves  
✅ Message deletions  
✅ Message edits  
✅ Voice channel activity  
✅ Role changes  
✅ Moderation actions  
✅ Command usage  
✅ Ticket operations

---

## 🆘 Troubleshooting

### Bot Not Responding
- Check if bot has Send Messages permission
- Verify bot token in `.env` file
- Ensure bot is actually running: `npm start`

### Music Not Working
- Verify Lavalink server is running
- Check `LAVALINK_URL` and password in `.env`
- Ensure bot is in a voice channel

### Verification Not Working
- Verify bot has Manage Roles permission
- Check verification role is configured
- Ensure verification role is below bot's highest role

### Tickets Not Creating
- Verify ticket category exists and bot can access it
- Check bot has Create Channel permission
- Ensure support/admin roles are properly configured

---

## 📈 Customization

The bot is highly configurable through commands. Modify these aspects per server:

- **Ticket Categories & Logging**
- **Moderation Thresholds**
- **XP Multipliers** (code modification)
- **Waifu Pull Costs** (code modification)
- **Daily Coin Amounts** (code modification)
- **Logging Channels**

---

## 🤝 Contributing

To contribute to this project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is provided as-is for community use.

---

## 🎉 Credits

Built with ❤️ for the **OverFlow VRChat Community**

### Powered By
- [Discord.js](https://discord.js.org/) - Discord API Library
- [Shoukaku](https://github.com/Deivu/Shoukaku) - Lavalink Connector
- [Node.js](https://nodejs.org/) - JavaScript Runtime

---

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact the bot developers
- Use `!ticket` to create a support ticket in the Discord server

---

## 🚀 Status

- **Version:** 1.0.0
- **Status:** Active Development
- **Last Updated:** June 2026
