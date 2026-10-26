require('dotenv').config();

const settings = {
  packname: 'Zenitsu Bot',
  author: '‎',
  botName: 'Zenitsu Bot',
  botOwner: 'Chris Gaaju',
  ownerNumber: '2348069675806',
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: 'public',
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: 'This is a bot for managing group commands and automating tasks.',
  version: '3.0.8',
  updateZipUrl: 'https://github.com/Xchristech2/Zenitsu-Bot/archive/refs/heads/main.zip',

  knightApiUrl: process.env.KNIGHT_API_URL || 'https://knightbotapi.stream',
  knightApiKey: process.env.KNIGHT_API_KEY || 'knight',
  mediaApiUrl: process.env.MEDIA_API_URL || 'https://knightbotapi.stream',
  mediaApiKey: process.env.MEDIA_API_KEY || 'knight',
  princeApiUrl: process.env.PRINCE_API_URL || 'https://api.princetechn.com',
  princeApiKey: process.env.PRINCE_API_KEY || 'prince',
};

global.sessionid = process.env.SESSION_ID;

module.exports = settings;
