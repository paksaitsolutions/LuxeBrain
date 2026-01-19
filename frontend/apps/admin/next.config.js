/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@luxebrain/api', '@luxebrain/auth', '@luxebrain/ui', '@luxebrain/config'],
};

module.exports = nextConfig;
