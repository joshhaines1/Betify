import { useAuth } from "../../context/AuthContext";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "@/assets/styles/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as groups_client from "../../clients/groups-client";
import Purchases from "react-native-purchases/dist/purchases";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [initials, setInitials] = useState("");

  useEffect(() => {
    setUsername(user?.displayName ?? "")
    setEmail(getEmailDisplay());
    setInitials(username
    ? username.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : getEmailDisplay()?.[0].toUpperCase() ?? "?")
  }, []);

  const handleSignOut = async () => {
    await logout();
    groups_client.clearGroupsCache();
    await Purchases.logOut(); 
    router.replace("/login");
  };

  const getEmailDisplay = () => {
  if (user?.email) return user.email;
  
  const providerIds = user?.providerData?.map(p => p.providerId) ?? [];
  
  if (providerIds.includes("apple.com")) return "Signed in with Apple";
  if (providerIds.includes("google.com")) return "Signed in with Google";
  
  return "—";
};

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {username && (
            <Text style={styles.displayName}>{username}</Text>
          )}
        </View>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>Account</Text>

        <View style={[styles.card, styles.cardFirst]}>
          <Text style={styles.cardLabel}>Email</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{email}</Text>
        </View>

        {username && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Username</Text>
            <Text style={styles.cardValue}>{username}</Text>
          </View>
        )}

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 15,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textColor,
    letterSpacing: 0.5,
  },
  avatarWrap: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1d1a1c",
    borderWidth: 2,
    borderColor: "#f8f8f8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#f8f8f8",
  },
  displayName: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textColor,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: "#1d1a1c",
    borderRadius: 12,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#252B38",
  },
  cardFirst: {
    borderColor: "#ffffff55",
    shadowColor: "#ff496b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  signOutButton: {
    marginTop: 8,
    backgroundColor: "#ff496b",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff496b55",
    paddingVertical: 16,
    alignItems: "center",
  },
  signOutText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#f8f8f8",
  },
});