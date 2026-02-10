import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface SlideInProps {
	children: React.ReactNode;
	startFrame: number;
	endFrame: number;
	direction: 'left' | 'right' | 'bottom' | 'top';
	distance?: number;
}

export const SlideIn: React.FC<SlideInProps> = ({
	children,
	startFrame,
	endFrame,
	direction,
	distance = 100,
}) => {
	const frame = useCurrentFrame();

	const getTransform = () => {
		const translate = interpolate(
			frame,
			[startFrame, endFrame],
			[distance, 0],
			{
				extrapolateLeft: 'clamp',
				extrapolateRight: 'clamp',
			}
		);

		switch (direction) {
			case 'left':
				return `translateX(-${translate}px)`;
			case 'right':
				return `translateX(${translate}px)`;
			case 'bottom':
				return `translateY(${translate}px)`;
			case 'top':
				return `translateY(-${translate}px)`;
			default:
				return `translateX(${translate}px)`;
		}
	};

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
				transform: getTransform(),
				opacity,
			}}
		>
			{children}
		</div>
	);
};



