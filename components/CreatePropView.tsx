import { FIREBASE_AUTH, FIRESTORE } from '@/.FirebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

export function CreatePropView({setModalVisible, fetchGroups, groupName, groupId}) {
  
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [line, setLine] = useState("");
    const [overOdds, setOverOdds] = useState("");
    const [underOdds, setUnderOdds] = useState("");
    const [type, setType] = useState("prop");

    useEffect(() => {
        resetFields();
        
      }, []);
    
    const createEvent = async () => {
        try {
    
          setModalVisible(false);
          const eventRef = doc(collection(FIRESTORE, "events")); // Create a new group doc reference
          const eventId = eventRef.id; // Get the auto-generated ID
            const date = new Date();
          // Step 1: Create the group document
          await setDoc(eventRef, {
            name: name,
            description: description,
            groupId: groupId,
            groupName: groupName,
            type: type,
            underOdds: underOdds,
            overOdds: overOdds,
            overUnder: line,
            result: "",
            status: "active", // Example field
            date: new Date(),
          });
          
      
          
        } catch (error) {
          console.error("Error creating group:", error);
        }
    
        
        fetchGroups();
      };
    
      const resetFields = () => {
        setName(""); 
        setDescription("");
        setLine("");
        setOverOdds("");
        setUnderOdds("");
      };
    
      const cancelGroupCreation = () => {
        setModalVisible(false);
      };


    return (
    
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create a Prop</Text>
                <Text style={styles.label}>Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Johnny Appleseed"
                  value={name}
                  onChangeText={setName}
                />
                <Text style={styles.label}>Description:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Burgers Eaten"
                  value={description}
                  onChangeText={setDescription}
                />
                <Text style={styles.label}>Over / Under Line:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="5.5"
                  value={line}
                  onChangeText={setLine}
                />
                <View style={styles.visibilityRow}>

                    <View style={styles.oddsContainer}>

                        <Text style={styles.label}>Over Odds:</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="-135"
                        value={overOdds}
                        onChangeText={setOverOdds}
                        />

                    </View>

                    <View style={styles.oddsContainer}>

                        <Text style={styles.label}>Under Odds:</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="+130"
                        value={underOdds}
                        onChangeText={setUnderOdds}
                        />
                        
                    </View>
                    
                </View>
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => createEvent()}>
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
      oddsContainer: {

        marginRight: 20,

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
