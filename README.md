# SongBird - Song of the Day

A full-stack Next.js application for tracking your daily music journal with social features.

## Features

- 🎵 **Song Search**: Search and add songs from Spotify
- 📝 **Daily Journal**: Add notes and memories to each song entry
- 📊 **Analytics**: View your top artists and songs with various time filters
- 📜 **History**: Browse your historical entries and search by keywords
- 👥 **Social Features**: Tag other users, friend system, social feed
- 🔐 **Authentication**: Secure user accounts with Clerk
- 💾 **Database**: Persistent storage with PostgreSQL via Prisma ORM
- 📅 **On This Day**: View memories from past years on the same date
- 🎁 **Wrapped**: Year-end summary of your music journey

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS
- **Mobile**: Expo React Native (iOS & Android)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Music API**: Spotify Web API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Spotify Developer Account
- Clerk Account

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Spotify API
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
```

3. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Update your `.env.local` file with the credentials

## Clerk Authentication Setup

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your Publishable Key and Secret Key
4. Update your `.env.local` file with the credentials

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── entries/      # Song entry endpoints
│   │   ├── songs/        # Spotify search endpoint
│   │   ├── analytics/    # Analytics endpoint
│   │   ├── feed/         # Social feed
│   │   ├── friends/      # Friend system
│   │   └── ...           # Other endpoints
│   ├── home/             # Landing page
│   ├── sign-in/          # Clerk sign-in
│   ├── sign-up/          # Clerk sign-up
│   └── page.tsx          # Main dashboard
├── mobile/                # Expo React Native mobile app
│   ├── app/              # Expo Router app directory
│   ├── lib/              # Mobile utilities
│   └── assets/           # Mobile assets
├── components/            # React components
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── AddEntryTab.tsx   # Add new song entry
│   ├── AnalyticsTab.tsx  # Analytics view
│   ├── FeedTab.tsx       # Social feed
│   ├── MemoryTab.tsx     # On This Day memories
│   └── ...               # Other components
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── clerk-sync.ts     # Clerk user sync
│   └── spotify.ts        # Spotify API client
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema
└── types/                 # TypeScript type definitions
```

## Database Schema

- **User**: User accounts with Clerk authentication
- **Entry**: Song of the day entries with metadata
- **EntryTag**: Tagging system for entries
- **FriendRequest**: Friend system
- **Mention**: Social mentions
- **Notification**: User notifications
- **PersonReference**: Tag people (app users or not)

## Development

### Web App
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npx prisma studio` - Open Prisma Studio to view/edit database
- `npx prisma db push` - Push schema changes to database

### Mobile App
- `cd mobile && npm install` - Install mobile dependencies
- `cd mobile && npm start` - Start Expo development server
- `cd mobile && npm run ios` - Run on iOS simulator
- `cd mobile && npm run android` - Run on Android emulator
- See `mobile/GETTING_STARTED.md` for detailed mobile setup instructions

## Documentation

See `SONGBIRD_DOCUMENTATION.md` for complete documentation including:
- Design system and UI guidelines
- API route reference
- Deployment instructions
- Feature roadmap
- Business strategy

## License

MIT
