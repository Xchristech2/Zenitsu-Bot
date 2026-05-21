const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {

const helpMessage = `
╭═══════════════════════════╮
│ ⚡ *Z E N I T S U • M E N U* ⚡
╰═══════════════════════════╯


👑 *BOT INFO*
╭──────────────────
│ ⚡ Bot: ${settings.botName || 'Zenitsu-Bot'}

│ 👑 Owner: ${settings.botOwner || 'Chris Gaaju'}

│ ⚙️ Version: ${settings.version || '4.0.0'}

│ 🌙 Mode: Thunder Breathing
╰──────────────────


⚡ *GENERAL COMMANDS*
╭──────────────────
│ ⚡ .menu

│ ⚡ .help

│ ⚡ .ping

│ ⚡ .alive

│ ⚡ .tts <text>

│ ⚡ .owner

│ ⚡ .joke

│ ⚡ .quote

│ ⚡ .fact

│ ⚡ .weather <city>

│ ⚡ .lyrics <song>

│ ⚡ .vv

│ ⚡ .trt

│ ⚡ .ss
╰──────────────────


👥 *ADMIN CONTROL*
╭──────────────────
│ ⚡ .ban

│ ⚡ .kick

│ ⚡ .promote

│ ⚡ .demote

│ ⚡ .mute

│ ⚡ .unmute

│ ⚡ .warn

│ ⚡ .warnings

│ ⚡ .antilink

│ ⚡ .antibadword

│ ⚡ .tagall

│ ⚡ .hidetag

│ ⚡ .welcome

│ ⚡ .goodbye

│ ⚡ .setgname

│ ⚡ .setgdesc
╰──────────────────


👑 *OWNER CORE*
╭──────────────────
│ ⚡ .mode public

│ ⚡ .mode private

│ ⚡ .update

│ ⚡ .settings

│ ⚡ .autoread

│ ⚡ .autotyping

│ ⚡ .anticall

│ ⚡ .pmblocker

│ ⚡ .setpp

│ ⚡ .clearsession
╰──────────────────


🎨 *MEDIA / STICKER*
╭──────────────────
│ ⚡ .sticker

│ ⚡ .simage

│ ⚡ .removebg

│ ⚡ .remini

│ ⚡ .meme

│ ⚡ .take

│ ⚡ .emojimix

│ ⚡ .igs

│ ⚡ .igsc
╰──────────────────


🎮 *GAMES*
╭──────────────────
│ ⚡ .tictactoe

│ ⚡ .hangman

│ ⚡ .trivia

│ ⚡ .truth

│ ⚡ .dare
╰──────────────────


🤖 *AI POWER*
╭──────────────────
│ ⚡ .gpt

│ ⚡ .gemini

│ ⚡ .imagine

│ ⚡ .flux

│ ⚡ .sora
╰──────────────────


🎭 *FUN ZONE*
╭──────────────────
│ ⚡ .compliment

│ ⚡ .insult

│ ⚡ .flirt

│ ⚡ .shayari

│ ⚡ .ship

│ ⚡ .simp

│ ⚡ .character
╰──────────────────


🔤 *TEXT MAKER*
╭──────────────────
│ ⚡ .neon

│ ⚡ .matrix

│ ⚡ .glitch

│ ⚡ .fire

│ ⚡ .hacker

│ ⚡ .devil

│ ⚡ .thunder
╰──────────────────


📥 *DOWNLOADER*
╭──────────────────
│ ⚡ .play

│ ⚡ .song

│ ⚡ .spotify

│ ⚡ .tiktok

│ ⚡ .instagram

│ ⚡ .ytmp4
╰──────────────────


💻 *GITHUB*
╭──────────────────
│ ⚡ .repo

│ ⚡ .script

│ ⚡ .github

│ ⚡ .sc
╰──────────────────


╭═══════════════════════════╮
│ ⚡ “Sleep... then strike like thunder.”
│         — Zenitsu Mode ⚡
╰═══════════════════════════╯
`;

try {

    // ⚔️ MENU REACTION
    await sock.sendMessage(chatId, {
        react: {
            text: '⚔️',
            key: message.key
        }
    });

    const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

    if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);

        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: helpMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406588763460@newsletter',
                    newsletterName: '⚡ Zenitsu Bot',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } else {
        await sock.sendMessage(chatId, {
            text: helpMessage,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406588763460@newsletter',
                    newsletterName: '⚡ Zenitsu Bot',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });
    }

} catch (error) {
    console.error('Menu Error:', error);

    await sock.sendMessage(chatId, {
        text: helpMessage
    }, { quoted: message });
}
}

module.exports = helpCommand;
