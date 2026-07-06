import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import Colors from "@/assets/styles/colors";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SECTIONS = [
  {
    icon: "flag-outline" as const,
    heading: "What Is a Basic Event?",
    body:
      "A Basic Event is a simple moneyline bet between two options. You pick which side will win, and if you're right, you get paid out based on the odds for that side. There's no spread, no over/under — just a straight pick between two outcomes.",
  },
  {
    icon: "people-outline" as const,
    heading: "Classic Use: Team vs. Team",
    body:
      "The most common use is a head-to-head matchup — Team 1 vs. Team 2. Set the odds for each side based on how likely you think they are to win, then let the group place their bets. Whoever wins the game wins the bet.",
  },
  {
    icon: "help-buoy-outline" as const,
    heading: "Creative Use: Yes / No Questions",
    body:
      "Basic Events aren't limited to sports matchups. Since it's really just \"Option A vs. Option B,\" you can use it for any Yes/No question:\n\n" +
      "• Will it rain during the tailgate?\n" +
      "• Will Jimmy show up on time?\n" +
      "• Will the home team score in the first quarter?\n\n" +
      "Just set \"Team 1\" to Yes and \"Team 2\" to No (or vice versa), and set odds for each.",
  },
  {
    icon: "sparkles-outline" as const,
    heading: "Other Ideas",
    body:
      "Basic Events work for anything with exactly two possible outcomes:\n\n" +
      "• Who arrives last to the party — Person A or Person B?\n" +
      "• Coin flip or tiebreaker bets between two friends.\n" +
      "• Head-to-head prop bets, like who eats more wings.\n\n" +
      "If it can be framed as \"this or that,\" a Basic Event can handle it.",
  },
  {
    icon: "checkmark-done-outline" as const,
    heading: "Settling a Basic Event",
    body:
      "As the group admin, once the outcome is known, open the event card and tap the side that won — the same way a user places a bet. Then tap SETTLE in the bottom-right corner. Betify pays out everyone who picked the winning side automatically.",
  },
];

export default function BasicEventHelp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/more")} style={styles.headerBackButton}>
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerGroupName} numberOfLines={1} ellipsizeMode="tail">
          Basic Event
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