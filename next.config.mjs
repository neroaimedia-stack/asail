/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "qkmmvcujdjgllgaijmhe.supabase.co",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
