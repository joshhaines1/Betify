import { FIREBASE_AUTH, FIRESTORE } from '@/.FirebaseConfig';
import { arrayUnion, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Text, View } from 'react-native';


export function JoinGroupView({setModalVisible, fetchGroups, name, visibility, correctPassword, members, startingCurrency, groupId}) {
  const groupDocRef = doc(FIRESTORE, "groups", groupId);



    const [password, setPassword] = useState("");

    const addMemberToGroup = async () => {
      
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
        currency: startingCurrency,
      });

    }
  
    const joinGroup = async () => {
        try {

          if(visibility == "Private")
          {
            if(password == correctPassword)
            {
              //setModalVisible(false);
              addMemberToGroup();

            } else {

              Alert.alert("Incorrect Password")
            }

          } else {
            //setModalVisible(false);
            addMemberToGroup()
          }
      
          
        } catch (error) {
          console.error("Error joining group:", error);
        }
    
        fetchGroups();
      };
    
      const cancelGroupJoin = () => {
        setModalVisible(false);
      };

    return (
    
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Join a Group</Text>
                <Text style={styles.label}>Name:</Text>
                <View style={styles.infoContainer}><Text>{name}</Text></View>
                <Text style={styles.label}>Visibility:</Text>
                <View style={styles.infoContainer}><Text>{visibility}</Text></View>
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
                <Text style={styles.label}>Current Members:</Text>
                <View style={styles.infoContainer}><Text>{members.length}</Text></View>
                <Text style={styles.label}>Starting Currency:</Text>
                <View style={styles.infoContainer}><Text>{startingCurrency}</Text></View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => joinGroup()}>
                    <Text style={styles.buttonText}>JOIN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonStyle, styles.cancelButton]} onPress={() => cancelGroupJoin()}>
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
      infoContainer: {
        borderColor: '#bdbdbd',
        borderWidth: 1, 
        borderRadius: 4, 
        padding: 6,
        marginTop: 5,
        marginBottom: 5,

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
        marginBottom: 5,
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
