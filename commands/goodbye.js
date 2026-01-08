const { isGoodByeOn } = require('../lib/index');

async function goodbyeCommand(sock, chatId, message) {
    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: '⚡ *ZENITSU-BOT*\n\nThis command can only be used in groups.' });
        return;
    }

    // Check if user is admin
    const participants = await sock.groupMetadata(chatId);
    const sender = message.key.participant || message.key.remoteJid;
    const isAdmin = participants.participants.find(p => p.id === sender)?.admin;

    if (!isAdmin) {
        await sock.sendMessage(chatId, { text: '⚡ *ZENITSU-BOT*\n\n❌ Only admins can use this command.' });
        return;
    }

    // Toggle goodbye message
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const args = text.split(' ');
    
    if (args[1] === 'on') {
        // Enable goodbye
        const statusMsg = await sock.sendMessage(chatId, {
            text: "⚡ *ZENITSU-BOT*\n\n🔧 *Setting up goodbye messages...*"
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: "⚡ *ZENITSU-BOT*\n\n✅ *Goodbye messages enabled!*\n\nWhen someone leaves the group, they will receive an automatic goodbye message.\n\n⭐ Powered by Zenitsu-BOT",
            edit: statusMsg.key
        });

        // Save to database or config
        // await saveGoodbyeStatus(chatId, true);

    } else if (args[1] === 'off') {
        // Disable goodbye
        const statusMsg = await sock.sendMessage(chatId, {
            text: "⚡ *ZENITSU-BOT*\n\n🔧 *Removing goodbye messages...*"
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: "⚡ *ZENITSU-BOT*\n\n❌ *Goodbye messages disabled!*\n\nGoodbye messages will no longer be sent when someone leaves.\n\n⭐ Powered by Zenitsu-BOT",
            edit: statusMsg.key
        });

        // Save to database or config
        // await saveGoodbyeStatus(chatId, false);

    } else {
        // Show current status
        const isEnabled = await isGoodByeOn(chatId);
        const statusMsg = await sock.sendMessage(chatId, {
            text: "⚡ *ZENITSU-BOT*\n\n🔍 *Checking goodbye status...*"
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: `⚡ *ZENITSU-BOT*\n\n📊 *Goodbye System*\n\nStatus: ${isEnabled ? '✅ ENABLED' : '❌ DISABLED'}\n\nUsage:\n• .goodbye on - Enable\n• .goodbye off - Disable\n\n⭐ Powered by Zenitsu-BOT`,
            edit: statusMsg.key
        });
    }
}

async function handleLeaveEvent(sock, id, participants) {
    try {
        // Check if goodbye is enabled for this group
        const isGoodbyeEnabled = await isGoodByeOn(id);
        if (!isGoodbyeEnabled) return;

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;

        // Send goodbye message for each leaving participant
        for (const participant of participants) {
            try {
                const user = participant.split('@')[0];
                
                // Get user's display name
                let displayName = user;
                try {
                    const contact = await sock.getBusinessProfile(participant);
                    if (contact && contact.name) {
                        displayName = contact.name;
                    } else {
                        const groupParticipants = groupMetadata.participants;
                        const userParticipant = groupParticipants.find(p => p.id === participant);
                        if (userParticipant && userParticipant.name) {
                            displayName = userParticipant.name;
                        }
                    }
                } catch (nameError) {
                    console.log('[GOODBYE] Could not fetch display name');
                }
                
                // Automatic goodbye message
                const goodbyeMessages = [
                    `🚪 *@${displayName}* left the group.\nWe will miss you! 👋`,
                    `👋 Goodbye *@${displayName}*\nThanks for being part of *${groupName}*`,
                    `⚠️ *@${displayName}* has left *${groupName}*\nHope to see you again!`,
                    `🏃 *@${displayName}* ran away!\nTake care! 👋`,
                    `👥 Member count: ${groupMetadata.participants.length}\n👋 Farewell *@${displayName}*`
                ];
                
                // Random message
                const randomMessage = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)];
                
                // Send goodbye message
                await sock.sendMessage(id, {
                    text: `⚡ *ZENITSU-BOT GOODBYE*\n\n${randomMessage}\n\n⭐ Powered by Benzo-MD`,
                    mentions: [participant]
                });
                
            } catch (error) {
                console.error('[GOODBYE] Error:', error);
                // Simple fallback
                const user = participant.split('@')[0];
                await sock.sendMessage(id, {
                    text: `⚡ *ZENITSU-BOT*\n\n👋 Goodbye *@${user}*\n\n⭐ Powered by Zenitsu-BOT`,
                    mentions: [participant]
                });
            }
        }
    } catch (error) {
        console.error('[GOODBYE SYSTEM] Error:', error);
    }
}

module.exports = { goodbyeCommand, handleLeaveEvent };
