import React from 'react';
import {
	AbsoluteFill,
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';
import {SubscribeButton} from './SubscribeButton';

interface OutroScreenProps {
	channelName?: string;
	callToAction?: string;
	backgroundColor?: string;
}

export const OutroScreen: React.FC<OutroScreenProps> = ({
	channelName = 'EarningLens',
	callToAction = 'Subscribe for more earnings analysis',
	backgroundColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Staggered animations
	const titleEntry = spring({
		frame,
		fps,
		config: {damping: 12},
	});

	const subtitleEntry = spring({
		frame: frame - 15,
		fps,
		config: {damping: 12},
	});

	const buttonEntry = spring({
		frame: frame - 30,
		fps,
		config: {damping: 12},
	});

	const titleY = interpolate(titleEntry, [0, 1], [50, 0]);
	const titleOpacity = interpolate(titleEntry, [0, 1], [0, 1]);

	const subtitleY = interpolate(subtitleEntry, [0, 1], [50, 0]);
	const subtitleOpacity = interpolate(subtitleEntry, [0, 1], [0, 1]);

	const buttonScale = interpolate(buttonEntry, [0, 1], [0.5, 1]);
	const buttonOpacity = interpolate(buttonEntry, [0, 1], [0, 1]);

	return (
		<AbsoluteFill
			style={{
				background: backgroundColor,
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '80px',
			}}
		>
			{/* Channel Name */}
			<div
				style={{
					transform: `translateY(${titleY}px)`,
					opacity: titleOpacity,
					marginBottom: '40px',
				}}
			>
				<h1
					style={{
						fontSize: '72px',
						fontWeight: 'bold',
						color: 'white',
						margin: 0,
						textAlign: 'center',
						fontFamily: 'Arial, sans-serif',
						textShadow: '0 4px 20px rgba(0,0,0,0.3)',
					}}
				>
					{channelName}
				</h1>
			</div>

			{/* Call to Action */}
			<div
				style={{
					transform: `translateY(${subtitleY}px)`,
					opacity: subtitleOpacity,
					marginBottom: '60px',
				}}
			>
				<p
					style={{
						fontSize: '32px',
						color: 'rgba(255, 255, 255, 0.9)',
						margin: 0,
						textAlign: 'center',
						fontFamily: 'Arial, sans-serif',
						maxWidth: '800px',
					}}
				>
					{callToAction}
				</p>
			</div>

			{/* Subscribe Button */}
			<div
				style={{
					transform: `scale(${buttonScale})`,
					opacity: buttonOpacity,
				}}
			>
				<SubscribeButton showBell={true} theme="dark" />
			</div>

			{/* Additional Info (optional) */}
			<div
				style={{
					position: 'absolute',
					bottom: '40px',
					opacity: subtitleOpacity,
				}}
			>
				<p
					style={{
						fontSize: '20px',
						color: 'rgba(255, 255, 255, 0.7)',
						margin: 0,
						fontFamily: 'Arial, sans-serif',
					}}
				>
					Visit earninglens.com for full analysis
				</p>
			</div>
		</AbsoluteFill>
	);
};

// Compact end card (picture-in-picture style)
export const CompactEndCard: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const slideIn = spring({
		frame,
		fps,
		config: {damping: 12},
	});

	const x = interpolate(slideIn, [0, 1], [400, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				bottom: '100px',
				right: '80px',
				transform: `translateX(${x}px)`,
			}}
		>
			<div
				style={{
					background: 'rgba(0, 0, 0, 0.85)',
					borderRadius: '20px',
					padding: '32px',
					maxWidth: '400px',
					boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
					backdropFilter: 'blur(10px)',
				}}
			>
				<h3
					style={{
						color: 'white',
						fontSize: '28px',
						marginBottom: '16px',
						fontFamily: 'Arial, sans-serif',
						fontWeight: 'bold',
					}}
				>
					Want More Insights?
				</h3>
				<p
					style={{
						color: 'rgba(255,255,255,0.8)',
						fontSize: '18px',
						marginBottom: '24px',
						fontFamily: 'Arial, sans-serif',
						lineHeight: '1.5',
					}}
				>
					Get full earnings analysis with interactive charts and transcripts
				</p>
				<div style={{display: 'flex', gap: '12px', flexDirection: 'column'}}>
					<SubscribeButton showBell={true} theme="dark" />
					<button
						type="button"
						style={{
							padding: '12px 24px',
							background: 'transparent',
							border: '2px solid white',
							borderRadius: '24px',
							color: 'white',
							fontSize: '18px',
							fontWeight: 'bold',
							cursor: 'pointer',
							fontFamily: 'Arial, sans-serif',
						}}
					>
						Visit Website →
					</button>
				</div>
			</div>
		</div>
	);
};
