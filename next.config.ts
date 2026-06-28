import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next.js doesn't infer it from an unrelated
  // lockfile higher up the directory tree.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
