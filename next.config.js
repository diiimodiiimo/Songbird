/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_Y2hhcm1pbmcta2l3aS0zOS5jbGVyay5hY2NvdW50cy5kZXYk',
    CLERK_SECRET_KEY: 'sk_test_ItopDjxx3irW16Y07vAItJ681quUhnaPTTlyRjs9od',
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: '/home',
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: '/home',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: '/',
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: '/',
    // DATABASE_URL - Supabase connection string
    DATABASE_URL: 'postgresql://postgres.undbrbgtjgslmoswqaww:D1modadreamo4979@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    DIRECT_URL: 'postgresql://postgres:D1modadreamo4979@db.undbrbgtjgslmoswqaww.supabase.co:5432/postgres',
  },
  images: {
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
        hostname: 'images.clerk.dev',
      },
    ],
  },
}

module.exports = nextConfig

