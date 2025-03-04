
import { useEffect, useLayoutEffect, useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EventCard } from "@/components/EventCard";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE } from "@/.FirebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { PropCard } from "@/components/PropCard";
import { CreatePropView } from "@/components/CreatePropView";
import Colors from "@/assets/styles/colors";


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
  status: string;
  results: string[];

}

interface Prop {

  id: string; 
  groupId: string;
  name: string;
  description: string;
  overOdds: string;
  underOdds: string;
  overUnder: string;
  date: string;
  groupName: string;
  result: string; 
  status: string;


}

interface Bet {

  amount: number;
  groupId: string;
  odds: string;
  picks: Map<string, string>,
  status: string;
  userId: string;

}

export default function Group() {
    const { name, groupId, admins} = useLocalSearchParams();
    const [view, setView] = useState("events");
    const [events, setEvents] = useState<Event[]>([]);
    const [props, setProps] = useState<Prop[]>([]);
    const navigation = useNavigation(); 
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [betSlipOdds, setBetSlipOdds] = useState(new Map<string, string>());
    const [betSlip, setBetSlip] = useState(new Map<string, string>());
    const [createButtonBottomMargin, setCreateButtonBottomMargin] = useState(50);
    const [liveSlipOdds, setLiveSlipOdds] = useState("");
    const [wager, setWager] = useState(100);
    
    useEffect(() => {
      if (betSlip.size > 0) {
        setCreateButtonBottomMargin(0); // Push above bet slip button
        calculateOdds();
      } else {
        setCreateButtonBottomMargin(50); // Default position
      }
    }, [betSlip]);

    const calculateOdds = async () => {

      let decimalOdds: number[] = [];
      for(const odds_string of betSlipOdds.values()){

        let americanOdds = +(odds_string);
        if(americanOdds < 0){

          decimalOdds.push((100 / Math.abs(americanOdds)) + 1);

        } else {

          decimalOdds.push((americanOdds / 100) + 1);

        }
        
      }

      let parlayDecimalOdds = decimalOdds[0];
      for(let i = decimalOdds.length - 1; i > 0; i--){

        parlayDecimalOdds *= decimalOdds[i];

      }

      if(parlayDecimalOdds >= 2){

        setLiveSlipOdds("+" +(Math.round((parlayDecimalOdds - 1) * 100)).toString());

      } else {

        setLiveSlipOdds(Math.round((-100 / (parlayDecimalOdds - 1))).toString());

      }

    }

    const placeBets = async () => {

      console.log("Placed bets");
      try {
        const wagersRef = doc(collection(FIRESTORE, "wagers")); // Create a new group doc reference
        const wagerId = wagersRef.id; // Get the auto-generated ID
        const betSlipObject = Object.fromEntries(betSlip);

        await setDoc(wagersRef, {
          amount: wager,
          groupId: groupId,
          odds: liveSlipOdds,
          picks: betSlipObject,
          status: 'open',
          userId: FIREBASE_AUTH.currentUser?.uid,
        });
      } catch (error) {
        console.error("Error placing bet:", error);
      }
      setBetSlip(new Map<string, string>());
      setBetSlipOdds(new Map<string, string>());

    }
    const fetchEvents = async () => {
        try {
          const querySnapshot = await getDocs(collection(FIRESTORE, "events"));
          const eventsList: Event[] = [];
          const propsList: Prop[] = [];
          querySnapshot.forEach((doc) => {
            const eventData = doc.data();
            if(groupId == eventData.groupId)
            {
              if(eventData.type == "MSO")
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
                  status: eventData.status,
                  results: eventData.results,
                });

              } else if(eventData.type == "prop")
              {
                propsList.push({

                  id: doc.id,
                  groupId: eventData.groupId,
                  name: eventData.name,
                  description: eventData.description,
                  overOdds: eventData.overOdds,
                  underOdds: eventData.underOdds,
                  overUnder: eventData.overUnder,
                  date: eventData.date,
                  groupName: eventData.groupName,
                  result: eventData.result,
                  status: eventData.status,

                });
              }
              
            }
            
          });
          setEvents(eventsList);
          setProps(propsList);
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      };

      useEffect(() => {
          fetchEvents();
           }, []);

      useLayoutEffect(() => {
        navigation.setOptions({ title: `${name}` });
      }, [navigation, name]);

  return (
    <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                  {view === "events" ? (
                    // Shows all groups that the currect user is NOT currently in using filter
                    events
                          .filter((event) => (event.status == "open"))
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
                              fetchGroups={fetchEvents}
                              setBetSlip={setBetSlip}
                              setBetSlipOdds={setBetSlipOdds}
                              betSlip={betSlip}
                              >
                              
                            </EventCard>   
                      ))
                  ) : (
          
                    props 
                          .filter((prop) => (prop.status == "open"))
                          .map((prop) => (
                          
                            <PropCard 
                              key={prop.id} 
                              groupName={prop.groupName} 
                              description={prop.description}
                              name={prop.name} 
                              overUnder={prop.overUnder}
                              overOdds={prop.overOdds}
                              underOdds={prop.underOdds}
                              eventId={prop.id} 
                              date={prop.date} 
                              fetchGroups={fetchEvents}
                              setBetSlip={setBetSlip}
                              setBetSlipOdds={setBetSlipOdds}
                              betSlip={betSlip}
                              >
                            </PropCard>   
                      ))
                  )}
                </ScrollView>

                <Modal animationType="fade" transparent={true} visible={createModalVisible}>
                    <CreatePropView fetchGroups={fetchEvents} setModalVisible={setCreateModalVisible} groupId={groupId} groupName={name}></CreatePropView>
                </Modal>

                <View style={styles.betSlipAndCreateButton}>
    
                  {admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true && (

                  <TouchableOpacity style={styles.plusButtonStyle} onPress={() => {setCreateModalVisible(true)}}>
                    <Text style={styles.plusButtonText}>+</Text>
                  </TouchableOpacity>

                  )}

                  {betSlip.size > 0 && (

                    <View style={styles.betSlipButtonContainer}>
                      <TouchableOpacity onPress={() => {placeBets()}}>
                      <Text style={styles.betSlipButtonText}>OPEN BET SLIP ({liveSlipOdds})</Text>
                      </TouchableOpacity>
                    </View>

                  )}

                </View>
        

          
          
      
        </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  betSlipButtonContainer: {

    width: "100%",
    borderRadius: 25,
    alignSelf: "center",
    justifyContent: "center",
    height: 55,
    backgroundColor: "#ff496b",
    

  },
  betSlipAndCreateButton: {

    margin: 25,
    marginBottom: 35,

  },
  
  betSlipButtonText: {

    textAlign: 'center',
    fontSize: 30,
    color: 'white',
    fontWeight: '700',

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
    backgroundColor: Colors.primary,
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
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    width: 55,
    height: 55,
    backgroundColor: "#ff496b",
    alignSelf: 'flex-end',
    marginBottom: 15,
    
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