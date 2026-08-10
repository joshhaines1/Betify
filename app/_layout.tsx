import { AuthProvider, useAuth } from '@/context/AuthContext';
import Colors from '@/assets/styles/colors';
import { SplashScreen, Stack } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { Platform, StyleSheet, View } from 'react-native';
import { AdsProvider, markPurchasesReady } from '@/context/PurchasesContext';
import Purchases from 'react-native-purchases';
import { RefObject, useEffect, useRef, useState } from 'react';
import { GroupsRefreshProvider } from '@/context/GroupsRefreshContext';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

// Keep the native splash screen up until fonts are loaded AND the initial
// Firebase auth check has resolved, so there's no blank/placeholder flash
// while those finish. See AppNavigator below for the matching hideAsync().
SplashScreen.preventAutoHideAsync();
// Fade the splash out instead of cutting it instantly (iOS only — Android's
// splash API has no fade concept, so hide() there is still a hard cut).
// Must be set here, in global scope, before hideAsync() is ever called.
ExpoSplashScreen.setOptions({ duration: 400, fade: true });

function AppNavigator({
  fontsLoaded,
  fontError,
  tabsAnimation,
  hasTransitioned,
  setTabsAnimation,
}: {
  fontsLoaded: boolean;
  fontError: Error | null;
  tabsAnimation: "fade" | "slide_from_left";
  hasTransitioned: RefObject<boolean>;
  setTabsAnimation: (value: "fade" | "slide_from_left") => void;
}) {
  const { loading: authLoading } = useAuth();
  const ready = (fontsLoaded || !!fontError) && !authLoading;

  useEffect(() => {
    if (ready) {
      // Give the newly-mounted Stack (and index.tsx's router.replace to
      // login/(tabs)) time to settle before dropping the native splash —
      // hiding it the instant `ready` flips true reveals a blank frame
      // while that navigation is still in flight.
      const timeout = setTimeout(() => {
        SplashScreen.hideAsync();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [ready]);

  if (!ready) {
    // Native splash screen is still covering the app; render nothing.
    return null;
  }

  return (
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
  );
}

export default function RootLayout() {
const [fontsLoaded, fontError] = useFonts(Ionicons.font);
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
        // Configure resolved: safe for AuthContext's onAuthStateChanged
        // listener (which may already be waiting) to call Purchases.logIn.
        markPurchasesReady();


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
        // Configure failed (or never ran) — unblock anything waiting on
        // purchasesReady anyway so it doesn't hang forever; those callers
        // will get their own (expected) error when they call the SDK.
        markPurchasesReady();
      }
    };

    setup();
  }, []);

  if (fontError) {
    console.error('Failed to load Ionicons font:', fontError);
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
    <AuthProvider>
      <AdsProvider adsRemoved={adsRemoved} isPro={isPro}>
        <GroupsRefreshProvider>
          <AppNavigator
            fontsLoaded={fontsLoaded}
            fontError={fontError}
            tabsAnimation={tabsAnimation}
            hasTransitioned={hasTransitioned}
            setTabsAnimation={setTabsAnimation}
          />
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
