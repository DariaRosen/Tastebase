import mongoose from 'mongoose';

// Explicitly load .env.local if not already loaded (fallback for Next.js)
if (typeof window === 'undefined' && !process.env.MONGO_URL) {
  try {
    const { config } = require('dotenv');
    const path = require('path');
    config({ path: path.join(process.cwd(), '.env.local') });
  } catch (e) {
    // dotenv might not be needed if Next.js loads it, but try anyway
  }
}

const getMongoUri = () => {
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
    };

    cached.promise = mongoose.connect(getMongoUri(), opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
