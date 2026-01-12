# Setup Instructions

Follow these steps to get SongBird up and running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database (PostgreSQL - Supabase recommended)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Spotify API - Get these from https://developer.spotify.com/dashboard
SPOTIPY_CLIENT_ID=your-spotify-client-id
SPOTIPY_CLIENT_SECRET=your-spotify-client-secret
```

### Getting Spotify API Credentials:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create an app"
3. Fill in app details (name, description)
4. Copy the Client ID and Client Secret

### Getting Clerk Credentials:

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Go to **API Keys** in your Clerk dashboard
4. Copy the Publishable Key and Secret Key

### Setting Up PostgreSQL (Supabase):

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to **Settings** → **Database**
4. Copy the connection string (URI format)
5. Replace `[YOUR-PASSWORD]` with your database password

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

1. Navigate to the home page
2. Click "Sign Up" to create an account via Clerk
3. Start adding songs of the day!

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
- The app uses client credentials flow for searching

### Clerk Authentication Issues

- Ensure your Clerk keys are correct in `.env.local`
- **Always restart the dev server** after changing environment variables
- Clear the `.next` folder if issues persist: `Remove-Item -Recurse -Force .next`

### Port Already in Use

If port 3000 is already in use:
```bash
# Use a different port
PORT=3001 npm run dev
```

## Next Steps

- Customize the UI colors in `tailwind.config.js`
- Deploy to Vercel (see `DEPLOYMENT.md`)
- Check `SONGBIRD_DOCUMENTATION.md` for complete documentation
