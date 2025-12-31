import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        favoriteArtists: true,
        favoriteSongs: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse JSON fields for response
    const responseUser = {
      ...user,
      favoriteArtists: user.favoriteArtists ? JSON.parse(user.favoriteArtists) : [],
      favoriteSongs: user.favoriteSongs ? JSON.parse(user.favoriteSongs) : [],
    }

    return NextResponse.json({ user: responseUser })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  username: z
    .string()
    .max(50)
    .transform((val) => (val.trim() === '' ? null : val.trim()))
    .optional()
    .nullable(),
  image: z
    .string()
    .transform((val) => (val.trim() === '' ? null : val.trim()))
    .refine((val) => val === null || z.string().url().safeParse(val).success || val.startsWith('data:image'), {
      message: 'Must be a valid URL, base64 data URI, or empty',
    })
    .optional()
    .nullable(),
  bio: z
    .string()
    .max(160)
    .transform((val) => (val.trim() === '' ? null : val.trim()))
    .optional()
    .nullable(),
  favoriteArtists: z
    .array(z.string())
    .optional()
    .nullable(),
  favoriteSongs: z
    .array(z.object({
      songTitle: z.string(),
      artist: z.string(),
    }))
    .optional()
    .nullable(),
})

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    // Check if username is already taken (if provided)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        username: data.username !== undefined ? (data.username || null) : undefined,
        image: data.image !== undefined ? (data.image || null) : undefined,
        bio: data.bio !== undefined ? (data.bio || null) : undefined,
        favoriteArtists: data.favoriteArtists !== undefined ? JSON.stringify(data.favoriteArtists || []) : undefined,
        favoriteSongs: data.favoriteSongs !== undefined ? JSON.stringify(data.favoriteSongs || []) : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        favoriteArtists: true,
        favoriteSongs: true,
      },
    })

    // Parse JSON fields for response
    const responseUser = {
      ...updatedUser,
      favoriteArtists: updatedUser.favoriteArtists ? JSON.parse(updatedUser.favoriteArtists) : [],
      favoriteSongs: updatedUser.favoriteSongs ? JSON.parse(updatedUser.favoriteSongs) : [],
    }

    return NextResponse.json({ user: responseUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}

