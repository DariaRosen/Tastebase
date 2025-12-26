import mongoose from 'mongoose';

const getMongoUri = () => {
  // Try to load .env.local if MONGO_URL is not set (fallback for Next.js)
  if (!process.env.MONGO_URL && typeof window === 'undefined') {
    try {
      const dotenv = require('dotenv');
      const path = require('path');
      const result = dotenv.config({ path: path.join(process.cwd(), '.env.local') });
      if (result.error) {
        console.warn('[MongoDB] dotenv.config error:', result.error);
      } else {
        console.log('[MongoDB] Loaded .env.local via dotenv');
      }
    } catch (e) {
      console.warn('[MongoDB] Failed to load .env.local:', e);
    }
  }
  
  const dbURL = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || 'Tastebase';
  
  if (!dbURL) {
    console.error('[MongoDB] MONGO_URL not found in process.env');
    console.error('[MongoDB] Available env keys:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB')));
    throw new Error('Please define the MONGO_URL environment variable inside .env.local');
  }
  
  // Construct full MongoDB URI with database name
  // Remove trailing slash from dbURL if present, then append dbName
  const cleanDbURL = dbURL.endsWith('/') ? dbURL.slice(0, -1) : dbURL;
  const uri = `${cleanDbURL}/${dbName}?retryWrites=true&w=majority`;
  
  return uri;
};

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      console.log('[MongoDB] Successfully connected to database');
      return mongoose;
    }).catch((error) => {
      console.error('[MongoDB] Connection error:', error);
      console.error('[MongoDB] Error name:', error?.name);
      console.error('[MongoDB] Error message:', error?.message);
      cached.promise = null;
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    const error = e instanceof Error ? e : new Error(String(e));
    console.error('[MongoDB] Failed to establish connection:', error.message);
    throw error;
  }

  return cached.conn;
}

export default connectDB;
