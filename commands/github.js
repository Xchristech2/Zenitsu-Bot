const moment = require('moment-timezone');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    // Fetch repository info
    const res = await fetch('https://api.github.com/repos/Xchristech2/Zenitsu-Bot');
    if (!res.ok) throw new Error('Error fetching repository data');
    const json = await res.json();

    // Build message text
    const txt = `
✨✨━━━━━━━━━━━━✨✨
𝐙𝐄𝐍𝐈𝐓𝐒𝐔 𝐁𝐎𝐓 🤖
GitHub Repository Info
✨✨━━━━━━━━━━━━✨✨

★ *Name*        : ${json.name}
★ *Watchers*    : ${json.watchers_count}
★ *Forks*       : ${json.forks_count}
★ *Stars*       : ${json.stargazers_count}
★ *Size*        : ${(json.size / 1024).toFixed(2)} MB
★ *Last Updated*: ${moment(json.updated_at).format('DD/MM/YY - HH:mm:ss')}
★ *URL*         : ${json.html_url}

📌 Keep following for updates!
✨✨━━━━━━━━━━━━✨✨
`;

    // Attach local bot image if exists
    const imgPath = path.join(__dirname, '../assets/bot_repo.jpg');
    let imgBuffer;
    if (fs.existsSync(imgPath)) {
      imgBuffer = fs.readFileSync(imgPath);
      await sock.sendMessage(chatId, { 
        image: imgBuffer, 
        caption: txt 
      }, { quoted: message });
    } else {
      await sock.sendMessage(chatId, { text: txt }, { quoted: message });
    }

  } catch (error) {
    console.error('Error in github command:', error);
    await sock.sendMessage(chatId, { text: '❌ Failed to fetch repository info.' }, { quoted: message });
  }
}

module.exports = githubCommand;