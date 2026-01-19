import { jwtVerify, SignJWT } from 'jose';

export interface JWTPayload {
  tenant_id: string;
  user_id: string;
  role: string;
  email: string;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
  const { payload } = await jwtVerify(token, secret);
  return payload as JWTPayload;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret');
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret);
}
