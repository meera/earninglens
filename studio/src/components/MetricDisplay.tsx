import React from 'react';
import {
	spring,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from 'remotion';

interface MetricProps {
	label: string;
	value: string | number;
	change?: number; // Percentage change
	trend?: 'up' | 'down' | 'neutral';
	icon?: string;
	delay?: number;
}

export const MetricCard: React.FC<MetricProps> = ({
	label,
	value,
	change,
	trend = 'neutral',
	delay = 0,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const entrance = spring({
		frame: frame - delay,
		fps,
		config: {damping: 12},
	});

	const scale = interpolate(entrance, [0, 1], [0.8, 1]);
	const opacity = interpolate(entrance, [0, 1], [0, 1]);

	// Animated number count-up (if value is number)
	const animatedValue =
		typeof value === 'number'
			? Math.floor(interpolate(entrance, [0, 1], [0, value]))
			: value;

	// Trend colors
	const trendColors = {
		up: {color: '#48bb78', arrow: '↑'},
		down: {color: '#f56565', arrow: '↓'},
		neutral: {color: '#718096', arrow: '→'},
	};

	const trendStyle = trendColors[trend];

	return (
		<div
			style={{
				transform: `scale(${scale})`,
				opacity,
				backgroundColor: 'white',
				borderRadius: '20px',
				padding: '32px',
				boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
				minWidth: '280px',
				border: '1px solid rgba(0,0,0,0.05)',
			}}
		>
			{/* Label */}
			<div
				style={{
					fontSize: '18px',
					color: '#718096',
					marginBottom: '12px',
					fontFamily: 'Arial, sans-serif',
					textTransform: 'uppercase',
					letterSpacing: '1px',
					fontWeight: '600',
				}}
			>
				{label}
			</div>

			{/* Value */}
			<div
				style={{
					fontSize: '48px',
					fontWeight: 'bold',
					color: '#1a202c',
					marginBottom: '8px',
					fontFamily: 'Arial, sans-serif',
				}}
			>
				{animatedValue}
			</div>

			{/* Change indicator */}
			{change !== undefined && (
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
					}}
				>
					<span
						style={{
							fontSize: '24px',
							color: trendStyle.color,
							fontWeight: 'bold',
						}}
					>
						{trendStyle.arrow}
					</span>
					<span
						style={{
							fontSize: '20px',
							color: trendStyle.color,
							fontWeight: 'bold',
							fontFamily: 'Arial, sans-serif',
						}}
					>
						{change > 0 ? '+' : ''}
						{change}%
					</span>
				</div>
			)}
		</div>
	);
};

// Grid of metrics
export const MetricsGrid: React.FC<{
	metrics: Array<Omit<MetricProps, 'delay'>>;
}> = ({metrics}) => {
	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
				gap: '32px',
				padding: '40px',
				maxWidth: '1200px',
			}}
		>
			{metrics.map((metric, index) => (
				<MetricCard key={index} {...metric} delay={index * 10} />
			))}
		</div>
	);
};

// Floating metric (picture-in-picture style)
export const FloatingMetric: React.FC<
	MetricProps & {position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'}
> = ({label, value, change, trend, position = 'top-right'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const slideIn = spring({
		frame,
		fps,
		config: {damping: 12},
	});

	const positions = {
		'top-left': {top: 100, left: 80},
		'top-right': {top: 100, right: 80},
		'bottom-left': {bottom: 100, left: 80},
		'bottom-right': {bottom: 100, right: 80},
	};

	const x = interpolate(slideIn, [0, 1], [position.includes('right') ? 300 : -300, 0]);

	return (
		<div
			style={{
				position: 'absolute',
				...positions[position],
				transform: `translateX(${x}px)`,
			}}
		>
			<div
				style={{
					backgroundColor: 'rgba(255, 255, 255, 0.95)',
					borderRadius: '16px',
					padding: '20px 28px',
					boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
					backdropFilter: 'blur(10px)',
					minWidth: '200px',
				}}
			>
				<div
					style={{
						fontSize: '14px',
						color: '#718096',
						marginBottom: '6px',
						fontFamily: 'Arial, sans-serif',
						textTransform: 'uppercase',
						letterSpacing: '0.5px',
						fontWeight: '600',
					}}
				>
					{label}
				</div>
				<div
					style={{
						fontSize: '32px',
						fontWeight: 'bold',
						color: '#1a202c',
						fontFamily: 'Arial, sans-serif',
					}}
				>
					{value}
				</div>
				{change !== undefined && trend && (
					<div
						style={{
							fontSize: '16px',
							color: trend === 'up' ? '#48bb78' : trend === 'down' ? '#f56565' : '#718096',
							fontWeight: 'bold',
							marginTop: '4px',
						}}
					>
						{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change > 0 ? '+' : ''}
						{change}%
					</div>
				)}
			</div>
		</div>
	);
};
