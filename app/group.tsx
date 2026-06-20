import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, ActivityIndicator, Pressable, Platform, Animated } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FIREBASE_AUTH } from "@/FirebaseConfig";
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
import { useAds } from "@/context/PurchasesContext";
import { SafeAreaView } from "react-native-safe-area-context";
//Ad
import { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

//Ad
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS!
    : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID!;

// ADS
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS!
    : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID!;

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

const EVENT_TYPES = [
  {
    key: "basic",
    label: "Basic Event",
    description: "Simple Win/Loss Event",
    onSelect: (setters) => {
      console.log("Setting eventType to basic");
      setters.setEventType("basic");
    },
  },
  {
    key: "advanced",
    label: "Advanced Event",
    description: "Moneyline, Spread, and Over/Under",
    onSelect: (setters) => {
      console.log("Setting eventType to MSO");
      setters.setEventType("MSO");
    },
  },
  {
    key: "prop",
    label: "Prop Bet",
    description: "Over or Under bets on a specific stat or outcome",
    onSelect: (setters) => {
      console.log("Setting eventType to prop");
      setters.setEventType("prop");
    },
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Group() {
  const { name, groupId, admins } = useLocalSearchParams();
  const [view, setView] = useState("events");
  const [events, setEvents] = useState<Event[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const navigation = useNavigation();
  const [eventType, setEventType] = useState("none");
  // Replace your two modal booleans + eventTypeSelectorVisible with one state:
  const [modalState, setModalState] = useState<"none" | "selector" | "event" | "prop">("none");
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
  const [leaving, setLeaving] = useState(false);
  const [groupInfo, setGroupInfo] = useState({ memberCount: 0, totalWagered: 0 });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isAdmin = admins.includes(FIREBASE_AUTH.currentUser?.uid ?? "Default UID") === true;

  const interstitialAdRef = useRef<InterstitialAd | null>(null);
  const adLoadedRef = useRef(false);
  const { adsEnabled } = useAds();

  // AD
  const loadInterstitialAd = () => {
    try {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    ad.addAdEventListener(AdEventType.LOADED, () => {
      console.log("Interstitial ad loaded");
      adLoadedRef.current = true;
    });

    ad.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log("Interstitial ad failed to load:", error);
      adLoadedRef.current = false;
    });

    ad.addAdEventListener(AdEventType.CLOSED, () => {
      // Preload next ad as soon as current one is dismissed
      adLoadedRef.current = false;
      Alert.alert("Success", "Your bet has been placed!");
      loadInterstitialAd();
    });

    ad.load();
    interstitialAdRef.current = ad;
    } catch (error) {
      console.error("Error loading interstitial ad:", error);
    }
  };

useEffect(() => {
    if (adsEnabled) {
      loadInterstitialAd();
    }
}, [adsEnabled]);

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
 
  //Modal animations
  useEffect(() => {
  if (modalState !== "none") {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }
}, [modalState]);

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
    let success = false;
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

      resetSlip();
      setCurrentBalance((prev) => prev - wager);
      invalidateBalanceCache();
      success = true;
    } catch (err) {
      resetSlip();
      Alert.alert("Error", err instanceof Error ? err.message : String(err));
    } finally {
    setBetSlipModalVisible(false);
    setLoading(false);

    if (adsEnabled && adLoadedRef.current && interstitialAdRef.current) {
      setTimeout(() => {
        interstitialAdRef.current?.show();
      }, 500);
    } else if (success) {
      setTimeout(() => {
        Alert.alert("Success", "Your bet has been placed!");
      }, 300);
    }
  }
  setLoading(false);
};

  const resetSlip = () => {
    setBetSlip([]);
    setBetSlipOdds(new Map());
  };

  // ── Fetch helpers ──────────────────────────────────────────────────────────
  const fetchBalance = async () => {
    try {
    const balance = await groups_client.getUsersCurrency(groupId as string);
    setCurrentBalance(balance);
    } catch (error) {
      setCurrentBalance(0);
      Alert.alert("Error", "Failed to load balance. Please try again later.");
    }
  };

  const fetchLeaderboard = async () => {
    try {
    const data = await groups_client.getGroupLeaderboard(groupId as string);
    setLeaderboard(data);
    } catch (error) {
      setLeaderboard([]);
      Alert.alert("Error", "Failed to load leaderboard. Please try again later.");
    }
  };

  const fetchGroupInfo = async () => {
    
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
      setEvents([]);
      setProps([]);
      setBetSlip([]);
      setBetSlipOdds(new Map());
      Alert.alert("Error", "Failed to load events. Please try again later.");
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchBalance();
    fetchLeaderboard();
    fetchGroupInfo();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${name}` });
  }, [navigation, name]);

  const handleLeaveButtonPress = async () => {
    try {
      Alert.alert(
            "Leave Group?",
            "Are you sure you want to leave this group?",
            [
              {
                text: "Yes",
                onPress: async () => {
                  setLeaving(true);
                  await groups_client.leaveGroup(groupId);
                  await groups_client.getAllGroups(0, true); // Invalidate cache on leave
                  await groups_client.getUsersGroups(true);
                  router.dismissAll();
                
                },
              },
              {
                text: "No",
                onPress: () => console.log("User answered: No"),
                style: "cancel",
              },
            ],
            { cancelable: false }
          );
      
    } catch (error) {
      Alert.alert("Error", "Failed to leave group. Please try again later.");
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

  console.log("modalState:", modalState, "eventType:", eventType);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="fade" transparent visible={leaving}>
        <View style={styles.leavingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </Modal>
      {/* ── Header ── */}
        <View style={styles.header}>
           <TouchableOpacity onPress={() => router.replace("/(tabs)")} style={styles.headerBackButton}>
            <Text style={styles.headerBackArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerGroupName}>{name}</Text>
        </View>
      {/* ── Tab bar ── */}
      <View style={styles.switchContainer}>
        {(["events", "props", "leaderboard", "info"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.switchButton, view === tab && styles.activeSwitchButton]}
            onPress={() => setView(tab)}
          >
            <Text style={styles.switchText}>
              {tab === "events" ? "Events" : tab.charAt(0).toUpperCase() + tab.slice(1)}
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
      {/* ── Events + Props scroll ── */}
      <>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.scrollContainer, view !== "events" && { display: "none" }]}
          contentContainerStyle={styles.scrollContent}
        >
          {loadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
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
                team1={event.options.team1}
                team2={event.options.team2}
                moneylineOdds1={event.options.moneylineOdds1}
                moneylineOdds2={event.options.moneylineOdds2}
                spread={event.options.spread}
                spreadOdds1={event.options.spreadOdds1}
                spreadOdds2={event.options.spreadOdds2}
                overUnder={event.options.overUnder}
                overOdds={event.options.overOdds}
                underOdds={event.options.underOdds}
                {...sharedCardProps}
              />
            ))
          )}
        </ScrollView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={[styles.scrollContainer, view !== "props" && { display: "none" }]}
          contentContainerStyle={styles.scrollContent}
        >
          {loadingEvents ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
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
                name={prop.name}
                description={prop.description}
                overUnder={prop.overUnder}
                overOdds={prop.overOdds}
                underOdds={prop.underOdds}
                {...sharedCardProps}
              />
            ))
          )}
        </ScrollView>
        </>
      

      {/* ── Leaderboard ── */}
      {view === "leaderboard" && <Leaderboard data={leaderboard} />}

      {/* ── Info ── */}
      {view === "info" && (
  <ScrollView contentContainerStyle={infoStyles.container}>

    <View style={infoStyles.headerTop}>
      <Text style={infoStyles.headerTitle}>GROUP DETAILS</Text>
    </View>

    <View style={infoStyles.columnLabels}>
      <Text style={infoStyles.columnLabel}>VALUE</Text>
    </View>

    {[
      { label: "INVITE CODE", value: groupId.toString().slice(-6).toUpperCase() },
      { label: "MEMBERS",     value: String(groupInfo.memberCount) },
      { label: "TOTAL WAGERED", value: groupInfo.totalWagered.toLocaleString() },
    ].map((row, i) => (
      <View
        key={row.label}
        style={[infoStyles.row, i === 0 && infoStyles.rowFirst]}
      >
        <Text style={infoStyles.label}>{row.label}</Text>
        <Text style={infoStyles.value}>{row.value}</Text>
      </View>
    ))}

    <TouchableOpacity style={infoStyles.leaveButton} onPress={handleLeaveButtonPress}>
      <Text style={infoStyles.leaveText}>LEAVE GROUP</Text>
    </TouchableOpacity>

  </ScrollView>
)}

      {/* ── Modals ── */}
      <Modal
        visible={modalState !== "none"}
        transparent
        animationType="fade"
        onRequestClose={() => setModalState("none")}
      >
      
        <Pressable style={styles.eventTypeOverlay} onPress={() => setModalState("none")}>
        {modalState === "selector" && (
            
          <Animated.View style={{ opacity: fadeAnim }}>
            <Pressable style={styles.eventTypeSheet} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.eventTypeTitle}>Create Event</Text>
              <Text style={styles.eventTypeSubtitle}>What type of event?</Text>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={styles.eventTypeOption}
                  onPress={() => {
                    type.onSelect({ setEventType });
                    setModalState(type.key === "prop" ? "prop" : "event");
                  }}
                >
                  <View style={styles.eventTypeTextBlock}>
                    <Text style={styles.eventTypeLabel}>{type.label}</Text>
                    <Text style={styles.eventTypeDescription}>{type.description}</Text>
                  </View>
                  <Text style={styles.eventTypeChevron}>›</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.eventTypeCancelButton} onPress={() => setModalState("none")}>
                <Text style={styles.eventTypeCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
          
        )}

        {modalState === "event" && (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <CreateMSOView
            key={eventType}
            fetchEvents={refreshEvents}
            setModalVisible={() => setModalState("none")}
            groupId={groupId}
            groupName={name}
            eventType={eventType}
          />
          </Animated.View>
        )}

        {modalState === "prop" && (
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <CreatePropView
            fetchEvents={refreshEvents}
            setModalVisible={() => setModalState("none")}
            groupId={groupId}
            groupName={name}
          />
          </Animated.View>
        )}
        </Pressable>
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
        {isAdmin && betSlip.length === 0 && (
          <TouchableOpacity
            style={styles.plusButtonStyle}
            onPress={() => setModalState("selector")}
          >
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

    </SafeAreaView>
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
  leavingOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},
  balance: {
    maxWidth: 75,
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
  eventTypeOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  eventTypeSheet: {
    backgroundColor: "#121112",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    paddingBottom: 36,
  },
  eventTypeTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    color: Colors.textColor,
  },
  eventTypeSubtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 20,
  },
  eventTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    color: Colors.textColor,
  },
  eventTypeIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  eventTypeTextBlock: {
    flex: 1,
  },
  eventTypeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textColor,
  },
  eventTypeDescription: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  eventTypeChevron: {
    fontSize: 22,
    color: "#ff496b",
  },
  eventTypeCancelButton: {
    marginTop: 16,
    alignItems: "center",
    paddingVertical: 12,
  },
   eventTypeCancelText: {
    fontSize: 16,
    color: "#888",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",  // centers the title
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  headerGroupName: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.textColor,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  headerBackButton: {
    position: "absolute",
    left: 4,
    padding: 4,
    zIndex: 1,
    width: 60,
     height: 40,
     justifyContent: "center",
     alignItems: "flex-start",
  },
  headerBackArrow: {
    fontSize: 38,
    color: Colors.textColor,
    lineHeight: 38,
    fontWeight: "300",
  },
  headerBalancePill: {
    position: "absolute",
    right: 4,
    backgroundColor: "#1d1a1c",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ff496b55",
  },
  headerBalanceText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
});

const infoStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 12,
    color: "#7A8499",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  columnLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1d1a1c",
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#252B38",
  },
  rowFirst: {
    borderColor: "#ff496b55",
    shadowColor: "#ff496b",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  leaveButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff496b55",
    paddingVertical: 16,
    alignItems: "center",
  },
  leaveText: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2,
    color: "white",
  },
  
});
