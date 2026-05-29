import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { BetCard } from "@/components/BetCard";
import {
  DocumentSnapshot,
} from "firebase/firestore";
import Colors from "@/assets/styles/colors";
import { useFocusEffect } from "expo-router";
import { useAds } from "../../context/PurchasesContext";
import * as wagers_service from "../../clients/wagers-client";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

interface Bet {
  id: string;
  date: Date;
  status: string;
  risk: string;
  payout: string;
  userId: string;
  groupName: string;
  picks: any[];
  odds: string;
}

type ViewType = "active" | "settled";

export default function Bets() {
  const [view, setView] = useState<ViewType>("active");
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [loadingSettled, setLoadingSettled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisibleActive, setLastVisibleActive] = useState<DocumentSnapshot | null>(null);
  const [lastVisibleSettled, setLastVisibleSettled] = useState<DocumentSnapshot | null>(null);
  const [hasMoreActiveBets, setHasMoreActiveBets] = useState(true);
  const [hasMoreSettledBets, setHasMoreSettledBets] = useState(true);
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const { adsEnabled } = useAds();
  // ADS
  const BANNER_AD_UNIT_ID = __DEV__
    ? TestIds.BANNER
    : Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS!
      : process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID!;


  const getStatusFilter = () => (view === "active" ? "active" : "settled");

  const mapDocsToBets = (docs: any[]): Bet[] => {
    return docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        date: data.date,
        status: data.status,
        risk: data.risk,
        payout: data.payout,
        userId: data.userId,
        groupName: data.groupName,
        picks: data.picks,
        odds: data.odds,
      };
    });
  };

  const fetchBets = async (statusFilter: string, refresh = false) => {
    const isActive = statusFilter === "active";
    if (isActive ? loadingActive : loadingSettled) return;

    try {
      isActive ? setLoadingActive(true) : setLoadingSettled(true);
      console.log(`Fetching ${statusFilter} bets...`);

      const lastVisible =
        statusFilter === "active" ? lastVisibleActive : lastVisibleSettled;

      const { wagers, nextCursor } =
        await wagers_service.getWagersByUser(
          statusFilter,
          lastVisible,
          refresh
        );

      if (wagers.length > 0) {
        if (statusFilter === "active") {
          setLastVisibleActive(nextCursor);
          setHasMoreActiveBets(wagers.length === 5);
          setActiveBets((prev) =>
            refresh ? wagers : [...prev, ...wagers]
          );
        } else {
          setLastVisibleSettled(nextCursor);
          setHasMoreSettledBets(wagers.length === 5);
          setSettledBets((prev) =>
            refresh ? wagers : [...prev, ...wagers]
          );
        }
      } else {
        console.log(`No more ${statusFilter} bets to load!`);
        if (statusFilter === "active") {
          setHasMoreActiveBets(false);
        } else {
          setHasMoreSettledBets(false);
        }
      }
    } catch (error) {
      // Stop further fetch attempts after a failure
      if (isActive) {
        setHasMoreActiveBets(false);
      } else {
        setHasMoreSettledBets(false);
      }
      throw new Error("Failed to fetch bets. Please try again later.");
    } finally {
     isActive ? setLoadingActive(false) : setLoadingSettled(false);
    }
  };


 const handleEndScroll = async () => {
  const isActive = view === "active";
  try {
    if (isActive && !loadingActive && hasMoreActiveBets) {
      await fetchBets("active");
    } else if (!isActive && !loadingSettled && hasMoreSettledBets) {
      await fetchBets("settled");
    }
  } catch (error) {
    Alert.alert("Error", "Failed to load bets. Please try again later.");
  }
};

  const handleSwitchView = (newView: ViewType) => {
    if (view !== newView) {
      setView(newView);
    }
  };

const onRefresh = async () => {
  setRefreshing(true);
  try {
    if (view === "active") {
      setLastVisibleActive(null);
      setHasMoreActiveBets(true);
      setActiveBets([]);
      await fetchBets("active", true);
    } else {
      setLastVisibleSettled(null);
      setHasMoreSettledBets(true);
      await fetchBets("settled", true);
    }
  } catch (error) {
    Alert.alert("Error", "Failed to refresh bets. Please try again later.");
  } finally {
    await sleep(1000);
    setRefreshing(false);
  }
};

 
  const renderBetItem = ({ item }: { item: Bet }) => (
    <BetCard
      date={item.date}
      status={item.status}
      risk={item.risk}
      payout={item.payout}
      pickId={item.id}
      userId={item.userId}
      bets={item.picks}
      odds={item.odds}
    />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No {getStatusFilter()} bets to display.
      </Text>
    </View>
  );

  useEffect(() => {
    const load = async () => {
    try {
      console.log("Fetching bets on initial load...");
      await fetchBets("active", true);
      await fetchBets("settled", true);
    } catch (error) {
      Alert.alert("Error", "Failed to load bets. Please try again later.");
    }
  };

  load();
  }, []);

  const displayedBets = view === "active" ? activeBets : settledBets;

  return (
    <View style={styles.container}>
      {/* Switch between Active and Settled */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            view === "active" && styles.activeSwitchButton,
          ]}
          onPress={() => handleSwitchView("active")}
        >
          <Text style={styles.switchText}>Active</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.switchButton,
            view === "settled" && styles.activeSwitchButton,
          ]}
          onPress={() => handleSwitchView("settled")}
        >
          <Text style={styles.switchText}>Settled</Text>
        </TouchableOpacity>

        {(refreshing) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
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
      {/* FlatList for Bets */}
      {(loadingActive && activeBets.length === 0) || (loadingSettled && settledBets.length === 0) ? (
        <></>
      ) : (
        <>
          <FlatList
            data={activeBets}
            renderItem={renderBetItem}
            keyExtractor={(item) => `active-${item.id}`}
            style={[styles.scrollContainer, view !== "active" && { display: "none" }]}
            onEndReached={handleEndScroll}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshing={false}
            onRefresh={onRefresh}
          />
          <FlatList
            data={settledBets}
            renderItem={renderBetItem}
            keyExtractor={(item) => `settled-${item.id}`}
            style={[styles.scrollContainer, view !== "settled" && { display: "none" }]}
            onEndReached={handleEndScroll}
            onEndReachedThreshold={0.1}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshing={false}
            onRefresh={onRefresh}
          />
        </>
      )}

      
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
    borderColor: Colors.primary || "#ff496b",
  },
  switchText: {
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textColor,
  },
  loadingOverlay: {
    marginVertical: 0,
    backgroundColor: "",
    justifyContent: "center",
    alignItems: "flex-end",
    width: '53%',
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
});
