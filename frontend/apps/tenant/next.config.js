/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@luxebrain/api', '@luxebrain/auth', '@luxebrain/ui', '@luxebrain/config'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
