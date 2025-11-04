import React from 'react';
import {Folder} from 'remotion';
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
			<Folder name="Production Videos">
				<Folder name="Summary Videos (50s)">
					<EarningsVideo />
				</Folder>
				<Folder name="Full Earnings Calls (30-60min)">
					<EarningsCallVideo />
				</Folder>
			</Folder>

			<Folder name="Animated Components (Examples)">
				<SubscribeExample />
				<OutroExample />
				<TitleExample />
				<MetricsExample />
				<FloatingMetricsExample />
				<LogoExample />
				<CompleteEndCardExample />
				<FullDemo />
			</Folder>
		</>
	);
};
