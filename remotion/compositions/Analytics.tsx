import React from 'react';
import {
	AbsoluteFill,
	Sequence,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';
import { FadeIn } from '../components/FadeIn';
import { SlideUp } from '../components/SlideUp';
import { SlideIn } from '../components/SlideIn';
import { CountUp } from '../components/CountUp';

export const AnalyticsDemo: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = '#1a1816';
	const surfaceColor = '#2f2a26';
	const textColor = '#E3E1DB';
	const accentColor = '#B65A2A';
	const mutedColor = '#9A9D9A';

	const topArtists = [
		{ name: 'The Weeknd', plays: 45, emoji: '🥇' },
		{ name: 'MGMT', plays: 32, emoji: '🥈' },
		{ name: 'Tame Impala', plays: 28, emoji: '🥉' },
	];

	return (
		<AbsoluteFill
			style={{
				backgroundColor: bgColor,
				fontFamily: 'Inter, sans-serif',
				color: textColor,
			}}
		>
			{/* Header */}
			<Sequence from={0} durationInFrames={60}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						paddingTop: 80,
					}}
				>
					<SlideUp startFrame={0} endFrame={30}>
						<h1
							style={{
								fontSize: 56,
								fontWeight: 400,
								margin: 0,
								fontFamily: 'Georgia, serif',
							}}
						>
							Your Insights
						</h1>
					</SlideUp>
					<SlideUp startFrame={20} endFrame={50}>
						<p
							style={{
								fontSize: 28,
								color: mutedColor,
								margin: 0,
							}}
						>
							Discover your music patterns
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Stats Overview */}
			<Sequence from={60} durationInFrames={120}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'row',
						justifyContent: 'center',
						gap: 30,
						paddingTop: 60,
					}}
				>
					<SlideIn startFrame={60} endFrame={90} direction="bottom">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 30,
								borderRadius: 16,
								textAlign: 'center',
								minWidth: 200,
							}}
						>
							<p
								style={{
									fontSize: 48,
									fontWeight: 600,
									margin: 0,
									color: accentColor,
								}}
							>
								<CountUp startFrame={80} endFrame={110} value={142} />
							</p>
							<p
								style={{
									fontSize: 20,
									color: mutedColor,
									margin: '8px 0 0 0',
								}}
							>
								Total Entries
							</p>
						</div>
					</SlideIn>

					<SlideIn startFrame={75} endFrame={105} direction="bottom">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 30,
								borderRadius: 16,
								textAlign: 'center',
								minWidth: 200,
							}}
						>
							<p
								style={{
									fontSize: 48,
									fontWeight: 600,
									margin: 0,
									color: accentColor,
								}}
							>
								<CountUp startFrame={95} endFrame={125} value={28} />
							</p>
							<p
								style={{
									fontSize: 20,
									color: mutedColor,
									margin: '8px 0 0 0',
								}}
							>
								Day Streak 🔥
							</p>
						</div>
					</SlideIn>

					<SlideIn startFrame={90} endFrame={120} direction="bottom">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 30,
								borderRadius: 16,
								textAlign: 'center',
								minWidth: 200,
							}}
						>
							<p
								style={{
									fontSize: 48,
									fontWeight: 600,
									margin: 0,
									color: accentColor,
								}}
							>
								<CountUp startFrame={110} endFrame={140} value={67} />
							</p>
							<p
								style={{
									fontSize: 20,
									color: mutedColor,
									margin: '8px 0 0 0',
								}}
							>
								Artists
							</p>
						</div>
					</SlideIn>
				</AbsoluteFill>
			</Sequence>

			{/* Top Artists Podium */}
			<Sequence from={180} durationInFrames={170}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						padding: 40,
						gap: 30,
					}}
				>
					<SlideUp startFrame={180} endFrame={210}>
						<h2
							style={{
								fontSize: 40,
								fontWeight: 400,
								margin: 0,
								fontFamily: 'Georgia, serif',
							}}
						>
							Top Artists
						</h2>
					</SlideUp>

					{topArtists.map((artist, index) => (
						<SlideIn
							key={index}
							startFrame={210 + index * 40}
							endFrame={240 + index * 40}
							direction="left"
						>
							<div
								style={{
									backgroundColor: surfaceColor,
									padding: 24,
									borderRadius: 16,
									display: 'flex',
									alignItems: 'center',
									gap: 20,
								}}
							>
								<div
									style={{
										fontSize: 48,
									}}
								>
									{artist.emoji}
								</div>
								<div style={{ flex: 1 }}>
									<p style={{ fontSize: 28, margin: 0, fontWeight: 500 }}>
										{artist.name}
									</p>
									<p
										style={{
											fontSize: 20,
											color: mutedColor,
											margin: '8px 0 0 0',
										}}
									>
										{artist.plays} entries
									</p>
								</div>
							</div>
						</SlideIn>
					))}
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

