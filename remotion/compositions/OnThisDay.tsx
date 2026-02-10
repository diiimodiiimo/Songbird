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

export const OnThisDayDemo: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = '#1a1816';
	const surfaceColor = '#2f2a26';
	const textColor = '#E3E1DB';
	const accentColor = '#B65A2A';
	const mutedColor = '#9A9D9A';

	const memories = [
		{ year: 2023, song: 'Blinding Lights', artist: 'The Weeknd' },
		{ year: 2022, song: 'Midnight City', artist: 'M83' },
		{ year: 2021, song: 'Electric Feel', artist: 'MGMT' },
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
							On This Day
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
							Relive your musical memories
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Date Display */}
			<Sequence from={60} durationInFrames={60}>
				<AbsoluteFill
					style={{
						display: 'flex',
						justifyContent: 'center',
						paddingTop: 40,
					}}
				>
					<SlideUp startFrame={60} endFrame={90}>
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: '20px 40px',
								borderRadius: 16,
							}}
						>
							<p style={{ fontSize: 32, margin: 0, fontFamily: 'Georgia, serif' }}>
								January 15
							</p>
						</div>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Memories */}
			<Sequence from={120} durationInFrames={260}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						padding: 40,
						gap: 30,
					}}
				>
					{memories.map((memory, index) => (
						<SlideIn
							key={index}
							startFrame={120 + index * 70}
							endFrame={150 + index * 70}
							direction="right"
						>
							<div
								style={{
									backgroundColor: surfaceColor,
									padding: 30,
									borderRadius: 16,
									display: 'flex',
									gap: 24,
									alignItems: 'center',
								}}
							>
								{/* Year Badge */}
								<div
									style={{
										backgroundColor: accentColor,
										color: textColor,
										padding: '16px 24px',
										borderRadius: 12,
										fontSize: 24,
										fontWeight: 600,
										minWidth: 100,
										textAlign: 'center',
									}}
								>
									{memory.year}
								</div>

								{/* Album Art */}
								<div
									style={{
										width: 120,
										height: 120,
										backgroundColor: accentColor + '40',
										borderRadius: 12,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 48,
									}}
								>
									🎵
								</div>

								{/* Song Info */}
								<div style={{ flex: 1 }}>
									<p style={{ fontSize: 28, margin: 0, fontWeight: 500 }}>
										{memory.song}
									</p>
									<p
										style={{
											fontSize: 22,
											color: mutedColor,
											margin: '8px 0 0 0',
										}}
									>
										{memory.artist}
									</p>
								</div>
							</div>
						</SlideIn>
					))}

					{/* Call to Action */}
					<Sequence from={330} durationInFrames={50}>
						<SlideUp startFrame={330} endFrame={360}>
							<div
								style={{
									textAlign: 'center',
									padding: 30,
								}}
							>
								<p
									style={{
										fontSize: 24,
										color: mutedColor,
										margin: 0,
									}}
								>
									What song will you remember today?
								</p>
							</div>
						</SlideUp>
					</Sequence>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

