import { Link, router } from "expo-router";
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../AuthContext";

export default function Entries() {
  const { logout } = useAuth();  // Use the auth context inside the component

  const handleSignOut = async () => {
    console.log("Signing out...");
    await logout();  // Sign out from Firebase
    router.replace("/login");  // Redirect to login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Entries</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#ff496b",
  },
});
