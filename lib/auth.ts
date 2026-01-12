import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
            password: true,
          },
        })

        if (!user) {
          return null
        }

        // If user has no password (Clerk user), they can't use password auth
        if (!user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Return only minimal data to avoid cookie size issues
        // NEVER include base64 images in JWT tokens - they're too large
        const userImage = user.image && 
                         !user.image.startsWith('data:') && 
                         user.image.length < 500 // Only include short URLs
          ? user.image 
          : undefined
        
        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          // Don't include username or image if they're too large
          ...(user.username && user.username.length < 50 ? { username: user.username } : {}),
          ...(userImage ? { image: userImage } : {}),
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Only store minimal data in JWT token - keep it small!
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        // Only store image if it's a short URL (not base64)
        if (user.image && 
            typeof user.image === 'string' && 
            !user.image.startsWith('data:') && 
            user.image.length < 500) {
          token.picture = user.image
        }
      }
      // Remove any large fields that might have been added
      delete (token as any).user
      delete (token as any).profile
      return token
    },
    async session({ session, token }) {
      // Only return minimal session data
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        // Only include image if it's a short URL
        if (token.picture && 
            typeof token.picture === 'string' && 
            !token.picture.startsWith('data:') && 
            token.picture.length < 500) {
          session.user.image = token.picture
        }
      }
      return session
    },
  },
}

