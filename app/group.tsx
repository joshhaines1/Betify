
import { useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function Group() {
    const { name, groupId } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name}</Text>
      <Text style={styles.text}>{groupId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
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
