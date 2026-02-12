// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Auto-cleaner every 3 hours
setInterval(() => {
  fs.readdir(customTemp, (err, files) => {
    if (err) return;
    for (const file of files) {
      const filePath = path.join(customTemp, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && Date.now() - stats.mtimeMs > 3 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    }
  });
  console.log('🧹 Temp folder auto-cleaned');
}, 3 * 60 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');
const ytdl = require('ytdl-core');
const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./commands/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./commands/autoread');

// Add logging function
function logSentMessage(chatId, content, isChannel = false) {
    try {
        const timestamp = new Date().toLocaleString();
        
        // Format the log
        const logEntry = `
════════════════════════════════════════
📅 ${timestamp}
📊 DIRECTION: 📤 SENT
💬 CHAT ID: ${chatId}
${isChannel ? '📢 CHANNEL/NEWSLETTER DETECTED!' : ''}
📝 CONTENT: ${typeof content === 'string' ? content.substring(0, 200) + (content.length > 200 ? '...' : '') : '[MEDIA/OTHER]'}
════════════════════════════════════════
`;

        // Log to console with green color
        console.log('\x1b[32m%s\x1b[0m', logEntry);

        // Save to log file
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const logFile = path.join(logsDir, `messages-${dateStr}.log`);
        
        fs.appendFileSync(logFile, logEntry + '\n', 'utf8');
        
    } catch (error) {
        console.error('Error logging sent message:', error);
    }
}

// ======================= COMMAND IMPORTS =======================
// Existing command imports
const tagAllCommand = require('./commands/tagall');
const helpCommand = require('./commands/help');
const banCommand = require('./commands/ban');
const { promoteCommand } = require('./commands/promote');
const { demoteCommand } = require('./commands/demote');
const muteCommand = require('./commands/mute');
const unmuteCommand = require('./commands/unmute');
const stickerCommand = require('./commands/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./commands/warn');
const warningsCommand = require('./commands/warnings');
const ttsCommand = require('./commands/tts');
const { tictactoeCommand, handleTicTacToeMove } = require('./commands/tictactoe');
const { incrementMessageCount, topMembers } = require('./commands/topmembers');
const ownerCommand = require('./commands/owner');
const deleteCommand = require('./commands/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./commands/antilink');
const { handleAntitagCommand, handleTagDetection } = require('./commands/antitag');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand } = require('./commands/mention');
const memeCommand = require('./commands/meme');
const tagCommand = require('./commands/tag');
const tagNotAdminCommand = require('./commands/tagnotadmin');
const hideTagCommand = require('./commands/hidetag');
const jokeCommand = require('./commands/joke');
const quoteCommand = require('./commands/quote');
const factCommand = require('./commands/fact');
const weatherCommand = require('./commands/weather');
const newsCommand = require('./commands/news');
const kickCommand = require('./commands/kick');
const simageCommand = require('./commands/simage');
const attpCommand = require('./commands/attp');
const { startHangman, guessLetter } = require('./commands/hangman');
const { startTrivia, answerTrivia } = require('./commands/trivia');
const { complimentCommand } = require('./commands/compliment');
const { insultCommand } = require('./commands/insult');
const { eightBallCommand } = require('./commands/eightball');
const { lyricsCommand } = require('./commands/lyrics');
const { dareCommand } = require('./commands/dare');
const { truthCommand } = require('./commands/truth');
const { clearCommand } = require('./commands/clear');
const pingCommand = require('./commands/ping');
const aliveCommand = require('./commands/alive');
const blurCommand = require('./commands/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./commands/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./commands/goodbye');
const githubCommand = require('./commands/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./commands/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./commands/chatbot');
const takeCommand = require('./commands/take');
const { flirtCommand } = require('./commands/flirt');
const characterCommand = require('./commands/character');
const wastedCommand = require('./commands/wasted');
const shipCommand = require('./commands/ship');
const apkCommand = require('./commands/apk');
const groupInfoCommand = require('./commands/groupinfo');
const resetlinkCommand = require('./commands/resetlink');
const staffCommand = require('./commands/staff');
const unbanCommand = require('./commands/unban');
const emojimixCommand = require('./commands/emojimix');
const { handlePromotionEvent } = require('./commands/promote');
const { handleDemotionEvent } = require('./commands/demote');
const viewOnceCommand = require('./commands/viewonce');
const clearSessionCommand = require('./commands/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./commands/autostatus');
const { simpCommand } = require('./commands/simp');
const { stupidCommand } = require('./commands/stupid');
const stickerTelegramCommand = require('./commands/stickertelegram');
const textmakerCommand = require('./commands/textmaker');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./commands/antidelete');
const clearTmpCommand = require('./commands/cleartmp');
const setProfilePicture = require('./commands/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./commands/groupmanage');
const instagramCommand = require('./commands/instagram');
const facebookCommand = require('./commands/facebook');
const spotifyCommand = require('./commands/spotify');
const playCommand = require('./commands/play');
const tiktokCommand = require('./commands/tiktok');
const songCommand = require('./commands/song');
const aiCommand = require('./commands/ai');
const urlCommand = require('./commands/url');
const { handleTranslateCommand } = require('./commands/translate');
const { handleSsCommand } = require('./commands/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const { goodnightCommand } = require('./commands/goodnight');
const { shayariCommand } = require('./commands/shayari');
const { rosedayCommand } = require('./commands/roseday');
const imagineCommand = require('./commands/imagine');
const videoCommand = require('./commands/video');
const sudoCommand = require('./commands/sudo');
const { miscCommand, handleHeart } = require('./commands/misc');
const { animeCommand } = require('./commands/anime');
const { piesCommand, piesAlias } = require('./commands/pies');
const stickercropCommand = require('./commands/stickercrop');
const updateCommand = require('./commands/update');
const removebgCommand = require('./commands/removebg');
const { reminiCommand } = require('./commands/remini');
const { igsCommand } = require('./commands/igs');
const { anticallCommand, readState: readAnticallState } = require('./commands/anticall');
const { pmblockerCommand, readState: readPmBlockerState } = require('./commands/pmblocker');
const settingsCommand = require('./commands/settings');
const soraCommand = require('./commands/sora');

// ======================= NEW COMMAND IMPORTS =======================
// 🆕 ADD THESE IMPORTS FOR NEW COMMANDS
const addUserCommand = require('./commands/add');
const blockUserCommand = require('./commands/block');
const setPrefixCommand = require('./commands/setprefix');
const saveContactCommand = require('./commands/save');
const xxxCommand = require('./commands/xxx');
const groupControlCommand = require('./commands/groupcontrol');
// ======================= END NEW IMPORTS =======================

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/0029VbBvGgyFsn0alyIDjw0z";
global.ytch = "Xchristech";

// Add this near the top of main.js with other global configurations
const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363406588763460@newsletter',
            newsletterName: '𝙕𝙖𝙣𝙞𝙩𝙨𝙪 𝙗𝙤𝙩',
            serverMessageId: -1
        }
    }
};

