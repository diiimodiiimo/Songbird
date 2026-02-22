# Connecting Custom Domain to Vercel & Expo

**Domain**: `songbiiird.com`  
**Purpose**: Connect domain to Vercel (web app) and configure Expo (mobile app) to use it.

---

## Quick Answer

**Vercel (Web App)**: ✅ Yes, easy to connect  
**Expo (Mobile App)**: ⚠️ Different - mobile apps don't use domains directly, but you can:
- Use domain for API endpoints
- Host web version of Expo app
- Use domain for deep linking
- Host landing page

---

## Part 1: Connecting Domain to Vercel (Web App)

### Step 1: Purchase Domain

1. Go to domain registrar (Namecheap, Google Domains, Cloudflare)
2. Search for `songbiiird.com`
3. Purchase domain (~$10-15/year for .com)
4. Complete checkout

### Step 2: Add Domain to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in to your account
   - Select your SongBird project

2. **Navigate to Domain Settings**
   - Click **Settings** tab
   - Click **Domains** in left sidebar
   - Click **Add Domain** button

3. **Enter Your Domain**
   - Type: `songbiiird.com`
   - Click **Add**

4. **Vercel Will Show DNS Instructions**
   - You'll see DNS records to add
   - Usually just an A record or CNAME

### Step 3: Configure DNS at Domain Registrar

**Option A: Using Namecheap (Example)**

1. Go to Namecheap dashboard
2. Click **Domain List** → **Manage** for `songbiiird.com`
3. Go to **Advanced DNS** tab
4. Add DNS record:
   - **Type**: CNAME Record
   - **Host**: `@` (or leave blank)
   - **Value**: `cname.vercel-dns.com` (Vercel will provide exact value)
   - **TTL**: Automatic

**Option B: Using Google Domains**

1. Go to Google Domains dashboard
2. Click **DNS** for `songbiiird.com`
3. Add custom resource record:
   - **Name**: `@`
   - **Type**: CNAME
   - **Data**: `cname.vercel-dns.com` (Vercel will provide exact value)

**Option C: Using Cloudflare**

1. Add domain to Cloudflare
2. Go to **DNS** settings
3. Add CNAME record:
   - **Name**: `@`
   - **Target**: `cname.vercel-dns.com` (Vercel will provide exact value)
   - **Proxy**: Off (or On, both work)

### Step 4: Wait for DNS Propagation

- DNS changes take 5 minutes to 48 hours
- Usually works within 1-2 hours
- Vercel will show status: "Valid Configuration" when ready

### Step 5: Test Domain

1. Visit `https://songbiiird.com` in browser
2. Should load your SongBird app
3. HTTPS is automatic (Vercel provides SSL)

### Step 6: Update Clerk Settings

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your SongBird application
3. Go to **Settings** → **Domains**
4. Add `songbiiird.com` to **Allowed Origins**
5. Update redirect URLs if needed:
   - `https://songbiiird.com/sign-in`
   - `https://songbiiird.com/sign-up`

---

## Part 2: Configuring Expo (Mobile App)

### Important: How Mobile Apps Use Domains

**Mobile apps don't directly use domains like web apps do.** Instead:

1. **API Endpoints**: Mobile app calls your API (which is on your domain)
2. **Web Version**: Expo can build a web version that uses your domain
3. **Deep Linking**: Domain can handle deep links (songbiiird.com/song/123)
4. **Landing Page**: Domain can host a landing page that links to app stores

### Step 1: Update Expo Config for API URL

Update `mobile/app.config.ts` to use your domain for API calls:

```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // ... existing config ...
  extra: {
    eas: {
      projectId: 'f03ed9db-623c-45ea-b95b-2fb2d4d351f9',
    },
    clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
    // Update API URL to use your domain
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://songbiiird.com',
  },
});
```

### Step 2: Set Environment Variable

Create `mobile/.env` file:

```env
EXPO_PUBLIC_API_URL=https://songbiiird.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key_here
```

### Step 3: Update API Calls in Mobile App

Make sure your mobile app uses the `apiUrl` from config:

```typescript
// Example: mobile/lib/api.ts
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://songbiiird.com';

export async function fetchEntries() {
  const response = await fetch(`${API_URL}/api/entries`);
  return response.json();
}
```

### Step 4: Build Web Version (Optional)

If you want to host a web version of your Expo app:

```bash
cd mobile
npx expo export:web
```

This creates a web build that can be hosted on your domain.

### Step 5: Configure Deep Linking (Optional)

For deep links like `songbiiird.com/song/123`:

1. **Update Expo Config**:
```typescript
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  scheme: 'songbird', // For app:// links
  // Add web support
  web: {
    ...config.web,
    bundler: 'metro',
  },
});
```

