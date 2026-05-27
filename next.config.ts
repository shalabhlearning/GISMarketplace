import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  serverExternalPackages: ['pdf-parse'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.gravatar.com',
      },
    ],
  },

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