import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './jwt';

export async function authMiddleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const payload = await verifyToken(token);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', payload.tenant_id);
    requestHeaders.set('x-user-role', payload.role);
    requestHeaders.set('x-user-id', payload.user_id);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export function withRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const role = request.headers.get('x-user-role');

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.next();
  };
}
