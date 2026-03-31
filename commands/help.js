const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const helpMessage = `
✨──────────────✨
        *🤖 ${settings.botName || 'Zenitsu-Bot'}*
        Version: *${settings.version || '4.0.0'}*
        Owner: *${settings.botOwner || 'Chris Gaaju'}*
        YT: ${global.ytch}
✨──────────────✨

🎯 *All Commands*

🐾 *General*
🫆 .help / .menu
🫆 .ping
🫆 .alive
🫆 .tts <text>
🫆 .owner
🫆 .joke
🫆 .quote
🫆 .fact
🫆 .weather <city>
🫆 .news
🫆 .attp <text>
🫆 .lyrics <song>
🫆 .8ball <question>
🫆 .groupinfo
🫆 .staff / .admins
🫆 .vv
🫆 .trt <text> <lang>
🫆 .ss <link>
🫆 .jid
🫆 .url

👥 *Admin*
🫆 .ban @user
🫆 .promote @user
🫆 .demote @user
🫆 .mute <minutes>
🫆 .unmute
🫆 .delete / .del
🫆 .kick @user
🫆 .warnings @user
🫆 .warn @user
🫆 .antilink
🫆 .antibadword
🫆 .clear
🫆 .tag <message>
🫆 .tagall
🫆 .tagnotadmin
🫆 .hidetag <message>
🫆 .chatbot
🫆 .resetlink
🫆 .antitag <on/off>
🫆 .welcome <on/off>
🫆 .goodbye <on/off>
🫆 .setgdesc <description>
🫆 .setgname <new name>
🫆 .setgpp (reply to image)

👑 *Owner*
🫆 .mode <public/private>
🫆 .clearsession
🫆 .antidelete
🫆 .cleartmp
🫆 .update
🫆 .settings
🫆 .setpp <reply to image>
🫆 .autoreact <on/off>
🫆 .autostatus <on/off>
🫆 .autostatus react <on/off>
🫆 .autotyping <on/off>
🫆 .autoread <on/off>
🫆 .anticall <on/off>
🫆 .pmblocker <on/off/status>
🫆 .pmblocker setmsg <text>
🫆 .setmention <reply to msg>
🫆 .mention <on/off>

🎨 *Media / Sticker*
🫆 .blur <image>
🫆 .simage <reply to sticker>
🫆 .sticker <reply to image>
🫆 .removebg
🫆 .remini
🫆 .crop <reply to image>
🫆 .tgsticker <link>
🫆 .meme
🫆 .take <packname>
🫆 .emojimix <emj1>+<emj2>
🫆 .igs <insta link>
🫆 .igsc <insta link>

🖼️ *Pies / Anime*
🫆 .pies <country>
🫆 .china
🫆 .indonesia
🫆 .japan
🫆 .korea
🫆 .hijab
🫆 .nom
🫆 .poke
🫆 .cry
🫆 .kiss
🫆 .pat
🫆 .hug
🫆 .wink
🫆 .facepalm

🎮 *Games*
🫆 .tictactoe @user
🫆 .hangman
🫆 .guess <letter>
🫆 .trivia
🫆 .answer <answer>
🫆 .truth
🫆 .dare

🤖 *AI*
🫆 .gpt <question>
🫆 .gemini <question>
🫆 .imagine <prompt>
🫆 .flux <prompt>
🫆 .sora <prompt>

🤹 *Fun*
🫆 .compliment @user
🫆 .insult @user
🫆 .flirt
🫆 .shayari
🫆 .goodnight
🫆 .roseday
🫆 .character @user
🫆 .wasted @user
🫆 .ship @user
🫆 .simp @user
🫆 .stupid @user [text]

🔤 *Textmaker*
🫆 .metallic <text>
🫆 .ice <text>
🫆 .snow <text>
🫆 .impressive <text>
🫆 .matrix <text>
🫆 .light <text>
🫆 .neon <text>
🫆 .devil <text>
🫆 .purple <text>
🫆 .thunder <text>
🫆 .leaves <text>
🫆 .1917 <text>
🫆 .arena <text>
🫆 .hacker <text>
🫆 .sand <text>
🫆 .blackpink <text>
🫆 .glitch <text>
🫆 .fire <text>

📥 *Downloader*
🫆 .play <song_name>
🫆 .song <song_name>
🫆 .spotify <query>
🫆 .instagram <link>
🫆 .facebook <link>
🫆 .tiktok <link>
🫆 .video <song name>
🫆 .ytmp4 <link>

💻 *Github*
🫆 .git
🫆 .github
🫆 .sc
🫆 .script
🫆 .repo

✨ Join our channel for updates!
`;

    try {
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
                        newsletterName: 'Zenitsu Bot',
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
                        newsletterName: 'Zenitsu Bot by Chris Gaaju',
                        serverMessageId: -1
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;