async function handleMessages(sock, messageUpdate, printLog) {
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        const message = messages[0];
        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        const chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const chatId = message.key.remoteJid;
            
            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, { 
                    text: '📢 *Join our Channel:*\nhttps://whatsapp.com/channel/0029Vb6zuIiLikg7V58lXp1A' 
                }, { quoted: message });
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Channel link sent', isChannel);
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./commands/owner');
                await ownerCommand(sock, chatId);
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Owner info sent', isChannel);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, { 
                    text: `🔗 *Support*\n\nhttps://chat.whatsapp.com/FASqxzw60hB989DVmMOpRO?mode=wwt` 
                }, { quoted: message });
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Support link sent', isChannel);
                return;
            }
        }

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        // Only log command usage
        if (userMessage.startsWith('.')) {
            console.log(`📝 Command used in ${isGroup ? 'group' : 'private'}: ${userMessage}`);
        }
        // Read bot mode once; don't early-return so moderation can still run in private mode
        let isPublic = true;
        try {
            const data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
        } catch (error) {
            console.error('Error checking access mode:', error);
            // default isPublic=true on error
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Ban warning sent', isChannel);
            }
            return;
        }

        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink checks message text internally, so run it even if userMessage is empty
            await Antilink(message, sock);
        }

        // PM blocker: block non-owner DMs when enabled (do not ban)
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    // Inform user, delay, then block without banning globally
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'PM blocker message', isChannel);
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // Then check for command prefix
        if (!userMessage.startsWith('.')) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            if (isGroup) {
                // Always run moderation features (antitag) regardless of mode
                await handleTagDetection(sock, chatId, message, senderId);
                await handleMentionDetection(sock, chatId, message);
                
                // Only run chatbot in public mode or for owner/sudo
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // List of admin commands
        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.antitag', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Bot admin required message', isChannel);
                return;
            }

            if (
                userMessage.startsWith('.mute') ||
                userMessage === '.unmute' ||
                userMessage.startsWith('.ban') ||
                userMessage.startsWith('.unban') ||
                userMessage.startsWith('.promote') ||
                userMessage.startsWith('.demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Admin required message', isChannel);
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                const isChannel = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Owner only command message', isChannel);
                return;
            }
        }

        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

        // ======================= START OF SWITCH STATEMENT =======================
        switch (true) {
            // ======================= NEW COMMANDS ADDED HERE =======================
            // 🆕 NEW COMMAND 1: .add
case userMessage.startsWith('.add'):
    if (!isGroup) {
        await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
        const isChannel = chatId.includes('@newsletter');
        logSentMessage(chatId, 'Group only command message', isChannel);
        return;
    }
    
    // Call the add command (admin checks are handled inside)
    await addUserCommand(sock, chatId, message);
    commandExecuted = true;
    break;

            // 🆕 NEW COMMAND 2: .block @user
            case userMessage.startsWith('.block'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only command message', isChannel);
                    return;
                }
                
                const mentionedJidListBlock = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                if (mentionedJidListBlock.length === 0) {
                    await sock.sendMessage(chatId, { text: 'Please mention user(s) to block. Usage: .block @user', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Block command usage', isChannel);
                    return;
                }
                
                await blockUserCommand(sock, chatId, mentionedJidListBlock, message);
                commandExecuted = true;
                break;

            // 🆕 NEW COMMAND 3: .setprefix
            case userMessage.startsWith('.setprefix'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Owner only command message', isChannel);
                    return;
                }
                
                const newPrefix = userMessage.split(' ')[1];
                if (!newPrefix || newPrefix.length > 2) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid prefix (1-2 characters). Usage: .setprefix !', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Setprefix command usage', isChannel);
                    return;
                }
                
                await setPrefixCommand(sock, chatId, newPrefix, message);
                commandExecuted = true;
                break;

            // 🆕 NEW COMMAND 4: .save
            case userMessage.startsWith('.save'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Owner only command message', isChannel);
                    return;
                }
                
                const contactNumber = userMessage.split(' ')[1];
                await saveContactCommand(sock, chatId, contactNumber, message);
                commandExecuted = true;
                break;

            // 🆕 NEW COMMAND 5: .xxx
            case userMessage.startsWith('.xxx'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only command message', isChannel);
                    return;
                }
                
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Owner only command message', isChannel);
                    return;
                }
                
                const xxxAction = userMessage.split(' ')[1]?.toLowerCase();
                await xxxCommand(sock, chatId, xxxAction, message);
                commandExecuted = true;
                break;

            // 🆕 NEW COMMAND 6: .close / .open
            case userMessage.startsWith('.close') || userMessage.startsWith('.open'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only command message', isChannel);
                    return;
                }
                
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Admin required message', isChannel);
                    return;
                }
                
                const action = userMessage.startsWith('.close') ? 'close' : 'open';
                await groupControlCommand(sock, chatId, action, message);
                commandExecuted = true;
                break;
            // ======================= END OF NEW COMMANDS =======================

            // ======================= EXISTING COMMANDS CONTINUE BELOW =======================
            case userMessage === '.simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Sticker to image conversion', isChannel);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Sticker to image usage', isChannel);
                }
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                const isChannelKick = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Kick command executed', isChannelKick);
                break;
            case userMessage.startsWith('.mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.', ...channelInfo }, { quoted: message });
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Mute command usage', isChannel);
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, `Mute command executed ${muteDuration ? 'for ' + muteDuration + ' minutes' : ''}`, isChannel);
                    }
                }
                break;
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                const isChannelUnmute = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Unmute command executed', isChannelUnmute);
                break;
            case userMessage.startsWith('.ban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Owner only ban message', isChannel);
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                const isChannelBan = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Ban command executed', isChannelBan);
                break;
            case userMessage.startsWith('.unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Owner only unban message', isChannel);
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                const isChannelUnban = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Unban command executed', isChannelUnban);
                break;
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                await helpCommand(sock, chatId, message, global.channelLink);
                const isChannelHelp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Help command executed', isChannelHelp);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                const isChannelSticker = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Sticker command executed', isChannelSticker);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                const isChannelWarnings = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Warnings command executed', isChannelWarnings);
                break;
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                const isChannelWarn = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Warn command executed', isChannelWarn);
                break;
            case userMessage.startsWith('.tts'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                const isChannelTts = chatId.includes('@newsletter');
                logSentMessage(chatId, 'TTS command executed', isChannelTts);
                break;
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                const isChannelDelete = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Delete command executed', isChannelDelete);
                break;
            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                const isChannelAttp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'ATTP command executed', isChannelAttp);
                break;

            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                const isChannelSettings = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Settings command executed', isChannelSettings);
                break;
            case userMessage.startsWith('.mode'):
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Owner only mode command', isChannel);
                    return;
                }
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Mode command error', isChannel);
                    return;
                }

                const actionOld = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!actionOld) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Mode command status', isChannel);
                    return;
                }

                if (actionOld !== 'public' && actionOld !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Usage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Mode command usage', isChannel);
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = actionOld === 'public';

                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

                    await sock.sendMessage(chatId, { text: `Bot is now in *${actionOld}* mode`, ...channelInfo });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, `Mode changed to ${actionOld}`, isChannel);
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Mode command error', isChannel);
                }
                break;
            case userMessage.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Owner only anticall', isChannel);
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Anticall command executed', isChannel);
                }
                break;
                


            case userMessage.startsWith('.apk'):
               await sock.sendMessage(chatId, { react: { text: "📦", key: message.key } });
                await new Promise(resolve => setTimeout(resolve, 500));
                await apkCommand(sock, chatId, message);
                const isChannelApk = chatId.includes('@newsletter');
                logSentMessage(chatId, 'APK command executed', isChannelApk);
                break;
            case userMessage.startsWith('.pmblocker'):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'PM blocker command executed', isChannel);
                }
                commandExecuted = true;
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                const isChannelOwner = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Owner command executed', isChannelOwner);
                break;
             case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                const isChannelTagall = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Tagall command executed', isChannelTagall);
                break;
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                const isChannelTagnotadmin = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Tagnotadmin command executed', isChannelTagnotadmin);
                break;
            case userMessage.startsWith('.hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Hidetag command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.tag'):
                const messageText = rawText.slice(4).trim();  // use rawText here, not userMessage
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                const isChannelTag = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Tag command executed', isChannelTag);
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only antilink', isChannel);
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Bot admin required antilink', isChannel);
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                const isChannelAntilink = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Antilink command executed', isChannelAntilink);
                break;
            case userMessage.startsWith('.antitag'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only antitag', isChannel);
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Bot admin required antitag', isChannel);
                    return;
                }
                await handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                const isChannelAntitag = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Antitag command executed', isChannelAntitag);
                break;
            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                const isChannelMeme = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Meme command executed', isChannelMeme);
                break;
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                const isChannelJoke = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Joke command executed', isChannelJoke);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                const isChannelQuote = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Quote command executed', isChannelQuote);
                break;
            case userMessage === '.fact':
                await factCommand(sock, chatId, message, message);
                const isChannelFact = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Fact command executed', isChannelFact);
                break;
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Weather command executed', isChannel);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please specify a city, e.g., .weather London', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Weather command usage', isChannel);
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId);
                const isChannelNews = chatId.includes('@newsletter');
                logSentMessage(chatId, 'News command executed', isChannelNews);
                break;
            case userMessage.startsWith('.ttt') || userMessage.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                const isChannelTtt = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Tictactoe command executed', isChannelTtt);
                break;
            case userMessage.startsWith('.move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Move command usage', isChannel);
                } else {
                    tictactoeMove(sock, chatId, senderId, position);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Move command executed', isChannel);
                }
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                const isChannelTop = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Topmembers command executed', isChannelTop);
                break;
            case userMessage.startsWith('.hangman'):
                startHangman(sock, chatId);
                const isChannelHangman = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Hangman command executed', isChannelHangman);
                break;
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Guess command executed', isChannel);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Guess command usage', isChannel);
                }
                break;
            case userMessage.startsWith('.trivia'):
                startTrivia(sock, chatId);
                const isChannelTrivia = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Trivia command executed', isChannelTrivia);
                break;
            case userMessage.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, answer);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Answer command executed', isChannel);
                } else {
                    sock.sendMessage(chatId, { text: 'Please provide an answer using .answer <answer>', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Answer command usage', isChannel);
                }
                break;
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                const isChannelCompliment = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Compliment command executed', isChannelCompliment);
                break;
            case userMessage.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                const isChannelInsult = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Insult command executed', isChannelInsult);
                break;
            case userMessage.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                const isChannel8ball = chatId.includes('@newsletter');
                logSentMessage(chatId, '8ball command executed', isChannel8ball);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                const isChannelLyrics = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Lyrics command executed', isChannelLyrics);
                break;
            case userMessage.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                const isChannelSimp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Simp command executed', isChannelSimp);
                break;
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                const isChannelStupid = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Stupid command executed', isChannelStupid);
                break;
            case userMessage === '.dare':
                await dareCommand(sock, chatId, message);
                const isChannelDare = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Dare command executed', isChannelDare);
                break;
            case userMessage === '.truth':
                await truthCommand(sock, chatId, message);
                const isChannelTruth = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Truth command executed', isChannelTruth);
                break;
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                const isChannelClear = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Clear command executed', isChannelClear);
                break;
            case userMessage.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                const isChannelPromote = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Promote command executed', isChannelPromote);
                break;
            case userMessage.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                const isChannelDemote = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Demote command executed', isChannelDemote);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                const isChannelPing = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Ping command executed', isChannelPing);
                break;
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                const isChannelAlive = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Alive command executed', isChannelAlive);
                break;
            case userMessage.startsWith('.mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Mention command executed', isChannel);
                }
                break;
            case userMessage === '.setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Setmention command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                const isChannelBlur = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Blur command executed', isChannelBlur);
                break;
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Welcome command executed', isChannel);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Admin required welcome', isChannel);
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only welcome', isChannel);
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Goodbye command executed', isChannel);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                        const isChannel = chatId.includes('@newsletter');
                        logSentMessage(chatId, 'Admin required goodbye', isChannel);
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only goodbye', isChannel);
                }
                break;
            case userMessage === '.git':
            case userMessage === '.github':
            case userMessage === '.sc':
            case userMessage === '.script':
            case userMessage === '.repo':
                await githubCommand(sock, chatId, message);
                const isChannelGit = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Git command executed', isChannelGit);
                break;
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only antibadword', isChannel);
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Bot admin required antibadword', isChannel);
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                const isChannelAntibadword = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Antibadword command executed', isChannelAntibadword);
                break;
            case userMessage.startsWith('.chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only chatbot', isChannel);
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Admin required chatbot', isChannel);
                    return;
                }

                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                const isChannelChatbot = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Chatbot command executed', isChannelChatbot);
                break;
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                {
                    const isSteal = userMessage.startsWith('.steal');
                    const sliceLen = isSteal ? 6 : 5; // '.steal' vs '.take'
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                    const isChannelTake = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Take command executed', isChannelTake);
                }
                break;
            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                const isChannelFlirt = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Flirt command executed', isChannelFlirt);
                break;
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                const isChannelChar = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Character command executed', isChannelChar);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                const isChannelWaste = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Waste command executed', isChannelWaste);
                break;
            case userMessage === '.ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only ship', isChannel);
                    return;
                }
                await shipCommand(sock, chatId, message);
                const isChannelShip = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Ship command executed', isChannelShip);
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only groupinfo', isChannel);
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                const isChannelGroupinfo = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Groupinfo command executed', isChannelGroupinfo);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only resetlink', isChannel);
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                const isChannelResetlink = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Resetlink command executed', isChannelResetlink);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Group only staff', isChannel);
                    return;
                }
                await staffCommand(sock, chatId, message);
                const isChannelStaff = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Staff command executed', isChannelStaff);
                break;
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                const isChannelUrl = chatId.includes('@newsletter');
                logSentMessage(chatId, 'URL command executed', isChannelUrl);
                break;
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                const isChannelEmix = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Emojimix command executed', isChannelEmix);
                break;

            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                const isChannelVv = chatId.includes('@newsletter');
                logSentMessage(chatId, 'View once command executed', isChannelVv);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                const isChannelClearsession = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Clearsession command executed', isChannelClearsession);
                break;
            case userMessage.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                const isChannelAutostatus = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Autostatus command executed', isChannelAutostatus);
                break;
            case userMessage.startsWith('.simp'):
                await simpCommand(sock, chatId, message);
                const isChannelSimp2 = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Simp command executed', isChannelSimp2);
                break;
            case userMessage.startsWith('.metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                const isChannelMetallic = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Metallic command executed', isChannelMetallic);
                break;
            case userMessage.startsWith('.ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                const isChannelIce = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Ice command executed', isChannelIce);
                break;
            case userMessage.startsWith('.snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                const isChannelSnow = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Snow command executed', isChannelSnow);
                break;
            case userMessage.startsWith('.impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                const isChannelImpressive = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Impressive command executed', isChannelImpressive);
                break;
            case userMessage.startsWith('.matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                const isChannelMatrix = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Matrix command executed', isChannelMatrix);
                break;
            case userMessage.startsWith('.light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                const isChannelLight = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Light command executed', isChannelLight);
                break;
            case userMessage.startsWith('.neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                const isChannelNeon = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Neon command executed', isChannelNeon);
                break;
            case userMessage.startsWith('.devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                const isChannelDevil = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Devil command executed', isChannelDevil);
                break;
            case userMessage.startsWith('.purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                const isChannelPurple = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Purple command executed', isChannelPurple);
                break;
            case userMessage.startsWith('.thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                const isChannelThunder = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Thunder command executed', isChannelThunder);
                break;
            case userMessage.startsWith('.leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                const isChannelLeaves = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Leaves command executed', isChannelLeaves);
                break;
            case userMessage.startsWith('.1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                const isChannel1917 = chatId.includes('@newsletter');
                logSentMessage(chatId, '1917 command executed', isChannel1917);
                break;
            case userMessage.startsWith('.arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                const isChannelArena = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Arena command executed', isChannelArena);
                break;
            case userMessage.startsWith('.hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                const isChannelHacker = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Hacker command executed', isChannelHacker);
                break;
            case userMessage.startsWith('.sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                const isChannelSand = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Sand command executed', isChannelSand);
                break;
            case userMessage.startsWith('.blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                const isChannelBlackpink = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Blackpink command executed', isChannelBlackpink);
                break;
            case userMessage.startsWith('.glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                const isChannelGlitch = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Glitch command executed', isChannelGlitch);
                break;
            case userMessage.startsWith('.fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                const isChannelFire = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Fire command executed', isChannelFire);
                break;
            case userMessage.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                const isChannelAntidelete = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Antidelete command executed', isChannelAntidelete);
                break;
            case userMessage === '.surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
                const isChannelSurrender = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Surrender command executed', isChannelSurrender);
                break;
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                const isChannelCleartmp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Cleartmp command executed', isChannelCleartmp);
                break;
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                const isChannelSetpp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Setpp command executed', isChannelSetpp);
                break;
            case userMessage.startsWith('.setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Setgdesc command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Setgname command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                const isChannelSetgpp = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Setgpp command executed', isChannelSetgpp);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || (userMessage === '.ig' || userMessage.startsWith('.ig ')):
                await instagramCommand(sock, chatId, message);
                const isChannelIg = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Instagram command executed', isChannelIg);
                break;
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                const isChannelIgsc = chatId.includes('@newsletter');
                logSentMessage(chatId, 'IGSC command executed', isChannelIgsc);
                break;
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                const isChannelIgs = chatId.includes('@newsletter');
                logSentMessage(chatId, 'IGS command executed', isChannelIgs);
                break;
            case userMessage.startsWith('.fb') || userMessage.startsWith('.facebook'):
                await facebookCommand(sock, chatId, message);
                const isChannelFb = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Facebook command executed', isChannelFb);
                break;
            case userMessage.startsWith('.music'):
                await playCommand(sock, chatId, message);
                const isChannelMusic = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Music command executed', isChannelMusic);
                break;
            case userMessage.startsWith('.spotify'):
                await spotifyCommand(sock, chatId, message);
                const isChannelSpotify = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Spotify command executed', isChannelSpotify);
                break;
            case userMessage.startsWith('.play') || userMessage.startsWith('.mp3') || userMessage.startsWith('.ytmp3') || userMessage.startsWith('.song'):
                await songCommand(sock, chatId, message);
                const isChannelPlay = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Play command executed', isChannelPlay);
                break;
            case userMessage.startsWith('.video') || userMessage.startsWith('.ytmp4'):
                await videoCommand(sock, chatId, message);
                const isChannelVideo = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Video command executed', isChannelVideo);
                break;
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                const isChannelTiktok = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Tiktok command executed', isChannelTiktok);
                break;
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini'):
                await aiCommand(sock, chatId, message);
                const isChannelAi = chatId.includes('@newsletter');
                logSentMessage(chatId, 'AI command executed', isChannelAi);
                break;
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                const isChannelTranslate = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Translate command executed', isChannelTranslate);
                return;
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                const isChannelSs = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Screenshot command executed', isChannelSs);
                break;
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                const isChannelAreact = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Areact command executed', isChannelAreact);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                const isChannelSudo = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Sudo command executed', isChannelSudo);
                break;
            case userMessage === '.goodnight' || userMessage === '.lovenight' || userMessage === '.gn':
                await goodnightCommand(sock, chatId, message);
                const isChannelGn = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Goodnight command executed', isChannelGn);
                break;
            case userMessage === '.shayari' || userMessage === '.shayri':
                await shayariCommand(sock, chatId, message);
                const isChannelShayari = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Shayari command executed', isChannelShayari);
                break;
            case userMessage === '.roseday':
                await rosedayCommand(sock, chatId, message);
                const isChannelRoseday = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Roseday command executed', isChannelRoseday);
                break;
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'): await imagineCommand(sock, chatId, message);
                const isChannelImagine = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Imagine command executed', isChannelImagine);
                break;
            case userMessage === '.jid': await groupJidCommand(sock, chatId, message);
                const isChannelJid = chatId.includes('@newsletter');
                logSentMessage(chatId, 'JID command executed', isChannelJid);
                break;
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                const isChannelAutotyping = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Autotyping command executed', isChannelAutotyping);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                const isChannelAutoread = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Autoread command executed', isChannelAutoread);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                const isChannelHeart = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Heart command executed', isChannelHeart);
                break;
            case userMessage.startsWith('.horny'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Horny command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.circle'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Circle command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.lgbt'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbt', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'LGBT command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.lolice'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Lolice command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.simpcard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Simpcard command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.tonikawa'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tonikawa', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Tonikawa command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.its-so-stupid'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Its-so-stupid command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.namecard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Namecard command executed', isChannel);
                }
                break;

            case userMessage.startsWith('.oogway2'):
            case userMessage.startsWith('.oogway'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith('.oogway2') ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Oogway command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.tweet'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Tweet command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.ytcomment'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['youtube-comment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'YT comment command executed', isChannel);
                }
                break;
            case userMessage.startsWith('.comrade'):
            case userMessage.startsWith('.gay'):
            case userMessage.startsWith('.glass'):
            case userMessage.startsWith('.jail'):
            case userMessage.startsWith('.passed'):
            case userMessage.startsWith('.triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(1).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, `${sub} command executed`, isChannel);
                }
                break;
            case userMessage.startsWith('.animu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Anime command executed', isChannel);
                }
                break;
            // animu aliases
            case userMessage.startsWith('.nom'):
            case userMessage.startsWith('.poke'):
            case userMessage.startsWith('.cry'):
            case userMessage.startsWith('.kiss'):
            case userMessage.startsWith('.pat'):
            case userMessage.startsWith('.hug'):
            case userMessage.startsWith('.wink'):
            case userMessage.startsWith('.facepalm'):
            case userMessage.startsWith('.face-palm'):
            case userMessage.startsWith('.animuquote'):
            case userMessage.startsWith('.quote'):
            case userMessage.startsWith('.loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, `${sub} command executed`, isChannel);
                }
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                const isChannelCrop = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Crop command executed', isChannelCrop);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Pies command executed', isChannel);
                    commandExecuted = true;
                }
                break;
            case userMessage === '.china':
                await piesAlias(sock, chatId, message, 'china');
                const isChannelChina = chatId.includes('@newsletter');
                logSentMessage(chatId, 'China command executed', isChannelChina);
                commandExecuted = true;
                break;
            case userMessage === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                const isChannelIndonesia = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Indonesia command executed', isChannelIndonesia);
                commandExecuted = true;
                break;
            case userMessage === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                const isChannelJapan = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Japan command executed', isChannelJapan);
                commandExecuted = true;
                break;
            case userMessage === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                const isChannelKorea = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Korea command executed', isChannelKorea);
                commandExecuted = true;
                break;
            case userMessage === '.hijab':
                await piesAlias(sock, chatId, message, 'hijab');
                const isChannelHijab = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Hijab command executed', isChannelHijab);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                    const isChannel = chatId.includes('@newsletter');
                    logSentMessage(chatId, 'Update command executed', isChannel);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                const isChannelRemovebg = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Removebg command executed', isChannelRemovebg);
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                const isChannelRemini = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Remini command executed', isChannelRemini);
                break;
            case userMessage.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                const isChannelSora = chatId.includes('@newsletter');
                logSentMessage(chatId, 'Sora command executed', isChannelSora);
                break;
            default:
                if (isGroup) {
                    // Handle non-command group messages
                    if (userMessage) {  // Make sure there's a message
                        await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                    }
                    await handleTagDetection(sock, chatId, message, senderId);
                    await handleMentionDetection(sock, chatId, message);
                }
                commandExecuted = false;
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith('.')) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Only try to send error message if we have a valid chatId
        if (chatId) {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to process command!',
                ...channelInfo
            });
            const isChannel = chatId.includes('@newsletter');
            logSentMessage(chatId, 'Error response sent', isChannel);
        }
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
    }
};
