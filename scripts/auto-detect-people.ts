import { getScriptSupabase } from './supabase-client'

const supabase = getScriptSupabase()

// Common false positives to ignore (expanded list)
const FALSE_POSITIVES = new Set([
  // Time/date words
  'today', 'yesterday', 'tomorrow', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december',
  'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year', 'hour', 'hours', 'minute', 'minutes',
  // Music-related
  'song', 'music', 'album', 'artist', 'track', 'playlist', 'spotify', 'sound', 'beat', 'lyrics',
  // Common articles/prepositions
  'the', 'a', 'an', 'and', 'or', 'but', 'with', 'from', 'to', 'for', 'of', 'in', 'on', 'at', 'by', 'as', 'is', 'was', 'are', 'were',
  // Common verbs (past tense, present, etc.)
  'had', 'got', 'went', 'came', 'saw', 'did', 'didn', 'made', 'took', 'gave',
  'then', 'when', 'where', 'what', 'who', 'why', 'how', 'this', 'that', 'these', 'those',
  'some', 'any', 'all', 'both', 'each', 'every', 'much', 'many', 'more', 'most', 'very', 'too', 'also', 'just', 'only',
  'can', 'could', 'should', 'would', 'will', 'shall', 'may', 'might', 'must',
  // Common adjectives
  'good', 'bad', 'big', 'small', 'long', 'short', 'new', 'old', 'young', 'hot', 'cold', 'warm', 'cool',
  'nice', 'fine', 'great', 'best', 'better', 'worse', 'worst', 'easy', 'hard', 'soft', 'loud', 'quiet',
  // Common nouns
  'time', 'times', 'place', 'way', 'thing', 'things', 'stuff', 'work', 'home', 'school', 'college', 'university',
  'class', 'classes', 'meeting', 'meetings', 'game', 'games', 'team', 'teams', 'group', 'groups',
  'food', 'drink', 'drinks', 'water', 'coffee', 'tea', 'beer', 'wine',
  'car', 'cars', 'bus', 'train', 'plane', 'flight', 'road', 'street', 'house', 'room', 'rooms',
  'phone', 'call', 'calls', 'text', 'texts', 'message', 'messages',
  'money', 'dollar', 'dollars', 'price', 'cost', 'free',
  'book', 'books', 'movie', 'movies', 'show', 'shows', 'tv', 'video', 'videos',
  'job', 'jobs', 'work', 'office', 'company', 'business',
  'friend', 'friends', 'family', 'mom', 'dad', 'parent', 'parents', 'brother', 'sister',
  'dog', 'dogs', 'cat', 'cats', 'pet', 'pets',
  'city', 'cities', 'town', 'state', 'country', 'world', 'worlds',
  'problem', 'problems', 'issue', 'issues', 'question', 'questions',
  'idea', 'ideas', 'plan', 'plans', 'project', 'projects',
  'start', 'starts', 'started', 'starting', 'end', 'ends', 'ended', 'ending',
  'way', 'ways', 'side', 'sides', 'part', 'parts', 'piece', 'pieces',
  'kind', 'kinds', 'type', 'types', 'sort', 'sorts',
  'number', 'numbers', 'amount', 'amounts', 'lot', 'lots',
  'case', 'cases', 'point', 'points', 'line', 'lines',
  'life', 'lives', 'death', 'deaths', 'health', 'body', 'bodies',
  'hand', 'hands', 'head', 'heads', 'eye', 'eyes', 'face', 'faces',
  'foot', 'feet', 'leg', 'legs', 'arm', 'arms',
  'back', 'backs', 'front', 'fronts', 'top', 'tops', 'bottom', 'bottoms',
  'left', 'right', 'up', 'down', 'inside', 'outside',
  // Places/brands
  'popeyes', 'houston', 'american', 'target', 'walmart', 'starbucks', 'mcdonalds',
  // Other common words
  'here', 'there', 'everywhere', 'nowhere', 'anywhere', 'somewhere',
  'now', 'before', 'after', 'during', 'while', 'until', 'since',
  'yes', 'no', 'maybe', 'sure', 'ok', 'okay', 'alright', 'wrong',
  'true', 'false', 'real', 'really', 'actually', 'probably', 'perhaps',
  'first', 'last', 'next', 'previous', 'other', 'another', 'same', 'different',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'hundred', 'thousand', 'million', 'billion',
  'once', 'twice', 'again', 'still', 'yet', 'already', 'soon', 'later', 'early',
  'always', 'never', 'often', 'sometimes', 'usually', 'rarely', 'seldom',
  'tonight',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
  'such',
  'am', 'be', 'been', 'being', 'have', 'has', 'having',
  'do', 'does', 'doing', 'done', 'get', 'gets', 'getting', 'gotten',
  'go', 'goes', 'going', 'gone', 'come', 'comes', 'coming',
  'see', 'sees', 'seeing', 'seen', 'know', 'knows', 'knew', 'knowing', 'known',
  'think', 'thinks', 'thought', 'thinking', 'say', 'says', 'said', 'saying',
  'want', 'wants', 'wanted', 'wanting', 'need', 'needs', 'needed', 'needing',
  'like', 'likes', 'liked', 'liking', 'love', 'loves', 'loved', 'loving',
  'make', 'makes', 'making', 'take', 'takes', 'taking', 'taken',
  'give', 'gives', 'giving', 'given', 'tell', 'tells', 'told', 'telling',
  'find', 'finds', 'found', 'finding', 'look', 'looks', 'looked', 'looking',
  'use', 'uses', 'used', 'using', 'try', 'tries', 'tried', 'trying',
  'ask', 'asks', 'asked', 'asking', 'worked', 'working',
  'seem', 'seems', 'seemed', 'seeming', 'feel', 'feels', 'felt', 'feeling',
  'leave', 'leaves', 'leaving',
  'called', 'calling',
  'help', 'helps', 'helped', 'helping', 'showed', 'showing', 'shown',
  'move', 'moves', 'moved', 'moving', 'lived', 'living',
  'believe', 'believes', 'believed', 'believing', 'bring', 'brings', 'brought', 'bringing',
  'happen', 'happens', 'happened', 'happening', 'write', 'writes', 'wrote', 'writing', 'written',
  'summer', 'summer',
])

