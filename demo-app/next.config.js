/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/sso/callback',
        destination: '/api/sso/callback',
      },
    ]
  },
}

module.exports = nextConfig
