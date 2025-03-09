import { useAuth } from "../AuthContext";
import { useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import Colors from "@/assets/styles/colors";

export default function Profile() {
  const { user, setUser, logout } = useAuth(); // Get user & logout function from context
  const [userName, setUserName] = useState(user?.displayName || "");

  const updateUserName = async () => {
    if (!user) {
      console.error("No user is signed in.");
      return;
    }

    try {
      await updateProfile(user, { displayName: userName });
      setUser({ ...user, displayName: userName }); // Update context with new username
      console.log("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSignOut = async () => {
    console.log("Signing out...");
    await logout(); // Sign out from Firebase
    router.replace("/login"); // Redirect to login screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profile</Text>
      <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  text: {
    color: "#ff496b",
  },
  input: {
    borderWidth: 2,
    padding: 8,
    margin: 5,
    borderRadius: 10,
    width: "80%",
    height: 45,
    borderColor: "black",
  },
  signOutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#ff496b",
    borderRadius: 10,
  },
  signOutText: {
    color: "white",
    fontWeight: "bold",
  },
});
