import React from 'react';
import {Composition, Folder} from 'remotion';
import {EarningsVideo} from './compositions/EarningsVideo';
import {EarningsCallVideo} from './compositions/EarningsVideoFull';
import {PLTR_Q3_2025} from './compositions/PLTR_Q3_2025';
import {PLTR_Q3_2025_take2} from './compositions/PLTR_Q3_2025-take2';
import {HOOD_Q3_2025} from './compositions/HOOD_Q3_2025';
import {
	SubscribeExample,
	OutroExample,
	TitleExample,
	MetricsExample,
	FloatingMetricsExample,
	LogoExample,
	CompleteEndCardExample,
	FullDemo,
} from './compositions/Examples/AnimatedAssets';
import { SubscribeExample as SubscribeLowerThirdExample } from './compositions/Examples/SubscribeExample';
import { ThemeExample } from './compositions/ThemeExample';
import { EnhancementsDemo } from './compositions/EnhancementsDemo';

/**
 * Root composition with three sections:
 *
 * 1. Production Videos - Actual earnings call videos
 * 2. Animated Components - Individual component examples
 * 3. Component Library - Reusable components for building videos
 */
export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Folder name="Production-Videos">
				<Folder name="Summary-Videos-50s">
					<EarningsVideo />
				</Folder>
				<Folder name="Full-Earnings-Calls">
					<EarningsCallVideo />
					<Composition
						id="HOOD-Q3-2025"
						component={HOOD_Q3_2025}
						durationInFrames={139254} // ~77 min at 30fps
						fps={30}
						width={1920}
						height={1080}
					/>
					<Composition
						id="PLTR-Q3-2025"
						component={PLTR_Q3_2025}
						durationInFrames={79000} // ~44 min at 30fps (adjust after insights)
						fps={30}
						width={1920}
						height={1080}
					/>
					<Composition
						id="PLTR-Q3-2025-take2"
						component={PLTR_Q3_2025_take2}
						durationInFrames={79000} // ~44 min at 30fps
						fps={30}
						width={1920}
						height={1080}
					/>
				</Folder>
			</Folder>

			<Folder name="Animated-Components">
				<Composition
					id="ThemeExample"
					component={ThemeExample}
					durationInFrames={600}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="SubscribeLowerThirdExample"
					component={SubscribeLowerThirdExample}
					durationInFrames={500}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="SubscribeExample"
					component={SubscribeExample}
					durationInFrames={150}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="OutroExample"
					component={OutroExample}
					durationInFrames={240}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="TitleExample"
					component={TitleExample}
					durationInFrames={180}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="MetricsExample"
					component={MetricsExample}
					durationInFrames={150}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="FloatingMetricsExample"
					component={FloatingMetricsExample}
					durationInFrames={150}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="LogoExample"
					component={LogoExample}
					durationInFrames={180}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="CompleteEndCardExample"
					component={CompleteEndCardExample}
					durationInFrames={240}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="FullDemo"
					component={FullDemo}
					durationInFrames={360}
					fps={30}
					width={1920}
					height={1080}
				/>
				<Composition
					id="EnhancementsDemo"
					component={EnhancementsDemo}
					durationInFrames={1500}
					fps={30}
					width={1920}
					height={1080}
				/>
			</Folder>
		</>
	);
};
