import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

async function reviewDetectedNames() {
  // Get all entries with notes
  // Note: Supabase doesn't support "none" relation filter like Prisma,
  // so we get all entries with notes and filter in-app
  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, date, notes, songTitle, artist')
    .not('notes', 'is', null)
    .order('date', { ascending: false })
    .limit(100)

  if (error) throw error

  // Filter out entries that already have people references
  const entryIds = entries.map((e: any) => e.id)
  const { data: existingPeople } = await supabase
    .from('person_references')
    .select('entryId')
    .in('entryId', entryIds)

  const entriesWithPeople = new Set((existingPeople || []).map((p: any) => p.entryId))
  const filteredEntries = entries.filter((e: any) => !entriesWithPeople.has(e.id))

  console.log(`\n📋 Reviewing detected names from sample entries...\n`)
  console.log(`Found ${filteredEntries.length} sample entries to review\n`)
  console.log(`This will show you names that appear in context so you can decide if they're real people.\n`)
  console.log(`─`.repeat(80))

  const nameContexts = new Map<string, Array<{ date: string, context: string }>>()

  for (const entry of filteredEntries) {
    if (!entry.notes) continue

    // Simple extraction - look for capitalized words after "with", "and", commas
    const text = entry.notes
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)

    sentences.forEach((sentence: string) => {
      // Look for patterns like "with X", "X and Y", "X, Y"
      const patterns = [
        /\b(?:with|saw|met|hung out with|spent time with|chilled with|talked to|called|texted|dm'd|dmed)\s+([a-z]+)/gi,
        /\b([a-z]+)\s+and\s+([a-z]+)/gi,
        /\b([a-z]+)\s*,\s*([a-z]+)/gi,
      ]

      patterns.forEach(pattern => {
        let match
        while ((match = pattern.exec(sentence)) !== null) {
          const names = match.slice(1).filter(Boolean)
          names.forEach((name: string) => {
            const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            if (normalized.length >= 3 && normalized.length <= 20) {
              const context = sentence.trim().substring(0, 100)
              const existing = nameContexts.get(normalized) || []
              if (existing.length < 3) { // Keep max 3 examples per name
                existing.push({
                  date: new Date(entry.date).toISOString().split('T')[0],
                  context,
                })
                nameContexts.set(normalized, existing)
              }
            }
          })
        }
      })
    })
  }

  // Sort by frequency (names with more examples first)
  const sortedNames = Array.from(nameContexts.entries())
    .sort((a, b) => b[1].length - a[1].length)

  console.log(`\nFound ${sortedNames.length} unique names in sample\n`)
  console.log(`─`.repeat(80))

  sortedNames.forEach(([name, contexts], index) => {
    console.log(`\n${index + 1}. "${name}" (appears ${contexts.length} time(s) in sample)`)
    contexts.forEach(({ date, context }) => {
      console.log(`   [${date}] ...${context}...`)
    })
  })

  console.log(`\n\n─`.repeat(80))
  console.log(`\n💡 Tips for review:`)
  console.log(`   - Real person names: "Jac", "Drea", "Nick", "Grace", etc.`)
  console.log(`   - False positives: "Sad", "Not", "Chill", "Grind", "Wake", etc.`)
  console.log(`   - Tell me which names to filter out, and I'll add them to the false positives list`)
  console.log(`   - Then we can re-run the detection script with the cleaned list\n`)
}

reviewDetectedNames().catch(console.error)
