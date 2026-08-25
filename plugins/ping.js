export default {
  name: "ping",
  alias: ["speed", "p"],
  category: "general",
  description: "Check bot speed and latency",
  async execute(sock, m, { args, prefix }) {
    const start = Date.now();
    const msg = await sock.sendMessage(
      m.key.remoteJid,
      { text: "🏓 *Pinging...*" },
      { quoted: m }
    );

    const end = Date.now();
    const latency = end - start;

    await sock.sendMessage(m.key.remoteJid, {
      text: `🚀 *Pong!*\n⏱️ *Latency:* \`${latency}ms\``,
      edit: msg.key,
    });
  },
};
