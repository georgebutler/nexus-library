import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.igdb.com",
        pathname: "/igdb/image/upload/**",
      },
    ],
  },
  transpilePackages: ["@webspatial/core-sdk", "@webspatial/react-sdk"],
};

export default nextConfig;
