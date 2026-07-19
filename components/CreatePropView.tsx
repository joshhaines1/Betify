import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Platform, TextInput, Alert, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/assets/styles/colors';
import * as Utils from '../DataValidation'
import * as events_client from '../clients/events-client';

export function CreatePropView({setModalVisible, fetchEvents, groupName, groupId}) {
  
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [line, setLine] = useState("");
    const [overOdds, setOverOdds] = useState("");
    const [underOdds, setUnderOdds] = useState("");
    const [type, setType] = useState("prop");
    const [lockDate, setLockDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        resetFields();
        
      }, []);

      async function validInputs() {
        if(!Utils.validOdds(overOdds) 
        || !Utils.validOdds(underOdds) 
        || name.trim() == "" || description.trim() == ""){
          return false;
        } else if(isNaN(Number(line))){
          const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Non-Numeric Over / Under",
            `The over/under value, ${line}, isn't a typical number. If you're setting a time, percentage, or other custom value, this is expected. Continue anyway?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => resolve(false),
              },
              {
                text: "Continue",
                onPress: () => resolve(true),
              },
            ],
            { cancelable: false }
          );
        });

        return confirmed; // Return the user's choice
          
        } else {
          return true;
        }
      }

  const handleDateClick = (choice) => {
    if(choice == "date"){
      if(!showDatePicker){
        setShowDatePicker(true);
        setShowTimePicker(false);
      } else {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    } else {
      if(!showTimePicker){
        setShowTimePicker(true);
        setShowDatePicker(false);
      } else {
        setShowTimePicker(false);
        setShowDatePicker(false);
      }
    }
  }
    
    const createEvent = async () => {
        if(!(await validInputs())){
          return;
        }
        setLoading(true);
        let eventToCreate = {
          groupId: groupId,
          type: type,
          lockDate: lockDate,
          options: {
            name: name,
            description: description,
            underOdds: (Number(underOdds) > 0 && !underOdds.includes("+")) ? "+" + underOdds : underOdds,
            overOdds: (Number(overOdds) > 0 && !overOdds.includes("+")) ? "+" + overOdds : overOdds,
            overUnder: line,
          },
        };
          events_client.createEvent(eventToCreate).then((response) => {
          console.log(response);
          fetchEvents();
          setModalVisible(false);
          setLoading(false);
        }).catch((error) => {
          console.error("Error creating event:", error);
        }).finally(() => {
          setLoading(false);
        });
      };
    
      const resetFields = () => {
        setName(""); 
        setDescription("");
        setLine("");
        setOverOdds("");
        setUnderOdds("");
        setLockDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      };
    
      const cancelGroupCreation = () => {
        setModalVisible(false);
      };


    return (
    
            <View style={styles.modalContainer}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingView}
              >
                <View style={styles.modalContent}>
                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                <Text style={styles.modalTitle}>Create a Prop</Text>
                <Text style={styles.label}>Name:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Johnny Appleseed"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={'gray'}
                />
                <Text style={styles.label}>Description:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Burgers Eaten"
                  value={description}
                  onChangeText={setDescription}
                  placeholderTextColor={'gray'}
                />
                <Text style={styles.label}>Over / Under Line:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6.5, 3:30pm, 43%, etc."
                  value={line}
                  onChangeText={setLine}
                  placeholderTextColor={'gray'}
                />
                <View style={styles.visibilityRow}>

                    <View style={styles.oddsContainer}>

                        <Text style={styles.label}>Over Odds:</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="-135"
                        value={overOdds}
                        onChangeText={setOverOdds}
                        placeholderTextColor={'gray'}
                        />

                    </View>

                    <View style={styles.oddsContainer}>

                        <Text style={styles.label}>Under Odds:</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="+130"
                        value={underOdds}
                        onChangeText={setUnderOdds}
                        placeholderTextColor={'gray'}
                        />
                        
                    </View>
                    
                </View>

                <View style={{marginTop: 0, marginBottom: 10}}>
                  <Text style={styles.label}>Event Lock Time:</Text>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                    <TouchableOpacity 
                      style={styles.datePickerButton} 
                      onPress={() => handleDateClick("date")}
                    >
                      <Text style={styles.datePickerText}>
                        {lockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.datePickerButton} 
                      onPress={() => handleDateClick("time")}
                    >
                      <Text style={styles.datePickerText}>
                        {lockDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>Event will lock and stop accepting wagers at this time</Text>
                </View>

                {(showDatePicker || showTimePicker) && (
                  <DateTimePicker
                    value={lockDate}
                    mode={showDatePicker ? "date" : "time"}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor={Colors.textColor}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setLockDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
                
                
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={[styles.buttonStyle, styles.createButton]} onPress={() => createEvent()} disabled={loading}>
                    <Text style={styles.buttonText}>CREATE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.buttonStyle, styles.cancelButton]} onPress={() => cancelGroupCreation()} disabled={loading}>
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>
                </View>

                </ScrollView>
              </View>
              </KeyboardAvoidingView>
            </View>
          
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 10,
  },
  oddsContainer: {
    marginRight: 20,
  },
  header: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.primary,
    textAlign: "left",
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonStyle: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 50,
  },
  createButton: {
    backgroundColor: "#ff496b",
  },
  cancelButton: {
    backgroundColor: "#1d1a1c",
    borderWidth: 1,
    borderColor: "#252B38",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  cancelButtonText: {
    color: "#7A8499",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 1.5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardAvoidingView: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: "#121112",
    padding: 20,
    width: "90%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#252B38",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 16,
    textAlign: "center",
    color: "#FFFFFF",
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    color: Colors.textColor,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 5,
    color: "#7A8499",
    textTransform: 'uppercase',
  },
  picker: {
    height: 50,
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 5,
    marginBottom: 10,
  },
  selectedVisibilityButton: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 35,
    marginRight: 10,
    backgroundColor: "#ff496b",
  },
  deselectedVisibilityButton: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 35,
    marginRight: 10,
    backgroundColor: "#1d1a1c",
    borderWidth: 1,
    borderColor: "#252B38",
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 35,
    marginRight: 10,
    backgroundColor: "#1d1a1c",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
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
    color: Colors.textColor,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#252B38',
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#1d1a1c",
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  datePickerText: {
    color: Colors.textColor,
    fontSize: 14,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 11,
    color: '#7A8499',
    marginTop: 5,
    fontStyle: 'italic',
  },
});