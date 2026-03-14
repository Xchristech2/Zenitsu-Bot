const { ttdl } = require("ruhend-scraper");
const axios = require('axios');

// Store processed message IDs to prevent duplicates
const processedMessages = new Set();

async function tiktokCommand(sock, chatId, message) {
    try {
        // Check if message has already been processed
        if (processedMessages.has(message.key.id)) {
            return;
        }
        
        // Add message ID to processed set
        processedMessages.add(message.key.id);
        
        // Clean up old message IDs after 5 minutes
        setTimeout(() => {
            processedMessages.delete(message.key.id);
        }, 5 * 60 * 1000);

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "🎬 *ZENITSU-BOT TIKTOK DOWNLOADER* 🎬\n\nPlease provide a TikTok link for the video."
            });
        }

        // Extract URL from command
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "🎬 *ZENITSU-BOT TIKTOK DOWNLOADER* 🎬\n\nPlease provide a TikTok link for the video."
            });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "❌ *INVALID LINK* ❌\n\nThat is not a valid TikTok link. Please provide a valid TikTok video link."
            });
        }

        // Send initial status message
        let statusMsg = await sock.sendMessage(chatId, {
            text: "🔍 *Processing TikTok link...*\n\n⏳ Please wait..."
        }, { quoted: message });

        // Update status to validating
        await sock.sendMessage(chatId, {
            text: "✅ *Link validated*\n🔗 Extracting video data...\n\n⚡ *Zenitsu-BOT* is working...",
            edit: statusMsg.key
        });

        await sock.sendMessage(chatId, {
            react: { text: '🔄', key: message.key }
        });

        try {
            // Update status to downloading
            await sock.sendMessage(chatId, {
                text: "⬇️ *Downloading video...*\n\n⚡ Connecting to servers...\n⏳ Please wait...",
                edit: statusMsg.key
            });

            // Try multiple APIs in sequence
            const apis = [
                `https://api.princetechn.com/api/download/tiktok?apikey=prince&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv2?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv3?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.princetechn.com/api/download/tiktokdlv4?apikey=prince_tech_api_azfsbshfb&url=${encodeURIComponent(url)}`,
                `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`
            ];

            let videoUrl = null;
            let audioUrl = null;
            let title = null;
            let username = null;

            // Try each API until one works
            for (const apiUrl of apis) {
                try {
                    const response = await axios.get(apiUrl, { timeout: 10000 });
                    
                    if (response.data) {
                        // Handle different API response formats
                        if (response.data.result && response.data.result.videoUrl) {
                            // PrinceTech API format
                            videoUrl = response.data.result.videoUrl;
                            audioUrl = response.data.result.audioUrl;
                            title = response.data.result.title;
                            username = response.data.result.author?.username || response.data.result.author;
                            break;
                        } else if (response.data.tiktok && response.data.tiktok.video) {
                            // Dreaded API format
                            videoUrl = response.data.tiktok.video;
                            title = response.data.tiktok.title;
                            username = response.data.tiktok.author;
                            break;
                        } else if (response.data.video) {
                            // Alternative format
                            videoUrl = response.data.video;
                            break;
                        }
                    }
                } catch (apiError) {
                    continue;
                }
            }

            // If no API worked, try the original ttdl method
            if (!videoUrl) {
                try {
                    await sock.sendMessage(chatId, {
                        text: "🔄 *Trying alternative method...*\n\n⚡ Using backup servers...",
                        edit: statusMsg.key
                    });

                    let downloadData = await ttdl(url);
                    if (downloadData && downloadData.data && downloadData.data.length > 0) {
                        const mediaData = downloadData.data;
                        for (let i = 0; i < Math.min(20, mediaData.length); i++) {
                            const media = mediaData[i];
                            const mediaUrl = media.url;

                            const isVideo = /\.(mp4|mov|avi|mkv|webm)$/i.test(mediaUrl) || 
                                          media.type === 'video';

                            const caption = `🎬 *ZENITSU-BOT TIKTOK DOWNLOADER* 🎬\n\n✅ *Downloaded successfully*\n\n⭐ *Powered by Zenitsu-BOT*`;

                            if (isVideo) {
                                await sock.sendMessage(chatId, {
                                    video: { url: mediaUrl },
                                    mimetype: "video/mp4",
                                    caption: caption
                                });
                            } else {
                                await sock.sendMessage(chatId, {
                                    image: { url: mediaUrl },
                                    caption: caption
                                });
                            }
                        }
                        
                        // Update status to complete
                        await sock.sendMessage(chatId, {
                            text: "✅ *Downloaded successfully!*\n\n🎬 *Video sent!*\n\n⭐ *Zenitsu-BOT Task Complete* ⭐",
                            edit: statusMsg.key
                        });
                        return;
                    }
                } catch (ttdlError) {
                    console.error('TTDL method failed:', ttdlError.message);
                }
            }

            // Update status to processing video
            await sock.sendMessage(chatId, {
                text: "⚡ *Processing video...*\n\n🎬 Preparing final output...\n⏳ Almost done...",
                edit: statusMsg.key
            });

            // Send the video if we got a URL from the APIs
            if (videoUrl) {
                try {
                    const caption = `🎬 *ZENITSU-BOT TIKTOK DOWNLOADER* 🎬\n\n` +
                                  (title ? `📝 *Title:* ${title}\n` : '') +
                                  (username ? `👤 *Author:* ${username}\n` : '') +
                                  `⚡ *Quality:* HD\n` +
                                  `🎬 *Format:* MP4\n\n` +
                                  `✅ *Downloaded successfully*\n\n` +
                                  `⭐ *Powered by Zenitsu-BOT*`;

                    await sock.sendMessage(chatId, {
                        video: { url: videoUrl },
                        mimetype: "video/mp4",
                        caption: caption
                    });

                    // Update status to complete
                    await sock.sendMessage(chatId, {
                        text: `✅ *Downloaded successfully!*\n\n` +
                              (title ? `📝 *Title:* ${title}\n` : '') +
                              (username ? `👤 *Author:* ${username}\n` : '') +
                              `⚡ *Quality:* HD\n` +
                              `🎬 *Format:* MP4\n\n` +
                              `🎬 *Video sent!*\n\n` +
                              `⭐ *Zenitsu-BOT Task Complete* ⭐`,
                        edit: statusMsg.key
                    });

                    // If we have audio URL, send it as well
                    if (audioUrl) {
                        try {
                            await sock.sendMessage(chatId, {
                                audio: { url: audioUrl },
                                mimetype: "audio/mp3",
                                caption: "🎵 *TikTok Audio*\n\n⭐ *Powered by Zenitsu-BOT*"
                            });
                        } catch (audioError) {
                            // Ignore audio errors
                        }
                    }
                    return;
                } catch (downloadError) {
                    console.error(`Failed to send video: ${downloadError.message}`);
                }
            }

            // If we reach here, no method worked
            await sock.sendMessage(chatId, {
                text: "❌ *DOWNLOAD FAILED* ❌\n\nAll download methods failed.\nPlease try again with a different link.",
                edit: statusMsg.key
            });
        } catch (error) {
            console.error('Error in TikTok download:', error);
            await sock.sendMessage(chatId, {
                text: "❌ *ERROR* ❌\n\nFailed to download the TikTok video.\nPlease try again later.",
                edit: statusMsg.key
            });
        }
    } catch (error) {
        console.error('Error in TikTok command:', error);
        await sock.sendMessage(chatId, { 
            text: "🚫 *SYSTEM ERROR* 🚫\n\nAn error occurred while processing.\nPlease try again later."
        });
    }
}

module.exports = tiktokCommand;
