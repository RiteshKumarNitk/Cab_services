import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it Next.js walks up the tree and
  // picks the first lockfile it finds (e.g. a stray ~/package-lock.json), which widens
  // module resolution and file watching to the wrong directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
