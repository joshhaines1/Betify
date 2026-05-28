import { createContext, useContext } from "react";

const AdsContext = createContext({ adsEnabled: true });

export function AdsProvider({ children, adsRemoved }) {
  return (
    <AdsContext.Provider value={{ adsEnabled: !adsRemoved }}>
      {children}
    </AdsContext.Provider>
  );
}

export const useAds = () => useContext(AdsContext);