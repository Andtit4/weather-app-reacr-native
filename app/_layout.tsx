import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
// import { StatusBar } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import WeatherScreen from './src/module/weather/presentations/screens/WeatherScreen';
import { SafeAreaView, StatusBar } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/font.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SafeAreaView style={{ flex: 1}}>
      <StatusBar
      barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        // style={colorScheme === 'dark' ? 'light' : 'dark'}
        
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#FFFFFF'}
      />
            <WeatherScreen />
          </SafeAreaView>
    </ThemeProvider>
  );
}
