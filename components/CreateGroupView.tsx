import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as Utils from '../DataValidation';
import * as groups_service from '../clients/groups-client';

export function CreateGroupView({ setModalVisible, fetchGroups }) {

  const [groupName, setGroupName] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [maxMembers, setMaxMembers] = useState("50");
  const [password, setPassword] = useState("");
  const [startingCurrency, setStartingCurrency] = useState("1000");
  const [loading, setLoading] = useState(false);

  useEffect(() => { resetFields(); }, []);

  const validInputs = () => {
    if (visibility == "Private") {
      return Utils.validInt(maxMembers) && Utils.validInt(startingCurrency) && groupName.trim() !== "" && password.trim() !== "" && groupName.length <= 30;
    }
    return Utils.validInt(maxMembers) && Utils.validInt(startingCurrency) && groupName.trim() !== "" && groupName.length <= 30;
  };

  const createGroup = async () => {
    if (!validInputs()) return;
    setLoading(true);
    setModalVisible(false);
    try {
      await groups_service.createGroup(groupName, visibility, startingCurrency, password);
      fetchGroups(true);
    } catch (error) {
      console.error("Error creating group:", error);
      Alert.alert("Error", "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  const resetFields = () => {
    setGroupName("");
    setVisibility("Public");
    setMaxMembers("50");
    setStartingCurrency("1000");
    setPassword("");
  };

  const handleVisibilityButton = (v) => {
    setVisibility(v);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>

        <Text style={styles.modalTitle}>Create Group</Text>
        <Text style={styles.modalSubtitle}>Set up your group details</Text>

        {/* Group Name */}
        <Text style={styles.infoLabel}>GROUP NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a name"
          placeholderTextColor="#555"
          value={groupName}
          onChangeText={setGroupName}
        />

        {/* Visibility toggle */}
        <Text style={styles.infoLabel}>VISIBILITY</Text>
        <View style={styles.visibilityRow}>
          {["Public", "Private"].map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.visibilityButton, visibility === v && styles.visibilityButtonActive]}
              onPress={() => handleVisibilityButton(v)}
            >
              <Text style={[styles.visibilityButtonText, visibility === v && styles.visibilityButtonTextActive]}>
                {v.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Password */}
        {visibility === "Private" && (
          <>
            <Text style={styles.infoLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter a password"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="oneTimeCode"
            />
          </>
        )}

        {/* Starting Currency */}
        <Text style={styles.infoLabel}>STARTING COINS</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="1000"
          placeholderTextColor="#555"
          value={startingCurrency}
          onChangeText={setStartingCurrency}
        />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.createButton} onPress={createGroup} disabled={loading}>
            <Text style={styles.createButtonText}>CREATE</Text>
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
  infoLabel: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    color: Colors.textColor,
    fontSize: 18,
    marginBottom: 16,
  },
  visibilityRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  visibilityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  visibilityButtonActive: {
    backgroundColor: "#ff496b",
    borderColor: "#ff496b",
  },
  visibilityButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#666",
  },
  visibilityButtonTextActive: {
    color: "#fff",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
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
    fontSize: 16,
    letterSpacing: 1,
  },
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ff496b",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 1,
  },
});