import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ONLY these names should be detected
const ALLOWED_NAMES = new Set([
  'elise', 'jojo', 'logan', 'teresa', 'nick', 'grace', 'bret', 'jocelyn', 'lexie', 'danny', 'andy', 'etan',
  'jacinta', 'andrea', 'rishabh', 'madison', 'brad', 'amar', 'charlie', 'talib', 'luke', 'joc', 'dander', 'unc', 'jart',
  'lincoln', 'bella', 'bailey', 'jake', 'od', 'caia', 'nico', 'sam', 'summer', 'grant', 'joey', 'noah', 'liam',
  'stilli', 'aliya', 'addison', 'jadin', 'aj', 'landon', 'devante', 'fore', 'dami', 'keely', 'bryce', 'paige',
  'mom', 'jim', 'amelia', 'alaina', 'steph', 'wes', 'shane', 'billy', 'jason', 'ginger', 'dad', 'alex', 'mikko',
  'sandrea', 'tam', 'freakbeast', 'vivi',
])

// Nickname mappings (variant -> canonical)
const NICKNAME_TO_CANONICAL: Record<string, string> = {
  'bretin': 'bret',
  'joc': 'jocelyn',
  'dander': 'danny',
  'temp': 'andy',
  'ethan': 'etan',
  'jac': 'jacinta',
  'drea': 'andrea',
  'chuck': 'charlie',
  'jimbob': 'jim',
  'boss': 'jason',
}

// Normalize name to proper case
function normalizeName(name: string): string {
  if (!name || name.length === 0) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// Extract person names from text (case-insensitive, only allowed names)
function extractPersonNames(text: string): string[] {
  if (!text || text.trim().length === 0) return []

  const textLower = text.toLowerCase()
  const foundNames = new Set<string>()

  // Also check for nickname variants
  const allNamesToCheck = new Set(ALLOWED_NAMES)
  Object.keys(NICKNAME_TO_CANONICAL).forEach(variant => {
    allNamesToCheck.add(variant)
  })

  // Check each allowed name and nickname variant
  allNamesToCheck.forEach(nameToCheck => {
    // Look for the name in context patterns
    const patterns = [
      new RegExp(`\\b(?:with|saw|met|hung out with|spent time with|chilled with|talked to|called|texted|dm'd|dmed)\\s+${nameToCheck}\\b`, 'gi'),
      new RegExp(`\\b${nameToCheck}\\s+and\\s+`, 'gi'),
      new RegExp(`\\b,\\s*${nameToCheck}\\b`, 'gi'),
      new RegExp(`\\b${nameToCheck}\\s*,`, 'gi'),
      // Also check for standalone occurrences (after common words)
      new RegExp(`\\b(?:and|or|,)\\s+${nameToCheck}\\b`, 'gi'),
    ]

    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        // Map variant to canonical if needed
        const canonical = NICKNAME_TO_CANONICAL[nameToCheck] || nameToCheck
        foundNames.add(canonical)
      }
    })
  })

  return Array.from(foundNames)
}

async function autoDetectPeople(dryRun: boolean = true, userId?: string) {
  console.log(`\n🔍 Auto-detecting people from notes...`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'APPLY (will create records)'}\n`)

  // Get all entries with notes but no people references
  const entries = await prisma.entry.findMany({
    where: {
      notes: { not: null },
      people: { none: {} },
      ...(userId ? { userId } : {}),
    },
    include: {
      people: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  console.log(`Found ${entries.length} entries with notes and no existing people tags\n`)

  const detections = new Map<string, { entries: string[], count: number }>()
  const entryResults: Array<{ entryId: string, date: string, songTitle: string, artist: string, detectedNames: string[] }> = []

  // Process each entry
  for (const entry of entries) {
    if (!entry.notes) continue

    const detectedNames = extractPersonNames(entry.notes)
    
    if (detectedNames.length > 0) {
      entryResults.push({
        entryId: entry.id,
        date: entry.date.toISOString().split('T')[0],
        songTitle: entry.songTitle,
        artist: entry.artist,
        detectedNames,
      })

      // Count occurrences (map variants to canonical)
      detectedNames.forEach(name => {
        const canonical = NICKNAME_TO_CANONICAL[name.toLowerCase()] || name.toLowerCase()
        const normalized = normalizeName(canonical)
        
        const existing = detections.get(normalized) || { entries: [], count: 0 }
        existing.entries.push(entry.id)
        existing.count++
        detections.set(normalized, existing)
      })
    }
  }

  // Filter: only keep names that appear in ≥2 entries
  const filteredDetections = new Map<string, { entries: string[], count: number }>()
  detections.forEach((data, name) => {
    if (data.count >= 2) {
      filteredDetections.set(name, data)
    }
  })

  console.log(`\n📊 Detection Summary:`)
  console.log(`Total names detected: ${detections.size}`)
  console.log(`Names appearing ≥2 times: ${filteredDetections.size}`)
  console.log(`Entries with detections: ${entryResults.length}\n`)

  // Show sample detections
  console.log(`\n📝 Sample Detections (first 10 entries):`)
  entryResults.slice(0, 10).forEach(result => {
    const canonicalNames = result.detectedNames.map(n => {
      const canonical = NICKNAME_TO_CANONICAL[n.toLowerCase()] || n.toLowerCase()
      return normalizeName(canonical)
    }).filter(name => filteredDetections.has(name))
    
    if (canonicalNames.length > 0) {
      console.log(`  ${result.date}: "${result.songTitle}" by ${result.artist}`)
      console.log(`    → ${canonicalNames.join(', ')}`)
    }
  })

  if (entryResults.length > 10) {
    console.log(`  ... and ${entryResults.length - 10} more entries`)
  }

  // Show all names that will be created
  console.log(`\n\n✅ Names that will be created (${filteredDetections.size}):`)
  Array.from(filteredDetections.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([name, data]) => {
      console.log(`  "${name}": ${data.count} entries`)
    })

  if (dryRun) {
    console.log(`\n\n⚠️  DRY RUN - No changes made. Run with --apply to create records.`)
  } else {
    console.log(`\n\n💾 APPLYING changes...`)

    let created = 0
    let skipped = 0

    for (const result of entryResults) {
      const canonicalNames = new Set<string>()
      result.detectedNames.forEach(name => {
        const canonical = NICKNAME_TO_CANONICAL[name.toLowerCase()] || name.toLowerCase()
        const normalized = normalizeName(canonical)
        if (filteredDetections.has(normalized)) {
          canonicalNames.add(normalized)
        }
      })
      
      for (const canonicalName of Array.from(canonicalNames)) {
        try {
          await prisma.personReference.create({
            data: {
              entryId: result.entryId,
              name: canonicalName,
              source: 'auto_migration',
            },
          })
          created++
        } catch (error: any) {
          if (error.code === 'P2002') {
            skipped++
          } else {
            console.error(`Error creating PersonReference for "${canonicalName}" in entry ${result.entryId}:`, error)
          }
        }
      }
    }

    console.log(`\n✅ Created ${created} PersonReference records`)
    if (skipped > 0) {
      console.log(`⊘ Skipped ${skipped} (already existed)`)
    }
  }

  await prisma.$disconnect()
}

// Main execution
const args = process.argv.slice(2)
const dryRun = !args.includes('--apply')
const userId = args.find(arg => arg.startsWith('--userId='))?.split('=')[1]

autoDetectPeople(dryRun, userId).catch(console.error)

