import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import * as Haptics from 'expo-haptics';


export function EventCard({groupName, team1, team2, moneylineOdds1, moneylineOdds2, spread, spreadOdds1, spreadOdds2, overUnder, overOdds, underOdds, fetchGroups, date, eventId}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [bet, selectBet] = useState("");
  const handlePress = (type: string) => {
    if(bet == type){
      selectBet("");
    } else {
      selectBet(type);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
  };


  const calculateSpread = (odds: string, otherOdds: string) => {
    if(moneylineOdds1 == moneylineOdds2){
      return "+0";
    } else if(+odds < +otherOdds){
      return "-" + spread;
    } else{
      return "+" + spread; 
    }
  }
  return (
    <>
    <View style={styles.container}>
        {/* Row 1 */}
      <View style={styles.eventInfoContainer}>
        <View style={styles.eventDateContainer}>
                
            <Text style={styles.eventInfoText}>{date}</Text>
      
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
                    source={{
                    uri: 'https://static.vecteezy.com/system/resources/previews/000/550/535/non_2x/user-icon-vector.jpg',
                    }}
                    style={styles.logo}
                    resizeMode="contain"
                />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
            <Text style={styles.eventTitle}>{team1}</Text>
        </View>
        <TouchableOpacity onPress={() => handlePress('moneyline1')} style={[styles.optionButton, bet === "moneyline1" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "moneyline1" && styles.selectedOddsText]}>{moneylineOdds1}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('spread1')} style={[styles.optionButton, bet === "spread1" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "spread1" && styles.selectedOddsText, styles.linesText]}>{calculateSpread(moneylineOdds1, moneylineOdds2)}</Text>
            <Text style={[styles.oddsText, bet === "spread1" && styles.selectedOddsText]}>{spreadOdds1}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('over')} style={[styles.optionButton, bet === "over" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "over" && styles.selectedOddsText, styles.linesText]}>O {overUnder}</Text>
            <Text style={[styles.oddsText, bet === "over" && styles.selectedOddsText]}>{overOdds}</Text>
        </TouchableOpacity>
      </View>
      {/* Row 3 */}
      <View style={styles.eventOptionsContainer}>
        <View style={styles.logoContainer}>
            <Image
                    source={{
                    uri: 'https://static.vecteezy.com/system/resources/previews/000/550/535/non_2x/user-icon-vector.jpg',
                    }}
                    style={styles.logo}
                    resizeMode="contain"
                />
        </View>
        <View style={styles.eventOptionsTitleContainer}>
            <Text style={styles.eventTitle}>{team2}</Text>
        </View>
        <TouchableOpacity onPress={() => handlePress('moneyline2')} style={[styles.optionButton, bet === "moneyline2" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "moneyline2" && styles.selectedOddsText]}>{moneylineOdds2}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('spread2')} style={[styles.optionButton, bet === "spread2" && styles.selectedOptionButton]}>
            <Text style={[styles.linesText, styles.oddsText, bet === "spread2" && styles.selectedOddsText, styles.linesText]}>{calculateSpread(moneylineOdds2, moneylineOdds1)}</Text>
            <Text style={[styles.oddsText, bet === "spread2" && styles.selectedOddsText]}>{spreadOdds2}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('under')} style={[styles.optionButton, bet === "under" && styles.selectedOptionButton]}>
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
    borderColor: '#e8e8e8',
    flexDirection: 'column',
    padding: 8,
    marginBottom: 8,
  },
  eventInfoContainer: {
    height: '10%',
    width: '100%',
    backgroundColor: 'white',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 8,
    flexDirection: 'row',

  },
  logo: {
    width: '100%',
    height: '100%',
    
  },
  logoContainer: {

    backgroundColor: 'white',
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

  },
  optionButton: {
    backgroundColor: 'white',
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
    color: 'black',
  }, 
  selectedOddsText: {
    fontWeight: '700',
    color: 'white',
  },
  linesText: {
    fontSize: 10,

  },
  optionHeaderContainer: {
    backgroundColor: 'white',
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
    color: '#ccc',
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
    color: 'black',
    fontWeight: '500',
  },
  
});
