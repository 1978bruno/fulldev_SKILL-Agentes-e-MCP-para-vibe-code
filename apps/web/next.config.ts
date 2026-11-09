import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O contêiner e2e abre a web por http://web:3000.
  allowedDevOrigins: ["web"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
