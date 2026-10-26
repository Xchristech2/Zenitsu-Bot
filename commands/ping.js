const settings = require('../settings.js');

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();

        await sock.sendMessage(
            chatId,
            { text: '⚡ Pinging...' },
            { quoted: message }
        );

        const end = Date.now();
        const ping = Math.round(end - start);

        const botInfo = `⚡ Pong!
ZENITSU BOT • ${ping}ms`;

        await sock.sendMessage(
            chatId,
            { text: botInfo },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error in ping command:', error);

        await sock.sendMessage(
            chatId,
            { text: '❌ Could not get ping status.' },
            { quoted: message }
        );
    }
}

module.exports = pingCommand;
