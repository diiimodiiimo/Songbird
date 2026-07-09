/**
 * Backfill entries.albumColor from album art.
 *
 * Dry run (count only):  npx tsx scripts/backfill-album-colors.ts
 * Apply:                 npx tsx scripts/backfill-album-colors.ts --apply
 *
 * Downloads each entry's album art, decodes the JPEG, and computes the same
 * saturation-weighted average color the client extracts at save time.
 * Safe to re-run: only touches rows where albumColor is null.
 */
import { getScriptSupabase } from './supabase-client'
import * as jpeg from 'jpeg-js'

const apply = process.argv.includes('--apply')
const CONCURRENCY = 8

const supabase = getScriptSupabase()

function computeColor(data: Uint8Array, width: number, height: number): string | null {
  let r = 0
  let g = 0
  let b = 0
  let weightSum = 0
  // Sample a grid rather than every pixel — plenty for an average
  const step = Math.max(1, Math.floor(Math.min(width, height) / 24)) * 4
  for (let i = 0; i < data.length; i += step * 4) {
    const pr = data[i]
    const pg = data[i + 1]
    const pb = data[i + 2]
    const max = Math.max(pr, pg, pb)
    const min = Math.min(pr, pg, pb)
    const weight = (max - min) / 255 + 0.08
    r += pr * weight
    g += pg * weight
    b += pb * weight
    weightSum += weight
  }
  if (weightSum === 0) return null
  const hex = [r, g, b]
    .map((v) => Math.round(v / weightSum).toString(16).padStart(2, '0'))
    .join('')
  return `#${hex}`
}

async function colorForUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('jpeg') && !contentType.includes('jpg')) return null
    const buffer = Buffer.from(await res.arrayBuffer())
    const decoded = jpeg.decode(buffer, { maxMemoryUsageInMB: 64 })
    return computeColor(new Uint8Array(decoded.data), decoded.width, decoded.height)
  } catch {
    return null
  }
}

async function run() {
  const { count } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .is('albumColor', null)
    .like('albumArt', 'http%')

  console.log(`${count || 0} entries need album colors.`)
  if (!apply) {
    console.log('Run with --apply to backfill.')
    return
  }

  let processed = 0
  let updated = 0
  let failed = 0

  while (true) {
    const { data: batch, error } = await supabase
      .from('entries')
      .select('id, albumArt')
      .is('albumColor', null)
      .like('albumArt', 'http%')
      .limit(200)
    if (error) throw error
    if (!batch || batch.length === 0) break

    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY)
      await Promise.all(
        chunk.map(async (entry) => {
          const color = await colorForUrl(entry.albumArt!)
          processed++
          if (color) {
            const { error: updateError } = await supabase
              .from('entries')
              .update({ albumColor: color })
              .eq('id', entry.id)
            if (updateError) failed++
            else updated++
          } else {
            // Mark unprocessable art so re-runs don't refetch it forever
            await supabase.from('entries').update({ albumColor: '#000000' }).eq('id', entry.id)
            failed++
          }
        })
      )
      if (processed % 200 < CONCURRENCY) {
        console.log(`  ${processed} processed (${updated} colored)...`)
      }
    }
  }

  console.log(`Done. ${updated} colored, ${failed} skipped/failed of ${processed}.`)
}

run().catch((err) => {
  console.error('Backfill failed:', err.message)
  process.exit(1)
})
