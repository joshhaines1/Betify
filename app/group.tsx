
import { useEffect, useLayoutEffect, useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EventCard } from "@/components/EventCard";
import { collection, getDocs } from "firebase/firestore";
import { FIRESTORE } from "@/.FirebaseConfig";
import { useNavigation } from '@react-navigation/native';


interface Event {
  id: string;
  groupId: string;
  groupName: string;
  type: string; 
  team1: string;
  team2: string;
  moneylineOdds1: string;
  moneylineOdds2: string;
  spread: string;
  spreadOdds1: string;
  spreadOdds2: string;
  overUnder: string;
  overOdds: string;
  underOdds: string;
  date: string;

}

export default function Group() {
    const { name, groupId } = useLocalSearchParams();
    const [view, setView] = useState("events");
    const [events, setEvents] = useState<Event[]>([]);
    const navigation = useNavigation(); 

    const fetchEvents = async () => {
        try {
          const querySnapshot = await getDocs(collection(FIRESTORE, "events"));
          const eventsList: Event[] = [];
          console.log("Fetching events...");
          querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            
            if(groupId == eventData.groupId)
            {
              eventsList.push({
                id: doc.id,
                groupId: eventData.groupId,
                groupName: eventData.groupName,
                type: eventData.type, 
                team1: eventData.team1,
                team2: eventData.team2,
                moneylineOdds1: eventData.moneylineOdds1,
                moneylineOdds2: eventData.moneylineOdds2,
                spread: eventData.spread,
                spreadOdds1: eventData.spreadOdds1,
                spreadOdds2: eventData.spreadOdds2,
                overUnder: eventData.overUnder,
                overOdds: eventData.overOdds,
                underOdds: eventData.underOdds,
                date: eventData.date,
              });
          }
          });
          setEvents(eventsList);
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      };

      useEffect(() => {
          fetchEvents();
           }, []);

      useLayoutEffect(() => {
        navigation.setOptions({ title: `${name}'s Events` });
      }, [navigation, name]);

  return (
    <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                  {view === "events" ? (
                    // Shows all groups that the currect user is NOT currently in using filter
                    events
                      .filter((event) => (event.groupId == groupId))
                        .filter((event) => (event.type == "MSO")) //Stands for Moneyline, Spread, Over/Under
                          .map((event) => (
                          
                            <EventCard 
                              key={event.id} 
                              groupName={event.groupName} 
                              team1={event.team1} 
                              team2={event.team2} 
                              moneylineOdds1={event.moneylineOdds1} moneylineOdds2={event.moneylineOdds2} 
                              spread={event.spread}
                              spreadOdds1={event.spreadOdds1}
                              spreadOdds2={event.spreadOdds2}
                              overUnder={event.overUnder}
                              overOdds={event.overOdds}
                              underOdds={event.underOdds}
                              eventId={event.id} 
                              date={event.date} 
                              fetchGroups={fetchEvents}>
                            </EventCard>   
                ))
                  ) : (
          
                    //Shows all groups that the current user IS currently in using filter
                    events
                      .filter((event) => (event.groupId == groupId))
                        .map((event) => (
                              
                          <Text></Text>
                ))
                  )}
                </ScrollView>
    
          
      
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    paddingTop: 0,
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