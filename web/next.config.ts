import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  webpack: (config, { isServer }) => {
    // Fix for drizzle-orm module resolution issue with Better Auth
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'drizzle-orm': 'commonjs drizzle-orm',
      });
    }
    return config;
  },
};

export default nextConfig;
