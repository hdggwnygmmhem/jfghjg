import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // User JID (e.g. 923000000000@s.whatsapp.net)
  name: { type: String, default: 'User' },
  warn: { type: Number, default: 0 },
  limit: { type: Number, default: 20 },
  banned: { type: Boolean, default: false }
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);

