import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Standalone server bundle for the Docker image (frontend/Dockerfile sets NEXT_OUTPUT)
  // Tracing root is the monorepo root so hoisted workspace node_modules are included
  ...(process.env.NEXT_OUTPUT === 'standalone'
    ? { output: 'standalone' as const, outputFileTracingRoot: path.join(__dirname, '..') }
    : {}),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Allow common Cloudflare R2 public bucket hostnames (adjust as needed)
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'pub-*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.cloudflare-ipfs.com',
      },
    ],
  },
  async rewrites() {
    // Only use rewrites in development
    if (process.env.NODE_ENV === 'development') {
      const backendPort = process.env.BE_PORT || '3001';
      return [
        {
          source: '/api/:path*',
          destination: `http://localhost:${backendPort}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
