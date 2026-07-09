import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getSupabase } from '@/lib/supabase'
import { getUserIdFromClerk } from '@/lib/clerk-sync'
import { checkRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

/**
 * Avatar upload API
 *
 * Accepts a base64 data URI, stores the decoded image in Supabase Storage,
 * and saves the public URL on the user record. Replaces the old pattern of
 * writing multi-megabyte base64 strings directly into users.image.
 */

const AVATAR_BUCKET = 'avatars'

// 2MB decoded — the client downscales before upload, so anything bigger is misuse
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const uploadSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(jpeg|png|webp);base64,/, 'Must be a JPEG, PNG, or WebP data URI'),
})

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = await checkRateLimit(clerkUserId, 'WRITE')
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!
    }

    const userId = await getUserIdFromClerk(clerkUserId)
    if (!userId) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    const body = await request.json()
    const { image } = uploadSchema.parse(body)

    const [header, base64Data] = image.split(',', 2)
    const contentType = header.slice('data:'.length, header.indexOf(';'))
    const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1]
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.byteLength > MAX_AVATAR_BYTES) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 413 })
    }

    const supabase = getSupabase()
    const filePath = `${userId}.${extension}`

    let { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, buffer, { contentType, upsert: true })

    // Self-provision the bucket on first ever upload
    if (uploadError && /bucket.*not.*found/i.test(uploadError.message)) {
      await supabase.storage.createBucket(AVATAR_BUCKET, { public: true })
      ;({ error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, buffer, { contentType, upsert: true }))
    }

    if (uploadError) {
      console.error('[profile/avatar] Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
    // Cache-bust: the path is stable per user, so stale CDN copies would linger otherwise
    const url = `${publicUrlData.publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase
      .from('users')
      .update({ image: url })
      .eq('id', userId)

    if (updateError) {
      console.error('[profile/avatar] DB update error:', updateError)
      return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message || 'Invalid image' }, { status: 400 })
    }
    console.error('[profile/avatar] Error:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}
