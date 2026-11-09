import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
