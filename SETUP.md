# Setup Instructions

Follow these steps to get your SOTD app up and running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth - Generate a random secret: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Spotify API - Get these from https://developer.spotify.com/dashboard
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
SPOTIPY_REDIRECT_URI=http://localhost:3000/api/auth/callback/spotify
PLAYLIST_ID=your-spotify-playlist-id
```

### Getting Spotify API Credentials:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an app"
3. Fill in app details (name, description)
4. Copy the Client ID and Client Secret
5. Click "Edit Settings" and add `http://localhost:3000/api/auth/callback/spotify` to Redirect URIs (if you plan to use OAuth later)

### Generating NextAuth Secret:

On Linux/Mac:
```bash
openssl rand -base64 32
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## 3. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database and tables
npx prisma db push
```

## 4. Start Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 5. Create Your First Account

1. Navigate to `/auth/signup`
2. Create an account with your email and password
3. Sign in at `/auth/signin`
4. Start adding songs of the day!

## Troubleshooting

### Database Issues

If you encounter database errors:
```bash
# Reset the database (WARNING: This deletes all data)
npx prisma migrate reset

# Or just push the schema again
npx prisma db push
```

### Spotify API Issues

- Make sure your Spotify app credentials are correct
- Check that your redirect URI matches exactly
- The app uses client credentials flow for searching, so OAuth redirect URI might not be needed initially

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
PORT=3001 npm run dev
```

## Next Steps

- Customize the UI colors in `tailwind.config.js`
- Add more features like user profiles, comments, etc.
- Deploy to Vercel, Railway, or your preferred hosting platform
- Switch to PostgreSQL for production (update DATABASE_URL)







