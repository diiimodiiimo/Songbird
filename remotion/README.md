# SongBird Remotion Demo Videos

This directory contains Remotion compositions for creating demo videos showcasing SongBird features.

## Setup

Remotion is already installed. To get started:

```bash
npm run remotion:studio
```

This will open the Remotion Studio where you can preview and edit videos.

## Available Videos

1. **SongbirdOverview** - Main app overview and feature highlights
2. **DailyEntry** - Daily song logging flow demonstration
3. **SocialFeed** - Social feed and friend interactions
4. **Analytics** - Insights and analytics dashboard
5. **OnThisDay** - Memory feature showcasing past entries

## Rendering Videos

### Render Individual Videos

```bash
# Overview video
npm run remotion:render:overview

# Daily entry demo
npm run remotion:render:daily

# Social feed demo
npm run remotion:render:feed

# Analytics demo
npm run remotion:render:analytics

# On This Day demo
npm run remotion:render:memories
```

### Render All Videos

```bash
npm run remotion:render:all
```

Videos will be saved to the `out/` directory.

## Video Specifications

- **Resolution**: 1080x1920 (9:16, mobile-first)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264)

## Customization

### Changing Video Duration

Edit the `durationInFrames` prop in `Root.tsx` for each composition.

### Changing Colors

The color scheme matches SongBird's design system:
- Background: `#1a1816`
- Surface: `#2f2a26`
- Text: `#E3E1DB`
- Accent: `#B65A2A`
- Muted: `#9A9D9A`

Update colors in individual composition files.

### Adding New Videos

1. Create a new composition in `compositions/`
2. Import and add it to `Root.tsx`
3. Add a render script to `package.json`

## Project Structure

```
remotion/
├── Root.tsx              # Main entry point with all compositions
├── index.ts              # Remotion registration
├── remotion.config.ts     # Remotion configuration
├── compositions/          # Video compositions
│   ├── Overview.tsx
│   ├── DailyEntry.tsx
│   ├── SocialFeed.tsx
│   ├── Analytics.tsx
│   └── OnThisDay.tsx
└── components/            # Reusable animation components
    ├── FadeIn.tsx
    ├── SlideUp.tsx
    ├── SlideIn.tsx
    ├── CountUp.tsx
    ├── SongbirdLogo.tsx
    └── FeatureCard.tsx
```

## Tips

- Use Remotion Studio to preview videos before rendering
- Adjust timing by modifying `startFrame` and `endFrame` values
- Test animations at different frame rates
- Keep videos concise (10-15 seconds for social media)




