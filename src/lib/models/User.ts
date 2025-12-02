import mongoose, { Schema, model, models } from 'mongoose';

export interface IUser {
  _id: string;
  email: string;
  full_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  password?: string; // Hashed password
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      trim: true,
      default: null,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    avatar_url: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: null,
    },
    password: {
      type: String,
      required: false, // Will be required for signup, optional for OAuth
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 });

export const User = models.User || model<IUser>('User', UserSchema);

