import { AuthProvider } from '@/context/AuthContext';
import Colors from '@/assets/styles/colors';
import { Slot, Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { AdsProvider } from '@/context/PurchasesContext';
import Purchases from 'react-native-purchases';
import { useEffect, useState } from 'react';

export default function RootLayout() {
const [adsRemoved, setAdsRemoved] = useState(false);
const [isPro, setIsPro] = useState(false);

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

      <Stack>
        <Stack.Screen name="(tabs)" options={{ animation: "fade", headerShown: false }} />
        <Stack.Screen name="+not-found" options={{headerShown: false}} />
        <Stack.Screen name="index" options={{headerShown: false}} />
        <Stack.Screen name="login" options={{animation: "fade", headerShown: false}} />
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
          
          
        }} 
      /></Stack>
      
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
