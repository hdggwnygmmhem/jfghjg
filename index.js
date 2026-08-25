import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import { initWebServer } from './server.js';
import { useMongoDBAuthState } from './lib/mongoAuth.js';
import { loadPlugins, commands } from './lib/pluginHandler.js';

let sock;
const PORT = process.env.PORT || 3000;

// Temporary / Media directories setup
const dirs = ['./temp', './media', './database'];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function startBot() {
  console.log('🚀 Starting Mini Bot Engine...');

  // 1. Load Plugins
  await loadPlugins();

  // 2. Auth State (MongoDB vs Local)
  let state, saveCreds;
  if (config.MONGODB_URI && config.MONGODB_URI.includes('mongodb')) {
    console.log('📦 Connecting to MongoDB Auth State...');
    const mongoAuth = await useMongoDBAuthState(config.MONGODB_URI);
    state = mongoAuth.state;
    saveCreds = mongoAuth.saveCreds;
  } else {
    console.log('⚠️ MongoDB URI missing. Using local auth directory...');
    const localAuth = await useMultiFileAuthState('./session');
    state = localAuth.state;
    saveCreds = localAuth.saveCreds;
  }

  const { version } = await fetchLatestBaileysVersion();

  // 3. Socket Connection
  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !config.PAIRED_CODE,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    markOnlineOnConnect: config.ALWAYS_ONLINE
  });

  sock.ev.on('creds.update', saveCreds);

  // 4. Connection State Events
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️ Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) setTimeout(() => startBot(), 3000);
    } else if (connection === 'open') {
      console.log('✅ Mini Bot successfully connected to WhatsApp!');
    }
  });

  // 5. Plugin & Message Handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const m = messages[0];
      if (!m.message) return;

      // Auto Status View
      if (m.key.remoteJid === 'status@broadcast' && config.AUTO_VIEW_STATUS) {
        await sock.readMessages([m.key]);
        if (config.AUTO_LIKE_STATUS && config.STATUS_EMOJI) {
          await sock.sendMessage(
            'status@broadcast',
            { react: { text: config.STATUS_EMOJI, key: m.key } },
            { statusJidList: [m.key.participant] }
          );
        }
        return;
      }

      const body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        '';

      const prefix = config.PREFIX.find((p) => body.startsWith(p));
      if (!prefix) return;

      const args = body.slice(prefix.length).trim().split(/ +/);
      const cmdName = args.shift().toLowerCase();

      const cmd = commands.get(cmdName);
      if (cmd) {
        await cmd.execute(sock, m, { args, prefix, body });
      }
    } catch (err) {
      console.error('Error executing message event:', err);
    }
  });
}

// 6. Express Web Server Initialization
initWebServer(PORT, () => sock);

// Start Bot Engine
startBot();
