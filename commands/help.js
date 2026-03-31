const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const os = require('os');

function runtime(seconds) {
 seconds = Number(seconds);
 const d = Math.floor(seconds / (3600 * 24));
 const h = Math.floor(seconds % (3600 * 24) / 3600);
 const m = Math.floor(seconds % 3600 / 60);
 const s = Math.floor(seconds % 60);
 return `${d}d ${h}h ${m}m ${s}s`;
}

async function helpCommand(sock, chatId, message) {

const mode = settings.mode || 'public'; // dynamic mode

const helpMessage = `
╔═══════════════════════╗
        ⚡ *ZENITSU BOT* ⚡
     Status · Contact · Menu
╚═══════════════════════╝

📅 *${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}*

🤖 *${settings.botName || 'ZENITSU-BOT'}*
Version ${settings.version || '4.0.0'} · Active

🔧 *SYSTEM INFO*
[ Z E N I T S U - B O T ]
► Prefix: [ . ]
► Owner: ${settings.botOwner || 'Chris Gaaju'}
► Mode: ${mode}   // ✅ Dynamic
► Platform: ${os.platform()}
► Speed: 0 ms
► Uptime: ${runtime(process.uptime())}
► Version: v${settings.version || '3.0.7'}
► RAM: ${Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)}%

⚡ *OWNER MENU*
❖ .ban @user
❖ .restart
❖ .unban @user  
❖ .promote @user
❖ .demote @user
❖ .mode public
❖ .mode private
❖ .clearsession
❖ .antidelete on
❖ .antidelete off
❖ .cleartmp
❖ .update
❖ .settings
❖ .setpp
❖ .autoreact on
❖ .autoreact off
❖ .autostatus on
❖ .autostatus off
❖ .autotyping on
❖ .autotyping off
❖ .autoread on
❖ .autoread off
❖ .anticall on
❖ .anticall off
❖ .pmblocker on
❖ .pmblocker off
❖ .setmention
❖ .mention

📁 *GENERAL COMMANDS*
❖ .menu
❖ .help
❖ .ping
❖ .alive
❖ .owner
❖ .tts
❖ .joke
❖ .quote
❖ .fact
❖ .weather
❖ .news
❖ .lyrics
❖ .8ball
❖ .groupinfo
❖ .admins
❖ .vv
❖ .trt
❖ .ss
❖ .jid
❖ .url

⚙️ *GROUP ADMIN*
❖ .ban
❖ .kick
❖ .mute
❖ .unmute
❖ .promote
❖ .demote
❖ .warn
❖ .warnings
❖ .antilink
❖ .antibadword
❖ .tagall
❖ .tagnotadmin
❖ .hidetag
❖ .welcome
❖ .goodbye
❖ .setgdesc
❖ .setgname
❖ .setgpp

🎨 *MEDIA*
❖ .sticker
❖ .simage
❖ .blur
❖ .removebg
❖ .remini
❖ .crop
❖ .meme
❖ .take
❖ .emojimix
❖ .igs
❖ .igsc

🎮 *GAMES*
❖ .tictactoe
❖ .hangman
❖ .guess
❖ .trivia
❖ .answer
❖ .truth
❖ .dare

🤖 *AI*
❖ .gpt
❖ .gemini
❖ .imagine
❖ .flux
❖ .sora

🎉 *FUN*
❖ .compliment
❖ .insult
❖ .flirt
❖ .ship
❖ .simp
❖ .stupid
❖ .wasted
❖ .character

⬇️ *DOWNLOADER*
❖ .play
❖ .song
❖ .spotify
❖ .tiktok
❖ .instagram
❖ .facebook
❖ .ytmp4
❖ .video

🎎 *ANIME*
❖ .nom
❖ .poke
❖ .cry
❖ .kiss
❖ .pat
❖ .hug
❖ .wink
❖ .facepalm

💻 *GITHUB*
❖ .repo
❖ .script
❖ .github

🚀 *NEW / UPCOMING*
❖ (add new commands here)

📊 *SYSTEM STATUS*
✅ Online · ⚡ Active · 🛡️ Secured
💾 RAM Usage Active

⭐ *Powered by ZENITSU-BOT*
`;

try {
const imagePath = path.join(__dirname, '../assets/thor.png'); // change image if you want

if (fs.existsSync(imagePath)) {
const imageBuffer = fs.readFileSync(imagePath);

await sock.sendMessage(chatId, {
image: imageBuffer,
caption: helpMessage,
contextInfo: {
forwardingScore: 999,
isForwarded: true,
forwardedNewsletterMessageInfo: {
newsletterJid: '120363406588763460@newsletter', // ✅ Add your newsletter JID here
newsletterName: 'ZENITSU BOT ⚡',
serverMessageId: -1
}
}
}, { quoted: message });

} else {
await sock.sendMessage(chatId, { text: helpMessage });
}

} catch (error) {
console.error('Menu Error:', error);
await sock.sendMessage(chatId, { text: helpMessage });
}

}

module.exports = helpCommand;
