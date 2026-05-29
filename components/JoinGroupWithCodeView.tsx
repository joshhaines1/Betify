import { FIREBASE_AUTH } from '@/FirebaseConfig';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, TextInput, View, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as groups_service from '@/clients/groups-client';

export function JoinGroupWithCodeView({ setModalVisible, fetchGroups }) {
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [matchedGroup, setMatchedGroup] = useState<any | null>(null);

  useEffect(() => {
    resetFields();
  }, []);

  const resetFields = () => {
    setInviteCode("");
    setPassword("");
    setMatchedGroup(null);
  };

  const handleCheckInviteCode = async () => {
    const trimmedCode = inviteCode.trim().toLowerCase();
    if (trimmedCode.length !== 6) {
      alert("Invite code must be exactly 6 characters.");
      return;
    }

    try {
      const allGroupsObj = await groups_service.getAllGroups(0);
      const allGroups = allGroupsObj.groups;
      const foundGroup = allGroups.find((group) => group.id.slice(-6).toLowerCase() === trimmedCode);

      if (!foundGroup) {
        alert("No group found with that invite code.");
        return;
      }

      setMatchedGroup(foundGroup);

      // If public, join immediately
      if (foundGroup.visibility.toLowerCase() === "public") {
        await joinGroup(foundGroup.id);
      }

    } catch (error) {
      console.error("Error checking invite code:", error);
      alert("Error checking invite code.");
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const user = FIREBASE_AUTH.currentUser;
      if (!user) {
        alert("You must be logged in to join a group.");
        return;
      }

      if (matchedGroup.visibility.toLowerCase() === "private") {
        if (password !== matchedGroup.password) {
          alert("Incorrect password!");
          return;
        }
      }

      await groups_service.joinGroup(groupId);
      alert("Successfully joined group!");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      fetchGroups();
      setModalVisible(false);

    } catch (error) {
      console.error("Error joining group:", error);
      alert("An error occurred while joining the group.");
    }
  };

  const cancelGroupJoin = () => {
    setModalVisible(false);
    resetFields();
  };

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Invite Code</Text>
        <TextInput
          style={styles.input}
          placeholder="ABC123"
          value={inviteCode}
          onChangeText={setInviteCode}
          placeholderTextColor="gray"
        />

        {/* Show password input only if the group is private */}
        {matchedGroup?.visibility?.toLowerCase() === "private" && (
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="gray"
          />
        )}

        <View style={styles.buttonRow}>
          {!matchedGroup ? (
            <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={handleCheckInviteCode}>
              <Text style={styles.buttonText}>NEXT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => joinGroup(matchedGroup.id)}>
              <Text style={styles.buttonText}>JOIN</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.buttonStyle, styles.cancelButton]} onPress={cancelGroupJoin}>
            <Text style={styles.cancelButtonText}>CANCEL</Text>
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
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    padding: 20,
    width: "90%",
    borderRadius: 10,
    borderColor: "gray",
    borderWidth: 0.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: Colors.textColor,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    color: Colors.textColor,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  buttonStyle: {
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 50,
  },
  createButton: {
    backgroundColor: "#ff496b",
  },
  cancelButton: {
    backgroundColor: "#ccc",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  cancelButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});
