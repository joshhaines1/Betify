import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';


export function EventCard({groupName, team1, team2, moneylineOdds1, moneylineOdds2, spread, spreadOdds1, spreadOdds2, overUnder, overOdds, underOdds, fetchGroups, date, eventId, setBetSlip, setBetSlipOdds, betSlip}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [bet, selectBet] = useState("");
  const handlePress = (type: string, odds: string, name: string, lineAndProp: string, header: string) => {
    if (bet === type) {
      selectBet("");
    } else {
      selectBet(type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  
    setBetSlip((prev: Map<string, string>[]) => {
      // Find existing bet for this event
      if (!Array.isArray(prev)) {
        return [];
    }
      const existingBetIndex = prev.findIndex((betMap) => betMap.has(eventId));
      console.log(existingBetIndex);
      let newBetSlip = [...prev];
  
      if (existingBetIndex != -1) {
        // If event exists, update it
        if(newBetSlip[existingBetIndex].get(eventId) != type)
        {
          newBetSlip.splice(existingBetIndex, 1);
          // Otherwise, add a new Map with the eventId
          const newBetMap = new Map<string, string>();
          newBetMap.set(eventId, type);
          newBetMap.set("header", header);
          newBetMap.set("lineAndProp", lineAndProp);
          newBetMap.set("name", name);
          newBetMap.set("odds", odds);
          newBetSlip.push(newBetMap);

        } else {

          newBetSlip.splice(existingBetIndex, 1);
        }
        
      } else {
        // Otherwise, add a new Map with the eventId
        const newBetMap = new Map<string, string>();
        newBetMap.set(eventId, type);
        newBetMap.set("header", header);
        newBetMap.set("lineAndProp", lineAndProp);
        newBetMap.set("name", name);
        newBetMap.set("odds", odds);
        newBetSlip.push(newBetMap);
        
      }
  
      return newBetSlip;
    });
  
    setBetSlipOdds((prev) => {
      const newBetSlipOdds = new Map(prev);
      if (newBetSlipOdds.get(eventId) === odds) {
          newBetSlipOdds.delete(eventId);
      } else {
          newBetSlipOdds.set(eventId, odds);
      }
      return newBetSlipOdds;
  });

  };
  


  const calculateSpread = (odds: string, otherOdds: string) => {
    if(Number(spread) < 0){
      //Add spread from favorite (EXAMPLE: Favorite +6.5 strokes in a golf match)
      if(+odds == +otherOdds){
        return "+0"
      }else if(+odds < +otherOdds){
        return "+" + spread.substr(1);
        
      } else{
        return "-" + spread.substr(1); 
      }

    } else {
      
      //Subtract spread from favorite (EXAMPLE: Favorite -6.5 points in basketball game)
      if(+odds == +otherOdds){
        return "+0"
      }else if(+odds < +otherOdds){
        return "-" + spread;
      } else{
        return "+" + spread; 
      }

    }
    
  }

  useEffect(() => {
    // Reset selection when betSlip is cleared
    const isBetPlaced = betSlip.some((betMap) => betMap.has(eventId));
    if (!isBetPlaced) {
        selectBet("");
    }
}, [betSlip, eventId]);

  
  return (
    <>
    <View style={styles.container}>
        {/* Row 1 */}
      <View style={styles.eventInfoContainer}>
        <View style={styles.eventDateContainer}>
                
            <Text style={styles.eventInfoText}>{date.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                })}</Text>
      
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
      {/* Row 2 */}
      <View style={styles.eventOptionsContainer}>
      <View style={styles.logoContainer}>
            <Image
                    source={require('@/assets/images/groupIcon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
            <Text style={styles.eventTitle}>{team1}</Text>
        </View>
        <TouchableOpacity onPress={() => handlePress('moneyline1', moneylineOdds1, team1, "Moneyline", groupName)} style={[styles.optionButton, bet === "moneyline1" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "moneyline1" && styles.selectedOddsText]}>{moneylineOdds1}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('spread1', spreadOdds1, team1, "Spread " + calculateSpread(moneylineOdds1, moneylineOdds2), groupName)} style={[styles.optionButton, bet === "spread1" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "spread1" && styles.selectedOddsText, styles.linesText]}>{calculateSpread(moneylineOdds1, moneylineOdds2)}</Text>
            <Text style={[styles.oddsText, bet === "spread1" && styles.selectedOddsText]}>{spreadOdds1}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('over', overOdds, "Total Score", ("Over " + overUnder), groupName)} style={[styles.optionButton, bet === "over" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "over" && styles.selectedOddsText, styles.linesText]}>O {overUnder}</Text>
            <Text style={[styles.oddsText, bet === "over" && styles.selectedOddsText]}>{overOdds}</Text>
        </TouchableOpacity>
      </View>
      {/* Row 3 */}
      <View style={styles.eventOptionsContainer}>
        <View style={styles.logoContainer}>
            <Image
                    source={require('@/assets/images/groupIcon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
            <Text style={styles.eventTitle}>{team2}</Text>
        </View>
        <TouchableOpacity onPress={() => handlePress('moneyline2', moneylineOdds2, team2, "Moneyline", groupName)} style={[styles.optionButton, bet === "moneyline2" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "moneyline2" && styles.selectedOddsText]}>{moneylineOdds2}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('spread2', spreadOdds2, team2, "Spread " + calculateSpread(moneylineOdds2, moneylineOdds1), groupName)} style={[styles.optionButton, bet === "spread2" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "spread2" && styles.selectedOddsText, styles.linesText]}>{calculateSpread(moneylineOdds2, moneylineOdds1)}</Text>
            <Text style={[styles.oddsText, bet === "spread2" && styles.selectedOddsText]}>{spreadOdds2}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('under', underOdds, "Total Score", "Under " + overUnder, groupName)} style={[styles.optionButton, bet === "under" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "under" && styles.selectedOddsText, styles.linesText]}>U {overUnder}</Text>
            <Text style={[styles.oddsText, bet === "under" && styles.selectedOddsText]}>{underOdds}</Text>
        </TouchableOpacity>
      </View>
      {/* Row 4 */}
      <View style={styles.eventInfoContainer}>
        <Text style={styles.eventInfoText}>{groupName}</Text>
      </View>
    </View>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    width: '100%',
    height: 150,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: Colors.border,
    flexDirection: 'column',
    padding: 8,
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
    borderColor: '#ccc',
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
    borderColor: '#ccc',
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
