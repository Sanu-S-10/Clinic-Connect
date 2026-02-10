import crypto from 'crypto';
import { connectToDatabase } from '../db.js';

const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || '10');
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || '5');
const OTP_SECRET = process.env.OTP_SECRET || 'otp-secret';

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

export function hashOtp(otp: string) {
  return crypto.createHmac('sha256', OTP_SECRET).update(otp).digest('hex');
}

export async function storeOtp(email: string, hashedOtp: string, userId?: string) {
  const { db } = await connectToDatabase();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Upsert a reset record for this email
  await db.collection('password_resets').updateOne(
    { email },
    {
      $set: { email, hashedOtp, expiresAt, updatedAt: new Date(), userId: userId || '' },
      $setOnInsert: { createdAt: new Date(), attempts: 0 }
    },
    { upsert: true }
  );
}

export async function getResetRecord(email: string) {
  const { db } = await connectToDatabase();
  const rec = await db.collection('password_resets').findOne({ email });
  return rec;
}

export async function markVerified(email: string) {
  const { db } = await connectToDatabase();
  const res = await db.collection('password_resets').findOneAndUpdate(
    { email },
    { $set: { verified: true, verifiedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return res.value;
}

export async function incrementAttempts(email: string) {
  const { db } = await connectToDatabase();
  const res = await db.collection('password_resets').findOneAndUpdate(
    { email },
    { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  return res.value;
}

export async function deleteReset(email: string) {
  const { db } = await connectToDatabase();
  await db.collection('password_resets').deleteMany({ email });
}

export { OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS };
