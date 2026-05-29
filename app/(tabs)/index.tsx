import React, { useCallback, useEffect, useState } from "react";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
// ADS
import { useAds } from "../../context/PurchasesContext";
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { GroupCard } from "@/components/GroupCard";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { CreateGroupView } from "@/components/CreateGroupView";
import Colors from "@/assets/styles/colors";
import { JoinGroupWithCodeView } from "@/components/JoinGroupWithCodeView";
import * as groups_service from "../../clients/groups-client";
import { useFocusEffect } from "@react-navigation/core";

// ADS
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS!
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID!;
    

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
  const { adsEnabled } = useAds();
  

  useFocusEffect(
  useCallback(() => {
    fetchGroups(false);
  }, [])
);
    
  const fetchGroups = async (forceRefresh: boolean = false) => {
    try {
    setLoading(true);
    const myGroups = await groups_service.getUsersGroups(forceRefresh);
    const otherGroups = await groups_service.getAllGroups(0, forceRefresh);
    setMyGroups(myGroups);
    setOtherGroups(otherGroups);
    console.log("No error");
    
  } catch (error) {
    setMyGroups([]);
    setOtherGroups([]);
    Alert.alert("Error", "Failed to load groups. Please try again later.");
  } finally {
    setLoading(false);
  }
};

  const onRefresh = async () => {
    console.log("Refresh..");
    setRefreshing(true);
    await fetchGroups(true);
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

      
        {/* ADS */}
      {adsEnabled && (
      <View style={{ marginBottom: 10, alignItems: 'center' }}>
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    )}
      {loading && myGroups?.length === 0 && otherGroups?.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : view === "joined" && myGroups.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 50 }}>
          <Text style={{ fontSize: 18, color: Colors.textColor, fontWeight: '600'}}>
            You haven't joined any groups yet.
          </Text>
          <View style={{flexDirection: "row"}}>
            <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
              <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>
                Create{' '}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>
              or{' '}
            </Text>
            <TouchableOpacity onPress={() => setInviteCodeModalVisible(true)}>
              <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>
                join{' '}
              </Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>
              a group now!
            </Text>
          </View>
        </View>
      ) : (
        <>
          <FlatList
            data={myGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            style={[{ flex: 1 }, view !== "joined" && { display: "none" }]}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ fontSize: 18, color: Colors.textColor, fontWeight: '600' }}>
                  You haven't joined any groups yet.
                </Text>
                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
                    <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>Create </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>or </Text>
                  <TouchableOpacity onPress={() => setInviteCodeModalVisible(true)}>
                    <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>join </Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, color: Colors.primary, marginTop: 10, fontWeight: '700' }}>a group now!</Text>
                </View>
              </View>
            }
          />
          <FlatList
            data={otherGroups.filter((group) => !group.members.includes(FIREBASE_AUTH.currentUser?.uid ?? ""))}
            keyExtractor={(item) => item.id}
            renderItem={renderGroup}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            style={[{ flex: 1 }, view !== "explore" && { display: "none" }]}
          />
        </>
      )}

      <TouchableOpacity style={styles.plusButtonStyle} onPress={() => setCreateModalVisible(true)}>
        <Text style={styles.plusButtonText}>+</Text>
      </TouchableOpacity>


      <Modal animationType="fade" transparent={true} visible={createModalVisible}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <CreateGroupView fetchGroups={fetchGroups} setModalVisible={setCreateModalVisible}></CreateGroupView>
        </KeyboardAvoidingView>
      </Modal>
      
      <Modal animationType="fade" transparent={true} visible={inviteCodeModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
        <JoinGroupWithCodeView fetchGroups={fetchGroups} setModalVisible={setInviteCodeModalVisible}></JoinGroupWithCodeView>
        </KeyboardAvoidingView>
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
    width: "100%",
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
    width: '75%',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
});
