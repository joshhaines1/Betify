import { AuthProvider } from '@/app/AuthContext';
import Colors from '@/assets/styles/colors';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>

      <Stack>
        <Stack.Screen name="(tabs)" options={{ animation: "fade", headerShown: false }} />
        <Stack.Screen name="+not-found" options={{headerShown: false}} />
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="login" options={{animation: "fade", headerShown: false}} />
        <Stack.Screen 
        name="group" 
        options={{ 
          animation: "flip", 
          headerShown: true, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          
          
        }} 
      /></Stack>

    </AuthProvider>
    
  );
  
}

const styles = StyleSheet.create({

  headerStyle: {

    backgroundColor: Colors.background,
  },

  headerText: {

    color: Colors.textColor,
    fontSize: 25,
    fontWeight: 700,
  }
});
