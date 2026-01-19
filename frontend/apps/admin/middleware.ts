import { withRole } from '@luxebrain/auth/middleware';

export const middleware = withRole(['admin', 'super_admin']);

export const config = {
  matcher: ['/tenants/:path*', '/revenue/:path*', '/usage/:path*', '/support/:path*'],
};
