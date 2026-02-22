import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface CountUpProps {
	value: number;
	startFrame: number;
	endFrame: number;
}

export const CountUp: React.FC<CountUpProps> = ({
	value,
	startFrame,
	endFrame,
}) => {
	const frame = useCurrentFrame();
	const count = Math.floor(
		interpolate(frame, [startFrame, endFrame], [0, value], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		})
	);

	return <>{count}</>;
};




