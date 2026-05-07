import { View, Text, ScrollView, StyleSheet } from "react-native";
import Colors from "@/assets/styles/colors";

export default function Help() {
  return (
    <View style={{backgroundColor: 'black'}}>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>How to Use Betify</Text>
      <Text style={styles.heading}>1. Create or Join a Group</Text>
      <Text style={styles.body}>
        Betify has public or private groups. You can either:
        {"\n"}- Create a group and share the invite code with others.
        {"\n"}- Enter an invite code from a friend to join their group.
        {"\n"}You can also decide how much points each player should start with when they join your group.
      </Text>

      <Text style={styles.heading}>2. Invite Friends</Text>
      <Text style={styles.body}>
        After creating a group, you can view your unique invite code in the info section. Share this with others so they can join your group.
      </Text>

      <Text style={styles.heading}>3. Create and Place Bets</Text>
      <Text style={styles.body}>
        Group leaders can create betting events that everyone in the group can bet on. There are three types, Player Props, Basic 2-Team Events, and Advanved 2-Team Events. You’ll see active bets in the group feed. Tap a bet to add it to your slip. You can place straight bets or parlay picks together!
      </Text>

      <Text style={styles.heading}>4. Settle Bets</Text>
      <Text style={styles.body}>
        When an event ends, the group leader who created the bet is responsible for settling it — marking the outcome. Go to the bet and select the outcome you want, the same way you would place a bet. Then instead of opening the bet slip, click the word SETTLE in the bottom right hand corner of the bet "card". Betify then pays out winnings to those who bet correctly.
      </Text>

      <Text style={styles.heading}>5. View Bets</Text>
      <Text style={styles.body}>
        In the bets tab, you can:
        {"\n"}- Check your betting history to see wins and losses.
        {"\n"}- See your active and settled bets from each group.
      </Text>

      <Text style={styles.heading}>Have Feedback?</Text>
      <Text style={styles.body}>
        Please do not hesitate to reach out to me at joshhaines1@icloud.com with any feedback, questions, suggestions, or bugs!
      </Text>

      <Text style={styles.footer}>Thanks for using Betify!</Text>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textColor,
    marginBottom: 5,
    textAlign: "center",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    color: "#ff496b",
  },
  body: {
    fontSize: 16,
    marginTop: 8,
    color: Colors.textColor,
    lineHeight: 22,
  },
  footer: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 40,
    color: "#888",
  },
});
