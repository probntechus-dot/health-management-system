/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
}

export default nextConfig