2. **Add Deep Link Handling**:
   - Create route handler in Next.js app
   - Redirect to mobile app if installed
   - Show web version if not

---

## Part 3: Complete Setup Checklist

### Domain Setup
- [ ] Domain purchased (`songbiiird.com`)
- [ ] Domain added to Vercel project
- [ ] DNS records configured at registrar
- [ ] DNS propagation complete (Vercel shows "Valid Configuration")
- [ ] Domain loads in browser (`https://songbiiird.com`)
- [ ] HTTPS working (automatic with Vercel)
- [ ] Clerk settings updated with new domain

### Expo Setup
- [ ] `app.config.ts` updated with API URL
- [ ] Environment variables set (`EXPO_PUBLIC_API_URL`)
- [ ] API calls in mobile app use domain
- [ ] Test API calls from mobile app work
- [ ] Deep linking configured (optional)
- [ ] Web version built (optional)

### Testing
- [ ] Web app loads at `https://songbiiird.com`
- [ ] Mobile app can call API at `https://songbiiird.com/api/*`
- [ ] Authentication works with new domain
- [ ] All features work with domain

---

## Part 4: Common Issues & Solutions

### Issue: Domain Not Loading

**Symptoms**: `songbiiird.com` shows error or doesn't load

**Solutions**:
1. Check DNS propagation: Use [whatsmydns.net](https://www.whatsmydns.net)
2. Verify DNS records match Vercel's instructions exactly
3. Wait 1-2 hours for DNS to propagate
4. Check Vercel dashboard for domain status

### Issue: HTTPS Not Working

**Symptoms**: Site loads but shows "Not Secure"

**Solutions**:
1. Vercel provides SSL automatically (wait 5-10 minutes)
2. Force HTTPS redirect in Vercel settings
3. Check domain status in Vercel dashboard

### Issue: Mobile App Can't Connect to API

**Symptoms**: Mobile app shows network errors

**Solutions**:
1. Verify `EXPO_PUBLIC_API_URL` is set correctly
2. Check API endpoints are accessible: `https://songbiiird.com/api/entries`
3. Verify CORS settings allow mobile app
4. Check Vercel function logs for errors

### Issue: Clerk Authentication Fails

**Symptoms**: Sign in/sign up doesn't work

**Solutions**:
1. Add `songbiiird.com` to Clerk **Allowed Origins**
2. Update Clerk redirect URLs
3. Verify environment variables are set in Vercel
4. Check Clerk dashboard for errors

---

## Part 5: DNS Record Examples

### Vercel CNAME Record (Most Common)

**At Your Domain Registrar:**

```
Type: CNAME
Name: @ (or blank)
Value: cname.vercel-dns.com
TTL: Automatic
```

**Note**: Vercel will provide the exact CNAME value when you add the domain.

### Vercel A Record (Alternative)

**If CNAME doesn't work:**

```
Type: A
Name: @
Value: 76.76.21.21 (Vercel will provide IP)
TTL: Automatic
```

### WWW Subdomain (Optional)

**To support www.songbiiird.com:**

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Automatic
```

---

## Part 6: Environment Variables Update

### Update Vercel Environment Variables

After connecting domain, update these if needed:

```
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://songbiiird.com/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://songbiiird.com/
```

### Update Mobile App Environment Variables

In `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://songbiiird.com
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Part 7: Final Configuration

### Update Next.js Config (Optional)

If you want to enforce your domain:

```javascript
// next.config.js
const nextConfig = {
  // ... existing config ...
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'your-project.vercel.app',
          },
        ],
        destination: 'https://songbiiird.com',
        permanent: true,
      },
    ];
  },
};
```

### Update Mobile App API Base URL

Make sure all API calls use the domain:

```typescript
// mobile/lib/api.ts
const API_BASE_URL = 'https://songbiiird.com';

export const api = {
  entries: `${API_BASE_URL}/api/entries`,
  songs: `${API_BASE_URL}/api/songs`,
  // ... etc
};
```

---

## Summary

**For Vercel (Web App):**
1. ✅ Buy domain
2. ✅ Add domain to Vercel
3. ✅ Configure DNS records
4. ✅ Wait for propagation
5. ✅ Update Clerk settings

**For Expo (Mobile App):**
1. ✅ Update `app.config.ts` with API URL
2. ✅ Set environment variables
3. ✅ Update API calls to use domain
4. ✅ Test API connectivity

**Result:**
- Web app: `https://songbiiird.com` ✅
- Mobile app: Uses `https://songbiiird.com/api/*` ✅
- Both work together seamlessly ✅

---

*Note: The domain `songbiiird.com` (with triple 'i') is unusual. Consider if this is intentional or if you meant `songbird.com` (single 'i'). Triple 'i' might be harder for users to remember/type correctly.*



