const settings = require("../settings");

async function aliveCommand(sock, chatId, message) {
    try {
        const aliveMessage = `
✨✨━━━━━━━━━━━━✨✨
🤖 *${settings.botName || "Zenitsu Bot"} is ONLINE!*

🛠 *Version:* ${settings.version || "4.0.0"}
⚡ *Status:* Active
🌐 *Mode:* Public

🌟 *Features:*
• Group Management & Admin Tools
• Antilink & Antispam Protection
• Fun & Game Commands
• AI & Image Commands
• And much more!

📌 Type *.menu* to view all commands
✨✨━━━━━━━━━━━━✨✨
`;

        await sock.sendMessage(chatId, {
            text: aliveMessage,
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406588763460@newsletter',
                    newsletterName: settings.botName || 'Zenitsu Bot',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    } catch (error) {
        console.error('Error in alive command:', error);
        await sock.sendMessage(chatId, { text: `🤖 ${settings.botName || "Zenitsu Bot"} is alive and running!` }, { quoted: message });
    }
}

module.exports = aliveCommand;