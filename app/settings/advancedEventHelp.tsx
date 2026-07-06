import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import Colors from "@/assets/styles/colors";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SECTIONS = [
  {
    icon: "layers-outline" as const,
    heading: "What Is an Advanced Event?",
    body:
      "An Advanced Event is a full 2-team matchup with three separate ways to bet: Moneyline, Spread, and Over/Under. Each one settles independently, so you can mix and match — or parlay all three together on the same matchup.",
  },
  {
    icon: "trophy-outline" as const,
    heading: "Moneyline (ML)",
    body:
      "The simplest of the three — just pick who wins the game outright, no point margin involved. Same as a Basic Event, but bundled here alongside spread and total.",
  },
  {
    icon: "swap-horizontal-outline" as const,
    heading: "Spread",
    body:
      "The spread evens out a mismatched game by adding or subtracting points from the final score. A favorite might be \"-6.5,\" meaning they need to win by 7+ points for that bet to hit. The underdog is \"+6.5,\" meaning they can lose by up to 6 and still cover." 
  },
  {
    icon: "stats-chart-outline" as const,
    heading: "Over / Under (O/U)",
    body:
      "This is a bet on the combined total score of both teams, regardless of who wins. Set a number (like 45.5 total points) — bettors then pick whether the actual combined score will go over or under that line.",
  },
  {
    icon: "layers-outline" as const,
    heading: "Why Use All Three?",
    body:
      "Advanced Events are best for real matchups where you want the full sportsbook experience. It lets bettors choose the type of risk they're comfortable with. A cautious bettor might take the favorite on the moneyline, while a bigger risk-taker plays the spread or total for better odds.",
  },
  {
    icon: "checkmark-done-outline" as const,
    heading: "Settling an Advanced Event",
    body:
      "As the group admin, once the game ends, open the event card and select the correct outcome for all three categories — Moneyline, Spread, and Over/Under. All three must be selected before you can tap SETTLE. Betify then pays out each category separately based on what each bettor picked.",
  },
];

export default function AdvancedEventHelp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/more")} style={styles.headerBackButton}>
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerGroupName} numberOfLines={1} ellipsizeMode="tail">
          Advanced Event
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name={section.icon} size={18} color="#ff496b" />
              </View>
            </View>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>Thanks for using Betify!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  card: {
    backgroundColor: "#1d1a1c",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#252B38",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff496b1a",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textColor,
    marginBottom: 6,
  },
  body: {
    fontSize: 14,
    color: Colors.textColor,
    opacity: 0.85,
    lineHeight: 21,
  },
  footer: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 24,
    color: "#7A8499",
  },
  headerBackArrow: {
    fontSize: 38,
    color: Colors.textColor,
    lineHeight: 38,
    fontWeight: "300",
    backgroundColor: "#0000009a",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingBottom: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 12,
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
  headerGroupName: {
    fontSize: 26,
    fontWeight: "700",
    color: Colors.textColor,
    letterSpacing: 0.5,
    textAlign: "center",
    maxWidth: "84%",
  },
});