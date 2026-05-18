import React, { useEffect, useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';
import * as events_service from '../clients/events-client';


export function PropCard({name, description, lockDate, overOdds, underOdds, overUnder, refreshEvents, createdAt, groupName, eventId, setBetSlip, setBetSlipOdds, betSlip, isAdmin, acceptingWagers, onEventSettled}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [bet, selectBet] = useState("");
  const [closed, setClosed] = useState(!acceptingWagers);

  useEffect(() => {}, [closed]);

  const settleBets = async () => {
        events_service.updateEvent({
          eventId: eventId,
          status: bet != "" ? "settled" : "closed",
          results: bet != "" ? [bet] : [],
          acceptingWagers: false,
        }).then(() => {
          console.log("Event settled successfully");
          onEventSettled(eventId, bet != "" ? true : false);
          setClosed(true);
          selectBet(''); 
          setBetSlip((prev: Map<string, string>[]) => {
            return prev.filter((betMap) => !betMap.has(eventId));
          });
          setBetSlipOdds((prev) => {
            const newBetSlipOdds = new Map(prev);
            newBetSlipOdds.delete(eventId);
            return newBetSlipOdds;
          });
        }).catch((error) => {
          console.error("Error settling event:", error);
        });
    }

    const settleBetWithPush = async () => {
        events_service.updateEvent({
          eventId: eventId,
          status: "settled",
          results: ["push"],
          acceptingWagers: false,
        }).then(() => {
          console.log("Event settled successfully");
          onEventSettled(eventId, true);
          setClosed(true);
          selectBet(''); 
          setBetSlip((prev: Map<string, string>[]) => {
            return prev.filter((betMap) => !betMap.has(eventId));
          });
          setBetSlipOdds((prev) => {
            const newBetSlipOdds = new Map(prev);
            newBetSlipOdds.delete(eventId);
            return newBetSlipOdds;
          });
        }).catch((error) => {
          console.error("Error settling event:", error);
        });
    }
  
    const handleSettleButtonPress =  () => {
      if(closed === true && bet == ""){
        return;
      }
      Alert.alert(
        bet != "" ? "Settle Event?" : "Manually Lock Event?",
        bet != "" ? "Are you sure you want to settle this event with the selected outcome?" : "Are you sure you want to manually lock this event and stop accepting wagers?",
        [
          {
            text: "Yes",
            onPress: () => { 
              settleBets();
            },
          },
          {
            text: "No",
            onPress: () => console.log("User answered: No"),
            style: "cancel",
          },
        ],
        { cancelable: false }
      );
      
  
    };

    const handlePushButtonPress =  () => {
            if(closed === true && bet != ""){
              return;
            }
            Alert.alert(
              ("Settle Event?"),
              ("Are you sure you want to settle this event with a tie, refunding each wager placed on this event?"),
              [
                {
                  text: "Yes",
                  onPress: () => {
        
                    settleBetWithPush();
                    console.log("Refresh events...");
        
                  },
                },
                {
                  text: "No",
                  onPress: () => console.log("User answered: No"),
                  style: "cancel",
                },
              ],
              { cancelable: false }
            );
            
        
          }
  

  const handlePress = (type: string, odds: string, name: string, lineAndProp: string, header: string) => {
    if (bet === type) {
        selectBet("");
      } else {
        selectBet(type);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    
      if(closed){
        return;
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
            newBetMap.set('eventId', eventId)
            newBetMap.set("header", header);
            newBetMap.set("lineAndProp", lineAndProp);
            newBetMap.set("name", name);
            newBetMap.set("odds", odds);
            newBetMap.set("lockDate", lockDate);
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
          newBetMap.set("lockDate", lockDate);
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

 useEffect(() => {
    // Reset selection when betSlip is cleared
    const isBetPlaced = betSlip.some((betMap) => betMap.has(eventId));
    const betMapWithEvent = betSlip.find((betMap) => betMap.has(eventId));
    selectBet(betMapWithEvent?.get(eventId));
    
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
                
            <Text style={styles.eventInfoText}>{new Date(lockDate._seconds * 1000).toLocaleString("en-US", { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</Text>
                  
      
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
        
        <TouchableOpacity onPress={() => handlePress('over', overOdds, name, "Over " + overUnder + " - " + description, groupName)} style={[styles.optionButton, bet === "over" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "over" && styles.selectedOddsText]}>{overOdds}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handlePress('under', underOdds, name, "Under " + overUnder + " - " + description, groupName)} style={[styles.optionButton, bet === "under" && styles.selectedOptionButton]}>
            <Text style={[styles.oddsText, bet === "under" && styles.selectedOddsText]}>{underOdds}</Text>
        </TouchableOpacity>
      </View>
      {/* Row 3 */}
      
      {/* Row 4 */}
      <View style={[styles.eventInfoContainer, styles.bottomInfo]}>
                <Text style={[styles.eventInfoText, styles.groupNameText]}>{groupName}</Text>
        
                {(isAdmin) && (
                  <View style={styles.adminActionsContainer}>
                    {(closed && bet == "") && (
                      <TouchableOpacity style={styles.pushBetsButton} onPress={handlePushButtonPress} disabled={!closed}>
                        <Text style={styles.settleBetsText}>
                          PUSH
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.settleBetsButton} onPress={handleSettleButtonPress}>
                      <Text style={(!closed) || (bet != "") ? styles.settleBetsText : styles.lockedBetText}>
                        {(bet != "" && closed) 
                          ? "SETTLE" 
                          : (!closed) 
                            ? "LOCK" 
                            : "LOCKED"
                        }
                      </Text>
                    </TouchableOpacity>
                  </View>
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
    height: 100,
    borderWidth: 0.5,
    borderRadius: 20,
    borderColor: Colors.border,
    flexDirection: 'column',
    padding: 8,
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
    
  },
  nameAndDescriptionContainer: {
    backgroundColor: '',
    alignItems: 'center',
    justifyContent: 'center',
    width: "52.5%",
    height: "100%",
    paddingHorizontal: 8,
    
  },
  settleBetsText: {
    fontSize: 10,
    color: Colors.primary,
    textAlign: 'right',
    backgroundColor: '',
    fontWeight: '800',

  },
lockedBetText: {
    fontSize: 10,
    color: "#8f8f8fff",
    textAlign: 'right',
    backgroundColor: '',
    fontWeight: '800',
  },
  settleBetsButton: {
    backgroundColor: '',
    marginRight: 5,
  },
  pushBetsButton: {
    backgroundColor: '',
    marginRight: 10,
    
  },
  adminActionsContainer: {
    flexDirection: 'row',
  },
  groupNameText: {
    flex: 1,
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
    color: Colors.textColor,

  },
  optionButton: {
    backgroundColor: Colors.cardBackground,
    width: '24%',
    height: '100%',
    marginRight: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 7,
    borderColor: Colors.border,
  },
  selectedOptionButton: {
    backgroundColor: Colors.primary,
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
    color: Colors.textColor,
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
