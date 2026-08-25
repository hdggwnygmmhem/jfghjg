import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // Group JID
  subject: { type: String, default: '' },
  antilink: { type: Boolean, default: false },
  welcome: { type: Boolean, default: false },
  welcomeMsg: { type: String, default: 'Welcome @user to @group!' },
  goodbyeMsg: { type: String, default: 'Goodbye @user!' },
  mute: { type: Boolean, default: false }
});

export const Group = mongoose.models.Group || mongoose.model('Group', groupSchema);
