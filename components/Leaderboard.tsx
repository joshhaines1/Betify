import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Animated,
} from 'react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  displayName: string;
  balance: number;
}

interface LeaderboardProps {
  data?: LeaderboardEntry[];
}

interface LeaderboardRowProps {
  item: LeaderboardEntry;
  index: number;
}

interface LeaderboardHeaderProps {
  total: number;
}

// ─── Theme ────────────────────────────────────────────────────────────────────
const Colors = {
  background: '#0b0b0b73',
  surface: '#1d1a1c',
  surfaceHighlight: '#1d1a1c',
  border: '#252B38',
  gold: '#ff496b',
  silver: '#ffffff',
  bronze: '#aaaaaa',
  accent: '#3EE8A0',
  textPrimary: '#FFFFFF',
  textSecondary: '#7A8499',
  positive: '#FFFFFF',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatBalance = (amount: number): string => {
  const abs = Math.abs(amount);
  if (abs >= 9999 && abs < 1000000) return `${(abs / 1000).toFixed(1)}k`;
  if (abs >= 1000000 && abs < 1000000000) return `${(abs / 1000000).toFixed(1)}M`;
  if (abs >= 1000000000) return `${(abs / 1000000000).toFixed(1)}B`;
  return `${abs.toFixed(0)}`;
};

const rankColor = (rank: number): string => {
  if (rank === 1) return Colors.gold;
  if (rank === 2) return Colors.silver;
  if (rank === 3) return Colors.bronze;
  return Colors.textSecondary;
};

const rankLabel = (rank: number): string => {
  if (rank === 1) return '1';
  if (rank === 2) return '2';
  if (rank === 3) return '3';
  return `#${rank}`;
};

// ─── Animated Row ─────────────────────────────────────────────────────────────
const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ item, index }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rank = index + 1;
  const isTop3 = rank <= 3;
  const isPositive = item.balance >= 0;

  return (
    <Animated.View
      style={[
        styles.row,
        isTop3 && styles.rowTop3,
        rank === 1 && styles.rowFirst,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Rank */}
      <View style={[styles.rankBadge, isTop3 && { borderColor: rankColor(rank) }]}>
        <Text style={[styles.rankText, isTop3 && { color: rankColor(rank) }]}>
          {rankLabel(rank)}
        </Text>
      </View>

      {/* Avatar initial */}
      <View style={[styles.avatar, { backgroundColor: isTop3 ? rankColor(rank) + '22' : Colors.surfaceHighlight }]}>
        <Text style={[styles.avatarText, { color: isTop3 ? rankColor(rank) : Colors.textSecondary }]}>
          {item.displayName.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Name */}
      <View style={styles.nameContainer}>
        <Text style={styles.displayName} numberOfLines={1}>
          {item.displayName}
        </Text>
        {rank === 1 && (
          <Text style={styles.crownLabel}>LEADER</Text>
        )}
      </View>

      {/* Balance */}
      <View style={styles.balanceContainer}>
        <Text style={[styles.balanceText, { color: isPositive ? Colors.positive : '#FF6B6B' }]}>
          {formatBalance(item.balance)}
        </Text>
        </View>
    </Animated.View>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────
const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({ total }) => (
  <View style={styles.header}>
    <View style={styles.headerTop}>
      <Text style={styles.headerTitle}>LEADERBOARD</Text>
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
    </View>
    <Text style={styles.headerSub}>{total} players ranked</Text>
    <View style={styles.columnLabels}>
      <Text style={styles.columnLabel}>PLAYER</Text>
      <Text style={styles.columnLabel}>BALANCE</Text>
    </View>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Leaderboard: React.FC<LeaderboardProps> = ({ data = [] }) => {
  const sorted = [...data].sort((a, b) => b.balance - a.balance);

  return (
    <View style={styles.container}>
      <FlatList<LeaderboardEntry>
        data={sorted}
        keyExtractor={(item, index) => `${item.displayName}-${index}`}
        ListHeaderComponent={<LeaderboardHeader total={sorted.length} />}
        renderItem={({ item, index }) => (
          <LeaderboardRow item={item} index={index} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    paddingTop: 15,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    color: Colors.textPrimary,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.positive + '22',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.positive,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.positive,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  columnLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  rowTop3: {
    backgroundColor: Colors.surfaceHighlight,
  },
  rowFirst: {
    borderColor: Colors.gold + '55',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // Rank badge
  rankBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Avatar
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Name
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  crownLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.gold,
  },

  // Balance
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  balanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default Leaderboard;
