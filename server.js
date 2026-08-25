import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { delay } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

export function initWebServer(port, getSock) {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
  });

  app.get('/pair', async (req, res) => {
    let phone = req.query.number;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number parameter required (?number=923000000000)' });
    }

    phone = phone.replace(/[^0-9]/g, '');
    const sock = getSock();

    if (!sock) {
      return res.status(500).json({ error: 'Bot engine is starting, please retry in 5 seconds.' });
    }

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

  app.listen(port, () => {
    console.log(`🌐 Web pairing server running at http://localhost:${port}`);
  });

  return app;
}

export default app;
