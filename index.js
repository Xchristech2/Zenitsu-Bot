/**
 * Zenitsu Bot - A WhatsApp Bot
 * Copyright (c) 2024 Professor
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the MIT License.
 *
 * Credits:
 * - Baileys Library by @adiwajshing
 * - Pair Code implementation inspired by TechGod143 & DGXEON
 */

require('dotenv').config();
require('./settings');

const { Boom } = require('@hapi/boom');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const path = require('path');
const axios = require('axios');

const {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus
} = require('./main');

const { handleAntibotDetection } = require('./commands/antibot');

const PhoneNumber = require('awesome-phonenumber');

const {
    imageToWebp,
    videoToWebp,
    writeExifImg,
    writeExifVid
} = require('./lib/exif');

const {
    smsg,
    isUrl,
    generateMessageTag,
    getBuffer,
    getSizeMedia,
    fetch,
    await: wait,
    sleep,
    reSize
} = require('./lib/myfunc');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    jidDecode,
    proto,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    delay
} = require("@whiskeysockets/baileys");

const NodeCache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const { parsePhoneNumber } = require("libphonenumber-js");
const { PHONENUMBER_MCC } = require('@whiskeysockets/baileys/lib/Utils/generics');

const {
    rmSync,
    existsSync
} = require('fs');

const {
    join
} = require('path');

// ============================================================
// LIGHTWEIGHT STORE
// ============================================================

const store = require('./lib/lightweight_store');

store.readFromFile();

const settings = require('./settings');

setInterval(() => {
    try {
        store.writeToFile();
    } catch (e) {}
}, settings.storeWriteInterval || 10000);

// ============================================================
// MEMORY OPTIMIZATION
// ============================================================

setInterval(() => {
    try {
        if (global.gc) {
            global.gc();
            console.log('🧹 Garbage collection completed');
        }
    } catch (e) {}
}, 60_000);

setInterval(() => {
    try {
        const used = process.memoryUsage().rss / 1024 / 1024;

        if (used > 400) {
            console.log('⚠️ RAM too high (>400MB), restarting bot...');
            process.exit(1);
        }
    } catch (e) {}
}, 30_000);

// ============================================================
// BOT CONFIG
// ============================================================

let phoneNumber = "911234567890";

let owner = {};

try {
    owner = JSON.parse(
        fs.readFileSync('./data/owner.json')
    );
} catch (e) {
    owner = settings.ownerNumber || '';
}

global.botname = "ZENITSU BOT";
global.themeemoji = "•";

// ============================================================
// SESSION CONFIG
// ============================================================
//
// SESSION_ID comes from settings.js:
//
// global.sessionid = process.env.SESSION_ID;
//
// Your session format:
//
// GAAJU-MD:xxxxxxxxxxxxxxxx
//
// ============================================================

const sessionId = global.sessionid || process.env.SESSION_ID || '';

const hasSessionId =
    typeof sessionId === 'string' &&
    sessionId.trim().length > 0;

// Only use pairing code when there is no SESSION_ID.
// You can still force pairing with --pairing-code.
const forcePairingCode =
    process.argv.includes("--pairing-code");

const pairingCode =
    !hasSessionId || forcePairingCode;

const useMobile =
    process.argv.includes("--mobile");

// ============================================================
// READLINE
// ============================================================

const rl = process.stdin.isTTY
    ? readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    : null;

const question = (text) => {
    if (rl) {
        return new Promise((resolve) => {
            rl.question(text, resolve);
        });
    }

    return Promise.resolve(
        settings.ownerNumber || phoneNumber
    );
};

// ============================================================
// RESTORE GAAJU-MD SESSION
// ============================================================

