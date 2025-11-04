import React from 'react';
import {
	AbsoluteFill,
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';

interface SubscribeButtonProps {
	showBell?: boolean;
	theme?: 'light' | 'dark';
}

export const SubscribeButton: React.FC<SubscribeButtonProps> = ({
	showBell = true,
	theme = 'dark',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Spring animations for smooth entrance
	const slideIn = spring({
		frame,
		fps,
		config: {
			damping: 12,
			mass: 0.5,
		},
	});

	const bellRing = spring({
		frame: frame - 30, // Delay bell animation
		fps,
		config: {
			damping: 10,
			mass: 0.3,
		},
	});

	// Bell rotation animation
	const bellRotation = interpolate(
		bellRing,
		[0, 0.25, 0.5, 0.75, 1],
		[0, -15, 15, -10, 0]
	);

	// Pulse effect for button
	const pulse = Math.sin((frame / fps) * Math.PI * 2) * 0.05 + 1;

	// Theme colors
	const colors = {
		light: {
			bg: '#FF0000',
			text: '#FFFFFF',
			accent: '#CC0000',
		},
		dark: {
			bg: '#FF0000',
			text: '#FFFFFF',
			accent: '#CC0000',
		},
	};

	const themeColors = colors[theme];

	// Scale animation
	const scale = interpolate(slideIn, [0, 1], [0.5, 1]);
	const opacity = interpolate(slideIn, [0, 1], [0, 1]);

	return (
		<div
			style={{
				transform: `scale(${scale * pulse})`,
				opacity,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					padding: '16px 32px',
					backgroundColor: themeColors.bg,
					borderRadius: '28px',
					boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
					cursor: 'pointer',
					transition: 'all 0.3s ease',
				}}
			>
				{/* Subscribe Text */}
				<span
					style={{
						color: themeColors.text,
						fontSize: '24px',
						fontWeight: 'bold',
						letterSpacing: '0.5px',
						fontFamily: 'Arial, sans-serif',
					}}
				>
					SUBSCRIBE
				</span>

				{/* Bell Icon */}
				{showBell && (
					<svg
						width="28"
						height="28"
						viewBox="0 0 24 24"
						fill="none"
						style={{
							transform: `rotate(${bellRotation}deg)`,
						}}
					>
						<path
							d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
							fill={themeColors.text}
						/>
					</svg>
				)}
			</div>
		</div>
	);
};

// Sequence component for placing Subscribe in timeline
export const SubscribeSequence: React.FC = () => {
	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'flex-end',
				paddingBottom: '100px',
			}}
		>
			<SubscribeButton showBell={true} theme="dark" />
		</AbsoluteFill>
	);
};
