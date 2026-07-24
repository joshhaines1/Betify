import { FIREBASE_AUTH } from '@/FirebaseConfig';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as groups_service from '@/clients/groups-client';

export function JoinGroupWithCodeView({ setModalVisible, fetchGroups }) {
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    resetFields();
  }, []);

  const resetFields = () => {
    setInviteCode("");
    setPassword("");
    setMatchedGroup(null);
  };

  const handleCheckInviteCode = async () => {
    const trimmedCode = inviteCode.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      Alert.alert("Invalid Code", "Invite code must be exactly 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const foundGroup = await groups_service.getGroupByInviteCode(trimmedCode);

      if (!foundGroup) {
        Alert.alert("Not Found", "No group found with that invite code.");
        return;
      }

      setMatchedGroup(foundGroup);

      // If public, join immediately. Pass foundGroup directly rather than relying on
      // matchedGroup state, since setMatchedGroup above hasn't applied yet in this closure.
      if (foundGroup.visibility.toLowerCase() === "public") {
        await joinGroup(foundGroup);
      }

    } catch (error) {
      console.error("Error checking invite code:", error);
      Alert.alert("Error", "Error checking invite code.");
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (group: any) => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to join a group.");
        return;
      }

      if (group.visibility.toLowerCase() === "private") {
        if (password !== group.password) {
          Alert.alert("Error", "Incorrect password!");
          return;
        }
      }

      await groups_service.joinGroup(group.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await fetchGroups(true, "all");
      setModalVisible(false);

    } catch (error) {
      console.error("Error joining group:", error);
      Alert.alert("Error", "An error occurred while joining the group.");
    }
  };

  const handleJoinPress = async () => {
    setLoading(true);
    try {
      await joinGroup(matchedGroup);
    } finally {
      setLoading(false);
    }
  };

  const cancelGroupJoin = () => {
    setModalVisible(false);
    resetFields();
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>

        <Text style={styles.modalTitle}>Join with Code</Text>
        <Text style={styles.modalSubtitle}>Enter an invite code to find a group</Text>

        {/* Invite Code */}
        <Text style={styles.infoLabel}>INVITE CODE</Text>
        <TextInput
          style={styles.input}
          placeholder="ABC123"
          placeholderTextColor="#555"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          value={inviteCode}
          onChangeText={setInviteCode}
        />

        {/* Show password input only if the group is private */}
        {matchedGroup?.visibility?.toLowerCase() === "private" && (
          <>
            <Text style={styles.infoLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the group password"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="oneTimeCode"
            />
          </>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelGroupJoin} disabled={loading}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
          {!matchedGroup ? (
            <TouchableOpacity style={styles.createButton} onPress={handleCheckInviteCode} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>NEXT</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.createButton} onPress={handleJoinPress} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>JOIN</Text>
              )}
            </TouchableOpacity>
          )}
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
