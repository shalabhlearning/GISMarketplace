import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Force Webpack (more stable for your current setup with fallbacks)
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

  // Fix for pdf-parse
  serverExternalPackages: ['pdf-parse'],

  // Image configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.gravatar.com',
      },
    ],
  },
};

export default nextConfig;