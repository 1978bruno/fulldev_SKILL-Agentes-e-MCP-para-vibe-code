import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O contêiner e2e abre a web por http://web:3000.
  allowedDevOrigins: ["web"],
  // O indicador de desenvolvimento cobre a tela nas capturas da validação visual.
  devIndicators: false,
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
