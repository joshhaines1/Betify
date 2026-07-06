import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";
import Colors from "@/assets/styles/colors";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SECTIONS = [
  {
    icon: "people-outline" as const,
    heading: "Create or Join a Group",
    body:
      "Betify has public or private groups. You can either:\n\n" +
      "• Create a group and share the invite code with others.\n" +
      "• Enter an invite code from a friend to join their group.\n\n" +
      "You can also decide how many points each player should start with when they join your group.",
  },
  {
    icon: "share-social-outline" as const,
    heading: "Invite Friends",
    body:
      "After creating a group, you can view your unique invite code in the info section. Share this with others so they can join your group.",
  },
  {
    icon: "receipt-outline" as const,
    heading: "Create and Place Bets",
    body:
      "Group leaders can create betting events that everyone in the group can bet on. There are several types — Player Props, Basic 2-Team Events, Advanced 2-Team Events, and Single Outcome Events. You'll see active bets in the group feed. Tap a bet to add it to your slip. You can place straight bets or parlay picks together!",
  },
  {
    icon: "checkmark-done-outline" as const,
    heading: "Settle Bets",
    body:
      "When an event ends, the group leader who created the bet is responsible for settling it — marking the outcome. Go to the bet and select the outcome, the same way you would place a bet. Then, instead of opening the bet slip, tap SETTLE in the bottom-right corner of the bet card. Betify then pays out winnings to those who bet correctly.",
  },
  {
    icon: "time-outline" as const,
    heading: "View Bets",
    body:
      "In the Bets tab, you can:\n\n" +
      "• Check your betting history to see wins and losses.\n" +
      "• See your active and settled bets from each group.",
  },
];

export default function Help() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/more")} style={styles.headerBackButton}>
          <Text style={styles.headerBackArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerGroupName} numberOfLines={1} ellipsizeMode="tail">
          How to Use Betify
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section, index) => (
          <View key={section.heading} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBadge}>
                <Ionicons name={section.icon} size={18} color="#ff496b" />
              </View>
              <Text style={styles.stepNumber}>STEP {index + 1}</Text>
            </View>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}

        <View style={[styles.card, styles.feedbackCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="mail-outline" size={18} color="#ff496b" />
            </View>
          </View>
          <Text style={styles.heading}>Have Feedback?</Text>
          <Text style={styles.body}>
            Please don't hesitate to reach out to me at joshhaines1@icloud.com with any feedback, questions, suggestions, or bugs!
          </Text>
        </View>

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
  feedbackCard: {
    borderColor: "#ff496b55",
    marginTop: 8,
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
  stepNumber: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#7A8499",
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