function restoreSessionFromEnv() {
    try {
        const sessionDir = './session';
        const credsPath = path.join(
            sessionDir,
            'creds.json'
        );

        // If credentials already exist, do not overwrite them.
        if (fs.existsSync(credsPath)) {
            console.log('✅ Existing session found.');
            return true;
        }

        if (!hasSessionId) {
            console.log('ℹ️ No SESSION_ID found in .env.');
            return false;
        }

        let sessionData;

        let sessionString =
            sessionId.trim();

        console.log('🔄 Restoring SESSION_ID...');

        // ====================================================
        // GAAJU-MD SESSION FORMAT
        // ====================================================

        if (
            sessionString.startsWith('GAAJU-MD:')
        ) {
            const base64Part =
                sessionString
                    .substring('GAAJU-MD:'.length)
                    .trim()
                    .replace(/^~+/, '');

            if (!base64Part) {
                throw new Error(
                    'GAAJU-MD session contains no data.'
                );
            }

            const decoded =
                Buffer
                    .from(base64Part, 'base64')
                    .toString('utf-8');

            sessionData =
                JSON.parse(decoded);

        } else {

            // =================================================
            // JSON SESSION
            // =================================================

            try {
                sessionData =
                    JSON.parse(sessionString);

            } catch (jsonError) {

                // =============================================
                // RAW BASE64 SESSION
                // =============================================

                const decoded =
                    Buffer
                        .from(sessionString, 'base64')
                        .toString('utf-8');

                sessionData =
                    JSON.parse(decoded);
            }
        }

        if (
            !sessionData ||
            typeof sessionData !== 'object'
        ) {
            throw new Error(
                'Decoded SESSION_ID is invalid.'
            );
        }

        fs.mkdirSync(
            sessionDir,
            {
                recursive: true
            }
        );

        fs.writeFileSync(
            credsPath,
            JSON.stringify(
                sessionData,
                null,
                2
            )
        );

        console.log(
            '✅ GAAJU-MD SESSION_ID restored successfully.'
        );

        return true;

    } catch (error) {

        console.error(
            '❌ Failed to restore SESSION_ID:',
            error.message
        );

        return false;
    }
}

// ============================================================
// START BOT
// ============================================================

