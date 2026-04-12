/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
}

export default nextConfig
