import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as events_service from '../clients/events-client';

// ─── Theme ────────────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
export type CardType = 'basic' | 'event' | 'prop';
const groupIcon = require('@/assets/images/groupIcon.png');
export interface UnifiedCardProps {
  type: CardType;

  // Shared
  eventId: string;
  groupName: string;
  lockDate: { _seconds: number };
  isAdmin: boolean;
  acceptingWagers: boolean;
  betSlip: Map<string, string>[];
  setBetSlip: (fn: (prev: Map<string, string>[]) => Map<string, string>[]) => void;
  setBetSlipOdds: (fn: (prev: Map<string, string>) => Map<string, string>) => void;
  onEventSettled: (eventId: string, settled: boolean) => void;
  refreshEvents?: () => void;
  createdAt?: any;

  // basic + event
  team1?: string;
  team2?: string;
  moneylineOdds1?: string;
  moneylineOdds2?: string;

  // event only
  spread?: string;
  spreadOdds1?: string;
  spreadOdds2?: string;
  overUnder?: string;
  overOdds?: string;
  underOdds?: string;

  // prop only
  name?: string;
  description?: string;
  // overUnder, overOdds, underOdds reused from event fields above
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
const formatLockDate = (lockDate: { _seconds: number }) =>
  new Date(lockDate._seconds * 1000).toLocaleString('en-US', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

// ─── Component ────────────────────────────────────────────────────────────────
export function UnifiedCard(props: UnifiedCardProps) {
  const {
    type, eventId, groupName, lockDate, isAdmin, acceptingWagers,
    betSlip, setBetSlip, setBetSlipOdds, onEventSettled, refreshEvents,
    team1, team2, moneylineOdds1, moneylineOdds2,
    spread, spreadOdds1, spreadOdds2,
    overUnder, overOdds, underOdds,
    name, description,
  } = props;

  // ── State ──────────────────────────────────────────────────────────────────
  // basic + prop: single selection keyed by eventId
  const [bet, selectBet] = useState('');
  // event: three independent selections
  const [moneylineSelection, setMoneylineSelection] = useState('');
  const [spreadSelection, setSpreadSelection] = useState('');
  const [overUnderSelection, setOverUnderSelection] = useState('');
  const [closed, setClosed] = useState(!acceptingWagers);

  const isEvent = type === 'event';
  const isProp = type === 'prop';
  const isBasic = type === 'basic';

  // For event cards, all three must be selected to settle
  const allEventSelected =
    moneylineSelection !== '' && spreadSelection !== '' && overUnderSelection !== '';

  // The "ready to settle" condition varies by card type
  const readyToSettle = isEvent ? allEventSelected : bet !== '';

  // ── Settle / Push ──────────────────────────────────────────────────────────
  const clearBetSlip = () => {
    setBetSlip((prev) => prev.filter((m) => !m.has(eventId)));
    setBetSlipOdds((prev) => { const n = new Map(prev); n.delete(eventId); return n; });
  };

  const resetSelections = () => {
    selectBet('');
    setMoneylineSelection('');
    setSpreadSelection('');
    setOverUnderSelection('');
  };

  const settleBets = async () => {
    const results = isEvent
      ? (allEventSelected ? [moneylineSelection, overUnderSelection, spreadSelection] : [])
      : (bet !== '' ? [bet] : []);

    events_service
      .updateEvent({
        eventId,
        status: results.length > 0 ? 'settled' : 'closed',
        results,
        acceptingWagers: false,
      })
      .then(() => {
        setClosed(true);
        onEventSettled(eventId, results.length > 0);
        resetSelections();
        clearBetSlip();
        refreshEvents?.();
      })
      .catch((e) => console.error('Error settling event:', e));
  };

  const settleBetWithPush = async () => {
    events_service
      .updateEvent({ eventId, status: 'settled', results: ['push'], acceptingWagers: false })
      .then(() => {
        setClosed(true);
        onEventSettled(eventId, true);
        resetSelections();
        clearBetSlip();
        refreshEvents?.();
      })
      .catch((e) => console.error('Error settling event:', e));
  };

  const handleSettleButtonPress = () => {
    if (closed && !readyToSettle) return;
    Alert.alert(
      readyToSettle ? 'Settle Event?' : 'Manually Lock Event?',
      readyToSettle
        ? 'Are you sure you want to settle this event with the selected outcome?'
        : 'Are you sure you want to manually lock this event and stop accepting wagers?',
      [{ text: 'Yes', onPress: settleBets }, { text: 'No', style: 'cancel' }],
      { cancelable: false }
    );
  };

  const handlePushButtonPress = () => {
    // For event cards, push is only shown when closed + all selected
    // For basic/prop, push is shown when closed + no selection
    if (isEvent && (!closed || !allEventSelected)) return;
    if (!isEvent && closed && bet !== '') return;
    Alert.alert(
      'Settle Event?',
      'Are you sure you want to settle this event with a tie, refunding each wager placed on this event?',
      [{ text: 'Yes', onPress: settleBetWithPush }, { text: 'No', style: 'cancel' }],
      { cancelable: false }
    );
  };

  // ── Bet slip helpers ───────────────────────────────────────────────────────
  const pushToBetSlip = (
    key: string, selType: string, odds: string,
    betName: string, lineAndProp: string, header: string
  ) => {
    setBetSlip((prev = []) => {
      if (!Array.isArray(prev)) return [];
      const next = [...prev];
      const idx = next.findIndex((m) => m.has(key));
      if (idx !== -1) next.splice(idx, 1);
      const newMap = new Map<string, string>();
      newMap.set(key, selType);
      newMap.set('eventId', eventId);
      newMap.set('header', header);
      newMap.set('lineAndProp', lineAndProp);
      newMap.set('name', betName);
      newMap.set('odds', odds);
      newMap.set('lockDate', lockDate as any);
      next.push(newMap);
      return next;
    });
    setBetSlipOdds((prev) => {
      const next = new Map(prev);
      next.set(key, odds);
      return next;
    });
  };

  const removeFromBetSlip = (key: string, odds: string, deselected: boolean) => {
    setBetSlip((prev = []) => {
      if (!Array.isArray(prev)) return [];
      const next = [...prev];
      const idx = next.findIndex((m) => m.has(key));
      if (idx !== -1) next.splice(idx, 1);
      return next;
    });
    setBetSlipOdds((prev) => {
      const next = new Map(prev);
      if (deselected) next.delete(key);
      return next;
    });
  };

  // ── handlePress: basic + prop (single key = eventId) ──────────────────────
  const handleSimplePress = (
    selType: string, odds: string,
    betName: string, lineAndProp: string, header: string
  ) => {
    const deselected = bet === selType;
    if (deselected) {
      selectBet('');
    } else {
      selectBet(selType);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (closed) return;
    if (deselected) {
      removeFromBetSlip(eventId, odds, true);
    } else {
      pushToBetSlip(eventId, selType, odds, betName, lineAndProp, header);
    }
  };

  // ── handlePress: event (key = eventId-category) ───────────────────────────
  const handleEventPress = (
    category: string, selType: string, odds: string,
    betName: string, lineAndProp: string, header: string
  ) => {
    const key = `${eventId}-${category}`;
    let deselected = false;

    switch (category) {
      case 'moneyline':
        deselected = moneylineSelection === selType;
        deselected ? setMoneylineSelection('') : setMoneylineSelection(selType);
        break;
      case 'spread':
        deselected = spreadSelection === selType;
        deselected ? setSpreadSelection('') : setSpreadSelection(selType);
        break;
      case 'overUnder':
        deselected = overUnderSelection === selType;
        deselected ? setOverUnderSelection('') : setOverUnderSelection(selType);
        break;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (closed) return;

    if (deselected) {
      removeFromBetSlip(key, odds, true);
    } else {
      pushToBetSlip(key, selType, odds, betName, lineAndProp, header);
    }
  };

  // ── Sync selections from betSlip ──────────────────────────────────────────
  useEffect(() => {
    if (isEvent) {
      const m = betSlip.find((b) => b.has(`${eventId}-moneyline`));
      const s = betSlip.find((b) => b.has(`${eventId}-spread`));
      const o = betSlip.find((b) => b.has(`${eventId}-overUnder`));
      setMoneylineSelection(m?.get(`${eventId}-moneyline`) ?? '');
      setSpreadSelection(s?.get(`${eventId}-spread`) ?? '');
      setOverUnderSelection(o?.get(`${eventId}-overUnder`) ?? '');
    } else {
      const found = betSlip.find((b) => b.has(eventId));
      selectBet(found?.get(eventId) ?? '');
    }
  }, [betSlip, eventId]);

  // ── Spread calculation (event only) ───────────────────────────────────────
  const calculateSpread = (odds: string, otherOdds: string): string => {
    if (!spread) return '';
    if (Number(spread) < 0) {
      if (+odds === +otherOdds) return '+0';
      return +odds < +otherOdds ? `+${spread.substr(1)}` : `-${spread.substr(1)}`;
    } else {
      if (+odds === +otherOdds) return '+0';
      return +odds < +otherOdds ? `-${spread}` : `+${spread}`;
    }
  };

  // ── Settle label ──────────────────────────────────────────────────────────
  const settleLabel =
    readyToSettle ? 'SETTLE' : !closed ? 'LOCK' : 'LOCKED';

  // ── Show push button ──────────────────────────────────────────────────────
  const showPush = isEvent
    ? closed && !allEventSelected
    : closed && bet === '';

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER LAYOUTS
  // ─────────────────────────────────────────────────────────────────────────

  const renderTopBar = (showColumns?: React.ReactNode) => (
    <View style={styles.topBar}>
      <Text style={styles.lockDate}>{formatLockDate(lockDate)}</Text>
      {showColumns}
    </View>
  );

  const renderBottomBar = () => (
    <View style={styles.bottomBar}>
      <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
      {isAdmin && (
        <View style={styles.adminActions}>
          {showPush && (
            <TouchableOpacity style={styles.pushButton} onPress={handlePushButtonPress}>
              <Text style={styles.pushButtonText}>PUSH</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.settleButton,
              closed && !readyToSettle && styles.settleButtonLocked,
              readyToSettle && closed && styles.settleButtonReady,
            ]}
            onPress={handleSettleButtonPress}
          >
            <Text style={[
              styles.settleButtonText,
              closed && !readyToSettle && styles.settleButtonTextLocked,
            ]}>
              {settleLabel}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ── BASIC layout ──────────────────────────────────────────────────────────
  if (isBasic) {
    return (
      <View style={styles.card}>
        {renderTopBar()}
        <View style={styles.teamsRow}>
          {/* Team 1 */}
          <View style={styles.teamBlock}>
            <Image source={groupIcon} style={styles.logo} resizeMode="contain" />
            <Text style={styles.teamName} numberOfLines={2}>{team1}</Text>
            <TouchableOpacity
              style={[styles.oddsButton, bet === 'moneyline1' && styles.oddsButtonSelected]}
              onPress={() => handleSimplePress('moneyline1', moneylineOdds1!, team1!, 'Moneyline', groupName)}
              activeOpacity={0.75}
            >
              <Text style={[styles.oddsText, bet === 'moneyline1' && styles.oddsTextSelected]}>
                {moneylineOdds1}
              </Text>
            </TouchableOpacity>
          </View>

          {/* VS */}
          <View style={styles.vsDivider}>
            <View style={styles.vsLine} />
            <Text style={styles.vsText}>VS</Text>
            <View style={styles.vsLine} />
          </View>

          {/* Team 2 */}
          <View style={styles.teamBlock}>
            <Image source={groupIcon} style={styles.logo} resizeMode="contain" />
            <Text style={styles.teamName} numberOfLines={2}>{team2}</Text>
            <TouchableOpacity
              style={[styles.oddsButton, bet === 'moneyline2' && styles.oddsButtonSelected]}
              onPress={() => handleSimplePress('moneyline2', moneylineOdds2!, team2!, 'Moneyline', groupName)}
              activeOpacity={0.75}
            >
              <Text style={[styles.oddsText, bet === 'moneyline2' && styles.oddsTextSelected]}>
                {moneylineOdds2}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        {renderBottomBar()}
      </View>
    );
  }

  // ── EVENT layout ──────────────────────────────────────────────────────────
  if (isEvent) {
    const sp1 = calculateSpread(moneylineOdds1!, moneylineOdds2!);
    const sp2 = calculateSpread(moneylineOdds2!, moneylineOdds1!);

    const renderEventTeamRow = (
      team: string,
      mlType: string, mlOdds: string,
      spType: string, spOdds: string, spLabel: string,
      ouType: string, ouOdds: string, ouLabel: string,
      mlSel: string, spSel: string, ouSel: string
    ) => (
      <View style={styles.teamRow}>
        <View style={styles.logoContainer}>
          <Image source={groupIcon} style={styles.teamRowLogo} resizeMode="contain" />
        </View>
        <View style={styles.teamNameContainer}>
          <Text style={styles.teamRowName} numberOfLines={1}>{team}</Text>
        </View>
        <TouchableOpacity
          style={[styles.oddsButtonWide, mlSel === mlType && styles.oddsButtonSelected]}
          onPress={() => handleEventPress('moneyline', mlType, mlOdds, team, 'Moneyline', groupName)}
          activeOpacity={0.75}
        >
          <Text style={[styles.oddsText, mlSel === mlType && styles.oddsTextSelected]}>{mlOdds}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.oddsButtonWide, spSel === spType && styles.oddsButtonSelected]}
          onPress={() => handleEventPress('spread', spType, spOdds, team, `Spread ${spLabel}`, groupName)}
          activeOpacity={0.75}
        >
          <Text style={[styles.lineLabel, spSel === spType && styles.oddsTextSelected]}>{spLabel}</Text>
          <Text style={[styles.oddsText, spSel === spType && styles.oddsTextSelected]}>{spOdds}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.oddsButtonWide, ouSel === ouType && styles.oddsButtonSelected]}
          onPress={() => handleEventPress('overUnder', ouType, ouOdds, 'Total Score', `${ouLabel} ${overUnder}`, groupName)}
          activeOpacity={0.75}
        >
          <Text style={[styles.lineLabel, ouSel === ouType && styles.oddsTextSelected]}>{ouLabel} {overUnder}</Text>
          <Text style={[styles.oddsText, ouSel === ouType && styles.oddsTextSelected]}>{ouOdds}</Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.card}>
        {renderTopBar(
          <View style={styles.columnHeaders}>
            <Text style={styles.columnHeader}>ML</Text>
            <Text style={styles.columnHeader}>SPREAD</Text>
            <Text style={styles.columnHeader}>O/U</Text>
          </View>
        )}
        {renderEventTeamRow(
          team1!, 'moneyline1', moneylineOdds1!, 'spread1', spreadOdds1!, sp1, 'over', overOdds!, 'O',
          moneylineSelection, spreadSelection, overUnderSelection
        )}
        {renderEventTeamRow(
          team2!, 'moneyline2', moneylineOdds2!, 'spread2', spreadOdds2!, sp2, 'under', underOdds!, 'U',
          moneylineSelection, spreadSelection, overUnderSelection
        )}
        {renderBottomBar()}
      </View>
    );
  }

  // ── PROP layout ───────────────────────────────────────────────────────────
  return (
    <View style={styles.card}>
      {renderTopBar(
        <View style={styles.columnHeaders}>
          <Text style={styles.columnHeader}>OVER {overUnder}</Text>
          <Text style={styles.columnHeader}>UNDER {overUnder}</Text>
        </View>
      )}
      <View style={styles.propMainRow}>
        <View style={styles.propNameBlock}>
          <Text style={styles.propTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.propDescription} numberOfLines={2}>{description}</Text>
        </View>
        <TouchableOpacity
          style={[styles.propOddsButton, bet === 'over' && styles.oddsButtonSelected]}
          onPress={() => handleSimplePress('over', overOdds!, name!, `Over ${overUnder} - ${description}`, groupName)}
          activeOpacity={0.75}
        >
          <Text style={[styles.oddsText, bet === 'over' && styles.oddsTextSelected]}>{overOdds}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.propOddsButton, bet === 'under' && styles.oddsButtonSelected]}
          onPress={() => handleSimplePress('under', underOdds!, name!, `Under ${overUnder} - ${description}`, groupName)}
          activeOpacity={0.75}
        >
          <Text style={[styles.oddsText, bet === 'under' && styles.oddsTextSelected]}>{underOdds}</Text>
        </TouchableOpacity>
      </View>
      {renderBottomBar()}
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

  // ── Shared top/bottom bars ─────────────────────────────────────────────────
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
    opacity: 0.5,
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  groupName: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    opacity: 0.5,
  },

