/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  distDir: process.env.NEXT_DIST_DIR || '.next',
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
