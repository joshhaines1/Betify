import { AuthProvider } from '@/app/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>

      <Stack>
        <Stack.Screen name="(tabs)" options={{ animation: "fade", headerShown: false }} />
        <Stack.Screen name="+not-found" options={{headerShown: false}} />
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="login" options={{animation: "fade", headerShown: false}} />
      </Stack>

    </AuthProvider>
    
  );
}
