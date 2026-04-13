import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Prevents loading all route modules into memory at startup.
    // On Node.js v22+ + Turbopack this triggers a native allocator crash
    // ("memory allocation of N bytes failed") — disabling it fixes it.
    preloadEntriesOnStart: false,
    // Reduce webpack memory footprint (active when running --no-turbopack)
    webpackMemoryOptimizations: true,
  },

  async headers() {
    return [
      {
        source: '/api/tests/:id',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;
