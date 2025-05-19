import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { FIRESTORE } from '@/.FirebaseConfig';


export function BasicEventCard({team1, team2, moneylineOdds1, moneylineOdds2, fetchGroups, date, groupName, eventId, setBetSlip, setBetSlipOdds, betSlip, isAdmin}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [bet, selectBet] = useState("");

  const settleBets = async () => {
  
        let eventDocRef = doc(FIRESTORE, "events", eventId);
        await updateDoc(eventDocRef, {
          result: bet,
          status: "settled",
        });
        
    }
  
    const handleSettleButtonPress = () => {
  
      settleBets();
      fetchGroups();
      selectBet('');
      console.log("Refresh events...");
  
    }

  const handlePress = (type: string, odds: string, name: string, lineAndProp: string, header: string) => {
      let deselected = false; 
      if (bet === type) {
        selectBet("");
        deselected = true; 
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
        console.log(betSlip);
        let newBetSlip = [...prev];
    
        if (existingBetIndex != -1) {
          // If event exists, update it
          if(newBetSlip[existingBetIndex].get(eventId) != type)
          {
            newBetSlip.splice(existingBetIndex, 1);
            // Otherwise, add a new Map with the eventId
            const newBetMap = new Map<string, string>();
            newBetMap.set(eventId, type);
            newBetMap.set('eventId', eventId)
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
          newBetMap.set('eventId', eventId)
          newBetMap.set("header", header);
          newBetMap.set("lineAndProp", lineAndProp);
          newBetMap.set("name", name);
          newBetMap.set("odds", odds);
          newBetSlip.push(newBetMap);
          
        }
    
        return newBetSlip;
      });
  
      console.log(deselected);
    
        setBetSlipOdds((prev) => {
          const newBetSlipOdds = new Map(prev);
          if (newBetSlipOdds.get(eventId) === odds && deselected) {
              newBetSlipOdds.delete(eventId);
              deselected = false; 
              /*This caused an error when selecting a bet that had the same odds
              as the previously selected bet. Not sure why I had it delete the event
              in the first place. Seems to be working now */
          } else {
              newBetSlipOdds.set(eventId, odds);
          }
          return newBetSlipOdds;
        });
  
    };

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
      <View style={[styles.eventInfoContainer, styles.topInfo]}>
        <View style={styles.eventDateContainer}>
                
            <Text style={styles.eventInfoText}>{date.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                })}</Text>
      
        </View>
        
        

      </View>
      {/* Row 2 */}
      <View style={styles.eventOptionsContainer}>

        {/* Columb 1 */}
        <View style={styles.column}>
        <Image
                source={require('@/assets/images/groupIcon.png')}
                style={styles.logo}
                resizeMode="contain"
                  />
            <View style={styles.teamContainer}>

                <Text style={styles.eventTitle}>{team1}</Text>

            </View>
            <TouchableOpacity onPress={() => handlePress("moneyline1", moneylineOdds1, team1, "Moneyline", groupName)} style={[styles.optionButton, bet === "moneyline1" && styles.selectedOptionButton]}>
                <Text style={[styles.oddsText, bet === "moneyline1" && styles.selectedOddsText]}>{moneylineOdds1}</Text>
            </TouchableOpacity>

        </View>

         {/* Columb 2 */}
        <View style={[styles.column, {flex: 1}]}>

                <Text style={styles.versusText}>VS</Text>
                
        </View>

         {/* Column 3 */}
        <View style={styles.column}>

            <Image
                source={require('@/assets/images/groupIcon.png')}
                style={styles.logo}
                resizeMode="contain"
                  />
            <View style={styles.teamContainer}>

                <Text style={styles.eventTitle}>{team2}</Text>
            
             </View>
            <TouchableOpacity onPress={() => handlePress("moneyline2", moneylineOdds2, team2, "Moneyline", groupName)} style={[styles.optionButton, bet === "moneyline2" && styles.selectedOptionButton]}>
                <Text style={[styles.oddsText, bet === "moneyline2" && styles.selectedOddsText]}>{moneylineOdds2}</Text>
            </TouchableOpacity>
            
        </View>
        
        
        
      </View>
      {/* Row 3 */}
      
      {/* Row 4 */}
      <View style={[styles.eventInfoContainer, styles.bottomInfo]}>
        <Text style={styles.eventInfoText}>{groupName}</Text>

        {(isAdmin && bet != "") && (

        <TouchableOpacity style={styles.settleBetsButton} onPress={handleSettleButtonPress}>
                        
          <Text style={styles.settleBetsText}>SETTLE</Text>

        </TouchableOpacity>

        )}
                
      </View>

      
    </View>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    width: '100%',
    height: 175,
    borderWidth: 0.5,
    borderRadius: 20,
    borderColor: Colors.border,
    flexDirection: 'column',
    padding: 8,
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
    
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
  column: {
    flex: 4,
    padding: 10,
    alignItems: 'center',


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
    
    marginBottom: 10,
  },
  bottomInfo: {

    marginTop: 15,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  logo: {
    width: '50%',
    height: '50%',
    
  },
  logoContainer: {

    backgroundColor: '',
    width: '13%',
    objectFit: 'cover',
    marginRight: 0,
    
  },
  versusText: {

    fontSize: 20,
    //color: '#ff496b',
    color: Colors.textColor,
    fontWeight: '700',
    textAlign: 'center',

  },
  eventDateContainer: {

    width: '48%',
    marginRight: 12, 
    paddingLeft: 0, 

  },

  optionHeaderText: {
    fontSize: 10,
    color: Colors.textColor,

  },
  optionButton: {
    backgroundColor: Colors.cardBackground,
    width: '65%',
    height: '55%',
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.border,
  },
  selectedOptionButton: {
    backgroundColor: Colors.primary,
    width: '65%',
    height: '55%',
    marginRight: 0,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 7,
    borderColor: '#ccc',
  },
  oddsText: {
    fontWeight: '600',
    color: Colors.textColor,
    fontSize: 15,
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
    color: Colors.textColor,
    fontWeight: '500',
    textAlign: 'center',
    
  },
  teamContainer: {
    height: 50,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",

  },
  descriptionText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.propTextColor,
    fontStyle: 'italic',
    fontWeight: '600',
    marginTop: 2,

  },

  descriptionContainer: {

    backgroundColor: '',
    alignItems: 'center',
    justifyContent: 'center',

    
  },
  
});
