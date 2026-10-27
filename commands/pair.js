const axios = require('axios');

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(
                chatId,
                {
                    text: `⚡ *ZENITSU PAIR*

Please enter a WhatsApp number.

Example:
.pair 23480696XXXX`
                },
                { quoted: message }
            );
        }

        const number = q.replace(/[^0-9]/g, '');

        if (number.length < 7 || number.length > 15) {
            return await sock.sendMessage(
                chatId,
                { text: '❌ Invalid WhatsApp number.' },
                { quoted: message }
            );
        }

        const whatsappID = `${number}@s.whatsapp.net`;
        const result = await sock.onWhatsApp(whatsappID);

        if (!result?.[0]?.exists) {
            return await sock.sendMessage(
                chatId,
                { text: '❌ That number is not registered on WhatsApp.' },
                { quoted: message }
            );
        }

        await sock.sendMessage(
            chatId,
            { text: '⚡ Generating pairing code...' },
            { quoted: message }
        );

        const response = await axios.get(
            `https://gaaju-ultra-pair-ljtv.onrender.com/code?number=${number}`,
            {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Zenitsu-Bot'
                }
            }
        );

        const code = response?.data?.code;

        if (!code || code === 'Service Unavailable') {
            throw new Error('Pairing service unavailable');
        }

        await sock.sendMessage(
            chatId,
            {
                text: `⚡ *PAIRING CODE*

\`${code}\`

Enter this code in WhatsApp to link your device.`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Pair Command Error:', error?.response?.data || error.message);

        let text = '❌ Failed to generate pairing code.';

        if (error.code === 'ECONNABORTED') {
            text = '⏱️ Pairing server took too long to respond.';
        } else if (error.response) {
            text = `❌ Pairing server error: ${error.response.status}`;
        }

        await sock.sendMessage(
            chatId,
            { text },
            { quoted: message }
        );
    }
}

module.exports = pairCommand;
