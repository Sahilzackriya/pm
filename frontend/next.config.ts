import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Export static HTML during `next build` so we can serve it from the
  // Python backend in production container builds.
  output: "export",
};

export default nextConfig;
