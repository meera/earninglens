import React from 'react';
import {
	AbsoluteFill,
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	Img,
} from 'remotion';

interface CompanyLogoProps {
	ticker: string;
	companyName: string;
	logoUrl?: string;
	size?: 'small' | 'medium' | 'large';
	animated?: boolean;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
	ticker,
	companyName,
	logoUrl,
	size = 'medium',
	animated = true,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Size configurations
	const sizes = {
		small: {logoSize: 60, fontSize: 18, tickerSize: 24},
		medium: {logoSize: 100, fontSize: 24, tickerSize: 32},
		large: {logoSize: 150, fontSize: 32, tickerSize: 48},
	};

	const config = sizes[size];

	// Animation
	const entrance = spring({
		frame,
		fps,
		config: {
			damping: 15,
		},
	});

	const scale = animated ? interpolate(entrance, [0, 1], [0.8, 1]) : 1;
	const opacity = animated ? interpolate(entrance, [0, 1], [0, 1]) : 1;

	// Subtle floating animation
	const float = animated
		? Math.sin((frame / fps) * Math.PI) * 5
		: 0;

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '20px',
				transform: `scale(${scale}) translateY(${float}px)`,
				opacity,
			}}
		>
			{/* Logo */}
			{logoUrl ? (
				<Img
					src={logoUrl}
					style={{
						width: config.logoSize,
						height: config.logoSize,
						borderRadius: '20px',
						boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
					}}
				/>
			) : (
				<div
					style={{
						width: config.logoSize,
						height: config.logoSize,
						borderRadius: '20px',
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
					}}
				>
					<span
						style={{
							color: 'white',
							fontSize: config.tickerSize,
							fontWeight: 'bold',
							fontFamily: 'Arial, sans-serif',
						}}
					>
						{ticker}
					</span>
				</div>
			)}

			{/* Company Info */}
			<div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
				<div
					style={{
						fontSize: config.tickerSize,
						fontWeight: 'bold',
						color: '#1a202c',
						fontFamily: 'Arial, sans-serif',
						letterSpacing: '1px',
					}}
				>
					{ticker}
				</div>
				<div
					style={{
						fontSize: config.fontSize,
						color: '#4a5568',
						fontFamily: 'Arial, sans-serif',
					}}
				>
					{companyName}
				</div>
			</div>
		</div>
	);
};

// Watermark version (smaller, corner positioned)
export const CompanyWatermark: React.FC<{
	ticker: string;
	logoUrl?: string;
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ticker, logoUrl, position = 'top-left'}) => {
	const positions = {
		'top-left': {top: 30, left: 30},
		'top-right': {top: 30, right: 30},
		'bottom-left': {bottom: 30, left: 30},
		'bottom-right': {bottom: 30, right: 30},
	};

	return (
		<div
			style={{
				position: 'absolute',
				...positions[position],
				zIndex: 10,
			}}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '12px',
					padding: '12px 16px',
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderRadius: '16px',
					boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
				}}
			>
				{logoUrl ? (
					<Img
						src={logoUrl}
						style={{
							width: 40,
							height: 40,
							borderRadius: '8px',
						}}
					/>
				) : (
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: '8px',
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<span
							style={{
								color: 'white',
								fontSize: 16,
								fontWeight: 'bold',
							}}
						>
							{ticker}
						</span>
					</div>
				)}
				<span
					style={{
						fontSize: 18,
						fontWeight: 'bold',
						color: '#1a202c',
						letterSpacing: '0.5px',
					}}
				>
					{ticker}
				</span>
			</div>
		</div>
	);
};
