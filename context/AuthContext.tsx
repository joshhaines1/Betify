import React, { createContext, useContext, useEffect, useState } from "react";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import Purchases from "react-native-purchases/dist/purchases";
import { purchasesReady } from "@/context/PurchasesContext";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  uid: string | null;
  loading: boolean;
  logout: () => Promise<void>;
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, async (currentUser: User | null) => {
      if (currentUser) {
      try {
        // Firebase can resolve a persisted session before RootLayout's
        // Purchases.configure() finishes; wait for it so this doesn't throw.
        await purchasesReady;
        // Tell RevenueCat who just logged in
        await Purchases.logIn(currentUser.uid);
      } catch (error) {
        // Don't let a RevenueCat hiccup block auth state (and, in turn,
        // the native splash screen, which waits on `loading` below).
        console.error("RevenueCat logIn error:", error);
      }
    }
      setUser(currentUser);
      setUid(currentUser?.uid || null);
      setIsLoggedIn(!!currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(FIREBASE_AUTH);
      setUser(null);
      setUid(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, uid, loading, logout, setIsLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
