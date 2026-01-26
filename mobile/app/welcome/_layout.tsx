import { Stack } from 'expo-router';
import { colors } from '../../lib/theme';

export default function WelcomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    />
  );
}
