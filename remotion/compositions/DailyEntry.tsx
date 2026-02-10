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

export const DailyEntryDemo: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const bgColor = '#1a1816';
	const surfaceColor = '#2f2a26';
	const textColor = '#E3E1DB';
	const accentColor = '#B65A2A';
	const mutedColor = '#9A9D9A';

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
						gap: 20,
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
							Monday, January 15
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
							How will we remember today?
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Empty State - Bird */}
			<Sequence from={60} durationInFrames={90}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 30,
					}}
				>
					<FadeIn startFrame={60} endFrame={90}>
						<div
							style={{
								fontSize: 200,
								opacity: 0.9,
							}}
						>
							🐦
						</div>
					</FadeIn>
					<SlideUp startFrame={80} endFrame={110}>
						<p
							style={{
								fontSize: 24,
								color: mutedColor,
							}}
						>
							Tap the songbird to log your song
						</p>
					</SlideUp>
				</AbsoluteFill>
			</Sequence>

			{/* Entry Form */}
			<Sequence from={150} durationInFrames={300}>
				<AbsoluteFill
					style={{
						display: 'flex',
						flexDirection: 'column',
						padding: 40,
						gap: 30,
					}}
				>
					{/* Date Picker */}
					<SlideIn startFrame={150} endFrame={180} direction="left">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 20,
								borderRadius: 16,
							}}
						>
							<p style={{ fontSize: 20, color: mutedColor, margin: 0 }}>
								Date: January 15, 2024
							</p>
						</div>
					</SlideIn>

					{/* Song Search */}
					<SlideIn startFrame={180} endFrame={210} direction="left">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 20,
								borderRadius: 16,
							}}
						>
							<p style={{ fontSize: 20, color: mutedColor, marginBottom: 10 }}>
								Search for a song
							</p>
							<div
								style={{
									backgroundColor: bgColor,
									padding: 16,
									borderRadius: 8,
									border: `1px solid ${mutedColor}20`,
								}}
							>
								<p style={{ fontSize: 24, margin: 0 }}>Blinding Lights</p>
								<p style={{ fontSize: 18, color: mutedColor, margin: '8px 0 0 0' }}>
									The Weeknd
								</p>
							</div>
						</div>
					</SlideIn>

					{/* Album Art Preview */}
					<SlideIn startFrame={210} endFrame={240} direction="left">
						<div
							style={{
								display: 'flex',
								gap: 20,
								alignItems: 'center',
								backgroundColor: surfaceColor,
								padding: 20,
								borderRadius: 16,
							}}
						>
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
							<div>
								<p style={{ fontSize: 24, margin: 0 }}>Blinding Lights</p>
								<p style={{ fontSize: 18, color: mutedColor, margin: '8px 0 0 0' }}>
									The Weeknd • After Hours
								</p>
							</div>
						</div>
					</SlideIn>

					{/* Notes */}
					<SlideIn startFrame={240} endFrame={270} direction="left">
						<div
							style={{
								backgroundColor: surfaceColor,
								padding: 20,
								borderRadius: 16,
							}}
						>
							<p style={{ fontSize: 20, color: mutedColor, marginBottom: 10 }}>
								Add notes
							</p>
							<div
								style={{
									backgroundColor: bgColor,
									padding: 16,
									borderRadius: 8,
									minHeight: 100,
									border: `1px solid ${mutedColor}20`,
								}}
							>
								<p style={{ fontSize: 20, margin: 0, color: mutedColor }}>
									Perfect song for my morning commute...
								</p>
							</div>
						</div>
					</SlideIn>

					{/* Save Button */}
					<SlideIn startFrame={300} endFrame={330} direction="bottom">
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								marginTop: 'auto',
							}}
						>
							<div
								style={{
									backgroundColor: accentColor,
									color: textColor,
									padding: '20px 60px',
									borderRadius: 16,
									fontSize: 28,
									fontWeight: 500,
								}}
							>
								Save Entry
							</div>
						</div>
					</SlideIn>

					{/* Success Message */}
					<Sequence from={380} durationInFrames={70}>
						<AbsoluteFill
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 30,
							}}
						>
							<FadeIn startFrame={380} endFrame={410}>
								<div style={{ fontSize: 120 }}>✅</div>
							</FadeIn>
							<SlideUp startFrame={400} endFrame={430}>
								<p style={{ fontSize: 32, color: accentColor }}>
									Song saved!
								</p>
							</SlideUp>
						</AbsoluteFill>
					</Sequence>
				</AbsoluteFill>
			</Sequence>
		</AbsoluteFill>
	);
};

