import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import Colors from "@/assets/styles/colors";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SECTIONS = [
  {
    icon: "stats-chart-outline" as const,
    heading: "What Is a Prop Bet?",
    body:
      "A Prop (short for \"proposition\") Bet is an over/under wager on a specific stat or outcome — not who wins the game. You set a name, a short description, and a line (the number bettors compare against), then everyone picks Over or Under that line.",
  },
  {
    icon: "person-outline" as const,
    heading: "Classic Use: Player Stats",
    body:
      "The most common prop is a player performance bet. Set the player's name, describe the stat (e.g. \"Passing Yards\" or \"Points Scored\"), and set a line. Bettors then wager on whether the player goes over or under that number.",
  },
  {
    icon: "time-outline" as const,
    heading: "Beyond Numbers: Time, Dates, and More",
    body:
      "The line doesn't have to be a plain number. Since bettors are just picking Over or Under relative to whatever line you set, you can use it for things like:\n\n" +
      "• Over/Under 5:00 PM for first pitch.\n" +
      "• Over/Under a specific date something happens.\n" +
      "• Over/Under a percentage, like a free throw rate.\n\n" +
      "As the admin, you decide the winning side manually when settling. Betify doesn't need to understand the value itself, just which side you declare the winner.",
  },
  {
    icon: "sparkles-outline" as const,
    heading: "Other Ideas",
    body:
      "Props work well for anything with a natural over/under feel, on or off the field:\n\n" +
      "• Over/Under number of hot dogs eaten at a tailgate.\n" +
      "• Over/Under how many texts someone sends during the game.\n" +
      "• Over/Under total group members by the end of the season.\n\n" +
      "If it's a single number, time, or measurable value someone can go over or under, it fits a Prop.",
  },
  {
    icon: "checkmark-done-outline" as const,
    heading: "Settling a Prop",
    body:
      "As the group admin, once the actual result is known, open the event card and tap Over or Under — whichever side actually happened. Then tap SETTLE in the bottom-right corner. Betify pays out everyone who picked the winning side automatically.",
  },
];

export default function PropHelp() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/more")} style={styles.headerBackButton}>
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerGroupName} numberOfLines={1} ellipsizeMode="tail">
          Prop
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