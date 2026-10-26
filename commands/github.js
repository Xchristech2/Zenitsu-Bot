const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function githubCommand(sock, chatId, message) {
  try {
    const res = await fetch('https://api.github.com/repos/Xchristech2/Zenitsu-Bot');

    if (!res.ok) throw new Error('GitHub API error');

    const repo = await res.json();

    const txt = `⚡ *ZENITSU GITHUB*

📦 ${repo.name}
⭐ Stars: ${repo.stargazers_count}
🍴 Forks: ${repo.forks_count}
👀 Watchers: ${repo.watchers_count}
💾 Size: ${(repo.size / 1024).toFixed(2)} MB

🔗 ${repo.html_url}

👑 Chris Gaaju
🤖 Zenitsu Bot`;

    const imgPath = path.join(__dirname, '../assets/bot_repo.jpg');

    const contextInfo = {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363406588763460@newsletter',
        newsletterName: '⚡ Zenitsu Updates',
        serverMessageId: -1
      }
    };

    if (fs.existsSync(imgPath)) {
      const imgBuffer = fs.readFileSync(imgPath);

      await sock.sendMessage(
        chatId,
        {
          image: imgBuffer,
          caption: txt,
          contextInfo
        },
        { quoted: message }
      );
    } else {
      await sock.sendMessage(
        chatId,
        {
          text: txt,
          contextInfo
        },
        { quoted: message }
      );
    }

  } catch (error) {
    console.error('GitHub Command Error:', error);

    await sock.sendMessage(
      chatId,
      { text: '❌ Failed to fetch GitHub data.' },
      { quoted: message }
    );
  }
}

module.exports = githubCommand;
