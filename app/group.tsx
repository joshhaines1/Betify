import { useEffect, useLayoutEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { arrayRemove, doc, updateDoc } from "firebase/firestore";
import { FIREBASE_AUTH, FIRESTORE } from "@/.FirebaseConfig";
import { useNavigation } from '@react-navigation/native';
import { UnifiedCard } from "@/components/UnifiedCard";
import { CreatePropView } from "@/components/CreatePropView";
import Colors from "@/assets/styles/colors";
import { CreateMSOView } from "@/components/CreateEventView";
import { BetSlipView } from "@/components/BetSlipView";
import * as wagers_service from "../clients/wagers-client";
import * as groups_client from "../clients/groups-client";
import * as events_client from "../clients/events-client";
import Leaderboard from "@/components/Leaderboard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event {
  id: string;
  groupId: string;
  groupName: string;
  type: string;
  options: {
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
  };
  lockDate: Date;
  createdAt: Date;
  status: string;
  results: string[];
  acceptingWagers: boolean;
}

interface Prop {
  id: string;
  groupId: string;
  name: string;
  description: string;
  overOdds: string;
  underOdds: string;
  overUnder: string;
  createdAt: Date;
  groupName: string;
  result: string;
  status: string;
  lockDate: Date;
  acceptingWagers: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Group() {
  const { name, groupId, admins } = useLocalSearchParams();
  const [view, setView] = useState("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const navigation = useNavigation();
  const [createPropModalVisible, setCreatePropModalVisible] = useState(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
  const [betSlipOdds, setBetSlipOdds] = useState(new Map<string, string>());
  const [betSlip, setBetSlip] = useState<Map<string, string>[]>([]);
  const [liveSlipOdds, setLiveSlipOdds] = useState("");
  const [wager, setWager] = useState(100);
  const [totalDecimalOdds, setTotalDecimalOdds] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [betSlipModalVisible, setBetSlipModalVisible] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  const isAdmin = admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true;

  // ── Bet slip side effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (betSlip.length > 0) calculateOdds();
  }, [betSlip]);

  // ── Cache helpers ──────────────────────────────────────────────────────────
  const invalidateEventsCache = () => {
    events_client.clearEventsCache(groupId as string);
  };

  const invalidateBalanceCache = () => {
    groups_client.clearBalanceCache(groupId as string);
  };

  const onEventChanged = (eventId: string, shouldRemove: boolean) => {
    if (shouldRemove) setEvents((prev) => prev.filter((e) => e.id !== eventId));
    invalidateEventsCache();
  };

  const onPropChanged = (propId: string, shouldRemove: boolean) => {
    if (shouldRemove) setProps((prev) => prev.filter((p) => p.id !== propId));
    invalidateEventsCache();
  };

  // ── Odds calculation ───────────────────────────────────────────────────────
  const calculateOdds = () => {
    const decimalOdds = [...betSlipOdds.values()].map((o) => {
      const american = +o;
      return american < 0 ? 100 / Math.abs(american) + 1 : american / 100 + 1;
    });

    const parlay = decimalOdds.reduce((acc, o, i) => (i === 0 ? o : acc + o), 0);

    setLiveSlipOdds(
      parlay >= 2
        ? `+${Math.round((parlay - 1) * 100)}`
        : `${Math.round(-100 / (parlay - 1))}`
    );
    setTotalDecimalOdds(parlay);
  };

  const oddsToMultiplier = (odds: number): number => {
    if (odds > 0) return +(odds / 100 + 1).toFixed(2);
    if (odds < 0) return +(100 / Math.abs(odds) + 1).toFixed(2);
    return 1;
  };

  // ── Place bets ─────────────────────────────────────────────────────────────
  const placeBets = async () => {
    setLoading(true);
    try {
      let counter = 0;
      const lockDates: Date[] = [];

      betSlip.forEach((bet) => {
        const eventId = bet.get("eventId");
        if (!eventId) return;

        const lockDateValue = bet.get("lockDate") as any;
        if (lockDateValue?._seconds) lockDates.push(new Date(lockDateValue._seconds * 1000));

        for (const suffix of ["moneyline", "spread", "overUnder"]) {
          const key = `${eventId}-${suffix}`;
          if (bet.has(key)) {
            const value = bet.get(key);
            if (value !== undefined) {
              bet.set(eventId, value);
              bet.delete(key);
              counter++;
            }
            break;
          }
        }
      });

      if (counter > 1) {
        Alert.alert("Error", "You cannot parlay bets from the same event.");
        resetSlip();
        return;
      }

      const betSlipObjectArray = betSlip.map((m) => Object.fromEntries(m));

      await wagers_service.placeWager({
        groupId,
        picks: betSlipObjectArray,
        eventIds: betSlipObjectArray.map((b) => b.eventId),
        odds: liveSlipOdds,
        multiplier: totalDecimalOdds,
        risk: Number(wager),
        payout: Math.round(wager * totalDecimalOdds),
        lockDates,
      });

      Alert.alert("Success!", "Your wager has been placed.");
      resetSlip();
      setCurrentBalance((prev) => prev - wager);
      invalidateBalanceCache();
    } catch (err) {
      resetSlip();
      Alert.alert("Error", err instanceof Error ? err.message : String(err));
    }
    setLoading(false);
  };

  const resetSlip = () => {
    setBetSlip([]);
    setBetSlipOdds(new Map());
  };

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchBalance = async () => {
    const balance = await groups_client.getUsersCurrency(groupId as string);
    setCurrentBalance(balance);
  };

  const fetchLeaderboard = async () => {
    const data = await groups_client.getGroupLeaderboard(groupId as string);
    setLeaderboard(data);
  };

  const refreshEvents = () => fetchEvents(true);

  const fetchEvents = async (forceRefresh = false) => {
    setLoadingEvents(true);
    try {
      const rawEvents = await events_client.getEventsByGroupId({ groupId: groupId as string, forceRefresh });
      const eventsList: Event[] = [];
      const propsList: Prop[] = [];

      rawEvents.forEach((eventData) => {
        if (!eventData.acceptingWagers && !isAdmin) return;

        if (eventData.type === "MSO") {
          eventsList.push({
            id: eventData.id,
            groupId: eventData.groupId,
            groupName: eventData.groupName,
            type: eventData.type,
            options: {
              team1: eventData.options.team1,
              team2: eventData.options.team2,
              moneylineOdds1: eventData.options.moneylineOdds1,
              moneylineOdds2: eventData.options.moneylineOdds2,
              spread: eventData.options.spread,
              spreadOdds1: eventData.options.spreadOdds1,
              spreadOdds2: eventData.options.spreadOdds2,
              overUnder: eventData.options.overUnder,
              overOdds: eventData.options.overOdds,
              underOdds: eventData.options.underOdds,
            },
            lockDate: eventData.lockDate,
            createdAt: eventData.createdAt,
            status: eventData.status,
            results: eventData.results,
            acceptingWagers: eventData.acceptingWagers,
          });
        } else if (eventData.type === "basic") {
          eventsList.push({
            id: eventData.id,
            groupId: eventData.groupId,
            groupName: eventData.groupName,
            type: eventData.type,
            options: {
              team1: eventData.options.team1,
              team2: eventData.options.team2,
              moneylineOdds1: eventData.options.moneylineOdds1,
              moneylineOdds2: eventData.options.moneylineOdds2,
              spread: "N/A",
              spreadOdds1: "N/A",
              spreadOdds2: "N/A",
              overUnder: "N/A",
              overOdds: "N/A",
              underOdds: "N/A",
            },
            lockDate: eventData.lockDate,
            createdAt: eventData.createdAt,
            status: eventData.status,
            results: eventData.results,
            acceptingWagers: eventData.acceptingWagers,
          });
        } else if (eventData.type === "prop") {
          propsList.push({
            id: eventData.id,
            groupId: eventData.groupId,
            name: eventData.options.name,
            description: eventData.options.description,
            overOdds: eventData.options.overOdds,
            underOdds: eventData.options.underOdds,
            overUnder: eventData.options.overUnder,
            createdAt: eventData.createdAt,
            groupName: eventData.groupName,
            lockDate: eventData.lockDate,
            result: eventData.results[0],
            status: eventData.status,
            acceptingWagers: eventData.acceptingWagers,
          });
        }
      });

      setEvents(eventsList);
      setProps(propsList);
      setBetSlip([]);
      setBetSlipOdds(new Map());
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchBalance();
    fetchLeaderboard();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${name}` });
  }, [navigation, name]);

  const handleLeaveButtonPress = async () => {
    try {
      const groupRef = doc(FIRESTORE, "groups", groupId as string);
      await updateDoc(groupRef, { members: arrayRemove(FIREBASE_AUTH.currentUser?.uid) });
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  // ── Shared props passed to every UnifiedCard ───────────────────────────────
  const sharedCardProps = {
    groupId: groupId as string,
    betSlip,
    setBetSlip,
    setBetSlipOdds,
    isAdmin,
    refreshEvents,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── Tab bar ── */}
      <View style={styles.switchContainer}>
        {(["events", "props", "leaderboard", "info"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.switchButton, view === tab && styles.activeSwitchButton]}
            onPress={() => setView(tab)}
          >
            <Text style={styles.switchText}>
              {tab === "events" ? "Games" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.switchButton, styles.balance]}>
          <Text ellipsizeMode="clip" style={styles.currencyText}>
            {currentBalance <= 9999
              ? currentBalance
              : (currentBalance / 1000).toFixed(1).replace(/\.0$/, "") + "K"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Events + Props scroll ── */}
      {(view === "events" || view === "props") && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          {loadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <>
              {view === "events" &&
                events.map((event) => (
                  <UnifiedCard
                    key={event.id}
                    type={event.type === "MSO" ? "event" : "basic"}
                    eventId={event.id}
                    groupName={event.groupName}
                    lockDate={event.lockDate as any}
                    createdAt={event.createdAt}
                    acceptingWagers={event.acceptingWagers}
                    onEventSettled={onEventChanged}
                    // team fields
                    team1={event.options.team1}
                    team2={event.options.team2}
                    moneylineOdds1={event.options.moneylineOdds1}
                    moneylineOdds2={event.options.moneylineOdds2}
                    // MSO-only fields (ignored by basic layout)
                    spread={event.options.spread}
                    spreadOdds1={event.options.spreadOdds1}
                    spreadOdds2={event.options.spreadOdds2}
                    overUnder={event.options.overUnder}
                    overOdds={event.options.overOdds}
                    underOdds={event.options.underOdds}
                    {...sharedCardProps}
                  />
                ))}

              {view === "props" &&
                props.map((prop) => (
                  <UnifiedCard
                    key={prop.id}
                    type="prop"
                    eventId={prop.id}
                    groupName={prop.groupName}
                    lockDate={prop.lockDate as any}
                    createdAt={prop.createdAt}
                    acceptingWagers={prop.acceptingWagers}
                    onEventSettled={onPropChanged}
                    // prop fields
                    name={prop.name}
                    description={prop.description}
                    overUnder={prop.overUnder}
                    overOdds={prop.overOdds}
                    underOdds={prop.underOdds}
                    {...sharedCardProps}
                  />
                ))}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Leaderboard ── */}
      {view === "leaderboard" && <Leaderboard data={leaderboard} />}

      {/* ── Info ── */}
      {view === "info" && (
        <View style={{ alignItems: "center", justifyContent: "center", flex: 1 }}>
          <Text style={{ color: Colors.textColor, fontSize: 30, fontWeight: "bold" }}>
            Invite Code: {(groupId.toString().substring(groupId.toString().length - 6)).toUpperCase()}
          </Text>
          <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveButtonPress}>
            <Text style={{ color: Colors.textColor, fontWeight: "700", fontSize: 16 }}>Leave Group</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Modals ── */}
      <Modal animationType="fade" transparent visible={createPropModalVisible}>
        <CreatePropView fetchEvents={refreshEvents} setModalVisible={setCreatePropModalVisible} groupId={groupId} groupName={name} />
      </Modal>
      <Modal animationType="fade" transparent visible={createEventModalVisible}>
        <CreateMSOView fetchEvents={refreshEvents} setModalVisible={setCreateEventModalVisible} groupId={groupId} groupName={name} />
      </Modal>
      <Modal animationType="fade" transparent visible={betSlipModalVisible}>
        <BetSlipView
          fetchGroups={refreshEvents}
          setModalVisible={setBetSlipModalVisible}
          numberOfPicks={betSlip.length}
          odds={liveSlipOdds}
          oddsToMultiplier={oddsToMultiplier}
          balance={currentBalance}
          setWager={setWager}
          wager={wager}
          placeBets={placeBets}
        />
      </Modal>

      {/* ── FAB / Bet slip button ── */}
      <View style={styles.betSlipAndCreateButton}>
        {isAdmin && view === "props" && betSlip.length === 0 && (
          <TouchableOpacity style={styles.plusButtonStyle} onPress={() => setCreatePropModalVisible(true)}>
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        )}
        {isAdmin && view === "events" && betSlip.length === 0 && (
          <TouchableOpacity style={styles.plusButtonStyle} onPress={() => setCreateEventModalVisible(true)}>
            <Text style={styles.plusButtonText}>+</Text>
          </TouchableOpacity>
        )}
        {betSlip.length > 0 && (
          <View style={styles.betSlipButtonContainer}>
            <TouchableOpacity disabled={loading} onPress={() => setBetSlipModalVisible(true)}>
              <Text style={styles.betSlipButtonText}>
                {loading ? "PLACING BETS..." : `OPEN BET SLIP (${liveSlipOdds})`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  leaveButton: {
    backgroundColor: Colors.primary,
    width: 120,
    height: 35,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
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
  scrollContent: {
    paddingBottom: 100,
  },
  betSlipButtonText: {
    textAlign: "center",
    fontSize: 28,
    color: "white",
    fontWeight: "700",
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
    alignSelf: "flex-end",
    bottom: 20,
    position: "absolute",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  switchButton: {
    padding: 10,
    alignItems: "center",
    marginHorizontal: 3,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
});
