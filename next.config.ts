import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Old paths from earlier versions keep working (links already shared).
  async redirects() {
    return [
      { source: "/dashboard", destination: "/app", permanent: false },
      { source: "/agreements/new", destination: "/app/nuevo", permanent: false },
      { source: "/agreements/:id", destination: "/app/acuerdo/:id", permanent: false },
      { source: "/arbiter", destination: "/app/arbitro", permanent: false },
    ];
  },
};

export default nextConfig;
