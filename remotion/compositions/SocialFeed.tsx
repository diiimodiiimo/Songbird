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

export const SocialFeedDemo: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = '#1a1816';
	const surfaceColor = '#2f2a26';
	const textColor = '#E3E1DB';
	const accentColor = '#B65A2A';
	const mutedColor = '#9A9D9A';

	const feedEntries = [
		{
			user: 'Alex',
			song: 'Midnight City',
			artist: 'M83',
			time: '2 hours ago',
		},
		{
			user: 'Sam',
			song: 'Electric Feel',
			artist: 'MGMT',
			time: '5 hours ago',
		},
		{
			user: 'Jordan',
			song: 'Time to Pretend',
			artist: 'MGMT',
			time: '1 day ago',
		},
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
							Your Flock
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
							See what your friends are listening to
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Feed Entries */}
			<Sequence from={60} durationInFrames={340}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						padding: 40,
						gap: 20,
						overflow: 'hidden',
					}}
				>
					{feedEntries.map((entry, index) => (
						<SlideIn
							key={index}
							startFrame={60 + index * 80}
							endFrame={90 + index * 80}
							direction="right"
						>
							<div
								style={{
									backgroundColor: surfaceColor,
									padding: 24,
									borderRadius: 16,
									display: 'flex',
									gap: 20,
									alignItems: 'center',
								}}
							>
								{/* Album Art */}
								<div
									style={{
										width: 100,
										height: 100,
										backgroundColor: accentColor + '40',
										borderRadius: 12,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										fontSize: 40,
									}}
								>
									🎵
								</div>

								{/* Song Info */}
								<div style={{ flex: 1 }}>
									<p
										style={{
											fontSize: 18,
											color: mutedColor,
											margin: '0 0 8px 0',
										}}
									>
										{entry.user} • {entry.time}
									</p>
									<p style={{ fontSize: 24, margin: 0, fontWeight: 500 }}>
										{entry.song}
									</p>
									<p
										style={{
											fontSize: 20,
											color: mutedColor,
											margin: '8px 0 0 0',
										}}
									>
										{entry.artist}
									</p>
								</div>

								{/* Vibe Button */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										alignItems: 'center',
										gap: 8,
									}}
								>
									<div
										style={{
											fontSize: 32,
											opacity: index === 0 ? 1 : 0.5,
										}}
									>
										{index === 0 ? '❤️' : '🤍'}
									</div>
									{index === 0 && (
										<p style={{ fontSize: 16, color: mutedColor, margin: 0 }}>
											12
										</p>
									)}
								</div>
							</div>
						</SlideIn>
					))}

					{/* Comment Section */}
					<Sequence from={300} durationInFrames={100}>
						<SlideIn startFrame={300} endFrame={330} direction="bottom">
							<div
								style={{
									backgroundColor: surfaceColor,
									padding: 24,
									borderRadius: 16,
									marginTop: 20,
								}}
							>
								<p
									style={{
										fontSize: 20,
										color: mutedColor,
										marginBottom: 16,
									}}
								>
									Comments
								</p>
								<div
									style={{
										backgroundColor: bgColor,
										padding: 16,
										borderRadius: 8,
										marginBottom: 12,
									}}
								>
									<p style={{ fontSize: 18, margin: '0 0 4px 0' }}>
										Alex: Love this one! 🎵
									</p>
									<p
										style={{
											fontSize: 14,
											color: mutedColor,
											margin: 0,
										}}
									>
										1 hour ago
									</p>
								</div>
								<div
									style={{
										display: 'flex',
										gap: 12,
										alignItems: 'center',
									}}
								>
									<input
										style={{
											flex: 1,
											backgroundColor: bgColor,
											border: `1px solid ${mutedColor}20`,
											padding: 12,
											borderRadius: 8,
											color: textColor,
											fontSize: 18,
										}}
										placeholder="Add a comment..."
									/>
									<button
										style={{
											backgroundColor: accentColor,
											color: textColor,
											padding: '12px 24px',
											borderRadius: 8,
											fontSize: 18,
											border: 'none',
											cursor: 'pointer',
										}}
									>
										Post
									</button>
								</div>
							</div>
						</SlideIn>
					</Sequence>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

