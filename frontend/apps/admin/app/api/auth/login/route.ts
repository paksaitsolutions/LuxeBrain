import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@luxebrain/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const response = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const data = await response.json();
    
    if (data.role !== 'admin' && data.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const token = await createToken({
      tenant_id: data.tenant_id || '',
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
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Login failed', details: String(error) }, { status: 500 });
  }
}
