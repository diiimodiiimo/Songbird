import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface SlideUpProps {
	children: React.ReactNode;
	startFrame: number;
	endFrame: number;
	distance?: number;
}

export const SlideUp: React.FC<SlideUpProps> = ({
	children,
	startFrame,
	endFrame,
	distance = 50,
}) => {
	const frame = useCurrentFrame();
	const translateY = interpolate(
		frame,
		[startFrame, endFrame],
		[distance, 0],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);
	const opacity = interpolate(
		frame,
		[startFrame, endFrame],
		[0, 1],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	return (
		<div
			style={{
				transform: `translateY(${translateY}px)`,
				opacity,
			}}
		>
			{children}
		</div>
	);
};




