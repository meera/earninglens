# Enhancement System Architecture

## Overview

The Enhancement System is a **data-driven** approach to applying visual enhancements to earnings call videos. Instead of hardcoding company-specific logic, we use:

1. **Company Brand Profiles** - JSON files with brand colors, logos, typography
2. **Enhancement Components** - Reusable React components that accept brand data
3. **Enhancement Manifests** - What enhancements to apply and when
4. **Templates** - Pre-configured enhancement sets for video types

---

## Directory Structure

```
earninglens/
├── lens/
│   ├── companies/              # Company brand profiles
│   │   ├── HOOD.json
│   │   ├── PLTR.json
│   │   ├── AAPL.json
│   │   └── _default.json       # Fallback
│   │
│   ├── enhancement-templates/  # Reusable templates
│   │   ├── earnings-call.json
│   │   ├── product-launch.json
│   │   └── investor-day.json
│   │
│   └── videos/
│       └── HOOD/
│           └── Q3-2025/
│               ├── metadata.json
│               ├── insights.json
│               └── enhancements.json  # Video-specific enhancements
│
└── studio/
    └── src/
        └── remotion/
            └── components/
                └── enhancements/   # Generic enhancement components
                    ├── AnimatedTitle.tsx
                    ├── SubscribeButton.tsx
                    ├── MetricDisplay.tsx
                    ├── CompanyLogo.tsx
                    ├── ChartOverlay.tsx
                    ├── SpeakerLabel.tsx
                    └── CallToAction.tsx
```

---

## 1. Company Brand Profiles

**Location**: `lens/companies/{TICKER}.json`

**Schema**:
```json
{
  "ticker": "HOOD",
  "name": "Robinhood",
  "brandColors": {
    "primary": "#00C805",        // Main brand color
    "secondary": "#00E805",      // Supporting color
    "accent": "#FF6154",         // Accent/warning color
    "background": "#000000",
    "backgroundGradient": ["#000000", "#1a1a1a"],
    "text": "#ffffff",
    "textSecondary": "#a0a0a0"
  },
  "typography": {
    "heading": "Inter, system-ui, sans-serif",
    "body": "Inter, system-ui, sans-serif",
    "mono": "JetBrains Mono, monospace",
    "headingWeight": "700",
    "bodyWeight": "400"
  },
  "logo": {
    "url": "https://logo.clearbit.com/robinhood.com",
    "backgroundColor": "#00C805",
    "position": "top-left"
  },
  "visualStyle": "modern-bold",     // Style preset
  "animations": {
    "speed": "fast",                // fast | medium | slow
    "style": "energetic",           // energetic | professional | smooth
    "transitions": "smooth"
  },
  "industry": "fintech"
}
```

**Usage**:
- LLM reads this to understand brand identity
- Components read this to apply styling
- Fallback to `_default.json` if ticker not found

---

## 2. Enhancement Templates

**Location**: `lens/enhancement-templates/{template-name}.json`

**Purpose**: Pre-configured enhancement sets for common video types

**Schema**:
```json
{
  "name": "Standard Earnings Call",
  "description": "Default enhancements for all earnings videos",
  "version": "1.0",
  "enhancements": [
    {
      "id": "title-card",
      "type": "animated-title",
      "timing": {
        "start": 0,           // Start time in seconds
        "duration": 5         // Duration in seconds
      },
      "config": {
        "template": "{company} Q{quarter} {year} Earnings Call",
        "animation": "fade-slide-up",
        "showLogo": true
      }
    },
    {
      "id": "logo-watermark",
      "type": "company-logo",
      "timing": {
        "start": 0,
        "persistent": true    // Show throughout video
      },
      "config": {
        "position": "top-left",
        "size": "small",
        "opacity": 0.8
      }
    }
  ]
}
```

**Built-in Templates**:
- `earnings-call.json` - Standard quarterly earnings
- `product-launch.json` - Product announcements
- `investor-day.json` - Annual investor presentations

---

## 3. Video Enhancement Manifests

**Location**: `lens/videos/{TICKER}/{QUARTER}/enhancements.json`

**Purpose**: Define what enhancements to apply for THIS specific video

**Schema**:
```json
{
  "videoId": "HOOD-Q3-2025",
  "template": "earnings-call",      // Inherit from template
  "brandProfile": "HOOD",           // Company brand to use

  "overrides": {
    // Override template settings
    "subscribe-start": {
      "timing": {"start": 5}        // Change timing from template
    }
  },

  "customEnhancements": [
    // Add video-specific enhancements
    {
      "id": "revenue-metric",
      "type": "metric-display",
      "timing": {
        "start": 930,               // When metric is mentioned
        "duration": 5
      },
      "config": {
        "metric": "Revenue",
        "value": "$1.3B",
        "change": "+100%",
        "changeType": "positive"
      }
    },
    {
      "id": "gold-subscribers",
      "type": "metric-display",
      "timing": {
        "start": 1370,
        "duration": 5
      },
      "config": {
        "metric": "Gold Subscribers",
        "value": "3.9M",
        "change": "+75%",
        "changeType": "positive"
      }
    }
  ]
}
```

---

## 4. Enhancement Components

**Location**: `studio/src/remotion/components/enhancements/`

**Purpose**: Generic, reusable components that accept brand data as props

### Example: MetricDisplay.tsx

