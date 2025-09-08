/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages deployment configuration
  // For Cloudflare Pages with full-stack support, use standard config
  // For static-only hosting, set STATIC_EXPORT=true
  ...(process.env.STATIC_EXPORT === 'true' && { output: 'export' }),
  
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  
  // Cloudflare Pages compatibility
  ...(process.env.CF_PAGES && {
    // Enable runtime if using Cloudflare Pages with Functions
    experimental: {
      ...nextConfig.experimental,
      runtime: 'edge',
    },
  }),
}

module.exports = nextConfig