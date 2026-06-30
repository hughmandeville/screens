import type { NextConfig } from "next";

// Served from a GitHub Pages project sub-path (e.g. /screens). Set
// NEXT_PUBLIC_BASE_PATH at build time so the same value is inlined into the
// client bundle for runtime asset/data URLs (see src/lib/basePath.ts). Left
// empty for local dev so the app serves from the root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Emit a fully static site to `out/` so it can be hosted on GitHub Pages.
  output: "export",

  basePath: basePath || undefined,

  // GitHub Pages can't run the Image Optimization API, so serve images as-is.
  images: {
    unoptimized: true,
  },

  // Pin the workspace root so Next.js doesn't infer it from an unrelated
  // lockfile higher up the directory tree.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
