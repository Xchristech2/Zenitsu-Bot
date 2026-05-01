const os = require('os');
const settings = require('../settings.js');

function formatTime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const hours = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days) time += `${days}d `;
    if (hours) time += `${hours}h `;
    if (minutes) time += `${minutes}m `;
    if (seconds || !time) time += `${seconds}s`;

    return time.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        // Measure ping
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '⚡ Pinging...' }, { quoted: message });
        const end = Date.now();
        const ping = Math.round(end - start);

        const uptimeInSeconds = process.uptime();
        const uptimeFormatted = formatTime(uptimeInSeconds);

        // Minimal output
        const botInfo = `
𝐙𝐄𝐍𝐈𝐓𝐒𝐔 𝐁𝐎𝐓 🤖

⚡ Ping : ${ping} ms
⏱️ Uptime : ${uptimeFormatted}
🆚 Version : v${settings.version}
`;

        await sock.sendMessage(chatId, { text: botInfo }, { quoted: message });

    } catch (error) {
        console.error('Error in ping command:', error);
        await sock.sendMessage(chatId, { text: '❌ Could not get ping status.' }, { quoted: message });
    }
}

module.exports = pingCommand;