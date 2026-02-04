import bcrypt from 'bcrypt';
import { env } from './env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
