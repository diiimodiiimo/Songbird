/** @type {import('next').NextConfig} */

const isCapacitorBuild = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  ...(isCapacitorBuild && {
    output: 'export',
    trailingSlash: true,
  }),
  env: {
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/home',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/home',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/',
  },
  images: {
    ...(isCapacitorBuild && { unoptimized: true }),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig

