# /app-store-prep

Help prepare SongBird for App Store (iOS) and Google Play (Android) submission.

## Key Documents

- `APP_STORE_CHECKLIST.md` - Submission requirements
- `APP_STORE_READINESS_ANALYSIS.md` - Current status
- `mobile/GETTING_STARTED.md` - Mobile development setup
- `docs/STRIPE_SETUP_GUIDE.md` - In-app purchases

## iOS App Store Requirements

### App Information
- [ ] App name (30 char max)
- [ ] Subtitle (30 char max)
- [ ] Description (4000 char max)
- [ ] Keywords (100 char max)
- [ ] Categories (primary + secondary)
- [ ] Age rating questionnaire

### Screenshots
- [ ] 6.7" display (iPhone 15 Pro Max): 1290 x 2796
- [ ] 6.5" display (iPhone 14 Plus): 1242 x 2688
- [ ] 5.5" display (iPhone 8 Plus): 1242 x 2208
- [ ] iPad Pro 12.9": 2048 x 2732
- Min 3, max 10 screenshots per device

### App Icon
- [ ] 1024 x 1024 PNG (no transparency)
- [ ] No rounded corners (Apple adds them)

### Required Pages
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] Support URL
- [ ] Marketing URL (optional)

### Legal
- [ ] EULA (can use Apple's standard)
- [ ] Privacy practices disclosure
- [ ] Data collection transparency

## Google Play Requirements

### Store Listing
- [ ] App name (30 char max)
- [ ] Short description (80 char max)
- [ ] Full description (4000 char max)
- [ ] App category
- [ ] Tags

### Graphics
- [ ] Feature graphic: 1024 x 500
- [ ] App icon: 512 x 512
- [ ] Screenshots: Min 2, max 8 per device type
- [ ] Phone: 16:9 or 9:16 aspect ratio
- [ ] 7" tablet: Same ratios
- [ ] 10" tablet: Same ratios

### Content Rating
- [ ] Complete IARC questionnaire
- [ ] Age-appropriate content declaration

### Data Safety
- [ ] Data collection disclosure
- [ ] Data sharing practices
- [ ] Security practices

## Technical Requirements

### iOS
```bash
# Build for TestFlight
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios
```

### Android
```bash
# Build for Google Play
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## In-App Purchases

If using Stripe (web) + App Store (mobile):
- Must use StoreKit for iOS purchases
- Must use Google Play Billing for Android
- Web can use Stripe directly

### StoreKit Setup
1. Create products in App Store Connect
2. Implement `react-native-iap` or similar
3. Handle subscription status sync

## Required Legal Pages

### Privacy Policy
Must include:
- Data collected (email, songs, notes)
- How data is used
- Third-party services (Spotify, Clerk, etc.)
- Data retention policy
- Contact information

### Terms of Service
Must include:
- Acceptable use policy
- Content guidelines
- Termination rights
- Limitation of liability

## Testing Checklist

### Before Submission
- [ ] All features work on physical devices
- [ ] Deep links work correctly
- [ ] Push notifications work
- [ ] In-app purchases work (sandbox)
- [ ] No crashes or major bugs
- [ ] Performance is acceptable
- [ ] Offline handling is graceful

### Review Common Rejections
- [ ] No placeholder content
- [ ] No broken links
- [ ] Login works (provide test account)
- [ ] No references to other platforms
- [ ] Proper age rating
- [ ] All required metadata complete

## App Review Notes

Provide to Apple/Google:
```
Test Account:
Email: test@songbird.app
Password: TestPassword123!

Notes:
- SongBird is a music journaling app
- Requires Spotify search (works without Spotify account)
- Push notifications for daily reminders
- No in-app purchases currently
```

## Build Configuration

### eas.json
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### app.config.ts
```typescript
export default {
  name: 'SongBird',
  slug: 'songbird',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png' },
  ios: {
    bundleIdentifier: 'app.songbird.ios',
    buildNumber: '1',
  },
  android: {
    package: 'app.songbird.android',
    versionCode: 1,
  },
}
```

## Common Issues

### "App rejected for missing login"
- Provide clear test credentials
- Ensure login flow works perfectly

### "Privacy policy not accessible"
- Host on stable URL
- Test link before submission

### "Screenshots show placeholder content"
- Use real app data
- Show actual features


