import React from 'react';
import {Composition, Folder} from 'remotion';
import {EarningsVideo} from './compositions/EarningsVideo';
import {EarningsCallVideo} from './compositions/EarningsVideoFull';
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
				</Folder>
			</Folder>

			<Folder name="Animated-Components">
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
			</Folder>
		</>
	);
};
