import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@luxebrain/auth/jwt';

export async function POST(request: NextRequest) {
  const { email, password, store_name } = await request.json();

  const response = await fetch(`${process.env.API_URL}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, store_name }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 400 });
  }

  const data = await response.json();
  const token = await createToken({
    tenant_id: data.tenant_id,
    user_id: data.user_id,
    role: data.role,
    email: data.email,
  });

  const res = NextResponse.json({ success: true });
  res.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
