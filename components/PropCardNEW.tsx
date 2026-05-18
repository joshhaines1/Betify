import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as events_service from '../clients/events-client';

// ─── Theme (matches Leaderboard) ─────────────────────────────────────────────
const Colors = {
  background:       '#0D0F14',
  surface:          '#121112',
  surfaceHighlight: '#1a1819',
  border:           '#252B38',
  accent:           '#ff496b',
  textPrimary:      '#FFFFFF',
  textSecondary:    '#FFFFFF',
  locked:           '#3A4055',
} as const;

export function PropCard({
  name,
  description,
  lockDate,
  overOdds,
  underOdds,
  overUnder,
  refreshEvents,
  createdAt,
  groupName,
  eventId,
  setBetSlip,
  setBetSlipOdds,
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

  const handlePushButtonPress = () => {
    if (closed && bet !== '') return;
    Alert.alert(
      'Settle Event?',
      'Are you sure you want to settle this event with a tie, refunding each wager placed?',
      [
        { text: 'Yes', onPress: settleBetWithPush },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const handlePress = (
    type: string,
    odds: string,
    name: string,
    lineAndProp: string,
    header: string
  ) => {
    if (bet === type) {
      selectBet('');
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
        next.splice(existingIndex, 1);
        if (next[existingIndex]?.get(eventId) === type) return next;
      }

      if (bet !== type) {
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
      if (next.get(eventId) === odds) {
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

  const lockDateFormatted = new Date(lockDate._seconds * 1000).toLocaleString(
    'en-US',
    { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }
  );

  const isLockedLabel =
    bet !== '' && closed ? 'SETTLE' : !closed ? 'LOCK' : 'LOCKED';

  return (
    <View style={styles.card}>
      {/* ── Top bar: date + column headers ── */}
      <View style={styles.topBar}>
        <Text style={styles.lockDate}>{lockDateFormatted}</Text>
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>OVER {overUnder}</Text>
          <Text style={styles.columnHeader}>UNDER {overUnder}</Text>
        </View>
      </View>

      {/* ── Main row: name/desc + buttons ── */}
      <View style={styles.mainRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.eventTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.descriptionText} numberOfLines={2}>{description}</Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            handlePress('over', overOdds, name, `Over ${overUnder} - ${description}`, groupName)
          }
          style={[styles.oddsButton, bet === 'over' && styles.oddsButtonSelected]}
          activeOpacity={0.75}
        >
          <Text style={[styles.oddsText, bet === 'over' && styles.oddsTextSelected]}>
            {overOdds}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            handlePress('under', underOdds, name, `Under ${overUnder} - ${description}`, groupName)
          }
          style={[styles.oddsButton, bet === 'under' && styles.oddsButtonSelected]}
          activeOpacity={0.75}
        >
          <Text style={[styles.oddsText, bet === 'under' && styles.oddsTextSelected]}>
            {underOdds}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom bar: group name + admin actions ── */}
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
                {isLockedLabel}
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
    justifyContent: 'space-between',
  },
  lockDate: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: Colors.textSecondary,
    flex: 1,
  },
  columnHeaders: {
    flexDirection: 'row',
    gap: 6,
  },
  columnHeader: {
    width: 72,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Main row
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameBlock: {
    flex: 1,
    paddingRight: 4,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  descriptionText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  oddsButton: {
    width: 72,
    height: 48,
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
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  oddsTextSelected: {
    color: Colors.textSecondary,
    fontWeight: '900',
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
    borderColor: Colors.locked,
    borderWidth: 0,
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
