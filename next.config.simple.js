/** @type {import('next').NextConfig} */
const nextConfig = {
  // Simplified configuration for guaranteed compatibility
  reactStrictMode: true,
  swcMinify: true,
  
  // Basic performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost'],
  },
  
  // Basic headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options', 
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
