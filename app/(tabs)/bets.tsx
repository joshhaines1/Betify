import React, { useCallback, useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView,
} from "react-native";
import { GroupCard } from "@/components/GroupCard";
import { addDoc, setDoc, doc, getDocs, collection, query, where } from "firebase/firestore";
import { FIRESTORE, FIREBASE_AUTH } from "@/.FirebaseConfig";
import { CreateGroupView } from "@/components/CreateGroupView";
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from "expo-router";
import { EventCard } from "@/components/EventCard";
import Colors from "@/assets/styles/colors";
import { BetCard } from "@/components/BetCard";

// Define the type for Group
interface Bet {
  id: string;
  date: Date;
  status: string;
  risk: string;
  payout: string;
  userId: number;
  groupName: string;
  picks: any[];
  odds: string;
}

export default function GroupsScreen() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [view, setView] = useState("active");
 
  useFocusEffect(
    useCallback(() => {
      fetchBets();
       
    }, []));
  // Define state to hold fetched groups
  const [bets, setBets] = useState<Bet[]>([]);

  

  const fetchBets = async () => {
    try {
      const betsQuery = query(
        collection(FIRESTORE, "wagers"),
        where("userId", "==", FIREBASE_AUTH.currentUser?.uid) // Add the filter for userId
      );
  
      const querySnapshot = await getDocs(betsQuery);
      const betsList: Bet[] = [];
      querySnapshot.forEach((doc) => {
        const betData = doc.data();
        betsList.push({
          id: doc.id,
          date: betData.date,
          status: betData.status,
          risk: betData.risk,
          payout: betData.payout,
          userId: betData.userId,
          groupName: betData.groupName,
          picks: betData.picks,
          odds: betData.odds,
        });
      });
      setBets(betsList);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchBets();
  }, []);

  //console.log("Test: " + bets[1].picks[0].get("odds"));
  //console.log("Test: " + bets[0].picks[0].get("odds"));
  //console.log(bets[0].picks[0].odds);
  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <TouchableOpacity 
          style={[styles.switchButton, view === "active" && styles.activeSwitchButton]} 
          onPress={() => setView("active")}>
          <Text style={styles.switchText}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.switchButton, view === "settled" && styles.activeSwitchButton]} 
          onPress={() => setView("settled")}>
          <Text style={styles.switchText}>Settled</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {view === "active" ? (
          // Shows all groups that the currect user is NOT currently in using filter
          bets.map((bet) => (
                <BetCard 
                  key={bet.id}
                  date={bet.date} 
                  status={bet.status} 
                  risk={bet.risk}
                  payout={bet.payout}
                  pickId={bet.id}
                  userId={bet.userId}
                  bets={bet.picks}
                  odds={bet.odds}
                  />
              ))
      )
    
    
         : (

          <></>
                    
      )
        }
      </ScrollView>
  
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
    justifyContent: "flex-start",
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
});
