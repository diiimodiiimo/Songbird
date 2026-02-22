# /onboarding-flow

Help with the SongBird onboarding flow - multi-step user introduction experience.

## Flow Overview

```
Welcome → Why SongBird → Value Props → Social Preview → 
Terms → Spotify Primer → Username → First Entry → 
First Entry Celebration → Memories → Social/Invite → 
Notifications → Attribution → Premium → Completion
```

## Key Files

### Components (`components/onboarding/`)
- `OnboardingFlow.tsx` - Main controller, manages step state
- `WelcomeScreen.tsx` - Initial welcome
- `WhySongBirdScreen.tsx` - Value proposition
- `ValueProp1Screen.tsx`, `ValueProp2Screen.tsx` - Feature highlights
- `SocialPreviewScreen.tsx` - Show social features
- `TermsAcceptanceScreen.tsx` - Legal acceptance
- `SpotifyDataPrimerScreen.tsx` - Explain Spotify usage
- `UsernameScreen.tsx` - Set username (required)
- `FirstEntryScreen.tsx` - Log first song
- `FirstEntryCelebrationScreen.tsx` - Celebrate first entry
- `MemoriesScreen.tsx` - Explain On This Day
- `SocialScreen.tsx` - Invite friends
- `NotificationSetupScreen.tsx` - Push notification permission
- `AttributionScreen.tsx` - Credits/Spotify attribution
- `PremiumScreen.tsx` - Founding Flock/premium offer
- `CompletionScreen.tsx` - Final welcome

### Routes
- `app/welcome/page.tsx` - Entry point
- `app/api/onboarding/complete/route.ts` - Mark completion

## Database Fields

```prisma
model User {
  onboardingCompletedAt DateTime?
  onboardingSkippedAt   DateTime?
}
```

## Analytics Events

```typescript
import { trackEvent, AnalyticsEvents } from '@/lib/analytics'

// Track onboarding events
trackEvent({ userId, event: AnalyticsEvents.ONBOARDING_STARTED })
trackEvent({ userId, event: AnalyticsEvents.ONBOARDING_STEP_COMPLETED, properties: { step: 'username' } })
trackEvent({ userId, event: AnalyticsEvents.ONBOARDING_COMPLETED })
trackEvent({ userId, event: AnalyticsEvents.ONBOARDING_SKIPPED })
```

## Screen Component Pattern

```tsx
interface ScreenProps {
  onNext: () => void
  onBack?: () => void
  onSkip?: () => void
}

export default function MyScreen({ onNext, onBack, onSkip }: ScreenProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header with back/skip */}
      <div className="p-4 flex justify-between">
        {onBack && <button onClick={onBack}>← Back</button>}
        {onSkip && <button onClick={onSkip}>Skip</button>}
      </div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Screen content */}
      </div>
      
      {/* Footer with CTA */}
      <div className="p-4">
        <button onClick={onNext} className="w-full bg-accent text-bg py-3 rounded-xl">
          Continue
        </button>
      </div>
    </div>
  )
}
```

## Step Management

```tsx
const [currentStep, setCurrentStep] = useState(0)

const steps = [
  { id: 'welcome', component: WelcomeScreen },
  { id: 'username', component: UsernameScreen, required: true },
  // ...
]

const handleNext = () => setCurrentStep(prev => prev + 1)
const handleBack = () => setCurrentStep(prev => prev - 1)
const handleSkip = () => setCurrentStep(steps.length - 1) // Jump to completion
```

## Conditional Steps

Some steps should be skipped based on user state:
- Skip Username if already set
- Skip First Entry if user has entries
- Skip Premium if already member

```tsx
const shouldShowStep = (step: string) => {
  if (step === 'username' && user?.username) return false
  if (step === 'first-entry' && hasEntries) return false
  if (step === 'premium' && user?.isPremium) return false
  return true
}
```

## Testing Onboarding

Access directly: `/test-onboarding` or `/welcome?force=true`

## Common Issues

### "User stuck on step"
- Check step validation logic
- Verify `onNext` is called
- Check for errors in step component

### "Onboarding shows again"
- Check `onboardingCompletedAt` is set
- Verify Dashboard checks completion

### "Skip doesn't work"
- Check `onboardingSkippedAt` is set
- Verify skip analytics tracking



