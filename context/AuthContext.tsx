import React, { createContext, useContext, useEffect, useState } from "react";
import { FIREBASE_AUTH } from "@/.FirebaseConfig";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { View, ActivityIndicator } from "react-native";

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  uid: string | null;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setIsLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (currentUser: User | null) => {
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ff496b" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, uid, logout, setUser, setIsLoggedIn }}>
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
