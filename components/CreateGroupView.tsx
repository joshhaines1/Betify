import { FIREBASE_AUTH, FIRESTORE } from '@/.FirebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export function CreateGroupView({setModalVisible, fetchGroups}) {
  
    const [groupName, setGroupName] = useState("");
    const [visibility, setVisibility] = useState("Public");
    const [maxMembers, setMaxMembers] = useState("10");
    const [password, setPassword] = useState("");
    const [startingCurrency, setStartingCurrency] = useState("1000");
    
    const createGroup = async () => {
        try {
    
          setModalVisible(false);
          const groupRef = doc(collection(FIRESTORE, "groups")); // Create a new group doc reference
          const groupId = groupRef.id; // Get the auto-generated ID
      
          // Step 1: Create the group document
          await setDoc(groupRef, {
            name: groupName,
            creator: FIREBASE_AUTH.currentUser?.displayName,
            visibility: visibility,
            admins: [FIREBASE_AUTH.currentUser?.uid],
            members: [FIREBASE_AUTH.currentUser?.uid],
            startingCurrency: startingCurrency,
            password: password, // Example field
            creationDate: new Date(),
          });
      
          // Step 2: Add members as a subcollection
          const membersCollectionRef = collection(groupRef, "members");
      
          
            const memberDocRef = doc(membersCollectionRef, FIREBASE_AUTH.currentUser?.uid);
            await setDoc(memberDocRef, {
              id: FIREBASE_AUTH.currentUser?.uid,
              displayName: FIREBASE_AUTH.currentUser?.displayName,
              joinedAt: new Date(),
              currency: startingCurrency,
            });
          
      
          console.log("Group created with subcollection for members!");
        } catch (error) {
          console.error("Error creating group:", error);
        }
    
        resetFields();
        fetchGroups();
      };
    
      const resetFields = () => {
        setGroupName(""); 
        setVisibility("Public");
        setMaxMembers("10");
        setStartingCurrency("1000");
      };
    
      const cancelGroupCreation = () => {
        setModalVisible(false);
        resetFields();
      };

      const handleVisiblityButton = (visibility) => {

        setVisibility(visibility);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

    return (
    
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create a Group</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Group Name"
                  value={groupName}
                  onChangeText={setGroupName}
                />
                <Text style={styles.label}>Visibility:</Text>
                <View style={styles.visibilityRow}>
                  <TouchableOpacity style={[styles.deselectedVisibilityButton, visibility === "Public" && styles.selectedVisibilityButton]} onPress={() => handleVisiblityButton("Public")}>
                    <Text style={styles.visibilityButtonText}>PUBLIC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.deselectedVisibilityButton, visibility === "Private" && styles.selectedVisibilityButton]} onPress={() => handleVisiblityButton("Private")}>
                    <Text style={styles.visibilityButtonText}>PRIVATE</Text>
                  </TouchableOpacity>
                </View>
                {visibility === "Private" && (
                  <>
                  <Text style={styles.label}>Password:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder=""
                    value={password}
                    onChangeText={setPassword}
                  />
                  </>
                )}
                <Text style={styles.label}>Max Members:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                />
                <Text style={styles.label}>Starting Currency:</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={startingCurrency}
                  onChangeText={setStartingCurrency}
                />
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => createGroup()}>
                    <Text style={styles.buttonText}>CREATE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonStyle, styles.cancelButton]} onPress={() => cancelGroupCreation()}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          
  );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 10,
      },
      header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#ff496b",
        textAlign: "center",
        marginBottom: 15,
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
      buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
      },
      cancelButtonText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 16,
      },
      modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
      },
      modalContent: {
        backgroundColor: "#fff",
        padding: 20,
        width: "90%",
        borderRadius: 10,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
      },
      input: {
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
      },
      label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
      },
      picker: {
        height: 50,
        marginBottom: 10,
      },
      buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
      },
      visibilityRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        marginTop: 5,
        marginBottom: 10,
      },
      selectedVisibilityButton: {
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 35,
        marginRight: 10,
        backgroundColor: "#ff496b",
      },
    
      deselectedVisibilityButton: {
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 35,
        marginRight: 10,
        backgroundColor: "#ccc",
      },
    
      visibilityButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
      },
    
      plusButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 50,
        padding: 0,
        lineHeight: 52.5,
      },
      plusButtonStyle: {
        position: "absolute",
        bottom: 30,
        right: 30,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        width: 55,
        height: 55,
        backgroundColor: "#ff496b",
      },
    
      scrollView: {
        maxHeight: 200,
        marginBottom: 20,
      },
      visibilityButton: {
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 35,
        marginRight: 10,
        backgroundColor: "#ccc",
      },
      switchContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 10,
        backgroundColor: 'white',
      },
      switchButton: {
        padding: 10,
        marginHorizontal: 5,
        borderBottomWidth: 2,
        borderColor: "transparent",
      },
      activeSwitchButton: {
        borderColor: "#ff496b",
      },
      switchText: {
        fontSize: 16,
        color: 'black',
        fontWeight: "bold",
      },
      scrollContainer: {
        flex: 1,
        
      },
});
