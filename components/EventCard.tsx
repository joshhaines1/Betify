import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';

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
  fetchGroups,
  date,
  eventId,
  setBetSlip,
  setBetSlipOdds,
  betSlip,
  isAdmin,
}) {
  const [moneylineSelection, setMoneylineSelection] = useState('');
  const [spreadSelection, setSpreadSelection] = useState('');
  const [overUnderSelection, setOverUnderSelection] = useState('');

  const handlePress = (category, type, odds, name, lineAndProp, header) => {
    let deselected = false;
    let newSelection = '';

    switch (category) {
      case 'moneyline':
        if (moneylineSelection === type) {
          setMoneylineSelection('');
          deselected = true;
        } else {
          setMoneylineSelection(type);
          newSelection = type;
        }
        break;

      case 'spread':
        if (spreadSelection === type) {
          setSpreadSelection('');
          deselected = true;
        } else {
          setSpreadSelection(type);
          newSelection = type;
        }
        break;

      case 'overUnder':
        if (overUnderSelection === type) {
          setOverUnderSelection('');
          deselected = true;
        } else {
          setOverUnderSelection(type);
          newSelection = type;
        }
        break;

      default:
        break;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setBetSlip((prev = []) => {
      const newBetSlip: Map<string, string>[] = [...prev];
      const existingBetIndex = newBetSlip.findIndex((betMap: Map<string, string>) => betMap.has(`${eventId}-${category}`));

      if (existingBetIndex !== -1) {
        newBetSlip.splice(existingBetIndex, 1);
      }

      if (!deselected) {
        const newBetMap = new Map<string, string>();
        newBetMap.set(`${eventId}-${category}`, type);
        newBetMap.set('header', header);
        newBetMap.set('lineAndProp', lineAndProp);
        newBetMap.set('name', name);
        newBetMap.set('odds', odds);
        newBetSlip.push(newBetMap);
      }

      return newBetSlip;
    });

    setBetSlipOdds((prev) => {
      const newBetSlipOdds = new Map(prev);

      if (deselected) {
        newBetSlipOdds.delete(`${eventId}-${category}`);
      } else {
        newBetSlipOdds.set(`${eventId}-${category}`, odds);
      }

      return newBetSlipOdds;
    });
  };

  const calculateSpread = (odds, otherOdds) => {
    if (Number(spread) < 0) {
      if (+odds === +otherOdds) {
        return '+0';
      } else if (+odds < +otherOdds) {
        return `+${spread.substr(1)}`;
      } else {
        return `-${spread.substr(1)}`;
      }
    } else {
      if (+odds === +otherOdds) {
        return '+0';
      } else if (+odds < +otherOdds) {
        return `-${spread}`;
      } else {
        return `+${spread}`;
      }
    }
  };

  useEffect(() => {
    const hasMoneylineBet = betSlip.some((betMap) => betMap.has(`${eventId}-moneyline`));
    const hasSpreadBet = betSlip.some((betMap) => betMap.has(`${eventId}-spread`));
    const hasOverUnderBet = betSlip.some((betMap) => betMap.has(`${eventId}-overUnder`));

    if (!hasMoneylineBet) setMoneylineSelection('');
    if (!hasSpreadBet) setSpreadSelection('');
    if (!hasOverUnderBet) setOverUnderSelection('');
  }, [betSlip, eventId]);

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.eventInfoContainer}>
        <View style={styles.eventDateContainer}>
          <Text style={styles.eventInfoText}>
            {date.toDate().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.optionHeaderContainer}>
          <Text style={styles.optionHeaderText}>Moneyline</Text>
        </View>
        <View style={styles.optionHeaderContainer}>
          <Text style={styles.optionHeaderText}>Spread</Text>
        </View>
        <View style={styles.optionHeaderContainer}>
          <Text style={styles.optionHeaderText}>O/U</Text>
        </View>
      </View>

      {/* Team 1 */}
      <View style={styles.eventOptionsContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/groupIcon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
          <Text style={styles.eventTitle}>{team1}</Text>
        </View>

        {/* Moneyline 1 */}
        <TouchableOpacity
          onPress={() => handlePress('moneyline', 'moneyline1', moneylineOdds1, team1, 'Moneyline', groupName)}
          style={[
            styles.optionButton,
            moneylineSelection === 'moneyline1' && styles.selectedOptionButton,
          ]}
        >
          <Text
            style={[styles.oddsText, moneylineSelection === 'moneyline1' && styles.selectedOddsText]}
          >
            {moneylineOdds1}
          </Text>
        </TouchableOpacity>

        {/* Spread 1 */}
        <TouchableOpacity
          onPress={() =>
            handlePress(
              'spread',
              'spread1',
              spreadOdds1,
              team1,
              `Spread ${calculateSpread(moneylineOdds1, moneylineOdds2)}`,
              groupName
            )
          }
          style={[
            styles.optionButton,
            spreadSelection === 'spread1' && styles.selectedOptionButton,
          ]}
        >
          <Text style={[styles.linesText, styles.oddsText]}>{calculateSpread(moneylineOdds1, moneylineOdds2)}</Text>
          <Text style={[styles.oddsText, spreadSelection === 'spread1' && styles.selectedOddsText]}>
            {spreadOdds1}
          </Text>
        </TouchableOpacity>

        {/* Over */}
        <TouchableOpacity
          onPress={() =>
            handlePress(
              'overUnder',
              'over',
              overOdds,
              'Total Score',
              `Over ${overUnder}`,
              groupName
            )
          }
          style={[
            styles.optionButton,
            overUnderSelection === 'over' && styles.selectedOptionButton,
          ]}
        >
          <Text style={[styles.linesText, styles.oddsText]}>O {overUnder}</Text>
          <Text style={[styles.oddsText, overUnderSelection === 'over' && styles.selectedOddsText]}>
            {overOdds}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Team 2 */}
      <View style={styles.eventOptionsContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('@/assets/images/groupIcon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
          <Text style={styles.eventTitle}>{team2}</Text>
        </View>

        {/* Moneyline 2 */}
        <TouchableOpacity
          onPress={() => handlePress('moneyline', 'moneyline2', moneylineOdds2, team2, 'Moneyline', groupName)}
          style={[
            styles.optionButton,
            moneylineSelection === 'moneyline2' && styles.selectedOptionButton,
          ]}
        >
          <Text
            style={[styles.oddsText, moneylineSelection === 'moneyline2' && styles.selectedOddsText]}
          >
            {moneylineOdds2}
          </Text>
        </TouchableOpacity>

        {/* Spread 2 */}
        <TouchableOpacity
          onPress={() =>
            handlePress(
              'spread',
              'spread2',
              spreadOdds2,
              team2,
              `Spread ${calculateSpread(moneylineOdds2, moneylineOdds1)}`,
              groupName
            )
          }
          style={[
            styles.optionButton,
            spreadSelection === 'spread2' && styles.selectedOptionButton,
          ]}
        >
          <Text style={[styles.linesText, styles.oddsText]}>{calculateSpread(moneylineOdds2, moneylineOdds1)}</Text>
          <Text style={[styles.oddsText, spreadSelection === 'spread2' && styles.selectedOddsText]}>
            {spreadOdds2}
          </Text>
        </TouchableOpacity>

        {/* Under */}
        <TouchableOpacity
          onPress={() =>
            handlePress(
              'overUnder',
              'under',
              underOdds,
              'Total Score',
              `Under ${overUnder}`,
              groupName
            )
          }
          style={[
            styles.optionButton,
            overUnderSelection === 'under' && styles.selectedOptionButton,
          ]}
        >
          <Text style={[styles.linesText, styles.oddsText]}>U {overUnder}</Text>
          <Text style={[styles.oddsText, overUnderSelection === 'under' && styles.selectedOddsText]}>
            {underOdds}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={[styles.eventInfoContainer, styles.bottomInfo]}>
        <Text style={styles.eventInfoText}>{groupName}</Text>

        {(isAdmin && betSlip.length == 3) && (
          <TouchableOpacity style={styles.settleBetsButton}>
            <Text style={styles.settleBetsText}>SETTLE</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    width: '100%',
    height: 160,
    borderWidth: 0.5,
    borderRadius: 20,
    borderColor: Colors.primary,
    flexDirection: 'column',
    padding: 8,
    paddingBottom: 10,
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
  },
  eventInfoContainer: {
    height: '10%',
    width: '100%',
    backgroundColor: '',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 8,
    flexDirection: 'row',

  },
  settleBetsText: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'right',
    backgroundColor: '',
    fontWeight: '800',

  },
  settleBetsButton: {
    backgroundColor: '',
    flex: 1,
    marginRight: 5,
    
  },
  logo: {
    width: '100%',
    height: '80%',
    tintColor: Colors.textColor,
  },
  logoContainer: {

    backgroundColor: '',
    width: '13%',
    objectFit: 'cover',
    marginRight: 5,
    
  },
  eventDateContainer: {

    width: '48%',
    marginRight: 9, 
    paddingLeft: 0, 

  },
  bottomInfo: {

    marginTop: 3,
    marginBottom: 5,
    
  },

  optionHeaderText: {
    fontSize: 10,
    color: Colors.textColor,

  },
  optionButton: {
    backgroundColor: Colors.cardBackground,
    width: '15.5%',
    height: '100%',
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.border,
  },
  selectedOptionButton: {
    backgroundColor: '#ff496b',
    width: '15.5%',
    height: '100%',
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.border,
  },
  oddsText: {
    fontWeight: '400',
    color: Colors.textColor,
  }, 
  selectedOddsText: {
    fontWeight: '700',
    color: 'white',
  },
  linesText: {
    fontSize: 10,
    color: Colors.textColor,

  },
  optionHeaderContainer: {
    backgroundColor: Colors.cardBackground,
    width: '15.5%',
    height: '100%',
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    

  },
  eventOptionsTitleContainer: {
    backgroundColor: '',
    width: '35%',
    justifyContent: 'center',
    marginRight: 10,
  },
  eventInfoText: {
    fontSize: 10,
    color: Colors.textColor,
  },
  eventOptionsContainer: {
    height: '40%',
    padding: 5,
    paddingLeft: 0,
    flexDirection: 'row',
    alignItems: 'center', 
    
  },
  eventTitle: {
    fontSize: 16,
    //color: '#ff496b',
    color: Colors.textColor,
    fontWeight: '500',
  },
  
});
