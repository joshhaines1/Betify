import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import Colors from "@/assets/styles/colors";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SECTIONS = [
  {
    icon: "flash-outline" as const,
    heading: "What Is a Single Outcome Event?",
    body:
      "A Single Outcome Event is a high-risk, single-option bet. There's only one side to bet on, not two. Either it happens (a hit) or it doesn't (a miss). There's no opposing pick, which usually means bigger odds and bigger risk than a standard prop.",
  },
  {
    icon: "create-outline" as const,
    heading: "Setting It Up",
    body:
      "As the admin, you'll fill in a few fields when creating this event:\n\n" +
      "• Name — a short title for the bet.\n" +
      "• Description — more detail on what's being wagered.\n" +
      "• Comparison Type — Over, Under, or Exactly.\n" +
      "• Line — the number, time, or value being compared (optional — see below).\n" +
      "• Odds — the single payout odds for this bet hitting.",
  },
  {
    icon: "trending-up-outline" as const,
    heading: "Using Over / Under / Exactly",
    body:
      "When the bet involves a specific number, pick a comparison type and set a line to go with it:\n\n" +
      "• Over 15 — \"Over 15 points scored.\"\n" +
      "• Under 3:30 — \"Under 3:30 for the national anthem.\"\n" +
      "• Exactly 3 — \"Exactly 3 home runs hit today.\"\n\n" +
      "The line can be a number, a time, or anything else comparable. You decide the winner manually when settling, so Betify doesn't need to interpret the value itself.",
  },
  {
    icon: "sparkles-outline" as const,
    heading: "Skipping the Line Entirely",
    body:
      "Not every bet needs a number to compare against. For events that either simply happen or don't, you can leave the line blank and just rely on the name and description to describe the bet:\n\n" +
      "• \"Someone Records a Triple-Double\"\n" +
      "• \"It Rains During the Game\"\n" +
      "• \"The Power Goes Out at the Bar\"\n\n" +
      "These don't need a comparison type or line at all — just describe the event, set your odds, and let the group bet on whether it happens.",
  },
  {
    icon: "warning-outline" as const,
    heading: "Why It's Higher Risk",
    body:
      "Since there's no opposing side to balance things out, Single Outcome Events are best for longshot or specialty bets, the kind of thing that either pays off big or doesn't pay off at all. Set your odds accordingly, since there's no second option absorbing the other side of the action.",
  },
  {
    icon: "checkmark-done-outline" as const,
    heading: "Settling a Single Outcome Event",
    body:
      "As the group admin, once the outcome is known, open the event card and tap SETTLE. You'll be asked whether the outcome was a HIT or a MISS. If it's a HIT, everyone who bet on it gets paid out. If it's a MISS, all wagers on the event lose. You can also tap LOCK to manually stop accepting wagers without settling yet.",
  },
];

export default function SingleOutcomeEventHelp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/more")} style={styles.headerBackButton}>
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerGroupName} numberOfLines={1} ellipsizeMode="tail">
          Single Outcome Event
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