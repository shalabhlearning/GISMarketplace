import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

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

  serverExternalPackages: ['pdf-parse'],

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