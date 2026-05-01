const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/Xchristech2/Zenitsu-Bot');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    const txt = `
╭━━━〔 ⚡ Z E N I T S U • G I T H U B ⚡ 〕━━━╮
┃ 📦 Repo: ${json.name}
┃ 🌐 Link: ${json.html_url}
╰━━━━━━━━━━━━━━━━━━━━━━━╯

⚡ *REPOSITORY STATS*
╭──────────────
│ ⭐ Stars     : ${json.stargazers_count}
│ 🍴 Forks     : ${json.forks_count}
│ 👀 Watchers  : ${json.watchers_count}
│ 💾 Size      : ${(json.size / 1024).toFixed(2)} MB
│ 🕒 Updated   : ${moment(json.updated_at).format('DD/MM/YY - HH:mm')}
╰──────────────

⚔️ *POWER NOTE*
“Code fast… strike faster ⚡”

╭━━━〔 ⚡ DEV INFO ⚡ 〕━━━╮
┃ 👑 Owner: Chris Gaaju
┃ 🤖 Bot: Zenitsu Bot
┃ 🚀 Version: 4.0
╰━━━━━━━━━━━━━━━━━━━━━━━╯
`;

    const imgPath = path.join(__dirname, '../assets/bot_repo.jpg');

    if (fs.existsSync(imgPath)) {
      const imgBuffer = fs.readFileSync(imgPath);

      await sock.sendMessage(chatId, {
        image: imgBuffer,
        caption: txt,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363406588763460@newsletter',
            newsletterName: '⚡ Zenitsu Updates',
            serverMessageId: -1
          }
        }
      }, { quoted: message });

    } else {
      await sock.sendMessage(chatId, {
        text: txt,
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363406588763460@newsletter',
            newsletterName: '⚡ Zenitsu Updates',
            serverMessageId: -1
          }
        }
      }, { quoted: message });
    }

  } catch (error) {
    console.error('GitHub Command Error:', error);

    await sock.sendMessage(chatId, {
      text: `⚡ *ERROR*\nFailed to fetch repository data.\nTry again later.`,
    }, { quoted: message });
  }
}

module.exports = githubCommand;