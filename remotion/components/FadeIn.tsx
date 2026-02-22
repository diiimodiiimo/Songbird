import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface FadeInProps {
	children: React.ReactNode;
	startFrame: number;
	endFrame: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
	children,
	startFrame,
	endFrame,
}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(
		frame,
		[startFrame, endFrame],
		[0, 1],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	return <div style={{ opacity }}>{children}</div>;
};




