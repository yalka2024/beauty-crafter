# CDN Integration Guide

## Steps
1. Choose a CDN provider (Cloudflare, AWS CloudFront, Akamai, etc.)
2. Point your domain's static/media asset URLs to the CDN
3. Update `next.config.js` or your static server config to use CDN URLs
4. Set appropriate cache headers for static assets
5. Test asset delivery and cache invalidation

## Example (Next.js)
- In `next.config.js`:

module.exports = {
  images: {
    domains: ['cdn.yourdomain.com'],
  },
  assetPrefix: 'https://cdn.yourdomain.com',
};

_Last updated: [DATE]_
