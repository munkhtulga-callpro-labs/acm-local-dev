/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript errors will now fail the build - ensuring type safety
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['@prisma/client'],
}

module.exports = nextConfig