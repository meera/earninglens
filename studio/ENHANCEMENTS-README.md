# Enhancement Components - Usage Guide

## Overview

The enhancement system provides **reusable, brand-aware components** that adapt to company branding automatically.

## Components Created

### 1. **MetricDisplay** - Animated metric cards
**Location**: `src/components/enhancements/MetricDisplay.tsx`

**Props**:
- `metric` - Metric name (e.g., "Revenue", "EPS")
- `value` - Metric value (e.g., "$1.3B", "3.9M")
- `change` - Change indicator (e.g., "+100% YoY", "Record")
- `changeType` - 'positive' | 'negative' | 'neutral'
- `brandColors` - Company brand colors
- `position` - Where to display (center, top-right, etc.)
- `animationStyle` - fade | slide-up | bounce | scale

**Example**:
```tsx
<MetricDisplay
  metric="Revenue"
  value="$1.3B"
  change="+100% YoY"
  changeType="positive"
  brandColors={robinhoodBrand.brandColors}
  position="center"
  animationStyle="bounce"
/>
```

---

### 2. **AnimatedTitle** - Opening title card
**Location**: `src/components/enhancements/AnimatedTitle.tsx`

**Props**:
- `company` - Company name
- `quarter` - Quarter (Q1, Q2, Q3, Q4)
- `year` - Year (2025)
- `brandColors` - Company brand colors
- `logo` - Optional logo URL
- `subtitle` - Optional subtitle (default: "Earnings Call")

**Example**:
```tsx
<AnimatedTitle
  company="Robinhood"
  quarter="Q3"
  year={2025}
  brandColors={robinhoodBrand.brandColors}
  logo="https://logo.clearbit.com/robinhood.com"
/>
```

---

### 3. **CompanyLogo** - Persistent watermark logo
**Location**: `src/components/enhancements/CompanyLogo.tsx`

**Props**:
- `logoUrl` - Logo image URL
- `brandColors` - Company brand colors
- `position` - top-left | top-right | bottom-left | bottom-right
- `size` - small | medium | large
- `opacity` - 0 to 1 (default: 0.8)
- `persistent` - Show throughout video

**Example**:
```tsx
<CompanyLogo
  logoUrl="https://logo.clearbit.com/robinhood.com"
  brandColors={robinhoodBrand.brandColors}
  position="top-left"
  size="small"
  opacity={0.8}
/>
```

---

### 4. **SpeakerLabel** - Speaker identification
**Location**: `src/components/enhancements/SpeakerLabel.tsx`

**Props**:
- `name` - Speaker name
- `title` - Speaker title/role
- `photoUrl` - Optional photo URL
- `brandColors` - Company brand colors
- `position` - bottom-left | bottom-right | top-left | top-right
- `showPhoto` - Show speaker photo (default: false)

**Example**:
```tsx
<SpeakerLabel
  name="Vlad Tenev"
  title="CEO"
  brandColors={robinhoodBrand.brandColors}
  position="bottom-left"
  showPhoto={false}
/>
```

---

### 5. **ChapterProgress** - Chapter progress bar
**Location**: `src/components/enhancements/ChapterProgress.tsx`

**Props**:
- `chapters` - Array of chapters with timestamps
- `brandColors` - Company brand colors
- `position` - top | bottom
- `showChapterName` - Show current chapter name

**Example**:
```tsx
<ChapterProgress
  chapters={[
    {timestamp: 0, title: 'Opening', description: 'CEO intro'},
    {timestamp: 300, title: 'Financials', description: 'Q3 results'},
  ]}
  brandColors={robinhoodBrand.brandColors}
  position="top"
  showChapterName={true}
/>
```

---

### 6. **CallToAction** - End-screen CTA
**Location**: `src/components/enhancements/CallToAction.tsx`

**Props**:
- `message` - CTA message
- `url` - Optional URL to display
- `brandColors` - Company brand colors
- `showSubscribe` - Show subscribe button

