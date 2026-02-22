# AI Insight Generator - Development Context & Limitations

## What This Feature Does

The AI insight generator creates short, personalized blurbs for the "Memory" tab in SongBird. When a user views "On This Day" (entries from the same calendar date across multiple years), the system generates a narrative connecting their music choices.

**Location:** `app/api/ai-insight/route.ts`

---

## What The User Originally Asked For

1. **Expand the library of phrases and words** - The original system had ~10 templates that were repetitive
2. **Look beyond just song title and genre** - Connect songs through multiple data dimensions
3. **Brainstorm other ways to connect user songs** - Find meaningful patterns, not just surface-level observations

---

## How I Initially Answered (And Why It Was Wrong)

### Attempt 1: Added more templates but kept them generic
I added 15 templates with varied "tones" (reflective, energetic, poetic, analytical). The user correctly identified these as **generic AI slop** - phrases like "music and memory are inseparable" and "your musical identity is taking shape" that sound profound but say nothing specific.

### Attempt 2: Made templates reference specific data
I added song titles in quotes, artist names, and tagged people. But the sentences were **choppy and robotic**: `"Song title" stood out. Artist name. Genre.` - just listing data, not telling a story.

### Attempt 3: Used em dashes everywhere
The user pointed out **em dashes are a telltale sign of AI writing**. Humans don't actually write that way.

### Attempt 4: Data structure was broken
I treated years, artists, and songs as separate unrelated arrays. When generating "2022 was Uzi", I was wrong - the data showed Pierre Bourne was 2022 and Uzi was 2024. **I was making connections that didn't exist in the actual data.**

### Attempt 5: Just listed the data correctly
I fixed the data pairing but then just listed it: `"2025: X. 2024: Y. 2023: Z."` The user correctly said **this is boring - they can already read this information themselves.**

---

## What The User Actually Wants

The user wants the insight to **help them relive their memories**, not just recite what happened. The example they gave:

> "Last year All The Stars was your play, and rap stayed consistent with Uzi's Just Wanna Rock in 2024. Although 2022 also saw rap with Sossboy by Pierre, 2023 actually saw some pop with Chris Brown and you were with X person throughout this."

This does several things my attempts didn't:
1. **Finds the pattern** (rap is consistent across years)
2. **Identifies the outlier** (2023 was pop, breaking the pattern)
3. **Weaves people in naturally** (not tacked on at the end)
4. **Tells a story** (has flow, uses connecting words like "although", "actually")
5. **Makes it feel like discovery** ("actually saw some pop" implies surprise)

---

## Current Implementation (Final Version)

The current code:
1. Pairs each entry with its correct year, song, artist, and genre
2. Simplifies Spotify genres to broad categories (rap, pop, r&b, rock, etc.)
3. Finds patterns:
   - Does an artist repeat across years?
   - Is there a consistent genre with outliers?
   - Are there tagged people to weave in?
4. Generates narrative prose, not lists

### Example output for the user's data:
> "This year, 'All The Stars (with SZA)' by Kendrick Lamar was your pick for the rap side of things. The rap stayed consistent through 2025, 2024, 2022 with Kendrick Lamar, Lil Uzi Vert, Pi'erre Bourne. But 2023 switched it up with some pop from Chris Brown's 'Red'. Sarah was there through some of this."

---

## Limitations The User Identified

### 1. Repetitiveness
Even with multiple templates, users will see patterns. The phrasing becomes predictable after a few uses.

### 2. First-layer insights only
The current system only sees obvious patterns:
- Same artist appears twice
- Genre is consistent/inconsistent
- People were tagged

It doesn't make deeper connections like:
- "Every time you're with Sarah, you play R&B"
- "Your December entries are always sadder than your summer ones"
- "You discovered this artist 3 years ago and they've shown up every year since"

### 3. No notes analysis
The user's journal notes contain rich context (the screenshot showed notes like "Super Bowl eagles win" and "midterm, miserable") but the current system doesn't meaningfully incorporate them.

### 4. No cross-date patterns
The system only looks at one date at a time. It can't say "This is the third time this week you've logged Drake" or "You always come back to this song in February."

---

## Limitations I See

### 1. Genre detection is imprecise
Spotify's genre tags are inconsistent. "Chris Brown" might return "pop" but could also return "r&b" or "dance pop" depending on which album is most prominent. The simplifyGenre() function helps but is crude.

### 2. The narrative logic is brittle
The code has specific if/else paths:
- If artist repeats → use artist-repeat template
- Else if genre has outlier → use outlier template
- Else → fallback

This means certain data combinations will always produce the same structure. True variety would require more randomization or more template variations per pattern type.

### 3. People data isn't fully utilized
The current code can say "Sarah was there" but can't:
- Know which specific year Sarah was tagged
- Compare "entries with Sarah vs without Sarah"
- Identify that Sarah is always associated with certain artists/genres

### 4. No memory of previous insights
Each API call is stateless. If the user refreshes, they might get a very similar insight, or the same pattern described with slightly different words. There's no guarantee of variety across sessions.

### 5. Temporal language is limited
The code uses "this year", "back in 2022", "switched it up" but doesn't have rich temporal vocabulary. A human might say:
- "Three years running, you've picked rap for this date"
- "The only time you broke from hip-hop was 2023"
- "You've been doing this for 4 years now"

### 6. No emotional arc detection
The system can't identify progression like:
- Songs getting more upbeat over the years
- A shift from sad to happy music after a certain year
- The person's taste evolving in a direction

### 7. Song-level analysis is missing
We know the song title but don't use Spotify's audio features (tempo, energy, valence) to say things like:
- "Your picks for this date have gotten more energetic each year"
- "2022 was mellow, 2024 was intense"

### 8. The writing still sounds somewhat artificial
Despite removing em dashes and adding flow, the output still reads as "generated text" rather than "what a friend would text you." True human writing would be more casual, might use incomplete sentences, would have personality quirks.

---

## What Would Make This Better

1. **Multiple templates per pattern type** - If we detect "consistent genre with outlier", have 5+ ways to phrase that, randomly selected

2. **Deeper data queries** - Pull the user's full history to make cross-date observations ("This is your 4th time logging Kendrick")

3. **Notes integration** - Scan notes for keywords/sentiment and incorporate ("2023 was rough based on your notes, and the music reflected that")

4. **Audio features** - Use Spotify's track audio features to comment on energy/mood patterns

5. **Person-specific patterns** - "When you're with Sarah, it's always R&B"

6. **True randomization** - Different phrasings, different sentence structures, even different levels of detail

7. **Tone matching** - If the user's notes are casual and use slang, the insight should too

---

## File Location

`app/api/ai-insight/route.ts`

## Data Available

From the frontend (MemoryTab.tsx), the API receives:
- `artists`: string[] - artist names, one per entry
- `songs`: string[] - song titles, one per entry  
- `years`: number[] - year of each entry
- `people`: string[] - tagged people names
- `date`: string - the calendar date being viewed (MM-DD)
- `popularity`: number[] - Spotify popularity scores (0-100)
- `duration`: number[] - track duration in ms
- `releaseDate`: string[] - when the song was released
- `notes`: string[] - user's journal notes (currently underutilized)

The API fetches genres from Spotify's artist search endpoint.
