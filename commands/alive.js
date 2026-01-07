const settings = require("../settings");
const path = require("path");
const fs = require("fs");

function runtime(seconds) {
    seconds = Number(seconds);
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
}

async function aliveCommand(sock, chatId, message) {
    try {
        // Send initial reaction
        await sock.sendMessage(chatId, {
            react: { text: "⚡", key: message.key }
        });

        const userName = message.pushName || "User";
        const botUptime = runtime(process.uptime());
        const usedMemory = Math.round(process.memoryUsage().rss / (1024 * 1024));
        const ownerNumber = "2348069675806";
        const ownerName = "ZENITSU-MD Owner";
        
        // Create VCF contact card
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:Zenitsu-BOT;
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
X-WA-BIZ-NAME:${ownerName}
NOTE:Owner of Zenitsu-MD WhatsApp Bot
URL:https://whatsapp.com/channel/0029Vb6zuIiLikg7V58lXp1A
END:VCARD`;
        
        // Check if image exists in assets folder
        const imagePath = path.join(__dirname, "../assets/bot_image.jpg");
        
        if (fs.existsSync(imagePath)) {
            // Send image with caption
            const aliveMessage = `
╔═══════════════════╗
        ⚡ *ZANITSU-BOT* ⚡
╚═══════════════════╝

👋 Hello *${userName}*

📊 *SYSTEM INFO*
• ✅ Status: ACTIVE
• 📦 Version: v${settings.version || '1.0.0'}
• ⏱️ Uptime: ${botUptime}
• 💾 Memory: ${usedMemory} MB

💡 *Commands:* .help`;

            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: aliveMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406735242612@newsletter',
                        newsletterName: 'Zenitsu-MD bot',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });

            // Send the contact card
            await sock.sendMessage(chatId, {
                contacts: { 
                    displayName: ownerName, 
                    contacts: [{ vcard }] 
                }
            });

        } else {
            // If no image, send text message
            const aliveMessage = `
╔═══════════════════╗
        ⚡ *ZANITSU-BOT* ⚡
╚═══════════════════╝

👋 Hello *${userName}*

📊 *SYSTEM INFO*
• ✅ Status: ACTIVE
• 📦 Version: v${settings.version || '1.0.0'}
• ⏱️ Uptime: ${botUptime}
• 💾 Memory: ${usedMemory} MB

💡 *Commands:* .help`;

            await sock.sendMessage(chatId, {
                text: aliveMessage,
                contextInfo: {
                    forwardingScore: 1,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363406735242612@newsletter',
                        newsletterName: 'Zenitsu-MD bot',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });

            // Send the contact card
            await sock.sendMessage(chatId, {
                contacts: { 
                    displayName: ownerName, 
                    contacts: [{ vcard }] 
                }
            });
        }

    } catch (error) {
        console.error("[ALIVE COMMAND] Error:", error);
        
        // Fallback to simple message if VCF fails
        await sock.sendMessage(chatId, {
            text: `⚡ *ZANITSU-BOT*\n\n✅ Bot is active!\n📱 Owner: +2348069675806\n\nVCF failed, contact manually.`,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406735242612@newsletter',
                    newsletterName: 'Zenitsu-BOT',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }
}

module.exports = aliveCommand;
