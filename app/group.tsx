
import { useEffect, useLayoutEffect, useState } from "react";
import { getAuth, updateProfile } from "firebase/auth";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView, Modal, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { EventCard } from "@/components/EventCard";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE } from "@/.FirebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { PropCard } from "@/components/PropCard";
import { CreatePropView } from "@/components/CreatePropView";
import Colors from "@/assets/styles/colors";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
import { CreateMSOView } from "@/components/CreateEventView";
import { BasicEventCard } from "@/components/BasicEventCard";
import { BetSlipView } from "@/components/BetSlipView";


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
  date: Date;
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
  date: Date;
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
    const [createPropModalVisible, setCreatePropModalVisible] = useState(false);
    const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
    const [betSlipOdds, setBetSlipOdds] = useState(new Map<string, string>());
    const [betSlip, setBetSlip] = useState<Map<string, string>[]>([]);
    const [createButtonBottomMargin, setCreateButtonBottomMargin] = useState(50);
    const [liveSlipOdds, setLiveSlipOdds] = useState("");
    const [wager, setWager] = useState(100);
    const [totalDecimalOdds, setTotalDecimalOdds] = useState(1.0);
    const [loading, setLoading] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [betSlipModalVisible, setBetSlipModalVisible] = useState(false);
    
    useEffect(() => {
      if (betSlip.length > 0) {
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

      let parlayDecimalOdds = (decimalOdds[0]);
      for(let i = decimalOdds.length - 1; i > 0; i--){

        parlayDecimalOdds += decimalOdds[i];

      }

      if(parlayDecimalOdds >= 2){

        setLiveSlipOdds("+" +(Math.round((parlayDecimalOdds - 1) * 100)).toString());

      } else {

        setLiveSlipOdds(Math.round((-100 / (parlayDecimalOdds - 1))).toString());

      }

      setTotalDecimalOdds(parlayDecimalOdds);

    }

    function oddsToMultiplier(odds: number): number {
      if (odds > 0) {
        return +(odds / 100 + 1).toFixed(2);
      } else if (odds < 0) {
        return +(100 / Math.abs(odds) + 1).toFixed(2);
      } else {
        return 1; 
      }
    }

    

    const placeBets = async () => {
      setLoading(true);
      console.log("Placed bets");
      try {
        const wagersRef = doc(collection(FIRESTORE, "wagers")); // Create a new group doc reference
        const userRef = doc(collection(FIRESTORE, "groups"));
        const wagerId = wagersRef.id; // Get the auto-generated ID
        

        let counter = 0; 
        betSlip.forEach(bet => {
          const eventId = bet.get("eventId");

          if (!eventId) return; // safety check

          const moneylineKey = `${eventId}-moneyline`;
          const spreadKey = `${eventId}-spread`;
          const overUnderKey = `${eventId}-overUnder`;

          if (bet.has(moneylineKey)) {
            const value = bet.get(moneylineKey);
            bet.set(eventId, value!);
            bet.delete(moneylineKey);
            counter++;
          } else if (bet.has(spreadKey)) {
            const value = bet.get(spreadKey);
            bet.set(eventId, value!);
            bet.delete(spreadKey);
            counter++;
          } else if (bet.has(overUnderKey)) {
            const value = bet.get(overUnderKey);
            bet.set(eventId, value!);
            bet.delete(overUnderKey);
            counter++;
          }
        });

        const betSlipObjectArray = betSlip.map((betMap) => Object.fromEntries(betMap));
        const eventIds = betSlipObjectArray.map(bet => bet.eventId);

        if(counter > 1){

          Alert.alert("Error", "You cannot parlay bets from the same event."); 
          setBetSlip([]);
          setBetSlipOdds(new Map<string, string>());
          setLoading(false);
          fetchBalance();
          return; 

        } 


        await setDoc(wagersRef, {
          groupId: groupId,
          eventIds: eventIds,
          odds: liveSlipOdds,
          multiplier: oddsToMultiplier(Number(liveSlipOdds)),
          risk: wager, 
          payout: Math.round(wager * totalDecimalOdds),
          date: new Date(),
          picks: betSlipObjectArray,
          status: 'active',
          userId: FIREBASE_AUTH.currentUser?.uid,
        });

        const userId = FIREBASE_AUTH.currentUser?.uid;
        if (!userId) throw new Error("User not authenticated");

        const memberRef = doc(FIRESTORE, "groups", groupId as string, "members", userId);

        // Fetch current balance
        const memberSnap = await getDocs(collection(FIRESTORE, `groups/${groupId}/members`));
        const memberDoc = memberSnap.docs.find(doc => doc.id === userId);

        if (!memberDoc || !memberDoc.exists()) {
          throw new Error("Member document not found");
        }

        const currentBalance = memberDoc.data().balance;
        const newBalance = currentBalance - wager;

        await setDoc(memberRef, {
          balance: newBalance,
        }, { merge: true });

      } catch (error) {
        console.error("Error placing bet:", error);
      }
      setBetSlip([]);
      setBetSlipOdds(new Map<string, string>());
      setLoading(false);
      fetchBalance();

    }
    const fetchBalance = async () => {

      const userId = FIREBASE_AUTH.currentUser?.uid;
        if (!userId) throw new Error("User not authenticated");

        const memberRef = doc(FIRESTORE, "groups", groupId as string, "members", userId);

        // Fetch current balance
        const memberSnap = await getDocs(collection(FIRESTORE, `groups/${groupId}/members`));
        const memberDoc = memberSnap.docs.find(doc => doc.id === userId);

        if (!memberDoc || !memberDoc.exists()) {
          throw new Error("Member document not found");
        }

        setCurrentBalance(memberDoc.data().balance)

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
                  results: eventData.result,
                });

              } else if (eventData.type == "basic")
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
                    spread: "N/A",
                    spreadOdds1: "N/A",
                    spreadOdds2: "N/A",
                    overUnder: "N/A",
                    overOdds: "N/A",
                    underOdds: "N/A",
                    date: eventData.date,
                    status: eventData.status,
                    results: eventData.result,
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
          setBetSlip([]);
          setBetSlipOdds(new Map<string, string>());
        } catch (error) {
          console.error("Error fetching events:", error);
        }
      };

      useEffect(() => {
          fetchEvents();
          fetchBalance();
           }, []);

      useLayoutEffect(() => {
        navigation.setOptions({ title: `${name}` });
      }, [navigation, name]);

  return (
    <View style={styles.container}>

      <View style={styles.switchContainer}>
              <TouchableOpacity 
                style={[styles.switchButton, view === "events" && styles.activeSwitchButton]} 
                onPress={() => setView("events")}>
                <Text style={styles.switchText}>Games</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchButton, view === "props" && styles.activeSwitchButton]} 
                onPress={() => setView("props")}>
                <Text style={styles.switchText}>Props</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchButton, view === "leaderboard" && styles.activeSwitchButton]} 
                onPress={() => setView("leaderboard")}>
                <Text style={styles.switchText}>Leaderboard</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchButton, view === "info" && styles.activeSwitchButton]} 
                onPress={() => setView("info")}>
                <Text style={styles.switchText}>Info</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchButton, styles.balance]}>
                <Text numberOfLines={1} ellipsizeMode="clip" style={styles.currencyText}>
                  {currentBalance <= 9999 
                    ? currentBalance 
                    : (currentBalance / 1000).toFixed(1).replace(/\.0$/, '') + 'K'}
                </Text>
              </TouchableOpacity>
            </View>
          {(view === "events" || view === "props") && (
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
                  {view === "events" && (
                    // Shows all groups that the currect user is NOT currently in using filter
                    events
                          .filter((event) => (event.status == "active"))
                          .map((event) => {
                          if(event.type == "MSO") {

                            return (

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
                              isAdmin={admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true}
                              
                              >
                              
                            </EventCard>   

                            )

                          } else if(event.type == "basic")
                          {

                            return (

                              <BasicEventCard 
                              key={event.id} 
                              groupName={event.groupName} 
                              team1={event.team1} 
                              team2={event.team2} 
                              moneylineOdds1={event.moneylineOdds1} 
                              moneylineOdds2={event.moneylineOdds2} 
                              eventId={event.id} 
                              date={event.date} 
                              fetchGroups={fetchEvents}
                              setBetSlip={setBetSlip}
                              setBetSlipOdds={setBetSlipOdds}
                              betSlip={betSlip}
                              isAdmin={admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true}
                              >
                              
                            </BasicEventCard>  

                            )

                          }}
                            
                      ))
                  }
                  {view === "props" && (
          
                    props 
                          .filter((prop) => (prop.status == "active"))
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
                              isAdmin={admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true}
                              
                              >
                            </PropCard>   
                      ))
                  )}
                  </ScrollView>
                  )}

                  {view == "leaderboard" && (

                    //Add leaderboard here
                    <>
                    <View style={{alignItems: 'center', justifyContent: 'center', backgroundColor: '', flex: 1}}>
                      <Text style={{color: Colors.textColor, fontSize: 30, fontWeight: 'bold'}}>COMING SOON</Text>
                    </View>
                    </>

                  )}

                  {view == "info" && (

                  //Add group info here
                  <>

                    <View style={{alignItems: 'center', justifyContent: 'center', backgroundColor: '', flex: 1}}>
                      <Text style={{color: Colors.textColor, fontSize: 30, fontWeight: 'bold'}}>Invite Code: {(groupId.toString().substring(groupId.toString().length - 6)).toUpperCase()}</Text>
                    </View>
                    
                  </>

                  )}
                

                <Modal animationType="fade" transparent={true} visible={createPropModalVisible}>
                    <CreatePropView fetchGroups={fetchEvents} setModalVisible={setCreatePropModalVisible} groupId={groupId} groupName={name}></CreatePropView>
                </Modal>

                <Modal animationType="fade" transparent={true} visible={createEventModalVisible}>
                    <CreateMSOView fetchGroups={fetchEvents} setModalVisible={setCreateEventModalVisible} groupId={groupId} groupName={name}></CreateMSOView>
                </Modal>

                <Modal animationType="fade" transparent={true} visible={betSlipModalVisible}>
                    <BetSlipView fetchGroups={fetchEvents} setModalVisible={setBetSlipModalVisible} numberOfPicks={betSlip.length} odds={liveSlipOdds} oddsToMultiplier={oddsToMultiplier} balance={currentBalance} setWager={setWager} wager={wager} placeBets={placeBets}></BetSlipView>
                </Modal>

                <View style={styles.betSlipAndCreateButton}>
    
                  {(admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true && view == "props" && betSlip.length == 0) && (

                  <TouchableOpacity style={styles.plusButtonStyle} onPress={() => {setCreatePropModalVisible(true)}}>
                    <Text style={styles.plusButtonText}>+</Text>
                  </TouchableOpacity>

                  )}

                  {(admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true && view == "events" && betSlip.length == 0) && (

                  <TouchableOpacity style={styles.plusButtonStyle} onPress={() => {setCreateEventModalVisible(true)}}>
                    <Text style={styles.plusButtonText}>+</Text>
                  </TouchableOpacity>

                  )}

                  {betSlip.length > 0 && (

                    <View style={styles.betSlipButtonContainer}>
                      <TouchableOpacity disabled={loading} onPress={() => {setBetSlipModalVisible(true)}}>
                          <Text style={styles.betSlipButtonText}>
                            {loading ? "PLACING BETS...": "OPEN BET SLIP (" + liveSlipOdds + ")"}
                            </Text>
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
  balance: {

    maxWidth: 75,

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

    marginHorizontal: 10,
    marginBottom: 35,

  },
  
  betSlipButtonText: {

    textAlign: 'center',
    fontSize: 28,
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
    bottom: 20,
    position: 'absolute',
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
    backgroundColor: Colors.background,
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
  currencyText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
    
  },
});