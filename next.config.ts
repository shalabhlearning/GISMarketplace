// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Keep this (silences the mixed config warning)
  turbopack: {
    resolveAlias: {
      net: false,
      tls: false,
      fs: false,
      // If more appear later (dns, crypto, etc.), add them here
    },
  },

  // Keep images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.gravatar.com',
      },
    ],
  },

  // Optional: keep webpack fallback as safety net for hybrid cases
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