**Example**:
```tsx
<CallToAction
  message="View full analysis with interactive charts"
  url="EarningLens.com/HOOD/Q3-2025"
  brandColors={robinhoodBrand.brandColors}
  showSubscribe={true}
/>
```

---

## Usage in Video Compositions

### Loading Brand Data

```typescript
import {BrandProfile} from '../types/brand';
import robinhoodBrandData from '../../../lens/companies/HOOD.json';

const robinhoodBrand: BrandProfile = robinhoodBrandData;
```

### Typical Video Structure

```tsx
export const EarningsVideo: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* 1. Title card (0-5s) */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <AnimatedTitle
          company={brand.name}
          quarter="Q3"
          year={2025}
          brandColors={brand.brandColors}
          logo={brand.logo.url}
        />
      </Sequence>

      {/* 2. Main video content */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 15}>
        {/* Video player, transcripts, etc. */}
      </Sequence>

      {/* 3. Metric overlays (at specific timestamps) */}
      <Sequence from={fps * 15} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Revenue"
          value="$1.3B"
          change="+100%"
          changeType="positive"
          brandColors={brand.brandColors}
        />
      </Sequence>

      {/* 4. Persistent elements */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 5}>
        <CompanyLogo
          logoUrl={brand.logo.url}
          brandColors={brand.brandColors}
        />
        <ChapterProgress
          chapters={chapters}
          brandColors={brand.brandColors}
        />
      </Sequence>

      {/* 5. End CTA */}
      <Sequence from={durationInFrames - fps * 10} durationInFrames={fps * 10}>
        <CallToAction
          message="View full analysis"
          url="EarningLens.com"
          brandColors={brand.brandColors}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
```

---

## Viewing the Demo

1. **Start Remotion Studio**:
   ```bash
   cd studio
   npm start
   ```

2. **Navigate to**: `Animated-Components` → `EnhancementsDemo`

3. **Preview** all enhancement components in action with Robinhood branding

---

## Customization

### Changing Brands

Simply pass a different brand profile:

```tsx
import palantirBrandData from '../../../lens/companies/PLTR.json';

<MetricDisplay
  brandColors={palantirBrandData.brandColors}  // Now uses Palantir blue
  // ... other props
/>
```

### Animation Timing

All components use Remotion's `spring` and `interpolate` for smooth animations:

- **Fast brands** (Robinhood): Higher stiffness, faster animations
- **Professional brands** (Palantir): Slower, smoother transitions

Adjust in component code or brand profile.

---

## File Structure

```
studio/
├── src/
│   ├── components/
│   │   └── enhancements/
│   │       ├── AnimatedTitle.tsx
│   │       ├── CallToAction.tsx
│   │       ├── ChapterProgress.tsx
│   │       ├── CompanyLogo.tsx
│   │       ├── MetricDisplay.tsx
│   │       ├── SpeakerLabel.tsx
│   │       └── index.ts
│   ├── types/
│   │   └── brand.ts              # TypeScript types
│   └── compositions/
│       └── EnhancementsDemo.tsx  # Example composition
│
lens/
├── companies/
│   ├── HOOD.json                 # Robinhood brand
│   ├── PLTR.json                 # Palantir brand
│   └── _default.json             # Fallback
└── enhancement-templates/
    └── earnings-call.json        # Standard template
```

---

## Next Steps

1. ✅ Components built and tested
2. ⏳ Create LLM script to generate enhancements.json from transcript
3. ⏳ Build full earnings video composition using enhancement system
4. ⏳ Test with Robinhood Q3 2025 video

---

## Benefits

✅ **Reusable** - Same components for all companies
✅ **Brand-aware** - Automatically adapts to company colors
✅ **Consistent** - Standardized look across all videos
✅ **Scalable** - Add new brands without code changes
✅ **Maintainable** - Update one component, affects all videos
