import React from 'react';
import { Composition } from 'remotion';
import { SongbirdOverview } from './compositions/Overview';
import { DailyEntryDemo } from './compositions/DailyEntry';
import { SocialFeedDemo } from './compositions/SocialFeed';
import { AnalyticsDemo } from './compositions/Analytics';
import { OnThisDayDemo } from './compositions/OnThisDay';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="SongbirdOverview"
				component={SongbirdOverview}
				durationInFrames={300}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					title: 'SongBird',
					subtitle: 'Remember your life through music',
				}}
			/>
			<Composition
				id="DailyEntry"
				component={DailyEntryDemo}
				durationInFrames={450}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="SocialFeed"
				component={SocialFeedDemo}
				durationInFrames={400}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="Analytics"
				component={AnalyticsDemo}
				durationInFrames={350}
				fps={30}
				width={1080}
				height={1920}
			/>
			<Composition
				id="OnThisDay"
				component={OnThisDayDemo}
				durationInFrames={380}
				fps={30}
				width={1080}
				height={1920}
			/>
		</>
	);
};