// Known nickname mappings (canonical -> variants)
const NICKNAME_MAP: Record<string, string[]> = {
  // User-specified mappings
  'jacinta': ['jac', 'jaci'],
  'bret': ['bretin'],
  'jocelyn': ['joc'],
  'danny': ['dander'],
  'andy': ['temp'],
  'etan': ['ethan'],
  'chuck': ['charlie'],
  'jim': ['jimbob'],
  'jason': ['boss'],
  // Also map reverse (variant -> canonical) for easier lookup
  'dander': ['danny'],
  'jimbob': ['jim'],
  'boss': ['jason'],
  // Common name mappings
  'andrea': ['drea', 'andie'],
  'alexander': ['alex'],
  'alexandra': ['alex'],
  'christopher': ['chris'],
  'christina': ['chris', 'tina'],
  'michael': ['mike', 'mikey'],
  'jennifer': ['jen', 'jenny'],
  'daniel': ['dan'],
  'robert': ['rob', 'bob', 'bobby'],
  'william': ['will', 'bill'],
  'richard': ['rich', 'rick', 'dick'],
  'joseph': ['joe'],
  'thomas': ['tom', 'tommy'],
  'james': ['jimmy'],
  'elizabeth': ['liz', 'lizzie', 'beth'],
  'patricia': ['pat', 'patti'],
  'catherine': ['cathy', 'cate', 'kate'],
  'rebecca': ['becca', 'becky'],
}

// Check if one name is a nickname of another
function isNickname(shortName: string, longName: string): boolean {
  const short = shortName.toLowerCase()
  const long = longName.toLowerCase()

  // Check if short is a prefix of long (e.g., "jac" -> "jacinta")
  if (long.startsWith(short) && short.length >= 3) {
    return true
  }

  // Check known nickname mappings
  const longVariants = NICKNAME_MAP[long] || []
  if (longVariants.includes(short)) return true

  const shortVariants = NICKNAME_MAP[short] || []
  if (shortVariants.some(v => v === long || long.startsWith(v))) return true

  return false
}

