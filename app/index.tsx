import { SplashScreen, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { View, Text } from 'react-native';

import { Stack } from 'expo-router';
import { useRef } from 'react';
import { Animated, StyleSheet, Image } from 'react-native';
import fetchGroups from './(tabs)/index'


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
      console.log("Waiting...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Start splash screen fade...");
      setAppReady(true);

      // Start fade-out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(async () => {
        //await SplashScreen.hideAsync(); // hide after animation
        console.log("Hide");
        setIsMounted(true);
      });
    };

    prepare();
    
  }, []);

    

  useEffect(() => {
    
    if (!isMounted) return; // Prevent navigation before mount
    if (isLoggedIn) {
      console.log("Logged in");
      router.replace('/(tabs)'); // Navigate to tabs if logged in
    } else {
      console.log("Not logged in");
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
