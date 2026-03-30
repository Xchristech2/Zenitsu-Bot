const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
const helpMessage = `
╔════════════════════╗
       🔱 ZENITSU-BOT 🔱
╠════════════════════╣
💡 Bot Name : ${settings.botName || 'ZENITSU-BOT'}
⚡ Version  : ${settings.version || '4.0.0'}
👨‍💻 Owner   : ${settings.botOwner || 'Chris Gaaju'}
📺 YouTube : ${global.ytch || 'N/A'}
╚════════════════════╝

✨ *Mystical Command Menu* ✨

📝 ─── GENERAL ✨
❖ menu
❖ ping
❖ alive
❖ tts <text>
❖ joke
❖ quote
❖ fact
❖ weather <city>
❖ news
❖ lyrics <song>
❖ 8ball <question>
❖ groupinfo

👥 ─── ADMIN ✨
❖ ban @user
❖ promote @user
❖ demote @user
❖ mute <minutes>
❖ unmute
❖ kick @user
❖ warnings @user
❖ antilink / antibadword
❖ tagall / tagnotadmin
❖ welcome / goodbye <on/off>
❖ setgdesc <desc>
❖ setgname <name>
❖ setgpp

👑 ─── OWNER ✨
❖ mode <public/private>
❖ clearsession / cleartmp
❖ antidelete
❖ update / settings
❖ setpp
❖ autoreact / autostatus / autotyping / autoread
❖ anticall / pmblocker
❖ mention / setmention

🖼️ ─── IMAGE & STICKER ✨
❖ blur / simage / sticker
❖ removebg / remini / crop
❖ tgsticker / meme / take
❖ emojimix / igs / igsc

🌍 ─── PIES & CATEGORIES ✨
❖ pies <country>
❖ china / indonesia / japan / korea / hijab

🎮 ─── GAMES ✨
❖ tictactoe / hangman / guess
❖ trivia / answer
❖ truth / dare

🤖 ─── AI ✨
❖ gpt / gemini / imagine
❖ flux / sora

🎉 ─── FUN ✨
❖ compliment / insult / flirt
❖ shayari / goodnight / roseday
❖ character / wasted / ship
❖ simp / stupid

✍️ ─── TEXTMAKER ✨
❖ metallic / ice / snow / impressive
❖ matrix / light / neon / devil
❖ purple / thunder / leaves / 1917
❖ arena / hacker / sand / blackpink
❖ glitch / fire

⬇️ ─── DOWNLOADER ✨
❖ play / song / spotify
❖ instagram / facebook / tiktok
❖ video / ytmp4

⚙️ ─── MISC ✨
❖ heart / horny / circle / lgbt
❖ lolice / its-so-stupid / namecard
❖ oogway / tweet / ytcomment / comrade
❖ gay / glass / jail / passed / triggered

🌸 ─── ANIME ✨
❖ nom / poke / cry / kiss
❖ pat / hug / wink / facepalm

💻 ─── GITHUB ✨
❖ git / github / sc / script / repo

🔮 Join our mystical realm for updates!
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
    await sock.sendMessage(chatId, { text: helpMessage });
  }
} catch (error) {
  console.error('Error in help command:', error);
  await sock.sendMessage(chatId, { text: helpMessage });
}

}

module.exports = helpCommand;