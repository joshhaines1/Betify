// Global test setup. Runs once per test file, after the test framework is
// installed. Mocks native/third-party modules that have no JS-only
// implementation so screens/components can render under Jest.

jest.mock("firebase/app");
jest.mock("firebase/auth");
jest.mock("firebase/firestore");

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// The official jest mock only ships a single `default` export, but this app
// consistently uses named imports (`{ SafeAreaView }`, `{ useSafeAreaInsets }`),
// so a default-only mock leaves those bindings `undefined` and crashes renders.
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 320, height: 640 };
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaInsetsContext: React.createContext(insets),
    SafeAreaFrameContext: React.createContext(frame),
    useSafeAreaInsets: jest.fn(() => insets),
    useSafeAreaFrame: jest.fn(() => frame),
    initialWindowMetrics: { insets, frame },
  };
});

jest.mock("expo-router", () => {
  const router = {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
  };

  const StackComponent: any = () => null;
  StackComponent.Screen = () => null;
  const TabsComponent: any = () => null;
  TabsComponent.Screen = () => null;

  return {
    router,
    useRouter: () => router,
    useLocalSearchParams: () => ({}),
    useNavigation: () => ({ setOptions: jest.fn(), addListener: jest.fn(() => jest.fn()) }),
    useFocusEffect: jest.fn(),
    Link: "Link",
    Stack: StackComponent,
    Tabs: TabsComponent,
    SplashScreen: { preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() },
  };
});

jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-auth-session/providers/google", () => ({
  useAuthRequest: jest.fn(() => [null, null, jest.fn()]),
}));

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(() => Promise.resolve(true)),
    signIn: jest.fn(),
  },
  isSuccessResponse: jest.fn(() => false),
  isErrorWithCode: jest.fn(() => false),
  statusCodes: { IN_PROGRESS: "IN_PROGRESS" },
}));

jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "mock-nonce"),
  digestStringAsync: jest.fn(() => Promise.resolve("mock-hashed-nonce")),
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
}));

const mockPurchases = {
  configure: jest.fn(),
  logIn: jest.fn(() => Promise.resolve({ customerInfo: {} })),
  logOut: jest.fn(() => Promise.resolve({})),
  getCustomerInfo: jest.fn(() =>
    Promise.resolve({ entitlements: { active: {} } })
  ),
  addCustomerInfoUpdateListener: jest.fn(),
  removeCustomerInfoUpdateListener: jest.fn(),
};
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: mockPurchases,
}));
jest.mock("react-native-purchases/dist/purchases", () => ({
  __esModule: true,
  default: mockPurchases,
}));

jest.mock("react-native-google-mobile-ads", () => ({
  __esModule: true,
  default: jest.fn(),
  BannerAd: "BannerAd",
  BannerAdSize: { BANNER: "BANNER" },
  TestIds: { BANNER: "test-banner", INTERSTITIAL: "test-interstitial", REWARDED: "test-rewarded" },
  AdEventType: { LOADED: "loaded", ERROR: "error", CLOSED: "closed" },
  RewardedAdEventType: { LOADED: "loaded", EARNED_REWARD: "earned_reward" },
  InterstitialAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn(),
      load: jest.fn(),
      show: jest.fn(),
    })),
  },
  RewardedAd: {
    createForAdRequest: jest.fn(() => ({
      addAdEventListener: jest.fn(),
      load: jest.fn(),
      show: jest.fn(),
    })),
  },
}));
