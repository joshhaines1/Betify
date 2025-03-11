import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { BetCard } from "@/components/BetCard";
import { getDocs, query, where, orderBy, limit, startAfter, collection, DocumentSnapshot } from "firebase/firestore";
import { FIRESTORE, FIREBASE_AUTH } from "@/.FirebaseConfig";
import Colors from "@/assets/styles/colors";

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

export default function GroupsScreen() {
  const [view, setView] = useState<ViewType>("active");
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [settledBets, setSettledBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastVisibleActive, setLastVisibleActive] = useState<DocumentSnapshot | null>(null);
  const [lastVisibleSettled, setLastVisibleSettled] = useState<DocumentSnapshot | null>(null);
  const [hasMoreActiveBets, setHasMoreActiveBets] = useState(true); // Separate pagination state for active bets
  const [hasMoreSettledBets, setHasMoreSettledBets] = useState(true); // Separate pagination state for settled bets

  const getStatusFilter = () => (view === "active" ? "active" : "settled");

  const buildQuery = (statusFilter: string, refresh = false, lastVisible: DocumentSnapshot | null) => {
    let betsQuery = query(
      collection(FIRESTORE, "wagers"),
      where("userId", "==", FIREBASE_AUTH.currentUser?.uid),
      where("status", "==", statusFilter),
      orderBy("date", "desc"),
      limit(5)
    );

    if (!refresh && lastVisible) {
      betsQuery = query(betsQuery, startAfter(lastVisible));
    }

    return betsQuery;
  };

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
    if (loading) return;

    try {
      setLoading(true);
      console.log(`Fetching ${statusFilter} bets...`);

      const lastVisible = statusFilter === "active" ? lastVisibleActive : lastVisibleSettled;
      const querySnapshot = await getDocs(buildQuery(statusFilter, refresh, lastVisible));

      if (!querySnapshot.empty) {
        const fetchedBets = mapDocsToBets(querySnapshot.docs);
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

        // Update the lastVisible for the corresponding bet type
        if (statusFilter === "active") {
          setLastVisibleActive(lastDoc);
          setHasMoreActiveBets(querySnapshot.docs.length === 5);
          setActiveBets((prev) => (refresh ? fetchedBets : [...prev, ...fetchedBets]));
        } else {
          setLastVisibleSettled(lastDoc);
          setHasMoreSettledBets(querySnapshot.docs.length === 5);
          setSettledBets((prev) => (refresh ? fetchedBets : [...prev, ...fetchedBets]));
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
      console.error("Error fetching bets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEndScroll = () => {
    if (!loading) {
      if (view === "active" && hasMoreActiveBets) {
        fetchBets("active");
      } else if (view === "settled" && hasMoreSettledBets) {
        fetchBets("settled");
      }
    }
  };

  const handleSwitchView = (newView: ViewType) => {
    if (view !== newView) {
      setView(newView);
    }
  };

  const renderBetItem = ({ item }: { item: Bet }) => (
    <BetCard
      key={`${view}-${item.id}`}
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
      <Text style={styles.emptyText}>No {getStatusFilter()} bets to display.</Text>
    </View>
  );

  useEffect(() => {
    // Fetch both active and settled bets on mount
    fetchBets("active", true);
    fetchBets("settled", true);
  }, []); // Only run once on mount

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
      </View>

      {/* FlatList for Bets */}
      <FlatList
        data={displayedBets}
        renderItem={renderBetItem}
        keyExtractor={(item) => `${view}-${item.id}`}
        onEndReached={handleEndScroll}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        ListEmptyComponent={renderEmptyComponent}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
  loadingContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
