import { createContext, useContext } from "react";

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