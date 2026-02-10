import React from 'react';
import { SlideUp } from './SlideUp';

interface FeatureCardProps {
	icon: string;
	title: string;
	description: string;
	startFrame: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
	icon,
	title,
	description,
	startFrame,
}) => {
	return (
		<SlideUp startFrame={startFrame} endFrame={startFrame + 30}>
			<div
				style={{
					backgroundColor: '#2f2a26',
					padding: 30,
					borderRadius: 16,
					display: 'flex',
					gap: 20,
					alignItems: 'center',
					maxWidth: 800,
				}}
			>
				<div style={{ fontSize: 64 }}>{icon}</div>
				<div>
					<h3
						style={{
							fontSize: 32,
							fontWeight: 500,
							margin: '0 0 8px 0',
							fontFamily: 'Georgia, serif',
						}}
					>
						{title}
					</h3>
					<p
						style={{
							fontSize: 22,
							color: '#9A9D9A',
							margin: 0,
						}}
					>
						{description}
					</p>
				</div>
			</div>
		</SlideUp>
	);
};



