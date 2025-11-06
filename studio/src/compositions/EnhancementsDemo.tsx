import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {
  AnimatedTitle,
  CallToAction,
  ChapterProgress,
  CompanyLogo,
  MetricDisplay,
  SpeakerLabel,
} from '../components/enhancements';
import {BrandProfile} from '../types/brand';

// This would normally be loaded from lens/companies/HOOD.json
const robinhoodBrand: BrandProfile = {
  ticker: 'HOOD',
  name: 'Robinhood',
  brandColors: {
    primary: '#00C805',
    secondary: '#00E805',
    accent: '#FF6154',
    background: '#000000',
    backgroundGradient: ['#000000', '#1a1a1a'],
    text: '#ffffff',
    textSecondary: '#a0a0a0',
  },
  typography: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
    headingWeight: '700',
    bodyWeight: '400',
  },
  logo: {
    url: 'https://logo.clearbit.com/robinhood.com',
    backgroundColor: '#00C805',
    position: 'top-left',
  },
  visualStyle: 'modern-bold',
  animations: {
    speed: 'fast',
    style: 'energetic',
    transitions: 'smooth',
  },
  industry: 'fintech',
};

const chapters = [
  {timestamp: 0, title: 'Opening Remarks', description: 'CEO introduction'},
  {timestamp: 300, title: 'Financial Highlights', description: 'Q3 results'},
  {timestamp: 600, title: 'Product Updates', description: 'New features'},
  {timestamp: 900, title: 'Q&A Session', description: 'Analyst questions'},
];

export const EnhancementsDemo: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        background: robinhoodBrand.brandColors.background,
      }}
    >
      {/* 1. TITLE CARD (0-5s) */}
      <Sequence from={0} durationInFrames={fps * 5}>
        <AnimatedTitle
          company={robinhoodBrand.name}
          quarter="Q3"
          year={2025}
          brandColors={robinhoodBrand.brandColors}
          logo={robinhoodBrand.logo.url || undefined}
        />
      </Sequence>

      {/* 2. MAIN CONTENT AREA (5s - end-10s) */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 15}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(135deg, ${robinhoodBrand.brandColors.background}, ${robinhoodBrand.brandColors.backgroundGradient?.[1]})`,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Placeholder content - would be actual video */}
          <div
            style={{
              fontSize: 48,
              color: robinhoodBrand.brandColors.textSecondary,
              textAlign: 'center',
            }}
          >
            [Earnings Call Video Content]
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* 3. METRIC DISPLAYS (shown at specific timestamps) */}

      {/* Revenue metric at 15s */}
      <Sequence from={fps * 15} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Revenue"
          value="$1.3B"
          change="+100% YoY"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="center"
          animationStyle="bounce"
        />
      </Sequence>

      {/* Gold Subscribers at 25s */}
      <Sequence from={fps * 25} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Gold Subscribers"
          value="3.9M"
          change="+75% YoY"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="top-right"
          animationStyle="slide-up"
        />
      </Sequence>

      {/* Net Deposits at 35s */}
      <Sequence from={fps * 35} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Net Deposits"
          value="$20B"
          change="Record Quarter"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          animationStyle="scale"
        />
      </Sequence>

      {/* 4. SPEAKER LABELS (appear when speakers change) */}

      {/* CEO introduction at 10s */}
      <Sequence from={fps * 10} durationInFrames={fps * 5}>
        <SpeakerLabel
          name="Vlad Tenev"
          title="CEO"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          showPhoto={false}
        />
      </Sequence>

      {/* CFO at 20s */}
      <Sequence from={fps * 20} durationInFrames={fps * 5}>
        <SpeakerLabel
          name="Jason Warnick"
          title="CFO"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          showPhoto={false}
        />
      </Sequence>

      {/* 5. PERSISTENT ELEMENTS (throughout video) */}

      {/* Company logo watermark */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 5}>
        <CompanyLogo
          logoUrl={robinhoodBrand.logo.url || ''}
          brandColors={robinhoodBrand.brandColors}
          position="top-left"
          size="small"
          opacity={0.8}
        />
      </Sequence>

      {/* Chapter progress bar */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 15}>
        <ChapterProgress
          chapters={chapters}
          brandColors={robinhoodBrand.brandColors}
          position="top"
          showChapterName={true}
        />
      </Sequence>

      {/* 6. CALL TO ACTION (last 10s) */}
      <Sequence from={durationInFrames - fps * 10} durationInFrames={fps * 10}>
        <CallToAction
          message="View full interactive analysis with charts and insights"
          url="EarningLens.com/HOOD/Q3-2025"
          brandColors={robinhoodBrand.brandColors}
          showSubscribe={true}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
