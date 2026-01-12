# SOTD - Songs of the Day

A full-stack Next.js application for tracking your daily music journal with social features. Migrated from Streamlit to a modern React/Next.js architecture.

## Features

- 🎵 **Song Search**: Search and add songs from Spotify
- 📝 **Daily Journal**: Add notes and memories to each song entry
- 📊 **Analytics**: View your top artists and songs with various time filters
- 📜 **History**: Browse your historical entries and search by keywords
- 👥 **Social Features**: Tag other users in your song entries
- 🔐 **Authentication**: Secure user accounts with NextAuth.js
- 💾 **Database**: Persistent storage with Prisma ORM

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **Music API**: Spotify Web API

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Spotify Developer Account (for API credentials)
- (Optional) PostgreSQL for production

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Spotify API
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
SPOTIPY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
PLAYLIST_ID=your-spotify-playlist-id
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
4. Add `http://localhost:3000/api/auth/callback/spotify` to your app's redirect URIs (if using OAuth)
5. Update your `.env` file with the credentials

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── entries/      # Song entry endpoints
│   │   ├── songs/        # Spotify search endpoint
│   │   └── analytics/    # Analytics endpoint
│   ├── auth/             # Authentication pages
│   └── page.tsx          # Main dashboard
├── components/            # React components
│   ├── Dashboard.tsx     # Main dashboard component
│   ├── AddEntryTab.tsx   # Add new song entry
│   ├── AnalyticsTab.tsx  # Analytics view
│   ├── HistoryTab.tsx    # Historical entries
│   └── FullHistoryTab.tsx # Full history with search
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   └── auth.ts           # NextAuth configuration
├── prisma/                # Database schema
│   └── schema.prisma     # Prisma schema
└── types/                 # TypeScript type definitions
```

## Database Schema

- **User**: User accounts with authentication
- **Entry**: Song of the day entries with metadata
- **EntryTag**: Many-to-many relationship for tagging users in entries

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Prisma Studio to view/edit database
- `npm run db:push` - Push schema changes to database

## Migration from Streamlit

This application is a complete rewrite of the original Streamlit app (`sotdapp6.py`) with the following improvements:

- ✅ Full authentication system
- ✅ Multi-user support
- ✅ Social tagging features
- ✅ Modern React UI with Tailwind CSS
- ✅ Database instead of Google Sheets
- ✅ RESTful API architecture
- ✅ Type-safe with TypeScript

## Future Enhancements

- [ ] Spotify OAuth for playlist management
- [ ] User profiles and public/private entries
- [ ] Follow system for social interactions
- [ ] Comments and reactions on entries
- [ ] Export data functionality
- [ ] Mobile app support

## License

MIT






