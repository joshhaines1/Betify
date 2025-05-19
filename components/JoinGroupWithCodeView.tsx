import { FIREBASE_AUTH, FIRESTORE } from '@/.FirebaseConfig';
import { arrayUnion, collection, doc, DocumentData, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as Utils from '../DataValidation'
import { JoinGroupView } from './JoinGroupView';

export function JoinGroupWithCodeView({setModalVisible, fetchGroups}) {
  
    const [inviteCode, setInviteCode] = useState("");
    const [joinGroupModal, setJoinGroupModal] = useState(false);
    const [password, setPassword] = useState("")
    const [visibility, setVisibility] = useState("")
    let name: string | null = null;
    let correctPassword: string | null = null;
    let members: any[] | null = null;
    let startingCurrency: number | null = null;
    let groupId: string | null = null;
    

    useEffect(() => {
        resetFields();
        
      }, []);

      const addMemberToGroup = async (groupId : string) => {
            
        const groupDocRef = doc(FIRESTORE, "groups", groupId);
            await updateDoc(groupDocRef, {
              members: arrayUnion(FIREBASE_AUTH.currentUser?.uid)
            });
            
            //Add a new member to the members subcollection
            const membersCollectionRef = collection(groupDocRef, "members");
            const memberDocRef = doc(membersCollectionRef, FIREBASE_AUTH.currentUser?.uid);
            await setDoc(memberDocRef, {
              id: FIREBASE_AUTH.currentUser?.uid,
              displayName: FIREBASE_AUTH.currentUser?.displayName,
              joinedAt: new Date(),
              balance: Number(startingCurrency),
            });
      
          }
    
      const joinGroup = async () => {
        const trimmedCode = inviteCode.trim().toLowerCase();
        if (trimmedCode.length !== 6) {
          alert("Invite code must be exactly 6 characters.");
          return;
        }
      
        try {
          const groupsRef = collection(FIRESTORE, "groups");
          const snapshot = await getDocs(groupsRef);
      
          const matchedDoc = snapshot.docs.find(docSnap => {
            const code = docSnap.id.slice(-6).toLowerCase();
            return code === trimmedCode;
          });
      
          if (!matchedDoc) {
            alert("No group found with that invite code.");
            return;
          }
      
          const user = FIREBASE_AUTH.currentUser;
          if (!user) {
            alert("You must be logged in to join a group.");
            return;
          }
      
          const groupData = matchedDoc.data();
      
          // Assign values from Firestore doc to variables
          groupId = matchedDoc.id;
          name = groupData.name ?? null;
          setVisibility(groupData.visibility);
          correctPassword = groupData.password ?? null;
          members = groupData.members ?? null;
          startingCurrency = groupData.startingCurrency ?? null;
      
          if(groupData.visibility == "Public" && !members?.includes(user.uid))
          {

            console.log("JOIN")
            addMemberToGroup(matchedDoc.id);
            alert("Successfully joined group!");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            fetchGroups();
            setModalVisible(false);

          } else if(groupData.visibility == "Private"){

            if(password != ""){

                if(password == correctPassword && !members?.includes(user.uid)){

                    console.log("JOIN")
                    addMemberToGroup(matchedDoc.id);
                    alert("Successfully joined group!");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    fetchGroups();
                    setModalVisible(false);

                } else {

                    alert("Incorrect password!");

                }

            }

          }
          
      
        } catch (error) {
          console.error("Error joining group:", error);
          alert("An error occurred while joining the group.");
        }
      };
      
    
    
    
      const resetFields = () => {
        setInviteCode("");
      };
    
      const cancelGroupCreation = () => {
        setModalVisible(false);
      };


    return (
    
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Invite Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="#ABCD123"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  placeholderTextColor={"gray"}
                />
                {visibility == "Private" && (

                    <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={"gray"}
                    />

                )}
            
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => joinGroup()}>
                    <Text style={styles.buttonText}>JOIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonStyle, styles.cancelButton]} onPress={() => cancelGroupCreation()}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Modal animationType="fade" transparent={true} visible={joinGroupModal}>
                        {/** setModalVisible, fetchGroups, name, visibility, correctPassword, members, startingCurrency, groupId */}
                        <JoinGroupView
                            fetchGroups={fetchGroups}
                            setModalVisible={setJoinGroupModal}
                            name={name}
                            visibility={visibility}
                            correctPassword={correctPassword}
                            members={[1, 2, 3]}
                            startingCurrency={1000}
                            groupId={groupId}
                        />
                </Modal>
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
        backgroundColor: "rgba(0,0,0,0.75)",
      },
      modalContent: {
        backgroundColor: Colors.cardBackground,
        padding: 20,
        width: "90%",
        borderRadius: 10,
        borderColor: 'gray',
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
      label: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 5,
        color: Colors.textColor,
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
