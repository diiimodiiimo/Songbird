/**
 * One-off: add the albumColor column to entries.
 * Run: npx tsx scripts/add-album-color-column.ts
 */
import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config()

const url = process.env.DIRECT_URL || process.env.DATABASE_URL
if (!url) {
  console.error('DIRECT_URL or DATABASE_URL must be set')
  process.exit(1)
}

const sql = postgres(url, { max: 1, ssl: 'require' })

async function run() {
  await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS "albumColor" TEXT`
  console.log('entries.albumColor column is present.')
  await sql.end()
}

run().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
