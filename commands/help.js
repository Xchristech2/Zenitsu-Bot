const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {

    const readMore = '\u200E'.repeat(4000);

    const botMode = settings.mode || 'public';

    // Calculate bot uptime
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        return `${days}d ${hours}h ${minutes}m ${secs}s`;
    };

    const uptime = formatUptime(process.uptime());

    const helpMessage = `
┏━『 *ZENITSU BOT* 』
┃ ⚡ Version: ${settings.version || '3.0.0'}
┃ 👨‍💻 Developer: ${settings.botOwner || 'Chris Gaaju'}
┃ 🌐 Multi-Device Bot
┃ 🔐 Mode: ${botMode.toString().toUpperCase()}
┃ ⏱️ Uptime: ${uptime}
┗━━━━━━━━━━━━━━
${readMore}

╭─「 🌐 GENERAL COMMANDS 」
│
│ ➧ .help
│ ➧ .ping
│ ➧ .alive
│ ➧ .tts
│ ➧ .owner
│ ➧ .joke
│ ➧ .quote
│ ➧ .fact
│ ➧ .weather
│ ➧ .news
│ ➧ .attp
│ ➧ .lyrics
│ ➧ .8ball
│ ➧ .groupinfo
│ ➧ .staff / .admins
│ ➧ .vv
│ ➧ .vv2
│ ➧ .trt
│ ➧ .ss
│ ➧ .jid
│ ➧ .url
╰━━━━━━━━━━━━━━

╭─「 👮 ADMIN COMMANDS 」
│
│ ➧ .ban
│ ➧ .promote
│ ➧ .demote
│ ➧ .mute
│ ➧ .unmute
│ ➧ .delete / .del
│ ➧ .kick
│ ➧ .warnings
│ ➧ .warn
│ ➧ .antilink
│ ➧ .antibadword
│ ➧ .clear
│ ➧ .tag
│ ➧ .tagall
│ ➧ .tagnotadmin
│ ➧ .hidetag
│ ➧ .chatbot
│ ➧ .resetlink
│ ➧ .antitag
│ ➧ .welcome
│ ➧ .goodbye
│ ➧ .antibot
│ ➧ .setgdesc
│ ➧ .setgname
│ ➧ .setgpp
│ ➧ .groupstatus
╰━━━━━━━━━━━━━━

${readMore}

╭─「 🔐 OWNER COMMANDS 」
│
│ ➧ .mode
│ ➧ .clearsession
│ ➧ .antidelete
│ ➧ .cleartmp
│ ➧ .update
│ ➧ .settings
│ ➧ .setpp
│ ➧ .autoreact
│ ➧ .autostatus
│ ➧ .autostatus react
│ ➧ .savestatus
│ ➧ .autotyping
│ ➧ .autoread
│ ➧ .anticall
│ ➧ .pmblocker
│ ➧ .pmblocker setmsg
│ ➧ .setmention
│ ➧ .mention
╰━━━━━━━━━━━━━━

╭─「 🎨 IMAGE & STICKER 」
│
│ ➧ .blur
│ ➧ .simage
│ ➧ .sticker
│ ➧ .removebg
│ ➧ .remini
│ ➧ .crop
│ ➧ .tgsticker
│ ➧ .meme
│ ➧ .take
│ ➧ .emojimix
│ ➧ .igs
│ ➧ .igsc
╰━━━━━━━━━━━━━━

╭─「 🖼️ PIES COMMANDS 」
│
│ ➧ .pies
│ ➧ .china
│ ➧ .indonesia
│ ➧ .japan
│ ➧ .korea
│ ➧ .hijab
╰━━━━━━━━━━━━━━

╭─「 🎮 GAME COMMANDS 」
│
│ ➧ .tictactoe
│ ➧ .hangman
│ ➧ .guess
│ ➧ .trivia
│ ➧ .answer
│ ➧ .truth
│ ➧ .dare
╰━━━━━━━━━━━━━━

${readMore}

╭─「 🤖 AI COMMANDS 」
│
│ ➧ .ai
│ ➧ .gpt
│ ➧ .gemini
│ ➧ .imagine
│ ➧ .flux
│ ➧ .sora
╰━━━━━━━━━━━━━━

╭─「 🎯 FUN COMMANDS 」
│
│ ➧ .compliment
│ ➧ .insult
│ ➧ .flirt
│ ➧ .shayari
│ ➧ .goodnight
│ ➧ .roseday
│ ➧ .character
│ ➧ .wasted
│ ➧ .ship
│ ➧ .simp
│ ➧ .stupid
╰━━━━━━━━━━━━━━

╭─「 🔤 TEXTMAKER 」
│
│ ➧ .metallic
│ ➧ .ice
│ ➧ .snow
│ ➧ .impressive
│ ➧ .matrix
│ ➧ .light
│ ➧ .neon
│ ➧ .devil
│ ➧ .purple
│ ➧ .thunder
│ ➧ .leaves
│ ➧ .1917
│ ➧ .arena
│ ➧ .hacker
│ ➧ .sand
│ ➧ .blackpink
│ ➧ .glitch
│ ➧ .fire
╰━━━━━━━━━━━━━━

╭─「 📥 DOWNLOADER 」
│
│ ➧ .play
│ ➧ .song
│ ➧ .spotify
│ ➧ .instagram
│ ➧ .facebook
│ ➧ .twitter
│ ➧ .tiktok
│ ➧ .video
│ ➧ .ytmp4
╰━━━━━━━━━━━━━━

${readMore}

╭─「 🧩 MISC COMMANDS 」
│
│ ➧ .heart
│ ➧ .horny
│ ➧ .circle
│ ➧ .lgbt
│ ➧ .lolice
│ ➧ .its-so-stupid
│ ➧ .namecard
│ ➧ .oogway
│ ➧ .tweet
│ ➧ .ytcomment
│ ➧ .comrade
│ ➧ .gay
│ ➧ .glass
│ ➧ .jail
│ ➧ .passed
│ ➧ .triggered
╰━━━━━━━━━━━━━━

╭─「 🖼️ ANIME COMMANDS 」
│
│ ➧ .nom
│ ➧ .poke
│ ➧ .cry
│ ➧ .kiss
│ ➧ .pat
│ ➧ .hug
│ ➧ .wink
│ ➧ .facepalm
╰━━━━━━━━━━━━━━

╭─「 💻 GITHUB COMMANDS 」
│
│ ➧ .git
│ ➧ .github
│ ➧ .sc
│ ➧ .script
│ ➧ .repo
╰━━━━━━━━━━━━━━
`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        const contextInfo = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363406588763460@newsletter',
                newsletterName: 'Zenitsu Bot',
                serverMessageId: -1
            }
        };

        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);

            await sock.sendMessage(
                chatId,
                {
                    image: imageBuffer,
                    caption: helpMessage,
                    contextInfo
                },
                { quoted: message }
            );
        } else {
            console.error('Bot image not found at:', imagePath);

            await sock.sendMessage(
                chatId,
                {
                    text: helpMessage,
                    contextInfo
                },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error('Error in help command:', error);

        await sock.sendMessage(
            chatId,
            { text: helpMessage },
            { quoted: message }
        );
    }
}

module.exports = helpCommand;
