import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.rawg.io",
        pathname: "/media/**",
      },
    ],
  },
  transpilePackages: ["@webspatial/core-sdk", "@webspatial/react-sdk"],
};

export default nextConfig;
