import Colors from '@/assets/styles/colors';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { joinGroup } from '@/clients/groups-client';

export function JoinGroupView({ setModalVisible, fetchGroups, name, visibility, correctPassword, members, startingCurrency, groupId }) {
  const [password, setPassword] = useState("");

  const addUserToGroup = async () => {
    try {
      if (visibility == "Private") {
        if (password == correctPassword) {
          setModalVisible(false);
          await joinGroup(groupId);
        } else {
          Alert.alert("Incorrect Password");
        }
      } else {
        setModalVisible(false);
        await joinGroup(groupId);
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
    fetchGroups(true, "all");
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>

        {/* Title */}
        <Text style={styles.modalTitle}>Join Group</Text>
        <Text style={styles.modalSubtitle}>Review details before joining</Text>

        {/* Info rows */}
        <View style={styles.infoBlock}>
          {[
            { label: "NAME", value: name },
            { label: "VISIBILITY", value: visibility },
            { label: "MEMBERS", value: String(members?.length ?? 0) },
            { label: "STARTING COINS", value: String(startingCurrency) },
          ].map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i < 3 && styles.infoRowBorder]}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text numberOfLines={1} style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Password field */}
        {visibility === "Private" && (
          <View style={styles.passwordBlock}>
            <Text style={styles.infoLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.joinButton} onPress={addUserToGroup}>
            <Text style={styles.joinButtonText}>JOIN</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    width: "90%",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.textColor,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },
  infoBlock: {
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginBottom: 16,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#666",
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textColor,
    maxWidth: "80%",
  },
  passwordBlock: {
    marginBottom: 20,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    color: Colors.textColor,
    fontSize: 15,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 1,
  },
  joinButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ff496b",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
});