import React from 'react';
import {
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';

interface AnimatedTitleProps {
	title: string;
	subtitle?: string;
	style?: 'modern' | 'classic' | 'minimal';
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({
	title,
	subtitle,
	style = 'modern',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Entrance animations
	const titleEntry = spring({
		frame,
		fps,
		config: {damping: 12, mass: 0.5},
	});

	const subtitleEntry = spring({
		frame: frame - 10,
		fps,
		config: {damping: 12, mass: 0.5},
	});

	// Underline animation
	const underlineWidth = interpolate(
		spring({
			frame: frame - 20,
			fps,
			config: {damping: 15},
		}),
		[0, 1],
		[0, 100]
	);

	const titleY = interpolate(titleEntry, [0, 1], [-50, 0]);
	const titleOpacity = interpolate(titleEntry, [0, 1], [0, 1]);

	const subtitleY = interpolate(subtitleEntry, [0, 1], [30, 0]);
	const subtitleOpacity = interpolate(subtitleEntry, [0, 1], [0, 1]);

	// Style variations
	const styles = {
		modern: {
			titleSize: '64px',
			titleColor: '#1a202c',
			titleWeight: 'bold' as const,
			subtitleSize: '32px',
			subtitleColor: '#4a5568',
			accentColor: '#667eea',
		},
		classic: {
			titleSize: '72px',
			titleColor: '#000000',
			titleWeight: 'bold' as const,
			subtitleSize: '36px',
			subtitleColor: '#666666',
			accentColor: '#FF0000',
		},
		minimal: {
			titleSize: '56px',
			titleColor: '#2d3748',
			titleWeight: '600' as const,
			subtitleSize: '28px',
			subtitleColor: '#718096',
			accentColor: '#48bb78',
		},
	};

	const currentStyle = styles[style];

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: '24px',
			}}
		>
			{/* Title */}
			<div
				style={{
					transform: `translateY(${titleY}px)`,
					opacity: titleOpacity,
					textAlign: 'center',
				}}
			>
				<h1
					style={{
						fontSize: currentStyle.titleSize,
						fontWeight: currentStyle.titleWeight,
						color: currentStyle.titleColor,
						margin: 0,
						fontFamily: 'Arial, sans-serif',
						lineHeight: '1.2',
						maxWidth: '1000px',
					}}
				>
					{title}
				</h1>

				{/* Animated underline */}
				<div
					style={{
						width: `${underlineWidth}%`,
						height: '6px',
						background: currentStyle.accentColor,
						marginTop: '16px',
						borderRadius: '3px',
						margin: '16px auto 0',
						maxWidth: '400px',
					}}
				/>
			</div>

			{/* Subtitle */}
			{subtitle && (
				<div
					style={{
						transform: `translateY(${subtitleY}px)`,
						opacity: subtitleOpacity,
					}}
				>
					<p
						style={{
							fontSize: currentStyle.subtitleSize,
							color: currentStyle.subtitleColor,
							margin: 0,
							fontFamily: 'Arial, sans-serif',
							textAlign: 'center',
							maxWidth: '800px',
						}}
					>
						{subtitle}
					</p>
				</div>
			)}
		</div>
	);
};

// Lower Third Title (news style)
export const LowerThirdTitle: React.FC<{text: string; accent?: string}> = ({
	text,
	accent,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const slideIn = spring({
		frame,
		fps,
		config: {damping: 15},
	});

	const x = interpolate(slideIn, [0, 1], [-400, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				bottom: '120px',
				left: '60px',
				transform: `translateX(${x}px)`,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 0,
				}}
			>
				{/* Accent bar */}
				{accent && (
					<div
						style={{
							width: '8px',
							height: '60px',
							backgroundColor: accent,
							marginRight: '16px',
						}}
					/>
				)}

				{/* Text container */}
				<div
					style={{
						backgroundColor: 'rgba(0, 0, 0, 0.85)',
						padding: '16px 32px',
						backdropFilter: 'blur(10px)',
					}}
				>
					<p
						style={{
							color: 'white',
							fontSize: '28px',
							fontWeight: 'bold',
							margin: 0,
							fontFamily: 'Arial, sans-serif',
						}}
					>
						{text}
					</p>
				</div>
			</div>
		</div>
	);
};
