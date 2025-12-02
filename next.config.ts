import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  reactCompiler: true,
  // Add empty turbopack config to use webpack
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Exclude MongoDB/Mongoose from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        'async_hooks': false,
      };
    }
    return config;
  },
};

export default nextConfig;
