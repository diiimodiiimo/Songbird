import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function reviewDetectedNames() {
  // Get all entries with notes but no people references
  const entries = await prisma.entry.findMany({
    where: {
      notes: { not: null },
      people: { none: {} },
    },
    orderBy: {
      date: 'desc',
    },
    take: 100, // Just get a sample for review
  })

  console.log(`\n📋 Reviewing detected names from sample entries...\n`)
  console.log(`Found ${entries.length} sample entries to review\n`)
  console.log(`This will show you names that appear in context so you can decide if they're real people.\n`)
  console.log(`─`.repeat(80))

  const nameContexts = new Map<string, Array<{ date: string, context: string }>>()

  for (const entry of entries) {
    if (!entry.notes) continue

    // Simple extraction - look for capitalized words after "with", "and", commas
    const text = entry.notes
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    sentences.forEach(sentence => {
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
          names.forEach(name => {
            const normalized = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
            if (normalized.length >= 3 && normalized.length <= 20) {
              const context = sentence.trim().substring(0, 100)
              const existing = nameContexts.get(normalized) || []
              if (existing.length < 3) { // Keep max 3 examples per name
                existing.push({
                  date: entry.date.toISOString().split('T')[0],
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

  await prisma.$disconnect()
}

reviewDetectedNames()



