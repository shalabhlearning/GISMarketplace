import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Important: Allow pdf-parse to work in Server Components / API Routes
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },

  // Turbopack config (if you're using it)
  turbopack: {
    resolveAlias: {
      net: false,
      tls: false,
      fs: false,
    },
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

  // Webpack fallback (safety net)
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