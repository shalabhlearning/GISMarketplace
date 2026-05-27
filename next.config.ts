import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fixed: Use serverExternalPackages (new correct key)
  serverExternalPackages: ['pdf-parse'],

  // Disable Turbopack (recommended for stability on Vercel right now)
  experimental: {
    turbopack: false,
  },

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.gravatar.com',
      },
    ],
  },

  // Webpack fallback for client-side (net, tls, fs)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;