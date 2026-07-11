import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // The project lives in a subfolder; pin the workspace root to avoid Next
  // picking up an unrelated lockfile higher up the tree.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
