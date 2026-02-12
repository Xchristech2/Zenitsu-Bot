const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function helpCommand(sock, chatId, message) {
    try {
        // Calculate bot uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / (24 * 60 * 60));
        const hours = Math.floor((uptime % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptime % (60 * 60)) / 60);
        const seconds = Math.floor(uptime % 60);
        
        // Get memory usage
        const used = process.memoryUsage();
        const usedMB = Math.round(used.rss / 1024 / 1024);
        const totalMB = Math.round(os.totalmem() / 1024 / 1024);
        const memPercent = Math.round((used.rss / os.totalmem()) * 100);
        
        // Calculate speed
        const speedStart = performance.now();
        const speedEnd = performance.now();
        const speed = Math.round(speedEnd - speedStart);

        // Send initial message
        const statusMsg = await sock.sendMessage(chatId, {
            text: "🔍 *ZENITSU-BOT* · *Loading...*\n⏳ *Please wait...*"
        }, { quoted: message });

        // Prepare the stylish menu
        const menuText = `
╔═══════════════════════╗
        ⚡ *Zanitsu Bot* ⚡
     Status · Contact · Menu
╚═══════════════════════╝

📅 *${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*

🤖 *ZENITSU-BOT*
Version ${settings.version || '1.0.0'} · Active

🔧 *SYSTEM INFO*
[ ] [ Z E N I T S U -  B O T ]
► Prefix: [ ${settings.prefix || '.'} ]
► Owner: ${settings.botOwner || 'Not set!'}
► Mode: ${settings.privateMode ? 'private' : 'public'}
► Platform: ▼ ${os.platform()}
► Speed: ${speed} ms
► Uptime: ${days}d ${hours}h ${minutes}m ${seconds}s
► Version: v${settings.version || '1.0.0'}
► Storage: ▼ ${usedMB} MB of ${totalMB} MB
► RAM: ▼ ${memPercent}%

⚡ *OWNER MENU*
• .ban @user
• .restart
• .unban @user  
• .promote @user
• .demote @user
• .mode public/private
• .clearsession
• .antidelete on/off
• .cleartmp
• .update
• .settings
• .setpp (reply image)
• .autoreact on/off
• .autostatus on/off
• .autotyping on/off
• .autoread on/off
• .anticall on/off
• .pmblocker on/off/status
• .pmblocker setmsg <text>
• .setmention (reply msg/media)
• .mention on/off

📁 *GENERAL COMMANDS*
• .help / .menu
• .ping
• .alive
• .owner
• .tts <text>
• .joke
• .quote
• .fact
• .weather <city>
• .news
• .attp <text>
• .lyrics <song_title>
• .8ball <question>
• .groupinfo
• .staff / .admins
• .vv
• .trt <text> <lang>
• .ss <link>
• .jid
• .url

⚙️ *GROUP ADMIN*
• .add @user 
• .close 
• .open 
• .ban @user
• .promote @user
• .demote @user
• .mute <minutes>
• .unmute
• .delete / .del
• .kick @user
• .warnings @user
• .warn @user
• .antilink on/off
• .antibadword on/off
• .clear
• .tag <message>
• .tagall
• .tagnotadmin
• .hidetag <message>
• .chatbot on/off
• .resetlink
• .antitag on/off
• .welcome on/off
• .goodbye on/off
• .setgdesc <description>
• .setgname <new name>
• .setgpp (reply to image)

🎨 *IMAGE/STICKER*
• .blur (reply image)
• .simage (reply sticker)
• .sticker (reply image)
• .removebg (reply image)
• .remini (reply image)
• .crop (reply image)
• .tgsticker <Link>
• .meme
• .take <packname>
• .emojimix <emj1>+<emj2>
• .igs <insta link>
• .igsc <insta link>

👩 *PIES*
• .pies <country>
• .china
• .indonesia
• .japan
• .korea
• .hijab

🎮 *GAME*
• .tictactoe @user
• .hangman
• .guess <letter>
• .trivia
• .answer <answer>
• .truth
• .dare

🤖 *AI*
• .gpt <question>
• .gemini <question>
• .imagine <prompt>
• .flux <prompt>
• .sora <prompt>

🎭 *FUN*
• .compliment @user
• .insult @user
• .flirt
• .shayari
• .goodnight
• .roseday
• .character @user
• .wasted @user
• .ship @user
• .simp @user
• .stupid @user [text]

✨ *TEXTMAKER*
• .metallic <text>
• .ice <text>
• .snow <text>
• .impressive <text>
• .matrix <text>
• .light <text>
• .neon <text>
• .devil <text>
• .purple <text>
• .thunder <text>
• .leaves <text>
• .1917 <text>
• .arena <text>
• .hacker <text>
• .sand <text>
• .blackpink <text>
• .glitch <text>
• .fire <text>

⬇️ *DOWNLOADER*
• .play <song_name>
• .song <song_name>
• .spotify <query>
• .instagram <link>
• .facebook <link>
• .tiktok <link>
• .video <youtube>
• .ytmp4 <Link>
• .apk <query>

🎨 *MISC*
• .heart
• .horny
• .circle
• .lgbt
• .lolice
• .its-so-stupid
• .namecard
• .oogway
• .tweet
• .ytcomment
• .comrade
• .gay
• .glass
• .jail
• .passed
• .triggered

🎎 *ANIME*
• .neko
• .waifu
• .loli
• .nom
• .poke
• .cry
• .kiss
• .pat
• .hug
• .wink
• .facepalm

💻 *GITHUB*
• .git
• .github
• .sc
• .script
• .repo

📊 *SYSTEM STATUS*
✅ Online · ⚡ Active · 🛡️ Secured
💾 ${usedMB}MB/${totalMB}MB · 📈 ${memPercent}%

⭐ *Powered by ZENITSU-BOT*`;

        // Update with menu ready
        await sock.sendMessage(chatId, {
            text: "✅ *ZENITSU-BOT* · *Menu Ready*\n📤 *Sending now...*",
            edit: statusMsg.key
        });

        // Create forwarding context (same as aliveCommand)
        const forwardingContext = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363406588763460@newsletter',
                newsletterName: 'Zanitsu Bot',
                serverMessageId: -1
            }
        };

        // Try to send with image
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        if (fs.existsSync(imagePath)) {
            try {
                const imageBuffer = fs.readFileSync(imagePath);
                
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: menuText,
                    contextInfo: forwardingContext
                });

                // Delete the status message
                await sock.sendMessage(chatId, {
                    delete: statusMsg.key
                });

            } catch (imageError) {
                console.error('[MENU] Image error:', imageError);
                // Fallback to text only with forwarding
                await sendTextMenu(sock, chatId, menuText, statusMsg, forwardingContext);
            }
        } else {
            // Send text menu if no image
            await sendTextMenu(sock, chatId, menuText, statusMsg, forwardingContext);
        }

    } catch (error) {
        console.error('[ZENITSU-BOT MENU] Error:', error);
        
        // Send error fallback with forwarding
        await sock.sendMessage(chatId, {
            text: `🚫 *SYSTEM ERROR*\n\nFailed to load menu.\nError: ${error.message}`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406588763460@newsletter',
                    newsletterName: 'Zanitsu Bot',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }
}

async function sendTextMenu(sock, chatId, menuText, statusMsg, forwardingContext) {
    // Split into multiple messages due to WhatsApp 4096 char limit
    const parts = splitMenu(menuText, 4000);
    
    for (let i = 0; i < parts.length; i++) {
        if (i === 0) {
            await sock.sendMessage(chatId, {
                text: parts[i],
                contextInfo: forwardingContext
            });
        } else {
            await sock.sendMessage(chatId, {
                text: parts[i]
            });
            await delay(1000);
        }
    }

    // Delete the status message
    await sock.sendMessage(chatId, {
        delete: statusMsg.key
    });
}

function splitMenu(text, maxLength) {
    const parts = [];
    const lines = text.split('\n');
    let currentPart = '';
    
    for (const line of lines) {
        if (currentPart.length + line.length + 1 > maxLength) {
            parts.push(currentPart);
            currentPart = line + '\n';
        } else {
            currentPart += line + '\n';
        }
    }
    
    if (currentPart) {
        parts.push(currentPart);
    }
    
    return parts;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = helpCommand;
