/**
 * Migrate base64 profile images out of users.image into Supabase Storage.
 *
 * Dry run (default):  npx tsx scripts/migrate-avatars-to-storage.ts
 * Apply:              npx tsx scripts/migrate-avatars-to-storage.ts --apply
 *
 * For each user whose image starts with "data:image", this decodes the base64,
 * uploads it to the public "avatars" bucket as {userId}.{ext}, and replaces
 * users.image with the storage URL. The original data is not deleted until the
 * row update succeeds, and re-running is safe (uploads are upserts).
 */
import { getScriptSupabase } from './supabase-client'

const AVATAR_BUCKET = 'avatars'
const apply = process.argv.includes('--apply')

const supabase = getScriptSupabase()

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some((b) => b.name === AVATAR_BUCKET)) {
    const { error } = await supabase.storage.createBucket(AVATAR_BUCKET, { public: true })
    if (error) throw new Error(`Failed to create bucket: ${error.message}`)
    console.log(`Created public bucket "${AVATAR_BUCKET}"`)
  }
}

async function migrate() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, image')
    .like('image', 'data:image%')

  if (error) throw error

  if (!users || users.length === 0) {
    console.log('No base64 avatars found — nothing to migrate.')
    return
  }

  const totalBytes = users.reduce((sum, u) => sum + (u.image?.length || 0), 0)
  console.log(`Found ${users.length} base64 avatar(s), ~${(totalBytes / 1024 / 1024).toFixed(1)} MB of base64 in the users table.`)

  if (!apply) {
    for (const user of users) {
      console.log(`  [dry run] ${user.email}: ${((user.image?.length || 0) / 1024).toFixed(0)} KB`)
    }
    console.log('\nRun with --apply to migrate.')
    return
  }

  await ensureBucket()

  let migrated = 0
  for (const user of users) {
    try {
      const [header, base64Data] = user.image!.split(',', 2)
      const contentType = header.slice('data:'.length, header.indexOf(';'))
      const subtype = contentType.split('/')[1] || 'jpeg'
      const extension = subtype === 'jpeg' ? 'jpg' : subtype
      const buffer = Buffer.from(base64Data, 'base64')

      const filePath = `${user.id}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, buffer, { contentType, upsert: true })
      if (uploadError) throw new Error(uploadError.message)

      const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath)
      const url = `${publicUrlData.publicUrl}?v=${Date.now()}`

      const { error: updateError } = await supabase
        .from('users')
        .update({ image: url })
        .eq('id', user.id)
      if (updateError) throw new Error(updateError.message)

      migrated++
      console.log(`  ✓ ${user.email} → ${url}`)
    } catch (err: any) {
      console.error(`  ✗ ${user.email}: ${err.message} (row left untouched)`)
    }
  }

  console.log(`\nMigrated ${migrated}/${users.length}.`)
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
