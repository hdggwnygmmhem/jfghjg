import mongoose from 'mongoose';

// MongoDB Schema for storing Baileys Auth Session
const AuthSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  data: { type: String, required: true }
});

const AuthModel = mongoose.models.BaileysAuth || mongoose.model('BaileysAuth', AuthSchema);

export const useMongoDBAuthState = async (mongoUrl) => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUrl);
  }

  const writeData = async (data, id) => {
    try {
      const serialized = JSON.stringify(data, (key, value) => {
        if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
          return { type: 'Buffer', data: Array.from(value) };
        }
        return value;
      });
      await AuthModel.updateOne({ id }, { data: serialized }, { upsert: true });
    } catch (err) {
      console.error('Error writing auth data to MongoDB:', err);
    }
  };

  const readData = async (id) => {
    try {
      const result = await AuthModel.findOne({ id });
      if (!result) return null;
      return JSON.parse(result.data, (key, value) => {
        if (value && typeof value === 'object' && value.type === 'Buffer') {
          return Buffer.from(value.data);
        }
        return value;
      });
    } catch (err) {
      return null;
    }
  };

  const removeData = async (id) => {
    try {
      await AuthModel.deleteOne({ id });
    } catch (err) {
      console.error('Error removing auth data from MongoDB:', err);
    }
  };

  const creds = (await readData('creds')) || (await import('@whiskeysockets/baileys')).initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = (await import('@whiskeysockets/baileys')).proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => writeData(creds, 'creds')
  };
};
