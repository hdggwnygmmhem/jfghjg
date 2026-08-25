import {
  default as makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  delay
} from '@whiskeysockets/baileys';
import pino from 'pino';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from './config.js';
import { useMongoDBAuthState } from './lib/mongoAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

let sock;

async function startBot() {
  console.log('🚀 Initializing Mini Bot Connection...');

  let state, saveCreds;

  // MongoDB Connection Check & Auth Setup
  if (config.MONGODB_URI && config.MONGODB_URI.includes('mongodb')) {
    console.log('📦 Connecting to MongoDB Database for Auth State...');
    const mongoAuth = await useMongoDBAuthState(config.MONGODB_URI);
    state = mongoAuth.state;
    saveCreds = mongoAuth.saveCreds;
  } else {
    console.log('⚠️ MongoDB URI missing! Falling back to local auth store...');
    const localAuth = await useMultiFileAuthState('./session');
    state = localAuth.state;
    saveCreds = localAuth.saveCreds;
  }

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !config.PAIRED_CODE,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: config.ALWAYS_ONLINE
  });

  // Save Auth Credentials to MongoDB whenever updated
  sock.ev.on('creds.update', saveCreds);

  // Connection Handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(
        '⚠️ Connection closed due to:',
        lastDisconnect?.error,
        ', Reconnecting:',
        shouldReconnect
      );
      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      } else {
        console.log('❌ Logged out from WhatsApp. Clear MongoDB auth collection to pair again.');
      }
    } else if (connection === 'open') {
      console.log('✅ Mini Bot successfully connected to WhatsApp!');
      
      // Send Welcome Message to Owner
      const ownerJid = `${config.OWNER_NUMBER}@s.whatsapp.net`;
      await sock.sendMessage(ownerJid, {
        text: `🤖 *${config.BOT_NAME} Connected Successfully!*\n\n> Prefix: ${config.PREFIX.join(' ')}\n> Work Type: ${config.WORK_TYPE}\n> Database: MongoDB Safe Auth`
      }).catch(() => null);
    }
  });

  // Incoming Message Handler
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      const m = messages[0];
      if (!m.message) return;

      // Auto Status View Logic
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

      // Simple Ping Test Command
      const body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        '';

      const isCommand = config.PREFIX.some((prefix) => body.startsWith(prefix));

      if (isCommand) {
        const prefix = config.PREFIX.find((p) => body.startsWith(p));
        const args = body.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        if (command === 'ping') {
          await sock.sendMessage(m.key.remoteJid, { text: '🏓 Pong! Mini Bot is active.' }, { quoted: m });
        }
      }
    } catch (err) {
      console.error('Error in messages.upsert:', err);
    }
  });
}

// Express API Route for Pairing Code Generation via Web Interface
app.get('/pair', async (req, res) => {
  let phone = req.query.number;
  if (!phone) return res.status(400).json({ error: 'Phone number parameter required (?number=923000000000)' });

  phone = phone.replace(/[^0-9]/g, '');

  if (!sock) return res.status(500).json({ error: 'Bot engine starting, please retry in 5 seconds.' });

  try {
    if (!sock.authState.creds.registered) {
      await delay(1500);
      const code = await sock.requestPairingCode(phone);
      return res.json({ code });
    } else {
      return res.json({ message: 'Bot is already registered and connected.' });
    }
  } catch (error) {
    console.error('Error requesting pairing code:', error);
    return res.status(500).json({ error: 'Failed to generate pairing code' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Web pairing server running on port http://localhost:${PORT}`);
  startBot();
});
