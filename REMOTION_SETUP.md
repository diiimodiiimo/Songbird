# SongBird Remotion Demo Videos - Quick Start

## What's Included

I've set up Remotion for creating demo videos for SongBird. Here's what you have:

### 5 Demo Videos Created:

1. **SongbirdOverview** - Main app introduction with feature highlights
2. **DailyEntry** - Shows the daily song logging flow
3. **SocialFeed** - Demonstrates the social feed and friend interactions
4. **Analytics** - Showcases insights and analytics dashboard
5. **OnThisDay** - Features the memory system showing past entries

## Quick Start

### 1. Open Remotion Studio (Preview Videos)

```bash
npm run remotion:studio
```

This opens a browser window where you can:
- Preview all videos
- Adjust timing and animations
- Test different compositions

### 2. Render Individual Videos

```bash
# Render overview video
npm run remotion:render:overview

# Render daily entry demo
npm run remotion:render:daily

# Render social feed demo
npm run remotion:render:feed

# Render analytics demo
npm run remotion:render:analytics

# Render memories demo
npm run remotion:render:memories
```

### 3. Render All Videos at Once

```bash
npm run remotion:render:all
```

Videos will be saved to the `out/` directory as MP4 files.

## Video Specifications

- **Resolution**: 1080x1920 (9:16 vertical, perfect for Instagram/TikTok)
- **Frame Rate**: 30 FPS
- **Format**: MP4 (H.264)
- **Duration**: 10-15 seconds each

## Customization

### Change Colors

All videos use SongBird's design system colors. To change them, edit the color variables in each composition file:
- `remotion/compositions/Overview.tsx`
- `remotion/compositions/DailyEntry.tsx`
- etc.

### Adjust Timing

Edit the `startFrame` and `endFrame` values in the animation components to change when elements appear.

### Change Duration

Modify `durationInFrames` in `remotion/Root.tsx` for each composition.

## Project Structure

```
remotion/
├── Root.tsx              # All video compositions registered here
├── index.ts              # Remotion entry point
├── remotion.config.ts     # Remotion settings
├── compositions/          # Individual video compositions
│   ├── Overview.tsx
│   ├── DailyEntry.tsx
│   ├── SocialFeed.tsx
│   ├── Analytics.tsx
│   └── OnThisDay.tsx
└── components/            # Reusable animation components
    ├── FadeIn.tsx         # Fade in animation
    ├── SlideUp.tsx        # Slide up animation
    ├── SlideIn.tsx        # Slide in from sides
    ├── CountUp.tsx        # Number counting animation
    ├── SongbirdLogo.tsx   # Animated bird logo
    └── FeatureCard.tsx    # Feature card component
```

## Tips

- **Preview First**: Always use `remotion:studio` to preview before rendering
- **Social Media**: These videos are optimized for Instagram Stories, TikTok, and YouTube Shorts
- **File Size**: Videos are rendered at high quality - you may want to compress them for web use
- **Customization**: Feel free to modify the content, colors, and timing to match your needs

## Next Steps

1. Run `npm run remotion:studio` to preview the videos
2. Customize the content to match your exact needs
3. Render the videos you want to use
4. Share them on social media or your website!

For more details, see `remotion/README.md`.



