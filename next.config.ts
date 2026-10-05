import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vzhzgyisjkzqbjvwawtw.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**', // permite cualquier ruta
      },
    ],
  },
};

export default nextConfig;
