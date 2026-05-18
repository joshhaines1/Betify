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
  locked:           '#3A4055',
} as const;

export function EventCard({
  groupName,
  team1,
  team2,
  moneylineOdds1,
  moneylineOdds2,
  spread,
  spreadOdds1,
  spreadOdds2,
  overUnder,
  overOdds,
  underOdds,
  refreshEvents,
  createdAt,
  eventId,
  setBetSlip,
  setBetSlipOdds,
  betSlip,
  lockDate,
  isAdmin,
  acceptingWagers,
  onEventSettled,
}) {
  const [moneylineSelection, setMoneylineSelection] = useState('');
  const [spreadSelection, setSpreadSelection] = useState('');
  const [overUnderSelection, setOverUnderSelection] = useState('');
  const [closed, setClosed] = useState(!acceptingWagers);

  useEffect(() => {}, [closed]);

  const allSelected =
    moneylineSelection !== '' && spreadSelection !== '' && overUnderSelection !== '';

  const settleBets = async () => {
    events_service
      .updateEvent({
        eventId,
        status: allSelected ? 'settled' : 'closed',
        results: allSelected ? [moneylineSelection, overUnderSelection, spreadSelection] : [],
        acceptingWagers: false,
      })
      .then(() => {
        setClosed(true);
        onEventSettled(eventId, allSelected);
        setMoneylineSelection('');
        setSpreadSelection('');
        setOverUnderSelection('');
        setBetSlip((prev: Map<string, string>[]) =>
          prev.filter((betMap) => !betMap.has(eventId))
        );
        setBetSlipOdds((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
        refreshEvents();
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
        setClosed(true);
        onEventSettled(eventId, allSelected);
        setMoneylineSelection('');
        setSpreadSelection('');
        setOverUnderSelection('');
        setBetSlip((prev: Map<string, string>[]) =>
          prev.filter((betMap) => !betMap.has(eventId))
        );
        setBetSlipOdds((prev) => {
          const next = new Map(prev);
          next.delete(eventId);
          return next;
        });
        refreshEvents();
      })
      .catch((error) => console.error('Error settling event:', error));
  };

  const handlePushButtonPress = () => {
    if (acceptingWagers === false && !allSelected) return;
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
    if (acceptingWagers === false && !allSelected) return;
    Alert.alert(
      allSelected ? 'Settle Event?' : 'Manually Lock Event?',
      allSelected
        ? 'Are you sure you want to settle this event with the selected outcome?'
        : 'Are you sure you want to manually lock this event and stop accepting wagers?',
      [
        { text: 'Yes', onPress: settleBets },
        { text: 'No', style: 'cancel' },
      ],
      { cancelable: false }
    );
  };

  const handlePress = (category, type, odds, name, lineAndProp, header) => {
    let deselected = false;

    switch (category) {
      case 'moneyline':
        if (moneylineSelection === type) { setMoneylineSelection(''); deselected = true; }
        else setMoneylineSelection(type);
        break;
      case 'spread':
        if (spreadSelection === type) { setSpreadSelection(''); deselected = true; }
        else setSpreadSelection(type);
        break;
      case 'overUnder':
        if (overUnderSelection === type) { setOverUnderSelection(''); deselected = true; }
        else setOverUnderSelection(type);
        break;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (closed) return;

    setBetSlip((prev = []) => {
      const next: Map<string, string>[] = [...prev];
      const existingIndex = next.findIndex((m) => m.has(`${eventId}-${category}`));
      if (existingIndex !== -1) next.splice(existingIndex, 1);
      if (!deselected) {
        const newMap = new Map<string, string>();
        newMap.set(`${eventId}-${category}`, type);
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
      if (deselected) next.delete(`${eventId}-${category}`);
      else next.set(`${eventId}-${category}`, odds);
      return next;
    });
  };

  const calculateSpread = (odds, otherOdds) => {
    if (Number(spread) < 0) {
      if (+odds === +otherOdds) return '+0';
      return +odds < +otherOdds ? `+${spread.substr(1)}` : `-${spread.substr(1)}`;
    } else {
      if (+odds === +otherOdds) return '+0';
      return +odds < +otherOdds ? `-${spread}` : `+${spread}`;
    }
  };

  useEffect(() => {
    const m = betSlip.find((m) => m.has(`${eventId}-moneyline`));
    const s = betSlip.find((m) => m.has(`${eventId}-spread`));
    const o = betSlip.find((m) => m.has(`${eventId}-overUnder`));
    setMoneylineSelection(m?.get(`${eventId}-moneyline`) ?? '');
    setSpreadSelection(s?.get(`${eventId}-spread`) ?? '');
    setOverUnderSelection(o?.get(`${eventId}-overUnder`) ?? '');
  }, [betSlip, eventId]);

  const lockDateFormatted = new Date(lockDate._seconds * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  const settleLabel =
    allSelected && closed ? 'SETTLE' : !closed ? 'LOCK' : 'LOCKED';

  const renderTeamRow = (
    team: string,
    mlType: string, mlOdds: string,
    spType: string, spOdds: string, spLabel: string,
    ouType: string, ouOdds: string, ouLabel: string,
    mlSel: string, spSel: string, ouSel: string
  ) => (
    <View style={styles.teamRow}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/groupIcon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Team name */}
      <View style={styles.teamNameContainer}>
        <Text style={styles.teamName} numberOfLines={1}>{team}</Text>
      </View>

      {/* Moneyline */}
      <TouchableOpacity
        style={[styles.oddsButton, mlSel === mlType && styles.oddsButtonSelected]}
        onPress={() => handlePress('moneyline', mlType, mlOdds, team, 'Moneyline', groupName)}
        activeOpacity={0.75}
      >
        <Text style={[styles.oddsText, mlSel === mlType && styles.oddsTextSelected]}>
          {mlOdds}
        </Text>
      </TouchableOpacity>

      {/* Spread */}
      <TouchableOpacity
        style={[styles.oddsButton, spSel === spType && styles.oddsButtonSelected]}
        onPress={() => handlePress('spread', spType, spOdds, team, `Spread ${spLabel}`, groupName)}
        activeOpacity={0.75}
      >
        <Text style={[styles.lineLabel, spSel === spType && styles.oddsTextSelected]}>
          {spLabel}
        </Text>
        <Text style={[styles.oddsText, spSel === spType && styles.oddsTextSelected]}>
          {spOdds}
        </Text>
      </TouchableOpacity>

      {/* Over/Under */}
      <TouchableOpacity
        style={[styles.oddsButton, ouSel === ouType && styles.oddsButtonSelected]}
        onPress={() => handlePress('overUnder', ouType, ouOdds, 'Total Score', `${ouLabel} ${overUnder}`, groupName)}
        activeOpacity={0.75}
      >
        <Text style={[styles.lineLabel, ouSel === ouType && styles.oddsTextSelected]}>
          {ouLabel} {overUnder}
        </Text>
        <Text style={[styles.oddsText, ouSel === ouType && styles.oddsTextSelected]}>
          {ouOdds}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.card}>

      {/* ── Top bar: date + column headers ── */}
      <View style={styles.topBar}>
        <Text style={styles.lockDate}>{lockDateFormatted}</Text>
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>ML</Text>
          <Text style={styles.columnHeader}>SPREAD</Text>
          <Text style={styles.columnHeader}>O/U</Text>
        </View>
      </View>

      {/* ── Team rows ── */}
      {renderTeamRow(
        team1,
        'moneyline1', moneylineOdds1,
        'spread1', spreadOdds1, calculateSpread(moneylineOdds1, moneylineOdds2),
        'over', overOdds, 'O',
        moneylineSelection, spreadSelection, overUnderSelection
      )}

      {renderTeamRow(
        team2,
        'moneyline2', moneylineOdds2,
        'spread2', spreadOdds2, calculateSpread(moneylineOdds2, moneylineOdds1),
        'under', underOdds, 'U',
        moneylineSelection, spreadSelection, overUnderSelection
      )}

      {/* ── Bottom bar ── */}
      <View style={styles.bottomBar}>
        <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>

        {isAdmin && (
          <View style={styles.adminActions}>
            {closed && !allSelected && (
              <TouchableOpacity style={styles.pushButton} onPress={handlePushButtonPress}>
                <Text style={styles.pushButtonText}>PUSH</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.settleButton,
                closed && !allSelected && styles.settleButtonLocked,
                allSelected && closed && styles.settleButtonReady,
              ]}
              onPress={handleSettleButtonPress}
            >
              <Text
                style={[
                  styles.settleButtonText,
                  closed && !allSelected && styles.settleButtonTextLocked,
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
    width: 60,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textSecondary,
    textAlign: 'center',
  },

  // Team row
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
    tintColor: Colors.textSecondary,
  },
  teamNameContainer: {
    flex: 1,
    paddingRight: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // Odds buttons
  oddsButton: {
    width: 60,
    height: 44,
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
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  oddsTextSelected: {
    color: Colors.textSecondary,
    fontWeight: '900',
  },
  lineLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    opacity: 0.7,
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
    opacity: 1,
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
