import { createContext, useContext } from "react";

// RootLayout kicks off Purchases.configure() and AuthContext's
// onAuthStateChanged listener both fire on mount, and Firebase can resolve
// a cached/persisted session (and call Purchases.logIn) before the native
// Purchases.configure() call finishes. Anything that needs Purchases to be
// configured first should `await purchasesReady` before calling into the
// SDK. markPurchasesReady() is called once configure() settles (success or
// failure) so callers never hang waiting on a call that isn't coming.
export let markPurchasesReady: () => void = () => {};
export const purchasesReady = new Promise<void>((resolve) => {
  markPurchasesReady = resolve;
});

const AdsContext = createContext({ adsEnabled: true });
const ProContext = createContext({ isPro: false });

export function AdsProvider({ children, adsRemoved, isPro }) {
  return (
    <AdsContext.Provider value={{ adsEnabled: !adsRemoved }}>
      <ProContext.Provider value={{ isPro: isPro }}>
        {children}
      </ProContext.Provider>
    </AdsContext.Provider>
  );
}

export const useAds = () => useContext(AdsContext);
export const usePro = () => useContext(ProContext);