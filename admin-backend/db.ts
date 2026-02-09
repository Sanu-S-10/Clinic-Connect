import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new client for each connection
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const client = await clientPromise;
  const db = client.db('clinicconnect'); // Change database name as needed
  try {
    // Ensure TTL index for password_resets expires documents at `expiresAt`
    await db.collection('password_resets').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch (err) {
    // Log but don't fail connection if index creation fails
    console.warn('Could not create TTL index on password_resets:', err);
  }
  return { client, db };
}

export default clientPromise;
