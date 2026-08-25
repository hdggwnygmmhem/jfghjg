import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Commands Store Map
export const commands = new Map();

/**
 * Automatically loads all plugin command files from the plugins directory.
 */
export async function loadPlugins() {
  commands.clear();
  const pluginsDir = path.join(__dirname, "../plugins");

  // Agar plugins folder na ho toh create karein
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  const files = fs.readdirSync(pluginsDir).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    try {
      const filePath = path.join(pluginsDir, file);
      const fileUrl = pathToFileURL(filePath).href;
      
      // Dynamic ESM import with cache bust
      const plugin = await import(`${fileUrl}?update=${Date.now()}`);

      if (plugin.default && plugin.default.name) {
        commands.set(plugin.default.name, plugin.default);
        
        // Register command aliases (e.g. .help for .menu)
        if (plugin.default.alias && Array.isArray(plugin.default.alias)) {
          plugin.default.alias.forEach((alias) => commands.set(alias, plugin.default));
        }
      }
    } catch (err) {
      console.error(`❌ Failed to load plugin ${file}:`, err);
    }
  }

  console.log(`✅ System Plugins Loaded: ${commands.size} commands/aliases active.`);
}