```typescript
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandColors} from '../../../types/brand';

interface MetricDisplayProps {
  metric: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  brandColors: BrandColors;
  position?: 'center' | 'top-right' | 'bottom-left';
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  metric,
  value,
  change,
  changeType,
  brandColors,
  position = 'center',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Animate entrance
  const scale = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: {damping: 12},
  });

  const opacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
  });

  // Color based on change type
  const changeColor = changeType === 'positive'
    ? brandColors.primary
    : changeType === 'negative'
    ? brandColors.accent
    : brandColors.textSecondary;

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        justifyContent: position.includes('right') ? 'flex-end' : 'center',
        alignItems: position.includes('bottom') ? 'flex-end' : 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          background: `linear-gradient(135deg, ${brandColors.background}, ${brandColors.backgroundGradient?.[1] || brandColors.background})`,
          border: `2px solid ${brandColors.primary}`,
          borderRadius: 16,
          padding: '32px 48px',
          boxShadow: `0 0 40px ${brandColors.primary}40`,
        }}
      >
        <div
          style={{
            fontSize: 24,
            color: brandColors.textSecondary,
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          {metric}
        </div>
        <div
          style={{
            fontSize: 64,
            color: brandColors.text,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: 32,
            color: changeColor,
            fontWeight: 600,
          }}
        >
          {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'} {change}
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

### Example: AnimatedTitle.tsx

```typescript
interface AnimatedTitleProps {
  company: string;
  quarter: string;
  year: number;
  brandColors: BrandColors;
  logo?: string;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
  company,
  quarter,
  year,
  brandColors,
  logo,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleSlide = spring({
    frame: frame - 10,
    fps,
    from: -100,
    to: 0,
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${brandColors.background}, ${brandColors.backgroundGradient?.[1]})`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {logo && (
        <img
          src={logo}
          style={{
            width: 120,
            height: 120,
            marginBottom: 24,
          }}
        />
      )}
      <div
        style={{
          transform: `translateY(${titleSlide}px)`,
          fontSize: 72,
          fontWeight: 700,
          color: brandColors.text,
          textAlign: 'center',
        }}
      >
        {company}
      </div>
      <div
        style={{
          fontSize: 48,
          color: brandColors.primary,
          marginTop: 16,
        }}
      >
        {quarter} {year} Earnings Call
      </div>
    </AbsoluteFill>
  );
};
```

---

## 5. How It Works (Workflow)

### Step 1: Process Earnings Call
```bash
python lens/process_earnings.py --url "youtube-url" --ticker HOOD --quarter Q3-2025
```

**Output**:
- `lens/videos/HOOD/Q3-2025/metadata.json`
- `lens/videos/HOOD/Q3-2025/insights.json`

### Step 2: Generate Enhancement Manifest

**Option A: Manual**
```bash
python lens/generate_enhancements.py --ticker HOOD --quarter Q3-2025 --template earnings-call
```

**Option B: LLM-Generated**
```bash
python lens/generate_enhancements.py --ticker HOOD --quarter Q3-2025 --auto
```

This reads:
- `insights.json` (for metrics, timestamps)
- `companies/HOOD.json` (for brand data)
- `enhancement-templates/earnings-call.json` (for base template)

And generates:
- `lens/videos/HOOD/Q3-2025/enhancements.json`

### Step 3: Render Video
```bash
cd studio
npm run render -- HOOD-Q3-2025
```

Remotion composition reads:
- `enhancements.json` - What to show
- `companies/HOOD.json` - How to style it
- `insights.json` - Data to display
- Applies all enhancements using generic components

---

## 6. LLM Instructions for Enhancement Generation

When generating `enhancements.json`, the LLM should:

1. **Read the transcript/insights** to find:
   - Key metrics mentioned (revenue, subscribers, etc.)
   - Timestamps when metrics are spoken
   - Speaker changes
   - Chapter breaks

2. **Read the company brand profile** to understand:
   - Brand colors
   - Visual style (bold vs. professional)
   - Animation preferences

3. **Start with template** (`earnings-call.json`)
   - Inherit base enhancements (title card, subscribe button, logo)

4. **Add custom metric displays** for each key metric:
   ```json
   {
     "type": "metric-display",
     "timing": {"start": 930},
     "config": {
       "metric": "Revenue",
       "value": "$1.3B",
       "change": "+100%"
     }
   }
   ```

5. **Add speaker labels** when speakers change

6. **Add chapter markers** from insights.json

7. **Output** complete `enhancements.json`

---

## 7. Benefits of This Approach

✅ **Scalable**: Works for 1000+ companies without code changes
✅ **Consistent**: Brand colors applied automatically
✅ **Reusable**: Components work for all videos
✅ **Data-Driven**: LLM generates enhancements from transcript
✅ **Flexible**: Easy to add new enhancement types
✅ **Maintainable**: Change template, affects all videos
✅ **Testable**: Preview enhancements in Remotion Studio

---

## 8. Example Enhancement Types

| Type | Purpose | Props |
|------|---------|-------|
| `animated-title` | Opening title card | company, quarter, year |
| `subscribe-button` | YouTube subscribe CTA | position, message |
| `metric-display` | Animated metric card | metric, value, change |
| `company-logo` | Watermark logo | position, size, opacity |
| `speaker-label` | Speaker identification | name, title, photo |
| `chapter-progress` | Progress bar with chapters | chapters, current |
| `live-captions` | Transcript captions | transcript, highlight |
| `chart-overlay` | Animated charts | data, type, style |
| `call-to-action` | End-screen CTA | message, url |

---

## Next Steps

1. ✅ Create company brand profiles (HOOD, PLTR, _default)
2. ✅ Create enhancement template (earnings-call)
3. ⏳ Build enhancement components in Remotion
4. ⏳ Create LLM script to generate enhancements.json
5. ⏳ Update render pipeline to use enhancements.json
6. ⏳ Test with HOOD Q3 2025 video
