import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { FadeIn } from '../components/FadeIn';
import { SlideUp } from '../components/SlideUp';
import { SongbirdLogo } from '../components/SongbirdLogo';
import { FeatureCard } from '../components/FeatureCard';

interface OverviewProps {
	title: string;
	subtitle: string;
}

export const SongbirdOverview: React.FC<OverviewProps> = ({ title, subtitle }) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	const bgColor = '#1a1816';
	const surfaceColor = '#2f2a26';
	const textColor = '#E3E1DB';
	const accentColor = '#B65A2A';

	return (
		<AbsoluteFill
			style={{
				backgroundColor: bgColor,
				fontFamily: 'Inter, sans-serif',
				color: textColor,
			}}
		>
			{/* Background texture */}
			<AbsoluteFill
				style={{
					backgroundImage: `linear-gradient(135deg, rgba(139, 143, 122, 0.03) 0%, transparent 50%, rgba(122, 90, 69, 0.02) 100%)`,
					opacity: 0.5,
				}}
			/>

			{/* Logo and Title Sequence */}
			<Sequence from={0} durationInFrames={90}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 40,
					}}
				>
					<FadeIn startFrame={0} endFrame={30}>
						<SongbirdLogo size={200} />
					</FadeIn>
					<SlideUp startFrame={20} endFrame={50}>
						<h1
							style={{
								fontSize: 72,
								fontWeight: 400,
								letterSpacing: -0.02,
								margin: 0,
								fontFamily: 'Georgia, serif',
							}}
						>
							{title}
						</h1>
					</SlideUp>
					<SlideUp startFrame={40} endFrame={70}>
						<p
							style={{
								fontSize: 32,
								color: '#9A9D9A',
								margin: 0,
							}}
						>
							{subtitle}
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Features Sequence */}
			<Sequence from={90} durationInFrames={210}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 30,
						padding: 60,
					}}
				>
					<SlideUp startFrame={90} endFrame={120}>
						<h2
							style={{
								fontSize: 48,
								fontWeight: 400,
								marginBottom: 20,
								fontFamily: 'Georgia, serif',
							}}
						>
							Your Musical Journal
						</h2>
					</SlideUp>

					<FeatureCard
						startFrame={120}
						icon="🎵"
						title="Daily Song Logging"
						description="Log one song each day to remember your life through music"
					/>

					<FeatureCard
						startFrame={150}
						icon="👥"
						title="Share with Friends"
						description="See what your friends are listening to and build your flock"
					/>

					<FeatureCard
						startFrame={180}
						icon="📊"
						title="Insights & Analytics"
						description="Discover your music patterns and top artists over time"
					/>

					<FeatureCard
						startFrame={210}
						icon="📅"
						title="On This Day"
						description="Relive memories from past years on the same date"
					/>
				</AbsoluteFill>
			</Sequence>

			{/* CTA Sequence */}
			<Sequence from={270} durationInFrames={30}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 20,
					}}
				>
					<FadeIn startFrame={270} endFrame={290}>
						<div
							style={{
								backgroundColor: accentColor,
								color: textColor,
								padding: '24px 48px',
								borderRadius: 16,
								fontSize: 28,
								fontWeight: 500,
							}}
						>
							Start Your Journey
						</div>
					</FadeIn>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

