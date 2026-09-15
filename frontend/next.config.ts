import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/interview/:path*',
        destination: `${backendUrl}/api/interview/:path*`,
      },
      {
        source: '/api/repo-analysis/:path*',
        destination: `${backendUrl}/api/repo-analysis/:path*`,
      },
      {
        source: '/api/resume/:path*',
        destination: `${backendUrl}/api/resume/:path*`,
      },
      {
        source: '/api/roadmap/:path*',
        destination: `${backendUrl}/api/roadmap/:path*`,
      },
      {
        source: '/api/github/:path*',
        destination: `${backendUrl}/api/github/:path*`,
      },
      {
        source: '/api/health',
        destination: `${backendUrl}/api/health`,
      },
    ];
  },
};

export default nextConfig;
