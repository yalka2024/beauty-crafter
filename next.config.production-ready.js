/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Skip type checking during build (handle separately)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build (handle separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Experimental features for production
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['localhost', 'beauty-crafter.vercel.app'],
    minimumCacheTTL: 60,
  },
  
  // Headers for security and performance
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
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300'
          }
        ]
      }
    ]
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