async function startXeonBotInc() {

    try {

        // ====================================================
        // RESTORE SESSION BEFORE BAILEYS LOADS AUTH STATE
        // ====================================================

        restoreSessionFromEnv();

        const {
            version,
            isLatest
        } = await fetchLatestBaileysVersion();

        // ====================================================
        // LOAD AUTH STATE
        // ====================================================

        const {
            state,
            saveCreds
        } = await useMultiFileAuthState('./session');

        const msgRetryCounterCache =
            new NodeCache();

        // ====================================================
        // CREATE SOCKET
        // ====================================================

        const XeonBotInc =
            makeWASocket({

                version,

                logger:
                    pino({
                        level: 'silent'
                    }),

                printQRInTerminal:
                    !pairingCode,

                browser: [
                    "Ubuntu",
                    "Chrome",
                    "20.0.04"
                ],

                auth: {
                    creds: state.creds,

                    keys:
                        makeCacheableSignalKeyStore(
                            state.keys,
                            pino({
                                level: "fatal"
                            }).child({
                                level: "fatal"
                            })
                        )
                },

                markOnlineOnConnect:
                    true,

                generateHighQualityLinkPreview:
                    true,

                syncFullHistory:
                    false,

                getMessage:
                    async (key) => {

                        const jid =
                            jidNormalizedUser(
                                key.remoteJid
                            );

                        const msg =
                            await store.loadMessage(
                                jid,
                                key.id
                            );

                        return msg?.message || "";
                    },

                msgRetryCounterCache,

                defaultQueryTimeoutMs:
                    60000,

                connectTimeoutMs:
                    60000,

                keepAliveIntervalMs:
                    10000
            });

        // ====================================================
        // SAVE CREDENTIAL UPDATES
        // ====================================================

        XeonBotInc.ev.on(
            'creds.update',
            saveCreds
        );

        store.bind(
            XeonBotInc.ev
        );

        // ====================================================
        // MESSAGE HANDLER
        // ====================================================

        XeonBotInc.ev.on(
            'messages.upsert',
            async chatUpdate => {

                try {

                    const mek =
                        chatUpdate.messages[0];

                    if (!mek || !mek.message)
                        return;

                    mek.message =
                        (
                            Object.keys(
                                mek.message
                            )[0] === 'ephemeralMessage'
                        )
                            ? mek.message
                                .ephemeralMessage
                                .message
                            : mek.message;

                    // ========================================
                    // STATUS
                    // ========================================

                    if (
                        mek.key &&
                        mek.key.remoteJid ===
                        'status@broadcast'
                    ) {
                        try {
                            await handleStatus(
                                XeonBotInc,
                                chatUpdate
                            );
                        } catch (e) {}

                        return;
                    }

                    // ========================================
                    // PRIVATE MODE
                    // ========================================

                    if (
                        !XeonBotInc.public &&
                        !mek.key.fromMe &&
                        chatUpdate.type === 'notify'
                    ) {

                        const isGroup =
                            mek.key?.remoteJid
                                ?.endsWith('@g.us');

                        if (!isGroup)
                            return;
                    }

                    // ========================================
                    // ANTIBOT
                    // ========================================

                    if (
                        mek.key?.remoteJid
                            ?.endsWith('@g.us') &&
                        !mek.key.fromMe
                    ) {

                        try {

                            await handleAntibotDetection(
                                XeonBotInc,
                                mek
                            );

                        } catch (abErr) {

                            console.error(
                                '[antibot] upsert hook:',
                                abErr?.message ||
                                abErr
                            );
                        }
                    }

                    // ========================================
                    // IGNORE BAE5 BOT MESSAGES
                    // ========================================

                    if (
                        mek.key?.id &&
                        mek.key.id.startsWith('BAE5') &&
                        mek.key.id.length === 16
                    ) {
                        return;
                    }

                    // ========================================
                    // CLEAR RETRY CACHE
                    // ========================================

                    if (
                        XeonBotInc?.msgRetryCounterCache
                    ) {
                        XeonBotInc
                            .msgRetryCounterCache
                            .clear();
                    }

                    // ========================================
                    // MAIN MESSAGE HANDLER
                    // ========================================

                    try {

                        await handleMessages(
                            XeonBotInc,
                            chatUpdate,
                            true
                        );

                    } catch (err) {

                        console.error(
                            "Error in handleMessages:",
                            err
                        );

                        if (
                            mek.key &&
                            mek.key.remoteJid
                        ) {

                            await XeonBotInc
                                .sendMessage(
                                    mek.key.remoteJid,
                                    {
                                        text:
                                            '❌ An error occurred while processing your message.'
                                    }
                                )
                                .catch(() => {});
                        }
                    }

                } catch (err) {

                    console.error(
                        "Error in messages.upsert:",
                        err
                    );
                }
            }
        );

        // ====================================================
        // DECODE JID
        // ====================================================

        XeonBotInc.decodeJid =
            (jid) => {

                if (!jid)
                    return jid;

                if (
                    /:\d+@/gi.test(jid)
                ) {

                    const decode =
                        jidDecode(jid) || {};

                    return (
                        decode.user &&
                        decode.server &&
                        decode.user +
                        '@' +
                        decode.server
                    ) || jid;

                } else {

                    return jid;
                }
            };

        // ====================================================
        // CONTACTS
        // ====================================================

        XeonBotInc.ev.on(
            'contacts.update',
            update => {

                for (
                    const contact
                    of update
                ) {

                    const id =
                        XeonBotInc
                            .decodeJid(
                                contact.id
                            );

                    if (
                        store &&
                        store.contacts
                    ) {

                        store.contacts[id] = {
                            id,
                            name: contact.notify
                        };
                    }
                }
            }
        );

        // ====================================================
        // GET NAME
        // ====================================================

        XeonBotInc.getName =
            (
                jid,
                withoutContact = false
            ) => {

                const id =
                    XeonBotInc
                        .decodeJid(jid);

                withoutContact =
                    XeonBotInc.withoutContact ||
                    withoutContact;

                let v;

                if (
                    id.endsWith("@g.us")
                ) {

                    return new Promise(
                        async (resolve) => {

                            v =
                                store.contacts[id] ||
                                {};

                            if (
                                !(
                                    v.name ||
                                    v.subject
                                )
                            ) {

                                v =
                                    await XeonBotInc
                                        .groupMetadata(
                                            id
                                        )
                                        .catch(
                                            () => ({})
                                        );
                            }

                            resolve(
                                v.name ||
                                v.subject ||
                                PhoneNumber(
                                    '+' +
                                    id.replace(
                                        '@s.whatsapp.net',
                                        ''
                                    )
                                ).getNumber(
                                    'international'
                                )
                            );
                        }
                    );
                }

                v =
                    id ===
                    '0@s.whatsapp.net'

                        ? {
                            id,
                            name: 'WhatsApp'
                        }

                        : (
                            XeonBotInc.user &&
                            id ===
                            XeonBotInc.decodeJid(
                                XeonBotInc.user.id
                            )
                        )

                            ? XeonBotInc.user

                            : (
                                store.contacts[id] ||
                                {}
                            );

                return (
                    withoutContact
                        ? ''
                        : v.name
                ) ||
                v.subject ||
                v.verifiedName ||
                PhoneNumber(
                    '+' +
                    jid.replace(
                        '@s.whatsapp.net',
                        ''
                    )
                ).getNumber(
                    'international'
                );
            };

        // ====================================================
        // PUBLIC MODE
        // ====================================================

        XeonBotInc.public =
            true;

        // ====================================================
        // SERIALIZE MESSAGE
        // ====================================================

        XeonBotInc.serializeM =
            (m) =>
                smsg(
                    XeonBotInc,
                    m,
                    store
                );

        // ====================================================
        // PAIRING CODE
        // ====================================================
        //
        // Only request a new pairing code when there is
        // no SESSION_ID or when --pairing-code is supplied.
        //
        // ====================================================

        if (
            pairingCode &&
            !state.creds.registered
        ) {

            if (useMobile) {

                throw new Error(
                    'Cannot use pairing code with mobile api'
                );
            }

            let pairNumber;

            if (
                global.phoneNumber
            ) {

                pairNumber =
                    global.phoneNumber;

            } else {

                pairNumber =
                    await question(
                        chalk.bgBlack(
                            chalk.greenBright(
                                `Please type your WhatsApp number 😍\nFormat: 2348069675806 (without + or spaces) : `
                            )
                        )
                    );
            }

            pairNumber =
                String(pairNumber)
                    .replace(
                        /[^0-9]/g,
                        ''
                    );

            const pn =
                require(
                    'awesome-phonenumber'
                );

            if (
                !pn(
                    '+' +
                    pairNumber
                ).isValid()
            ) {

                console.log(
                    chalk.red(
                        'Invalid phone number. Please enter your full international number without + or spaces.'
                    )
                );

                process.exit(1);
            }

            setTimeout(
                async () => {

                    try {

                        let code =
                            await XeonBotInc
                                .requestPairingCode(
                                    pairNumber
                                );

                        code =
                            code
                                ?.match(
                                    /.{1,4}/g
                                )
                                ?.join("-") ||
                            code;

                        console.log(
                            chalk.black(
                                chalk.bgGreen(
                                    `Your Pairing Code : `
                                )
                            ),
                            chalk.black(
                                chalk.white(
                                    code
                                )
                            )
                        );

                        console.log(
                            chalk.yellow(
                                `\nPlease enter this code in your WhatsApp app:\n1. Open WhatsApp\n2. Go to Settings > Linked Devices\n3. Tap "Link a Device"\n4. Enter the code shown above`
                            )
                        );

                    } catch (error) {

                        console.error(
                            'Error requesting pairing code:',
                            error
                        );

                        console.log(
                            chalk.red(
                                'Failed to get pairing code.'
                            )
                        );
                    }

                },
                3000
            );
        }

        // ====================================================
        // CONNECTION UPDATE
        // ====================================================

        XeonBotInc.ev.on(
            'connection.update',
            async (s) => {

                const {
                    connection,
                    lastDisconnect,
                    qr
                } = s;

                if (qr) {

                    console.log(
                        chalk.yellow(
                            '📱 QR Code generated. Please scan with WhatsApp.'
                        )
                    );
                }

                if (
                    connection === 'connecting'
                ) {

                    console.log(
                        chalk.yellow(
                            '🔄 Connecting to WhatsApp...'
                        )
                    );
                }

                // ============================================
                // CONNECTED
                // ============================================

                if (
                    connection === 'open'
                ) {

                    console.log(
                        chalk.magenta(
                            ` `
                        )
                    );

                    console.log(
                        chalk.yellow(
                            `🌿Connected to => ` +
                            JSON.stringify(
                                XeonBotInc.user,
                                null,
                                2
                            )
                        )
                    );

                    // ========================================
                    // CONNECTION MESSAGE
                    // ========================================

                    try {

                        const botNumber =
                            XeonBotInc.user.id
                                .split(':')[0] +
                            '@s.whatsapp.net';

                        await XeonBotInc
                            .sendMessage(
                                botNumber,
                                {
                                    text:
                                        `🤖 Bot Connected Successfully!\n\n⏰ Time: ${new Date().toLocaleString()}\n✅ Status: Online and Ready!\n\n✅ Make sure to join below channel`,

                                    contextInfo: {
                                        forwardingScore: 1,
                                        isForwarded: true,

                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid:
                                                '120363406588763460@newsletter',

                                            newsletterName:
                                                'Zenitsu Bot',

                                            serverMessageId:
                                                -1
                                        }
                                    }
                                }
                            );

                    } catch (error) {

                        console.error(
                            'Error sending connection message:',
                            error.message
                        );
                    }

                    await delay(
                        1999
                    );

                    console.log(
                        chalk.yellow(
                            `\n\n                  ${chalk.bold.blue(`[ ${global.botname || 'ZENITSU BOT'} ]`)}\n\n`
                        )
                    );

                    console.log(
                        chalk.cyan(
                            `< ================================================== >`
                        )
                    );

                    console.log(
                        chalk.magenta(
                            `\n${global.themeemoji || '•'} YT CHANNEL: Xchristech`
                        )
                    );

                    console.log(
                        chalk.magenta(
                            `${global.themeemoji || '•'} GITHUB: Xchristech2`
                        )
                    );

                    console.log(
                        chalk.magenta(
                            `${global.themeemoji || '•'} WA NUMBER: ${owner}`
                        )
                    );

                    console.log(
                        chalk.magenta(
                            `${global.themeemoji || '•'} CREDIT: Chris Gaaju`
                        )
                    );

                    console.log(
                        chalk.green(
                            `${global.themeemoji || '•'} 🤖 Bot Connected Successfully! ✅`
                        )
                    );

                    console.log(
                        chalk.blue(
                            `Bot Version: ${settings.version}`
                        )
                    );
                }

                // ============================================
                // CONNECTION CLOSED
                // ============================================

                if (
                    connection === 'close'
                ) {

                    const statusCode =
                        lastDisconnect
                            ?.error
                            ?.output
                            ?.statusCode;

                    const errMsg =
                        String(
                            lastDisconnect
                                ?.error
                                ?.message ||
                            lastDisconnect
                                ?.error ||
                            ''
                        );

                    const isLoggedOut =
                        statusCode ===
                        DisconnectReason.loggedOut ||
                        statusCode === 401;

                    const isConflict =
                        statusCode ===
                        DisconnectReason.connectionReplaced ||
                        statusCode === 440 ||
                        /conflict|replaced/i
                            .test(errMsg);

                    const shouldReconnect =
                        !isLoggedOut &&
                        !isConflict;

                    console.log(
                        chalk.red(
                            `Connection closed due to ${lastDisconnect?.error}, reconnecting ${shouldReconnect}`
                        )
                    );

                    // ========================================
                    // SESSION CONFLICT
                    // ========================================

                    if (
                        isConflict
                    ) {

                        console.log(
                            chalk.yellow(
                                '⚠️ Session conflict: another WhatsApp instance connected.'
                            )
                        );

                        console.log(
                            chalk.yellow(
                                'Stop the other bot/device using this session before reconnecting.'
                            )
                        );

                        return;
                    }

                    // ========================================
                    // LOGGED OUT
                    // ========================================

                    if (
                        isLoggedOut
                    ) {

                        try {

                            rmSync(
                                './session',
                                {
                                    recursive: true,
                                    force: true
                                }
                            );

                            console.log(
                                chalk.yellow(
                                    'Session folder deleted. Please re-authenticate.'
                                )
                            );

                        } catch (error) {

                            console.error(
                                'Error deleting session:',
                                error
                            );
                        }

                        console.log(
                            chalk.red(
                                'Session logged out. Please re-authenticate.'
                            )
                        );

                        return;
                    }

                    // ========================================
                    // RECONNECT
                    // ========================================

                    if (
                        shouldReconnect
                    ) {

                        console.log(
                            chalk.yellow(
                                'Reconnecting...'
                            )
                        );

                        await delay(
                            5000
                        );

                        startXeonBotInc();
                    }
                }
            }
        );

        // ====================================================
        // ANTICALL
        // ====================================================

        const antiCallNotified =
            new Set();

        XeonBotInc.ev.on(
            'call',
            async (calls) => {

                try {

                    const {
                        readState:
                            readAnticallState
                    } =
                        require(
                            './commands/anticall'
                        );

                    const state =
                        readAnticallState();

                    if (
                        !state.enabled
                    ) {
                        return;
                    }

                    for (
                        const call
                        of calls
                    ) {

                        const callerJid =
                            call.from ||
                            call.peerJid ||
                            call.chatId;

                        if (!callerJid)
                            continue;

                        try {

                            try {

                                if (
                                    typeof XeonBotInc
                                        .rejectCall ===
                                    'function' &&
                                    call.id
                                ) {

                                    await XeonBotInc
                                        .rejectCall(
                                            call.id,
                                            callerJid
                                        );

                                } else if (
                                    typeof XeonBotInc
                                        .sendCallOfferAck ===
                                    'function' &&
                                    call.id
                                ) {

                                    await XeonBotInc
                                        .sendCallOfferAck(
                                            call.id,
                                            callerJid,
                                            'reject'
                                        );
                                }

                            } catch {}

                            if (
                                !antiCallNotified
                                    .has(callerJid)
                            ) {

                                antiCallNotified
                                    .add(callerJid);

                                setTimeout(
                                    () => {
                                        antiCallNotified
                                            .delete(
                                                callerJid
                                            );
                                    },
                                    60000
                                );

                                await XeonBotInc
                                    .sendMessage(
                                        callerJid,
                                        {
                                            text:
                                                '📵 Anticall is enabled. Your call was rejected and you will be blocked.'
                                        }
                                    );
                            }

                        } catch {}

                        setTimeout(
                            async () => {

                                try {

                                    await XeonBotInc
                                        .updateBlockStatus(
                                            callerJid,
                                            'block'
                                        );

                                } catch {}
                            },
                            800
                        );
                    }

                } catch (e) {}
            }
        );

        // ====================================================
        // GROUP PARTICIPANTS
        // ====================================================

        XeonBotInc.ev.on(
            'group-participants.update',
            async (update) => {

                try {

                    await handleGroupParticipantUpdate(
                        XeonBotInc,
                        update
                    );

                } catch (e) {}
            }
        );

        // ====================================================
        // STATUS
        // ====================================================

        XeonBotInc.ev.on(
            'messages.upsert',
            async (m) => {

                try {

                    if (
                        m.messages?.[0]?.key &&
                        m.messages[0]
                            .key
                            .remoteJid ===
                        'status@broadcast'
                    ) {

                        await handleStatus(
                            XeonBotInc,
                            m
                        );
                    }

                } catch (e) {}
            }
        );

        XeonBotInc.ev.on(
            'status.update',
            async (status) => {

                try {

                    await handleStatus(
                        XeonBotInc,
                        status
                    );

                } catch (e) {}
            }
        );

        XeonBotInc.ev.on(
            'messages.reaction',
            async (status) => {

                try {

                    await handleStatus(
                        XeonBotInc,
                        status
                    );

                } catch (e) {}
            }
        );

        return XeonBotInc;

    } catch (error) {

        console.error(
            'Error in startXeonBotInc:',
            error
        );

        await delay(
            5000
        );

        startXeonBotInc();
    }
}

// ============================================================
// START BOT
// ============================================================

startXeonBotInc()
    .catch(
        error => {

            console.error(
                'Fatal error:',
                error
            );

            process.exit(1);
        }
    );

// ============================================================
// PROCESS ERRORS
// ============================================================

process.on(
    'uncaughtException',
    (err) => {

        console.error(
            'Uncaught Exception:',
            err
        );
    }
);

process.on(
    'unhandledRejection',
    (err) => {

        console.error(
            'Unhandled Rejection:',
            err
        );
    }
);

// ============================================================
// AUTO RELOAD
// ============================================================

let file =
    require.resolve(__filename);

fs.watchFile(
    file,
    () => {

        fs.unwatchFile(file);

        console.log(
            chalk.redBright(
                `Update ${__filename}`
            )
        );

        delete require.cache[file];

        require(file);
    }
);
