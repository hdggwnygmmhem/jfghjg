import mongoose from 'mongoose';
import { User } from './userSchema.js';
import { Group } from './groupSchema.js';

// User Helpers
export const getUser = async (jid) => {
  let user = await User.findOne({ id: jid });
  if (!user) {
    user = await User.create({ id: jid });
  }
  return user;
};

// Group Helpers
export const getGroup = async (jid) => {
  let group = await Group.findOne({ id: jid });
  if (!group) {
    group = await Group.create({ id: jid });
  }
  return group;
};

export { User, Group };
