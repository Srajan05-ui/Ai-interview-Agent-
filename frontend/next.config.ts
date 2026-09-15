import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // We no longer need rewrites because safeFetchJson automatically prepends NEXT_PUBLIC_BACKEND_URL
};

export default nextConfig;
