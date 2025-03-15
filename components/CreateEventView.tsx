import { FIREBASE_AUTH, FIRESTORE } from '@/.FirebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as Utils from '../DataValidation'

export function CreateMSOView({setModalVisible, fetchGroups, groupName, groupId}) {
  
    const [team1, setTeam1] = useState("");
    const [team2, setTeam2] = useState("");
    const [team1MoneylineOdds, setTeam1MoneylineOdds] = useState("");
    const [team2MoneylineOdds, setTeam2MoneylineOdds] = useState("");
    const [spread, setSpread] = useState("");
    const [team1SpreadOdds, setTeam1SpreadOdds] = useState("");
    const [team2SpreadOdds, setTeam2SpreadOdds] = useState("");
    const [overUnder, setOverUnder] = useState("");
    const [overOdds, setOverOdds] = useState("");
    const [underOdds, setUnderOdds] = useState("");
    const [type, setType] = useState("");
    const [spreadType, setSpreadType] = useState("Spread");

    useEffect(() => {
        resetFields();
        
      }, []);

      
      const validMSOInputs = () => {
        // Validate all the required fields
        if (
          !Utils.validOdds(team1MoneylineOdds) ||
          !Utils.validOdds(team2MoneylineOdds) ||
          !Utils.validOdds(team1SpreadOdds) ||
          !Utils.validOdds(team2SpreadOdds) ||
          !Utils.validOdds(overOdds) ||
          !Utils.validOdds(underOdds) ||
          !Utils.validOverUnder(overUnder) ||
          !Utils.validSpread(spread, team1MoneylineOdds, team2MoneylineOdds) ||
          team1.trim() == "" || team2.trim() == ""
        ) {
          return false; // Invalid inputs
        }
        return true; // All inputs are valid
      }

      const validBasicInputs = () => {
        // Validate all the required fields
        if (
          !Utils.validOdds(team1MoneylineOdds) ||
          !Utils.validOdds(team2MoneylineOdds) ||
          team1.trim() == "" || team2.trim() == ""
        ) {
          return false; // Invalid inputs
        }
        return true; // All inputs are valid
      }

      const handleCreateEvent = async () => {

        if(type == "basic"){

          createBasicEvent();

        } else if(type == "MSO"){

          createMSOEvent();
        }
      }
    
    const createMSOEvent = async () => {
        try {
          if (!validMSOInputs()) {
            
            return;
          }
          setModalVisible(false);
          const eventRef = doc(collection(FIRESTORE, "events")); // Create a new group doc reference
          const eventId = eventRef.id; // Get the auto-generated ID
            const date = new Date();
          // Step 1: Create the group document
          await setDoc(eventRef, {
            team1: team1,
            team2: team2,
            groupId: groupId,
            groupName: groupName,
            type: type,
            underOdds: (Number(underOdds) > 0 && !underOdds.includes("+")) ? "+" + underOdds : underOdds,
            overOdds: (Number(overOdds) > 0 && !overOdds.includes("+")) ? "+" + overOdds : overOdds,
            overUnder: overUnder,
            moneylineOdds1: (Number(team1MoneylineOdds) > 0 && !team1MoneylineOdds.includes("+")) ? "+" + team1MoneylineOdds : team1MoneylineOdds,
            moneylineOdds2: (Number(team2MoneylineOdds) > 0 && !team2MoneylineOdds.includes("+")) ? "+" + team2MoneylineOdds : team2MoneylineOdds,
            spread: spreadType == "Spread" ? spread : "-" + spread,
            spreadOdds1: (Number(team1SpreadOdds) > 0 && !team1SpreadOdds.includes("+")) ? "+" + team1SpreadOdds : team1SpreadOdds,
            spreadOdds2: (Number(team2SpreadOdds) > 0 && !team2SpreadOdds.includes("+"))? "+" + team2SpreadOdds : team2SpreadOdds,
            result: ["", "", ""],
            status: "active", // Example field
            date: new Date(),
          });
          
      
          
        } catch (error) {
          console.error("Error creating group:", error);
        }
    
        
        fetchGroups();
      };

      const createBasicEvent = async () => {
        try {
          if (!validBasicInputs()) {
            
            return;
          }
          setModalVisible(false);
          const eventRef = doc(collection(FIRESTORE, "events")); // Create a new group doc reference
          const eventId = eventRef.id; // Get the auto-generated ID
            const date = new Date();
          // Step 1: Create the group document
          await setDoc(eventRef, {
            team1: team1,
            team2: team2,
            groupId: groupId,
            groupName: groupName,
            type: type,
            moneylineOdds1: (Number(team1MoneylineOdds) > 0 && !team1MoneylineOdds.includes("+")) ? "+" + team1MoneylineOdds : team1MoneylineOdds,
            moneylineOdds2: (Number(team2MoneylineOdds) > 0 && !team2MoneylineOdds.includes("+")) ? "+" + team2MoneylineOdds : team2MoneylineOdds,
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
        setTeam1(""); 
        setTeam2("");
        setTeam1MoneylineOdds("");
        setTeam2MoneylineOdds("");
        setSpread("");
        setTeam1SpreadOdds("");
        setTeam2SpreadOdds("");
        setOverUnder("");
        setOverOdds("");
        setUnderOdds("");
        setType("basic");
      };
      
    
      const cancelGroupCreation = () => {
        setModalVisible(false);
      };


  function handleVisiblityButton(type: string): void {
    setType(type);
  }

  function handleSpreadButtonPress(): void {

    if(spreadType == "Spread") {
      setSpreadType("Reverse Spread");
    }else {
      setSpreadType("Spread");
    }
  }

    return (
    
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Create an Event</Text>
                <Text style={styles.label}>Teams:</Text>
                <TextInput
                keyboardType='ascii-capable'
                  style={[styles.input, {marginBottom: 10}]}
                  placeholder="Team 1"
                  placeholderTextColor={"gray"}
                  value={team1}
                  onChangeText={setTeam1}
                  maxLength={25}
                />
                <TextInput
                keyboardType='ascii-capable'
                  style={styles.input}
                  placeholder="Team 2"
                  value={team2}
                  onChangeText={setTeam2}
                  maxLength={25}
                  placeholderTextColor={"gray"}
                />
                <View style={styles.visibilityRow}>
                  <TouchableOpacity style={[styles.deselectedVisibilityButton, type === "basic" && styles.selectedVisibilityButton]} onPress={() => handleVisiblityButton("basic")}>
                    <Text style={styles.visibilityButtonText}>BASIC</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.deselectedVisibilityButton, type === "MSO" && styles.selectedVisibilityButton]} onPress={() => handleVisiblityButton("MSO")}>
                    <Text style={styles.visibilityButtonText}>ADVANCED</Text>
                  </TouchableOpacity>
                </View>                


                <View style={{alignItems: 'flex-start'}}>
                  <Text style={styles.header}>Moneyline</Text>
                  <View style={styles.moneylineRow}>
                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Team 1 Odds:</Text>
                          <TextInput
                          keyboardType='ascii-capable'
                          style={styles.input}
                          placeholder="-135"
                          value={team1MoneylineOdds}
                          onChangeText={setTeam1MoneylineOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>

                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Team 2 Odds:</Text>
                          <TextInput
                          style={styles.input}
                          placeholder="+130"
                          value={team2MoneylineOdds}
                          onChangeText={setTeam2MoneylineOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>
                  </View>
                </View>

                {type == "MSO" && (
                    <>
                
                  <View style={{alignItems: 'flex-start'}}>
                    <View style={{flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center'}}>
                      
                    <Text style={[styles.header]}>{spreadType}</Text>
                      <TouchableOpacity style={styles.spreadButton} onPress={handleSpreadButtonPress}>

                        <Image source={require('@/assets/images/switchIcon.png')}
                          resizeMode='contain'
                          style={styles.logo}
                        ></Image>

                      </TouchableOpacity>
                      
                    </View>
                  
                  <View style={styles.moneylineRow}>
                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Team 1 Odds:</Text>
                          <TextInput
                          style={[styles.input, {width: 100}]}
                          placeholder="-135"
                          value={team1SpreadOdds}
                          onChangeText={setTeam1SpreadOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>

                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Line</Text>
                          <TextInput
                          style={[styles.input, {width: 75, textAlign: 'left'}]}
                          placeholder="7.5"
                          value={spread}
                          onChangeText={setSpread}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>

                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Team 2 Odds:</Text>
                          <TextInput
                          style={[styles.input, {width: 100}]}
                          placeholder="+130"
                          value={team2SpreadOdds}
                          onChangeText={setTeam2SpreadOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>
                  </View>
                  </View>


                  <View style={{alignItems: 'flex-start'}}>
                  <Text style={styles.header}>Over / Under</Text>
                  <View style={styles.moneylineRow}>
                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Over Odds:</Text>
                          <TextInput
                          style={[styles.input, {width: 100}]}
                          placeholder="-135"
                          value={overOdds}
                          onChangeText={setOverOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>

                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>O/U</Text>
                          <TextInput
                          style={[styles.input, {width: 75, textAlign: 'left'}]}
                          placeholder="191.5"
                          value={overUnder}
                          onChangeText={setOverUnder}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>

                      <View style={styles.oddsContainer}>
                          <Text style={[styles.label, styles.centerLabel]}>Under Odds:</Text>
                          <TextInput
                          style={[styles.input, {width: 100}]}
                          placeholder="+130"
                          value={underOdds}
                          onChangeText={setUnderOdds}
                          maxLength={5}
                          placeholderTextColor={"gray"}
                          />
                      </View>
                  </View>
                  </View>
              </>

                )}
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => handleCreateEvent()}>
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
        padding: 8,
      },
      logo:{

        width: 18,
        height: 18,
        position: 'relative',
        alignSelf: 'center',
        justifyContent: 'flex-start',
        margin: 0,
        marginLeft: 0,
        tintColor: Colors.primary,
        resizeMode: 'contain',

      },
      oddsContainer: {

        paddingHorizontal: 5,

      },
      centerLabel: {

        textAlign: 'center',
      },
      header: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.primary,
        textAlign: "left",
        textTransform: 'uppercase',
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
        padding: 15,
        width: "90%",
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: 'gray',
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
        marginBottom: 5,
        color: Colors.textColor,
      },
      label: {
        fontSize: 15,
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
        marginTop: 5,
      },
      visibilityRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        marginTop: 5,
        marginBottom: 10,
      },

      moneylineRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 10,
        backgroundColor: '',

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

      spreadButton: {
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        width: 25,
        height: 25,
        marginLeft: 0,
        backgroundColor: "",
        borderColor: 'gray',
        borderWidth: 0,
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
