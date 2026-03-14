import mongoose from 'mongoose';

// In local dev, load from .env.local via Next.js or dotenv.
// In Vercel production, env vars are injected automatically.
if (process.env.NODE_ENV !== 'production') {
  const { default: dotenv } = await import('dotenv');
  const { fileURLToPath } = await import('url');
  const { default: path } = await import('path');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
}

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const conn = await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};
