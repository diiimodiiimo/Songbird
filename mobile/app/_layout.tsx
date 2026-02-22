import { Stack } from 'expo-router';
import { ClerkProvider } from '../lib/auth';
import { colors } from '../lib/theme';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ClerkProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="join/[code]" />
          <Stack.Screen
            name="notifications"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="notification-settings"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="blocked-users"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="theme-selector"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="premium"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="report"
            options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
          />
          <Stack.Screen
            name="user/[username]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="archive"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="wrapped"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="terms"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="privacy"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="help"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="refund"
            options={{ animation: 'slide_from_right' }}
          />
        </Stack>
      </View>
    </ClerkProvider>
  );
}
