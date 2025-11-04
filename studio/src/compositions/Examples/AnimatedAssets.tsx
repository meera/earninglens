import React from 'react';
import {AbsoluteFill, Sequence, useVideoConfig} from 'remotion';
import {
	SubscribeSequence,
	OutroScreen,
	CompactEndCard,
	AnimatedTitle,
	LowerThirdTitle,
	MetricsGrid,
	FloatingMetric,
	CompanyLogo,
	CompanyWatermark,
} from '../../components';

// Example 1: Subscribe Animation
export const SubscribeExample: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			}}
		>
			<SubscribeSequence />
		</AbsoluteFill>
	);
};

// Example 2: Outro Screen
export const OutroExample: React.FC = () => {
	return (
		<OutroScreen
			channelName="EarningLens"
			callToAction="Subscribe for weekly earnings analysis"
		/>
	);
};

// Example 3: Title Animations
export const TitleExample: React.FC = () => {
	const {fps} = useVideoConfig();

	return (
		<AbsoluteFill
			style={{
				background: '#f7fafc',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<Sequence from={0} durationInFrames={fps * 3}>
				<AnimatedTitle
					title="Palantir Q3 2024 Earnings"
					subtitle="Revenue up 30% YoY"
					style="modern"
				/>
			</Sequence>

			<Sequence from={fps * 3} durationInFrames={fps * 3}>
				<LowerThirdTitle
					text="CEO Alex Karp - Opening Remarks"
					accent="#667eea"
				/>
			</Sequence>
		</AbsoluteFill>
	);
};

// Example 4: Metrics Display
export const MetricsExample: React.FC = () => {
	const metrics = [
		{
			label: 'Revenue',
			value: '$725M',
			change: 30,
			trend: 'up' as const,
		},
		{
			label: 'EPS',
			value: '$0.10',
			change: 43,
			trend: 'up' as const,
		},
		{
			label: 'Customers',
			value: '629',
			change: 39,
			trend: 'up' as const,
		},
		{
			label: 'Operating Margin',
			value: '38%',
			change: 10,
			trend: 'up' as const,
		},
	];

	return (
		<AbsoluteFill
			style={{
				background: '#f7fafc',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<MetricsGrid metrics={metrics} />
		</AbsoluteFill>
	);
};

// Example 5: Floating Metrics (overlay)
export const FloatingMetricsExample: React.FC = () => {
	return (
		<AbsoluteFill style={{background: '#1a202c'}}>
			<FloatingMetric
				label="Revenue"
				value="$725M"
				change={30}
				trend="up"
				position="top-right"
			/>

			<FloatingMetric
				label="Customers"
				value="629"
				change={39}
				trend="up"
				position="bottom-right"
			/>
		</AbsoluteFill>
	);
};

// Example 6: Company Logo
export const LogoExample: React.FC = () => {
	const {fps} = useVideoConfig();

	return (
		<AbsoluteFill
			style={{
				background: '#ffffff',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<Sequence from={0} durationInFrames={fps * 3}>
				<CompanyLogo
					ticker="PLTR"
					companyName="Palantir Technologies"
					size="large"
					animated={true}
				/>
			</Sequence>

			{/* Watermark overlay */}
			<Sequence from={fps * 3}>
				<CompanyWatermark ticker="PLTR" position="top-left" />
			</Sequence>
		</AbsoluteFill>
	);
};

// Example 7: Complete End Card
export const CompleteEndCardExample: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
			}}
		>
			<CompactEndCard />
		</AbsoluteFill>
	);
};

// Full Demo: All assets combined
export const FullDemo: React.FC = () => {
	const {fps} = useVideoConfig();

	return (
		<AbsoluteFill>
			{/* Scene 1: Title (0-3s) */}
			<Sequence from={0} durationInFrames={fps * 3}>
				<AbsoluteFill
					style={{
						background: '#f7fafc',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<AnimatedTitle
						title="Palantir Q3 2024 Earnings"
						subtitle="Visual Analysis & Insights"
						style="modern"
					/>
				</AbsoluteFill>
			</Sequence>

			{/* Scene 2: Company Logo (3-5s) */}
			<Sequence from={fps * 3} durationInFrames={fps * 2}>
				<AbsoluteFill
					style={{
						background: '#ffffff',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}
				>
					<CompanyLogo
						ticker="PLTR"
						companyName="Palantir Technologies"
						size="large"
						animated={true}
					/>
				</AbsoluteFill>
			</Sequence>

			{/* Scene 3: Key Metrics (5-8s) */}
			<Sequence from={fps * 5} durationInFrames={fps * 3}>
				<MetricsExample />
			</Sequence>

			{/* Scene 4: Outro (8-12s) */}
			<Sequence from={fps * 8} durationInFrames={fps * 4}>
				<OutroScreen channelName="EarningLens" />
			</Sequence>
		</AbsoluteFill>
	);
};
