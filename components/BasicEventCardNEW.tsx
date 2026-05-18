import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as events_service from '../clients/events-client';

// ─── Theme (matches PropCard) ─────────────────────────────────────────────────
const Colors = {
  background:       '#0D0F14',
  surface:          '#121112',
  surfaceHighlight: '#1a1819',
  border:           '#252B38',
  accent:           '#ff496b',
  textPrimary:      '#ff496b',
  textSecondary:    '#FFFFFF',
  positive:         '#3EE8A0',
  negative:         '#FF6B6B',
  locked:           '#3A4055',
} as const;

export function BasicEventCard({
  team1,
  team2,
  moneylineOdds1,
  moneylineOdds2,
  refreshEvents,
  createdAt,
  groupName,
  eventId,
  setBetSlip,
  setBetSlipOdds,
  lockDate,
  betSlip,
  isAdmin,
  acceptingWagers,
  onEventSettled,
}) {
  const [bet, selectBet] = useState('');
  const [closed, setClosed] = useState(!acceptingWagers);

  useEffect(() => {}, [closed]);

  const settleBets = async () => {
    events_service
      .updateEvent({
        eventId,
        status: bet !== '' ? 'settled' : 'closed',
        results: bet !== '' ? [bet] : [],
        acceptingWagers: false,
      })
      .then(() => {
        onEventSettled(eventId, bet !== '');
        setClosed(true);
        selectBet('');
        setBetSlip((prev: Map<string, string>[]) =>
          prev.filter((betMap) => !betMap.has(eventId))
        );
        setBetSlipOdds((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
      })
      .catch((error) => console.error('Error settling event:', error));
  };

  const settleBetWithPush = async () => {
    events_service
      .updateEvent({
        eventId,
        status: 'settled',
        results: ['push'],
        acceptingWagers: false,
      })
      .then(() => {
        onEventSettled(eventId, true);
        setClosed(true);
        selectBet('');
        setBetSlip((prev: Map<string, string>[]) =>
          prev.filter((betMap) => !betMap.has(eventId))
        );
        setBetSlipOdds((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
      })
      .catch((error) => console.error('Error settling event:', error));
  };

  const handlePushButtonPress = () => {
    if (closed && bet !== '') return;
    Alert.alert(
      'Settle Event?',
      'Are you sure you want to settle this event with a tie, refunding each wager placed on this event?',
      [
        { text: 'Yes', onPress: settleBetWithPush },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const handleSettleButtonPress = () => {
    if (closed && bet === '') return;
    Alert.alert(
      bet !== '' ? 'Settle Event?' : 'Manually Lock Event?',
      bet !== ''
        ? 'Are you sure you want to settle this event with the selected outcome?'
        : 'Are you sure you want to manually lock this event and stop accepting wagers?',
      [
        { text: 'Yes', onPress: settleBets },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const handlePress = (type: string, odds: string, name: string, lineAndProp: string, header: string) => {
    let deselected = false;
    if (bet === type) {
      selectBet('');
      deselected = true;
    } else {
      selectBet(type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (closed) return;

    setBetSlip((prev: Map<string, string>[]) => {
      if (!Array.isArray(prev)) return [];
      const existingIndex = prev.findIndex((m) => m.has(eventId));
      let next = [...prev];

      if (existingIndex !== -1) {
        if (next[existingIndex].get(eventId) !== type) {
          next.splice(existingIndex, 1);
          if (!deselected) {
            const newMap = new Map<string, string>();
            newMap.set(eventId, type);
            newMap.set('eventId', eventId);
            newMap.set('header', header);
            newMap.set('lineAndProp', lineAndProp);
            newMap.set('name', name);
            newMap.set('odds', odds);
            newMap.set('lockDate', lockDate);
            next.push(newMap);
          }
        } else {
          next.splice(existingIndex, 1);
        }
      } else if (!deselected) {
        const newMap = new Map<string, string>();
        newMap.set(eventId, type);
        newMap.set('eventId', eventId);
        newMap.set('header', header);
        newMap.set('lineAndProp', lineAndProp);
        newMap.set('name', name);
        newMap.set('odds', odds);
        newMap.set('lockDate', lockDate);
        next.push(newMap);
      }

      return next;
    });

    setBetSlipOdds((prev) => {
      const next = new Map(prev);
      if (next.get(eventId) === odds && deselected) {
        next.delete(eventId);
      } else {
        next.set(eventId, odds);
      }
      return next;
    });
  };

  useEffect(() => {
    const betMapWithEvent = betSlip.find((m) => m.has(eventId));
    const isBetPlaced = Boolean(betMapWithEvent);
    selectBet(isBetPlaced ? betMapWithEvent?.get(eventId) ?? '' : '');
  }, [betSlip, eventId]);

  const lockDateFormatted = new Date(lockDate._seconds * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const settleLabel =
    bet !== '' && closed ? 'SETTLE' : !closed ? 'LOCK' : 'LOCKED';

  return (
    <View style={styles.card}>

      {/* ── Top bar: date ── */}
      <View style={styles.topBar}>
        <Text style={styles.lockDate}>{lockDateFormatted}</Text>
      </View>

      {/* ── Teams ── */}
      <View style={styles.teamsRow}>

        {/* Team 1 */}
        <View style={styles.teamBlock}>
          <Image
            source={require('@/assets/images/groupIcon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={2}>{team1}</Text>
          <TouchableOpacity
            style={[styles.oddsButton, bet === 'moneyline1' && styles.oddsButtonSelected]}
            onPress={() => handlePress('moneyline1', moneylineOdds1, team1, 'Moneyline', groupName)}
            activeOpacity={0.75}
          >
            <Text style={[styles.oddsText, bet === 'moneyline1' && styles.oddsTextSelected]}>
              {moneylineOdds1}
            </Text>
          </TouchableOpacity>
        </View>

        {/* VS divider */}
        <View style={styles.vsDivider}>
          <View style={styles.vsLine} />
          <Text style={styles.vsText}>VS</Text>
          <View style={styles.vsLine} />
        </View>

        {/* Team 2 */}
        <View style={styles.teamBlock}>
          <Image
            source={require('@/assets/images/groupIcon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.teamName} numberOfLines={2}>{team2}</Text>
          <TouchableOpacity
            style={[styles.oddsButton, bet === 'moneyline2' && styles.oddsButtonSelected]}
            onPress={() => handlePress('moneyline2', moneylineOdds2, team2, 'Moneyline', groupName)}
            activeOpacity={0.75}
          >
            <Text style={[styles.oddsText, bet === 'moneyline2' && styles.oddsTextSelected]}>
              {moneylineOdds2}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>

        {isAdmin && (
          <View style={styles.adminActions}>
            {closed && bet === '' && (
              <TouchableOpacity style={styles.pushButton} onPress={handlePushButtonPress}>
                <Text style={styles.pushButtonText}>PUSH</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.settleButton,
                closed && bet === '' && styles.settleButtonLocked,
                bet !== '' && closed && styles.settleButtonReady,
              ]}
              onPress={handleSettleButtonPress}
            >
              <Text
                style={[
                  styles.settleButtonText,
                  closed && bet === '' && styles.settleButtonTextLocked,
                ]}
              >
                {settleLabel}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 8,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockDate: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: Colors.textSecondary,
    opacity: 0.5,
  },

  // Teams row
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: Colors.textSecondary,
    opacity: 1,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    minHeight: 36,
  },
  oddsButton: {
    width: '75%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oddsButtonSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  oddsText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  oddsTextSelected: {
    color: Colors.textSecondary,
    fontWeight: '900',
  },

  // VS divider
  vsDivider: {
    width: 36,
    alignItems: 'center',
    gap: 4,
  },
  vsLine: {
    width: 1,
    height: 20,
    backgroundColor: Colors.border,
  },
  vsText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: Colors.textPrimary,
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    opacity: 0.5,
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pushButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
  },
  pushButtonText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  settleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '22',
  },
  settleButtonReady: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.accent,
  },
  settleButtonLocked: {
    borderWidth: 0,
    borderColor: Colors.locked,
    backgroundColor: 'transparent',
  },
  settleButtonText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
  settleButtonTextLocked: {
    color: Colors.locked,
  },
});
