import { View, Image, StyleSheet } from 'react-native';
import { birdThemes, defaultBirdImage } from '../lib/theme';

interface ThemeBirdProps {
  size?: number;
  birdId?: string;
}

export default function ThemeBird({ size = 60, birdId }: ThemeBirdProps) {
  const bird = birdId ? birdThemes[birdId] : null;
  const imageSource = bird?.image || defaultBirdImage;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={imageSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
