import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
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
  async redirects() {
    return [
      {
        source: "/index.html",
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:webspatialToken",
          has: [
            {
              type: "query",
              key: "command",
              value: "createSpatialized2DElement",
            },
          ],
          destination: "/webspatial-host",
        },
        {
          source: "/:webspatialToken",
          has: [
            {
              type: "query",
              key: "command",
              value: "createAttachment",
            },
          ],
          destination: "/webspatial-host",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
