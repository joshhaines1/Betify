import React, { useEffect, useState } from "react";
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView,
} from "react-native";
import { GroupCard } from "@/components/GroupCard";
import { addDoc, setDoc, doc, getDocs, collection } from "firebase/firestore";
import { FIRESTORE, FIREBASE_AUTH } from "@/.FirebaseConfig";
import { CreateGroupView } from "@/components/CreateGroupView";
import * as Haptics from 'expo-haptics';

// Define the type for Group
interface Group {
  id: string;
  name: string;
  members: string[];
  creator: string;
  visibility: string;
  startingCurrency: number;
  password: string;
  admins: string[];
  creationDate: Date;
}

export default function GroupsScreen() {
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [view, setView] = useState("join");
 
  
  // Define state to hold fetched groups
  const [groups, setGroups] = useState<Group[]>([]);

  

  const fetchGroups = async () => {
    try {
      const querySnapshot = await getDocs(collection(FIRESTORE, "groups"));
      const groupsList: Group[] = [];
      querySnapshot.forEach((doc) => {
        const groupData = doc.data();
        
        groupsList.push({
          id: doc.id,
          name: groupData.name,
          members: groupData.members,
          creator: groupData.creator,
          visibility: groupData.visibility,
          startingCurrency: groupData.startingCurrency,
          admins: groupData.admins,
          creationDate: groupData.creationDate,
          password: groupData.password,
        });
      });
      setGroups(groupsList);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);


  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <TouchableOpacity 
          style={[styles.switchButton, view === "join" && styles.activeSwitchButton]} 
          onPress={() => setView("join")}>
          <Text style={styles.switchText}>Explore Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.switchButton, view === "joined" && styles.activeSwitchButton]} 
          onPress={() => setView("joined")}>
          <Text style={styles.switchText}>My Groups</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
        {view === "join" ? (
          // Shows all groups that the currect user is NOT currently in using filter
          groups
            .filter((group) => !group.members?.includes(FIREBASE_AUTH.currentUser?.uid ?? ""))
              .map((group) => (
                
                  <GroupCard
                    key={group.id}
                    name={group.name}
                    members={group.members}
                    adminName={group.creator}
                    visibility={group.visibility}
                    password={group.password}
                    startingCurrency={group.startingCurrency}
                    groupId={group.id}
                    fetchGroups={fetchGroups}
                    joined={false}
                    />
      ))
        ) : (

          //Shows all groups that the current user IS currently in using filter
          groups
            .filter((group) => group.members.includes(FIREBASE_AUTH.currentUser?.uid ?? ""))
              .map((group) => (
                    <GroupCard
                      key={group.id}
                      name={group.name}
                      members={group.members}
                      adminName={group.creator}
                      visibility={group.visibility}
                      password={group.password}
                      startingCurrency={group.startingCurrency}
                      groupId={group.id}
                      fetchGroups={fetchGroups}
                      joined={true}
                    />
      ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.plusButtonStyle} onPress={() => setCreateModalVisible(true)}>
        <Text style={styles.plusButtonText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="fade" transparent={true} visible={createModalVisible}>
        <CreateGroupView fetchGroups={fetchGroups} setModalVisible={setCreateModalVisible}></CreateGroupView>
      </Modal>
  
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
