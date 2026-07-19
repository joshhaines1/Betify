import { AuthProvider } from '@/context/AuthContext';
import Colors from '@/assets/styles/colors';
import { Slot, Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { AdsProvider } from '@/context/PurchasesContext';
import Purchases from 'react-native-purchases';
import { useEffect, useRef, useState } from 'react';
import { GroupsRefreshProvider } from '@/context/GroupsRefreshContext';

export default function RootLayout() {
const [adsRemoved, setAdsRemoved] = useState(false);
const [isPro, setIsPro] = useState(false);
const [tabsAnimation, setTabsAnimation] = useState<"fade" | "slide_from_left">("fade");
const hasTransitioned = useRef(false);

  useEffect(() => {
    const setup = async () => {
      
      try {
        
        if (Platform.OS === 'ios') {
          await Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY! });
        } else {
          await Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY! });
        }

        
        const customerInfo = await Purchases.getCustomerInfo();
        setAdsRemoved(customerInfo.entitlements.active["remove_ads"] !== undefined || customerInfo.entitlements.active["pro"] !== undefined);
        setIsPro(customerInfo.entitlements.active["pro"] !== undefined);
        //setIsPro(true); // Set isPro to true for testing purposes

        Purchases.addCustomerInfoUpdateListener((customerInfo) => {
          setAdsRemoved(customerInfo.entitlements.active["remove_ads"] !== undefined || customerInfo.entitlements.active["pro"] !== undefined);
          setIsPro(customerInfo.entitlements.active["pro"] !== undefined);
        });
        

      } catch (error) {
        console.error("Error setting up purchases:", error);
      }
    };

    setup();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <AuthProvider>
      <AdsProvider adsRemoved={adsRemoved} isPro={isPro}>
        <GroupsRefreshProvider>
      <Stack>
        <Stack.Screen
        name="(tabs)"
        options={{
          animation: tabsAnimation,
          headerShown: false,
          gestureEnabled: false,
        }}
        listeners={{
          transitionEnd: () => {
            if (!hasTransitioned.current) {
              hasTransitioned.current = true;
              setTabsAnimation("slide_from_left");
            }
          },
        }}
      />
        <Stack.Screen name="+not-found" options={{headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="index" options={{headerShown: false, gestureEnabled: false}} />
        <Stack.Screen name="login" options={{animation: "fade", headerShown: false, gestureEnabled: false}} />
        <Stack.Screen 
        name="group" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
        }} 
      />
      <Stack.Screen 
        name="settings/help" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
          
        }} 
      />
      <Stack.Screen 
        name="settings/basicEventHelp" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
          
        }} 
      />
      <Stack.Screen 
        name="settings/playerPropHelp" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
          
        }} 
      />
      <Stack.Screen 
        name="settings/advancedEventHelp" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
          
        }} 
      />
      <Stack.Screen 
        name="settings/singleOutcomeEventHelp" 
        options={{ 
          animation: "flip", 
          headerShown: false, 
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: styles.headerText,
          headerTintColor: Colors.textColor, // Back arrow color
          headerShadowVisible: false, 
          headerStyle: styles.headerStyle,
          gestureEnabled: false, // Disable swipe back gesture
          
        }} 
      />
      </Stack>
        </GroupsRefreshProvider>
      </AdsProvider>
    </AuthProvider>
    </View>
    
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
