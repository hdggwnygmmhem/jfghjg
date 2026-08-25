import { fileURLToPath } from 'url';
import fs from 'fs';

// --- MAIN BOT CONFIGURATION ---
export const config = {
  // Owner Information
  BOT_NAME: "MINI-BOT-X",
  OWNER_NAME: "Your Name",
  OWNER_NUMBER: "923000000000", // Country code ke sath (bina + ke)
  SUDO_USERS: ["923000000000"], // Sudo / Extra Admins numbers

  // Bot Settings
  PREFIX: [".", "!", "/", "#"], // Multi-prefix support
  WORK_TYPE: "public", // 'public' ya 'private'
  PAIRED_CODE: true, // Web pairing code interface ke liye

  // MongoDB Connection URL (Har cheez isi Database mein safe hogi)
  MONGODB_URI: "mongodb+srv://kamranmd6:kamranmd6@cluster0.6lcfr8v.mongodb.net/?appName=Cluster0",

  // Auto Features
  AUTO_READ_MESSAGES: false,
  AUTO_VIEW_STATUS: true,
  AUTO_LIKE_STATUS: true,
  STATUS_EMOJI: "❤️",
  ALWAYS_ONLINE: true,
  AUTO_TYPING: false,
  AUTO_RECORDING: false,

  // Limits
  MAX_WARN: 3,
  DEFAULT_LIMIT: 20,

  // Custom Messages / Watermark
  MESSAGES: {
    WAIT: "⏳ *Processing, please wait...*",
    SUCCESS: "✅ *Done successfully!*",
    FAILED: "❌ *Something went wrong!*",
    ADMIN_ONLY: "⚠️ *This command is only for Group Admins!*",
    BOT_ADMIN: "⚠️ *Make sure the bot is an Admin first!*",
    OWNER_ONLY: "👑 *This command is restricted to the Bot Owner!*",
    GROUP_ONLY: "👥 *This command can only be used in groups!*",
    PRIVATE_ONLY: "📥 *This command is only for Private Chat!*",
  },

  // Dynamic Thumbnail Links & Media Assets
  ASSETS: {
    THUMBNAIL: "https://i.imgur.com/8Qp49X0.jpeg",
    MENU_LOGO: "https://i.imgur.com/8Qp49X0.jpeg",
  }
};

// Auto Reload Setup
const __filename = fileURLToPath(import.meta.url);
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`Updated 'config.js'`);
  import(`${import.meta.url}?update=${Date.now()}`);
});

export default config;
