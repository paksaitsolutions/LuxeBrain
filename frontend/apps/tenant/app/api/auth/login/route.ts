import { NextRequest, NextResponse } from 'next/server';
import { createToken } from '@luxebrain/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password, rememberMe } = await request.json();

    const response = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const data = await response.json();
    const token = await createToken({
      tenant_id: data.tenant_id || '',
      user_id: data.user_id,
      role: data.role,
      email: data.email,
    });

    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

    const res = NextResponse.json({ 
      success: true, 
      role: data.role,
      refresh_token: data.refresh_token 
    });
    
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed', details: String(error) }, { status: 500 });
  }
}
