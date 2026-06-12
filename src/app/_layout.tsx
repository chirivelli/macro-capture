import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { CronoProvider } from '@/components/crono/crono-app';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <CronoProvider>
        <AnimatedSplashOverlay />
        <Slot />
      </CronoProvider>
    </ThemeProvider>
  );
}
