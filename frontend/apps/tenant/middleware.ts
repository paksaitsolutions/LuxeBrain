import { authMiddleware } from '@luxebrain/auth/middleware';

export { authMiddleware as middleware };

export const config = {
  matcher: ['/overview/:path*', '/recommendations/:path*', '/automation/:path*', '/analytics/:path*', '/settings/:path*', '/billing/:path*'],
};