  // ── Shared odds buttons ────────────────────────────────────────────────────
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
  oddsButtonWide: {
    width: 60,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propOddsButton: {
    width: 60,
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

  // ── Admin actions ──────────────────────────────────────────────────────────
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  settleButtonReady: {
    backgroundColor: Colors.surfaceHighlight,
    borderColor: Colors.accent,
  },
  settleButtonLocked: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  settleButtonText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginRight: -1.5,
  },
  settleButtonTextLocked: {
    color: Colors.locked,
  },

  // ── BASIC layout ───────────────────────────────────────────────────────────
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 0,
  },
  logo: {
    width: 40,
    height: 40,
    tintColor: Colors.textSecondary,
    opacity: 1,
    padding: 4,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
    minHeight: 36,
  },
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

  // ── EVENT layout ───────────────────────────────────────────────────────────
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
  teamRowLogo: {
    width: '100%',
    height: '100%',
    tintColor: Colors.textSecondary,
    opacity: 1,
  },
  teamNameContainer: {
    flex: 1,
    paddingRight: 4,
  },
  teamRowName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },

  // ── PROP layout ────────────────────────────────────────────────────────────
  propMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propNameBlock: {
    flex: 1,
    paddingRight: 4,
  },
  propTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
    marginBottom: 3,
  },
  propDescription: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
    color: Colors.textSecondary,
    lineHeight: 15,
  },
});
