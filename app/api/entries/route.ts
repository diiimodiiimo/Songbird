import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || session.user.id
    const date = searchParams.get('date')
    const excludeImages = searchParams.get('excludeImages') === 'true' // For archive page

    // Pagination - REDUCED page size to prevent string length errors
    const page = Number(searchParams.get('page') || 1)
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 100), excludeImages ? 500 : 100) // Larger page size for archive without images
    const skip = (page - 1) * pageSize

    const where: any = { userId: String(userId) }

    if (date) {
      const dateStr = date.includes('T') ? date.split('T')[0] : date
      const targetDate = new Date(dateStr + 'T12:00:00.000Z')
      const startOfDay = new Date(targetDate)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setUTCHours(23, 59, 59, 999)
      where.date = { gte: startOfDay, lte: endOfDay }
    }

    const isAllEntriesQuery = !date

    let entries: any[] = []

    if (isAllEntriesQuery) {
      // Fetch user info separately for bulk queries
      const user = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: { id: true, name: true, email: true, image: true },
      }).catch(() => null)

      // Paginated fetch for large history - conditionally include albumArt
      const selectFields: any = {
        id: true,
        date: true,
        songTitle: true,
        artist: true,
        albumTitle: true,
        notes: true,
      }
      
      // Only include albumArt if not excluding images
      if (!excludeImages) {
        selectFields.albumArt = true
      }
      
      entries = await prisma.entry.findMany({
        where: { userId: String(userId) },
        select: selectFields,
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      })

      const userInfo = user || { id: String(userId), name: null, email: null, image: null }
      // CRITICAL: Filter out base64 images from user.image - they're too large
      const userImage = userInfo.image && !userInfo.image.startsWith('data:image')
        ? String(userInfo.image).substring(0, 500) // Limit URL length too
        : null
      
      entries = entries.map((entry) => {
        // Convert date - MUST be string, not Date object
        const dateStr = entry.date instanceof Date
          ? entry.date.toISOString().split('T')[0]
          : String(entry.date || '').split('T')[0].substring(0, 10)
        
        // AGGRESSIVELY truncate notes - max 200 chars to prevent huge strings
        const notes = entry.notes
          ? String(entry.notes).substring(0, 200) + (entry.notes.length > 200 ? '...' : '')
          : null
        
        // Ensure all strings are limited in length
        return {
          id: String(entry.id || '').substring(0, 100),
          date: dateStr,
          songTitle: String(entry.songTitle || '').substring(0, 200),
          artist: String(entry.artist || '').substring(0, 200),
          albumTitle: String(entry.albumTitle || '').substring(0, 200),
          notes: notes,
          albumArt: excludeImages ? null : (entry.albumArt ? String(entry.albumArt) : null), // Exclude for archive
          user: {
            id: String(userInfo.id || '').substring(0, 100),
            name: userInfo.name ? String(userInfo.name).substring(0, 100) : null,
            email: userInfo.email ? String(userInfo.email).substring(0, 200) : null,
            image: userImage,
          },
          tags: [],
          mentions: [],
          people: [],
        }
      })
    } else {
      // Full detail for single-day view
      entries = await prisma.entry.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          tags: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          mentions: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
          people: {
            include: {
              user: { select: { id: true, name: true, email: true, image: true } },
            },
          },
        },
        orderBy: { date: 'desc' },
      })

      // Format single-day entries - ensure all Date objects are converted
      entries = entries.map((entry) => {
        // Convert main date
        const dateStr = entry.date instanceof Date
          ? entry.date.toISOString().split('T')[0]
          : String(entry.date).split('T')[0]

        // Convert user - EXCLUDE base64 images
        const user = entry.user ? {
          id: String(entry.user.id).substring(0, 100),
          name: entry.user.name ? String(entry.user.name).substring(0, 100) : null,
          email: String(entry.user.email).substring(0, 200),
          image: entry.user.image && !entry.user.image.startsWith('data:image')
            ? String(entry.user.image).substring(0, 500)
            : null,
        } : null

        // Convert tags, mentions, people - remove Date objects and base64 images
        const tags = Array.isArray(entry.tags) ? entry.tags.map((tag: any) => ({
          id: String(tag.id || '').substring(0, 100),
          userId: String(tag.userId || '').substring(0, 100),
          user: tag.user ? {
            id: String(tag.user.id || '').substring(0, 100),
            name: tag.user.name ? String(tag.user.name).substring(0, 100) : null,
            email: String(tag.user.email || '').substring(0, 200),
            image: tag.user.image && !tag.user.image.startsWith('data:image')
              ? String(tag.user.image).substring(0, 500)
              : null,
          } : null,
        })) : []

        const mentions = Array.isArray(entry.mentions) ? entry.mentions.map((mention: any) => ({
          id: String(mention.id || '').substring(0, 100),
          userId: String(mention.userId || '').substring(0, 100),
          user: mention.user ? {
            id: String(mention.user.id || '').substring(0, 100),
            name: mention.user.name ? String(mention.user.name).substring(0, 100) : null,
            email: String(mention.user.email || '').substring(0, 200),
            image: mention.user.image && !mention.user.image.startsWith('data:image')
              ? String(mention.user.image).substring(0, 500)
              : null,
          } : null,
        })) : []

        const people = Array.isArray(entry.people) ? entry.people.map((person: any) => ({
          id: String(person.id || '').substring(0, 100),
          name: String(person.name || '').substring(0, 200),
          userId: person.userId ? String(person.userId).substring(0, 100) : null,
          user: person.user ? {
            id: String(person.user.id || '').substring(0, 100),
            name: person.user.name ? String(person.user.name).substring(0, 100) : null,
            email: String(person.user.email || '').substring(0, 200),
            image: person.user.image && !person.user.image.startsWith('data:image')
              ? String(person.user.image).substring(0, 500)
              : null,
          } : null,
        })) : []

        return {
          id: String(entry.id),
          date: dateStr,
          songTitle: String(entry.songTitle),
          artist: String(entry.artist),
          albumTitle: String(entry.albumTitle),
          albumArt: entry.albumArt ? String(entry.albumArt) : null, // Include base64 images for archive
          notes: entry.notes ? String(entry.notes).substring(0, 1000) : null,
          user: user,
          tags: tags,
          mentions: mentions,
          people: people,
        }
      })
    }

    // Calculate hasMore - check if there are more entries beyond current page
    let hasMore = false
    if (isAllEntriesQuery) {
      const totalCount = await prisma.entry.count({
        where: { userId: String(userId) },
      })
      hasMore = skip + entries.length < totalCount
    } else {
      // For single-date queries, hasMore is always false (we get all entries for that date)
      hasMore = false
    }

    return NextResponse.json({
      entries,
      page,
      pageSize,
      hasMore,
    })
  } catch (error: any) {
    console.error('=== ERROR IN /api/entries ===')
    console.error(error?.message)
    return NextResponse.json(
      {
        error: 'Failed to fetch entries',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
