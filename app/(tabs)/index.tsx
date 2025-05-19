import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  Modal,
} from "react-native";
import { GroupCard } from "@/components/GroupCard";
import { getDocs, collection, limit, query, where } from "firebase/firestore";
import { FIRESTORE, FIREBASE_AUTH } from "@/.FirebaseConfig";
import { CreateGroupView } from "@/components/CreateGroupView";
import { useFocusEffect } from "expo-router";
import Colors from "@/assets/styles/colors";
import { TextInput } from "react-native";
import { JoinGroupWithCodeView } from "@/components/JoinGroupWithCodeView";

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
  const [inviteCodeModal, setInviteCodeModalVisible] = useState(false);
  const [view, setView] = useState("joined");
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [otherGroups, setOtherGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  //Refresh on refocus
  /* useFocusEffect(
    useCallback(() => {
      fetchGroups();
    }, [])
  ); */
  useEffect(() => {
    fetchGroups();
     }, []);

     const buildQuery = (allGroups: boolean) => {
      let betsQuery = allGroups
        ? query(collection(FIRESTORE, "groups"),
          limit(10)
      ) 
        : query(
            collection(FIRESTORE, "groups"),
            where("members", "array-contains", FIREBASE_AUTH.currentUser?.uid)
          );
    
      return betsQuery;
    };
    

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(buildQuery(false));
      const myGroupsList: Group[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setMyGroups(myGroupsList);

      const querySnapshot1 = await getDocs(buildQuery(true));
      const otherGroupsList: Group[] = querySnapshot1.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Group[];
      setOtherGroups(otherGroupsList);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    console.log("Refresh..");
    setRefreshing(true);
    await sleep(1000);
    await fetchGroups();
    setRefreshing(false);
  };

  const renderGroup = ({ item }: { item: Group }) => (
    <GroupCard
      key={item.id}
      name={item.name}
      members={item.members}
      adminName={item.creator}
      admins={item.admins}
      visibility={item.visibility}
      password={item.password}
      startingCurrency={item.startingCurrency}
      groupId={item.id}
      fetchGroups={fetchGroups}
      joined={view === "joined"}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.switchContainer}>
        <TouchableOpacity 
          style={[styles.switchButton, view === "joined" && styles.activeSwitchButton]} 
          onPress={() => setView("joined")}>
          <Text style={styles.switchText}>My Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.switchButton, view === "explore" && styles.activeSwitchButton]} 
          onPress={() => setView("explore")}>
          <Text style={styles.switchText}>Explore Groups</Text>
        </TouchableOpacity>

        <View style={styles.joinButtonContainer}>
          <TouchableOpacity 
          style={[styles.joinButton]} 
          onPress={() => setInviteCodeModalVisible(true)}>
          <Text style={styles.switchText}>JOIN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {refreshing && (
        <ActivityIndicator size="large" color="#ff496b" />
      )}
        <TextInput></TextInput>
        <FlatList
          data={view == "joined" ? myGroups : otherGroups.filter((group) =>
                  !group.members.includes(FIREBASE_AUTH.currentUser?.uid ?? ""))
                }
          keyExtractor={(item) => item.id}
          renderItem={renderGroup}
          refreshing={refreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      

      <TouchableOpacity style={styles.plusButtonStyle} onPress={() => setCreateModalVisible(true)}>
        <Text style={styles.plusButtonText}>+</Text>
      </TouchableOpacity>

      <Modal animationType="fade" transparent={true} visible={createModalVisible}>
        <CreateGroupView fetchGroups={fetchGroups} setModalVisible={setCreateModalVisible}></CreateGroupView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={inviteCodeModal}>
        <JoinGroupWithCodeView fetchGroups={fetchGroups} setModalVisible={setInviteCodeModalVisible}></JoinGroupWithCodeView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 10,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 10,
    backgroundColor: '',
  },
  switchButton: {
    padding: 10,
    marginHorizontal: 5,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  joinButtonContainer: {
    alignItems: 'flex-end',
    flex: 1, 
    padding: 5,
    marginHorizontal: 5,
    borderBottomWidth: 0,
    borderColor: "transparent",
    height: '100%',
    backgroundColor: '',
    
  },
  joinButton: {

    backgroundColor: Colors.primary, 
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, 
    borderRadius: 5,

  },
  activeSwitchButton: {
    borderColor: "#ff496b",
  },
  switchText: {
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: "bold",
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
  plusButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 50,
    padding: 0,
    lineHeight: 52.5,
  },
});
