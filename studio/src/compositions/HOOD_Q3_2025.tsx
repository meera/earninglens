import {AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig} from 'remotion';
import {
  AnimatedTitle,
  CallToAction,
  CompanyLogo,
  MetricDisplay,
  SpeakerLabel,
} from '../components/enhancements';
import {BrandProfile} from '../types/brand';

// Load Robinhood brand profile
import robinhoodBrandData from '../../../lens/companies/HOOD.json';

const robinhoodBrand: BrandProfile = robinhoodBrandData as BrandProfile;

// Chapters from insights.json
const chapters = [
  {timestamp: 0, title: 'Opening Remarks', description: 'CEO Vlad Tenev and CFO Jason Warnick begin the call.'},
  {timestamp: 300, title: 'Financial Highlights', description: 'Overview of Q3 financial performance.'},
  {timestamp: 600, title: 'Product Updates', description: 'Discussion on new product launches and updates.'},
  {timestamp: 900, title: 'Global Expansion', description: "Plans for expanding Robinhood's global financial ecosystem."},
  {timestamp: 1200, title: 'Leadership Transition', description: 'CFO Jason Warnick announces retirement, Shiv Verma to succeed.'},
  {timestamp: 1500, title: 'Q&A Session - Part 1', description: 'Analyst questions on financials and strategy.'},
  {timestamp: 1800, title: 'Q&A Session - Part 2', description: 'Further questions on product offerings and market strategy.'},
  {timestamp: 2100, title: 'Q&A Session - Part 3', description: 'Discussion on international strategy and future plans.'},
  {timestamp: 2400, title: 'Closing Remarks', description: 'Final thoughts and future outlook.'},
];

/**
 * Robinhood Q3 2025 Earnings Call Video
 * Duration: ~77 minutes (4642 seconds)
 *
 * Key moments:
 * - 107s: Revenue $1.3B (+100% YoY)
 * - 650s: Record trading volumes
 * - 1070s: Prediction markets $100M+ revenue
 * - 1205s: CFO transition announcement
 * - 1600s: Banking rollout update
 */
export const HOOD_Q3_2025: React.FC = () => {
  const {fps, durationInFrames} = useVideoConfig();

  // Video path (trimmed video with audio)
  const videoPath = staticFile('audio/HOOD_Q3_2025.mp4');

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

      {/* 2. MAIN VIDEO CONTENT (5s onwards) - Actual earnings call video */}
      <Sequence from={fps * 5} durationInFrames={durationInFrames - fps * 15}>
        <AbsoluteFill>
          <OffthreadVideo
            src={videoPath}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 3. KEY METRICS (at specific timestamps from insights) */}

      {/* Revenue: $1.3B at 107s (1m 47s) */}
      <Sequence from={fps * 107} durationInFrames={fps * 5}>
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

      {/* Trading Volumes at 650s (10m 50s) */}
      <Sequence from={fps * 650} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Trading Volumes"
          value="Record"
          change="All-Time High"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="top-right"
          animationStyle="slide-up"
        />
      </Sequence>

      {/* Gold Subscribers - display early for impact */}
      <Sequence from={fps * 320} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Gold Subscribers"
          value="3.9M"
          change="Record Quarter"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          animationStyle="scale"
        />
      </Sequence>

      {/* Net Deposits */}
      <Sequence from={fps * 450} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Net Deposits"
          value="$20B"
          change="Record Quarter"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="center"
          animationStyle="bounce"
        />
      </Sequence>

      {/* Prediction Markets at 1070s (17m 50s) */}
      <Sequence from={fps * 1070} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="Prediction Markets"
          value="$100M+"
          change="Annualized Revenue"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="center"
          animationStyle="bounce"
        />
      </Sequence>

      {/* International Customers */}
      <Sequence from={fps * 920} durationInFrames={fps * 5}>
        <MetricDisplay
          metric="International Customers"
          value="700K"
          change="Including Bitstamp"
          changeType="positive"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-right"
          animationStyle="slide-up"
        />
      </Sequence>

      {/* 4. SPEAKER LABELS (appear when speakers change) */}

      {/* CEO Vlad Tenev - Opening remarks */}
      <Sequence from={fps * 10} durationInFrames={fps * 8}>
        <SpeakerLabel
          name="Vlad Tenev"
          title="CEO"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          showPhoto={false}
        />
      </Sequence>

      {/* CFO Jason Warnick - Financial highlights */}
      <Sequence from={fps * 305} durationInFrames={fps * 8}>
        <SpeakerLabel
          name="Jason Warnick"
          title="CFO"
          brandColors={robinhoodBrand.brandColors}
          position="bottom-left"
          showPhoto={false}
        />
      </Sequence>

      {/* Shiv Verma - New CFO introduction */}
      <Sequence from={fps * 1205} durationInFrames={fps * 8}>
        <SpeakerLabel
          name="Shiv Verma"
          title="SVP Finance & Strategy (Incoming CFO)"
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
