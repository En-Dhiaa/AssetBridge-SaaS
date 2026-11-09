/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: process.env.NEXT_PUBLIC_BACKEND_URL 
          ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/:path*`
          : "http://localhost:8000/api/v1/:path*"
      }
    ];
  }
};

export default nextConfig;

