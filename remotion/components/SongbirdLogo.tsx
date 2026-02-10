import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface SongbirdLogoProps {
	size?: number;
}

export const SongbirdLogo: React.FC<SongbirdLogoProps> = ({ size = 200 }) => {
	const frame = useCurrentFrame();
	const scale = interpolate(
		frame,
		[0, 15, 30, 45],
		[1, 1.1, 1, 1.05],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	return (
		<div
			style={{
				fontSize: size,
				transform: `scale(${scale})`,
				display: 'inline-block',
			}}
		>
			🐦
		</div>
	);
};



