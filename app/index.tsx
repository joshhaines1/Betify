import { SplashScreen, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { View, Text } from 'react-native';

import { Stack } from 'expo-router';
import { useRef } from 'react';
import { Animated, StyleSheet, Image } from 'react-native';


//SplashScreen.preventAutoHideAsync(); 

const Index = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [appReady, setAppReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Mark component as mounted once the component is ready to render
  useEffect(() => {
    
    const prepare = async () => {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      setAppReady(true);

      setIsMounted(true); // Mark as mounted after loading is complete
    };

    prepare();
    
  }, []);

    

  useEffect(() => {
    
    if (!isMounted) return; // Prevent navigation before mount
    if (isLoggedIn) {
      router.replace('/(tabs)'); // Navigate to tabs if logged in
    } else {
      router.replace('/login'); // Navigate to login if not logged in
    }
  }, [isLoggedIn, isMounted]); // Triggered only after `isMounted` is true


  return (
    <View style={{ flex: 1 }}>
      <Stack />
      {!appReady && (
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'black', opacity: fadeAnim, justifyContent: 'center', alignItems: 'center' }]}>
          <Image source={require('../assets/icons/BetifyAppLogoDark.png')} style={{ width: 200, height: 200 }} resizeMode="contain" />
        </Animated.View>
      )}
    </View>
  );
};

export default Index;
