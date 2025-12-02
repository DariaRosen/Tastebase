import mongoose from 'mongoose';

const getMongoUri = () => {
  const dbURL = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME || 'Tastbase';
  
  if (!dbURL) {
    throw new Error('Please define the MONGO_URL environment variable inside .env.local');
  }
  
  // Construct full MongoDB URI with database name
  const uri = `${dbURL}${dbName}?retryWrites=true&w=majority`;
  
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
