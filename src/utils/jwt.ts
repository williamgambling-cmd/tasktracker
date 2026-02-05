import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from './env';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface DecodedToken extends JwtPayload, TokenPayload {}

export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): DecodedToken {
  return jwt.verify(token, env.JWT_SECRET) as DecodedToken;
}

export function decodeToken(token: string): DecodedToken | null {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') {
    return null;
  }
  return decoded as DecodedToken;
}
