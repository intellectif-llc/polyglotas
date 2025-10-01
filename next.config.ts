import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          process.env.CLOUDFRONT_URL?.replace("https://", "") ||
          "d1lb764d5mqf1c.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
