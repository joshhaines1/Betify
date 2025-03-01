import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import * as Haptics from 'expo-haptics';


export function PropCard({name, description, overOdds, underOdds, overUnder, fetchGroups, date, groupName, eventId}) {
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

  return (
    <>
    <View style={styles.container}>
        {/* Row 1 */}
      <View style={[styles.eventInfoContainer, styles.topInfo]}>
        <View style={styles.eventDateContainer}>
                
            <Text style={styles.eventInfoText}>{date}</Text>
      
            </View>
            <View style={styles.optionHeaderContainer}>
                <Text style={styles.optionHeaderText}>Over {overUnder}</Text>
            </View>
            <View style={styles.optionHeaderContainer}>
                <Text style={styles.optionHeaderText}>Under {overUnder}</Text>
            </View>
      </View>
      {/* Row 2 */}
      <View style={styles.eventOptionsContainer}>
        <View style={styles.nameAndDescriptionContainer}>

            <View style={styles.eventOptionsTitleContainer}>
                <Text style={styles.eventTitle}>{name}</Text>
            </View>
            
            <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionText}>{description}</Text>
            </View>

        </View>
        
        <TouchableOpacity onPress={() => handlePress('over')} style={[styles.optionButton, bet === "over" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "over" && styles.selectedOddsText]}>{overOdds}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('under')} style={[styles.optionButton, bet === "under" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "under" && styles.selectedOddsText]}>{underOdds}</Text>
        </TouchableOpacity>
      </View>
      {/* Row 3 */}
      
      {/* Row 4 */}
      <View style={[styles.eventInfoContainer, styles.bottomInfo]}>
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
    height: 100,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: '#e8e8e8',
    flexDirection: 'column',
    padding: 8,
    marginBottom: 8,
    
  },
  nameAndDescriptionContainer: {
    backgroundColor: '',
    alignItems: 'center',
    justifyContent: 'center',
    width: "52.5%",
    height: "100%",
    paddingHorizontal: 8,
    
  },
  eventInfoContainer: {
    height: '10%',
    width: '100%',
    backgroundColor: '',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 8,
    flexDirection: 'row',
    flex: 1,

  },
  topInfo: {
    
    marginBottom: 0,
  },
  bottomInfo: {

    marginTop: 3,
  },
  logo: {
    width: '100%',
    height: '100%',
    
  },
  logoContainer: {

    backgroundColor: '',
    width: '13%',
    objectFit: 'cover',
    marginRight: 5,
    
  },
  eventDateContainer: {

    width: '48%',
    marginRight: 12, 
    paddingLeft: 0, 

  },

  optionHeaderText: {
    fontSize: 10,

  },
  optionButton: {
    backgroundColor: 'white',
    width: '24%',
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
    width: '24%',
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
    backgroundColor: '',
    width: '24%',
    height: '100%',
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    

  },
  eventOptionsTitleContainer: {
    backgroundColor: '',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 0,

  },
  eventInfoText: {
    fontSize: 10,
    color: '#ccc',
  },
  eventOptionsContainer: {
    height: '60%',
    padding: 5,
    paddingLeft: 0,
    flexDirection: 'row',
    alignItems: 'center', 
    backgroundColor: '',
    
  },
  eventTitle: {
    fontSize: 16,
    //color: '#ff496b',
    color: 'black',
    fontWeight: '500',
    textAlign: 'center',
  },
  descriptionText: {
    textAlign: 'center',
    fontSize: 11,
    color: 'black',
    fontStyle: 'italic',
    marginTop: 2,

  },

  descriptionContainer: {

    backgroundColor: '',
    alignItems: 'center',
    justifyContent: 'center',

    
  },
  
});