// Normalize name to proper case (first letter capitalized, rest lowercase)
function normalizeName(name: string): string {
  if (!name || name.length === 0) return name
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// Simple NER-like person detection
function extractPersonNames(text: string, artistName?: string): string[] {
  if (!text || text.trim().length === 0) return []

  // Remove artist name if provided (to avoid false positives)
  let cleanedText = text.toLowerCase()
  if (artistName) {
    const artistWords = artistName.toLowerCase().split(/\s+/)
    artistWords.forEach(word => {
      cleanedText = cleanedText.replace(new RegExp(`\\b${word}\\b`, 'gi'), '')
    })
  }

  // Split into sentences and tokens
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const names: Set<string> = new Set()

  sentences.forEach(sentence => {
    const withPattern = /\b(?:with|saw|met|hung out with|spent time with|chilled with|talked to|called|texted|dm'd|dmed)\s+([a-z]+(?:\s+[a-z]+)?)/gi
    const andPattern = /\b([a-z]+)\s+and\s+([a-z]+)/gi
    const commaPattern = /\b([a-z]+)\s*,\s*([a-z]+)/gi

    let match
    while ((match = withPattern.exec(sentence)) !== null) {
      const name = normalizeName(match[1].trim())
      if (isValidPersonName(name)) {
        names.add(name)
      }
    }

    while ((match = andPattern.exec(sentence)) !== null) {
      const name1 = normalizeName(match[1].trim())
      const name2 = normalizeName(match[2].trim())
      if (isValidPersonName(name1)) names.add(name1)
      if (isValidPersonName(name2)) names.add(name2)
    }

    while ((match = commaPattern.exec(sentence)) !== null) {
      const name1 = normalizeName(match[1].trim())
      const name2 = normalizeName(match[2].trim())
      if (isValidPersonName(name1)) names.add(name1)
      if (isValidPersonName(name2)) names.add(name2)
    }

    const words = sentence.split(/\s+/)
    words.forEach((word, index) => {
      const cleaned = word.replace(/[.,!?;:]/g, '').toLowerCase()
      if (
        cleaned.length >= 3 &&
        /^[a-z]+$/.test(cleaned) &&
        !FALSE_POSITIVES.has(cleaned) &&
        index > 0 &&
        (words[index - 1]?.toLowerCase().match(/\b(with|and|,)\b/) || 
         words[index + 1]?.toLowerCase() === 'and')
      ) {
        const normalized = normalizeName(cleaned)
        if (isValidPersonName(normalized)) {
          names.add(normalized)
        }
      }
    })
  })

  return Array.from(names)
}

function isValidPersonName(name: string): boolean {
  if (!name || name.length < 3) return false
  if (name.length > 50) return false
  if (FALSE_POSITIVES.has(name.toLowerCase())) return false
  if (!/^[A-Z][a-z]+$/.test(name)) return false
  return true
}

function nameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase()
  const n2 = name2.toLowerCase()

  if (n1 === n2) return 1.0
  if (isNickname(n1, n2) || isNickname(n2, n1)) return 0.95

  if (n1.startsWith(n2) || n2.startsWith(n1)) {
    const shorter = n1.length < n2.length ? n1 : n2
    return shorter.length >= 3 ? 0.85 : 0.7
  }

  const editDistance = levenshteinDistance(n1, n2)
  const longer = n1.length > n2.length ? n1 : n2
  const similarity = 1 - editDistance / longer.length

  return similarity
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

function groupSimilarNames(detections: Map<string, { entries: string[], count: number }>): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  const processed = new Set<string>()

  const names = Array.from(detections.keys())

  const nicknameGroups = new Map<string, Set<string>>()
  const allNicknameNames = new Set<string>()
  
  names.forEach(name => {
    const nameLower = name.toLowerCase()
    if (NICKNAME_MAP[nameLower]) {
      if (!nicknameGroups.has(nameLower)) {
        nicknameGroups.set(nameLower, new Set([name]))
        allNicknameNames.add(name)
      }
      NICKNAME_MAP[nameLower].forEach(variant => {
        const variantName = names.find(n => n.toLowerCase() === variant)
        if (variantName) {
          nicknameGroups.get(nameLower)!.add(variantName)
          allNicknameNames.add(variantName)
        }
      })
    }
    Object.entries(NICKNAME_MAP).forEach(([canonical, variants]) => {
      if (variants.includes(nameLower)) {
        if (!nicknameGroups.has(canonical)) {
          const canonicalName = names.find(n => n.toLowerCase() === canonical)
          if (canonicalName) {
            nicknameGroups.set(canonical, new Set([canonicalName]))
            allNicknameNames.add(canonicalName)
          }
        }
        if (nicknameGroups.has(canonical)) {
          nicknameGroups.get(canonical)!.add(name)
          allNicknameNames.add(name)
        }
      }
    })
  })

  nicknameGroups.forEach((nameSet, canonical) => {
    const canonicalName = Array.from(nameSet).find(n => n.toLowerCase() === canonical) || Array.from(nameSet)[0]
    groups.set(canonicalName, Array.from(nameSet))
    nameSet.forEach(n => processed.add(n))
  })

  names.forEach(name => {
    if (processed.has(name)) return

    const group: string[] = [name]
    processed.add(name)

    names.forEach(otherName => {
      if (processed.has(otherName)) return
      if (allNicknameNames.has(otherName)) return
      
      if (isNickname(name, otherName) || isNickname(otherName, name)) {
        return
      }
      
      const similarity = nameSimilarity(name, otherName)
      if (similarity >= 0.65) {
        group.push(otherName)
        processed.add(otherName)
      }
    })

    const knownCanonicals = Object.keys(NICKNAME_MAP)
    let canonical = group.find(name => knownCanonicals.includes(name.toLowerCase()))
    
    if (!canonical) {
      canonical = group.reduce((a, b) => {
        const countA = detections.get(a)?.count || 0
        const countB = detections.get(b)?.count || 0
        if (Math.abs(countA - countB) <= 2) {
          return b.length > a.length ? b : a
        }
        return countB > countA ? b : a
      })
    } else {
      const canonicalLower = canonical.toLowerCase()
      canonical = group.find(name => name.toLowerCase() === canonicalLower) || group[0]
    }

    groups.set(canonical, group)
  })

  return groups
}

interface DetectionResult {
  entryId: string
  date: string
  songTitle: string
  artist: string
  detectedNames: string[]
}

async function autoDetectPeople(dryRun: boolean = true, userId?: string) {
  console.log(`\n🔍 Auto-detecting people from notes...`)
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'APPLY (will create records)'}\n`)

  // Get all entries with notes
  let query = supabase
    .from('entries')
    .select('id, date, songTitle, artist, notes, userId')
    .not('notes', 'is', null)
    .order('date', { ascending: false })

  if (userId) {
    query = query.eq('userId', userId)
  }

  const { data: allEntries, error: entriesError } = await query
  if (entriesError) throw entriesError

  // Filter out entries that already have people references
  const entryIds = allEntries.map((e: any) => e.id)
  const { data: existingPeople } = await supabase
    .from('person_references')
    .select('entryId')
    .in('entryId', entryIds.length > 0 ? entryIds : ['__none__'])

  const entriesWithPeople = new Set((existingPeople || []).map((p: any) => p.entryId))
  const entries = allEntries.filter((e: any) => !entriesWithPeople.has(e.id))

  console.log(`Found ${entries.length} entries with notes and no existing people tags\n`)

  const detections = new Map<string, { entries: string[], count: number }>()
  const entryResults: DetectionResult[] = []

  for (const entry of entries) {
    if (!entry.notes) continue

    const detectedNames = extractPersonNames(entry.notes, entry.artist)
    
    if (detectedNames.length > 0) {
      entryResults.push({
        entryId: entry.id,
        date: new Date(entry.date).toISOString().split('T')[0],
        songTitle: entry.songTitle,
        artist: entry.artist,
        detectedNames,
      })

      detectedNames.forEach(name => {
        const existing = detections.get(name) || { entries: [], count: 0 }
        existing.entries.push(entry.id)
        existing.count++
        detections.set(name, existing)
      })
    }
  }

  const nameGroups = groupSimilarNames(detections)

  const mergedDetections = new Map<string, { entries: string[], count: number }>()
  
  nameGroups.forEach((aliases, canonical) => {
    const allEntries = new Set<string>()
    let totalCount = 0
    
    aliases.forEach(alias => {
      const data = detections.get(alias)
      if (data) {
        data.entries.forEach(e => allEntries.add(e))
        totalCount += data.count
      }
    })
    
    if (totalCount >= 2) {
      mergedDetections.set(canonical, {
        entries: Array.from(allEntries),
        count: totalCount,
      })
    }
  })

  const filteredDetections = mergedDetections

  console.log(`\n📊 Detection Summary:`)
  console.log(`Total names detected: ${detections.size}`)
  console.log(`Names appearing ≥2 times (after merging): ${filteredDetections.size}`)
  console.log(`Entries with detections: ${entryResults.length}\n`)

  console.log(`\n👥 Similar Name Groups (merged):`)
  const groupsWithAliases = Array.from(nameGroups.entries()).filter(([canonical, aliases]) => {
    return aliases.length > 1 && filteredDetections.has(canonical)
  })
  console.log(`Found ${groupsWithAliases.length} groups with multiple aliases\n`)

  groupsWithAliases.forEach(([canonical, aliases]) => {
    const data = filteredDetections.get(canonical)
    console.log(`  "${canonical}" (canonical, ${data?.count || 0} total entries)`)
    aliases.filter(a => a !== canonical).forEach(alias => {
      const aliasData = detections.get(alias)
      if (aliasData) {
        console.log(`    - "${alias}" (${aliasData.count} entries)`)
      }
    })
    console.log()
  })

  const aliasToCanonical = new Map<string, string>()
  nameGroups.forEach((aliases, canonical) => {
    aliases.forEach(alias => {
      aliasToCanonical.set(alias, canonical)
    })
  })

  console.log(`\n📝 Sample Detections (first 10 entries):`)
  entryResults.slice(0, 10).forEach(result => {
    const canonicalNames = new Set<string>()
    result.detectedNames.forEach(name => {
      const canonical = aliasToCanonical.get(name) || name
      if (filteredDetections.has(canonical)) {
        canonicalNames.add(canonical)
      }
    })
    if (canonicalNames.size > 0) {
      console.log(`  ${result.date}: "${result.songTitle}" by ${result.artist}`)
      console.log(`    → ${Array.from(canonicalNames).join(', ')}`)
    }
  })

  if (entryResults.length > 10) {
    console.log(`  ... and ${entryResults.length - 10} more entries`)
  }

  console.log(`\n\n✅ Names that will be created (${filteredDetections.size}):`)
  Array.from(filteredDetections.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([canonical, data]) => {
      const aliases = nameGroups.get(canonical) || [canonical]
      if (aliases.length > 1) {
        console.log(`  "${canonical}" (includes: ${aliases.filter(a => a !== canonical).join(', ')}): ${data.count} entries`)
      } else {
        console.log(`  "${canonical}": ${data.count} entries`)
      }
    })

  if (dryRun) {
    console.log(`\n\n⚠️  DRY RUN - No changes made. Run with --apply to create records.`)
  } else {
    console.log(`\n\n💾 APPLYING changes...`)

    let created = 0
    let skipped = 0

    const aliasToCanonical2 = new Map<string, string>()
    nameGroups.forEach((aliases, canonical) => {
      aliases.forEach(alias => {
        aliasToCanonical2.set(alias, canonical)
      })
    })

    for (const result of entryResults) {
      const canonicalNames = new Set<string>()
      result.detectedNames.forEach(name => {
        const canonical = aliasToCanonical2.get(name) || name
        if (filteredDetections.has(canonical)) {
          canonicalNames.add(canonical)
        }
      })
      
      for (const canonicalName of Array.from(canonicalNames)) {
        try {
          const { error: insertError } = await supabase
            .from('person_references')
            .insert({
              entryId: result.entryId,
              name: canonicalName,
              source: 'auto_migration',
            })

          if (insertError) {
            if (insertError.code === '23505') { // Unique constraint violation
              skipped++
            } else {
              throw insertError
            }
          } else {
            created++
          }
        } catch (error: any) {
          console.error(`Error creating PersonReference for "${canonicalName}" in entry ${result.entryId}:`, error)
        }
      }
    }

    console.log(`\n✅ Created ${created} PersonReference records`)
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} (already existed)`)
    }
  }

  console.log(`\n`)
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--apply')
  const userIdArg = args.find(arg => arg.startsWith('--userId='))
  const userId = userIdArg ? userIdArg.split('=')[1] : undefined

  try {
    await autoDetectPeople(dryRun, userId)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
