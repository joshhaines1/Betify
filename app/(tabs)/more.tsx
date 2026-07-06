import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import Colors from "@/assets/styles/colors";

interface SettingsRow {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
  destructive?: boolean;
}

interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

const SECTIONS: SettingsSection[] = [
  {
    title: "TYPES OF BETS",
    rows: [
    { label: "Basic Event", icon: "flag-outline", route: "/settings/basicEventHelp" },
    { label: "Advanced Event", icon: "layers-outline", route: "/settings/advancedEventHelp" },
    { label: "Single Outcome Event", icon: "flash-outline", route: "/settings/singleOutcomeEventHelp" },
    { label: "Player Prop", icon: "stats-chart-outline", route: "/settings/playerPropHelp" },
    ],
  },
  {
    title: "SUPPORT",
    rows: [
     { label: "How to Use", icon: "book-outline", route: "/settings/help" },
],
  },
];

export default function More() {
  const handlePress = (row: SettingsRow) => {
    if (row.onPress) {
      row.onPress();
    } else if (row.route) {
      router.push(row.route as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionCard}>
            {section.rows.map((row, index) => (
              <TouchableOpacity
                key={row.label}
                style={[
                  styles.row,
                  index !== section.rows.length - 1 && styles.rowBorder,
                ]}
                onPress={() => handlePress(row)}
                activeOpacity={0.6}
              >
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={row.icon}
                    size={20}
                    color={row.destructive ? Colors.primary ?? "#FF6B6B" : Colors.textColor}
                  />
                  <Text style={[styles.rowLabel, row.destructive && styles.rowLabelDestructive]}>
                    {row.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#7A8499" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 3,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#7A8499",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#1d1a1c",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252B38",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#252B38",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textColor,
  },
  rowLabelDestructive: {
    color: "#FF6B6B",
  },
});