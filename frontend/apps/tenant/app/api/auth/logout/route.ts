import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ message: 'Logged out successfully' });
  res.cookies.delete('token');
  return res;
}
