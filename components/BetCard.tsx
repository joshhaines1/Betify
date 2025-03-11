import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import Colors from '@/assets/styles/colors';
import { BetPropCard } from './BetPropCard';


export function BetCard({date, status, risk, payout, pickId, userId, bets, odds}) {

  return (
    <>
    <View style={styles.container}>
        {/*  Row 1  */}
      
      <View style={styles.row1}>

        <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{date.toDate().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                })}
            </Text>
        </View>
        <View style={styles.watermarkContainer}>
            <Text style={styles.watermarkText}></Text>
        </View>
        <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
    {bets.length > 1 && (

      <View style={styles.parlayRow}>
      <View style={styles.parlayLegContainer}>
            <Text style={styles.parlayLegText}>{bets.length} Leg Parlay</Text>
        </View>
        <View style={styles.parlayOddsContainer}>
            <Text style={styles.parlayOddsText}>{odds}</Text>
        </View>
      </View>

    )}
      
      {/*  Row 2  */}
      <View style={styles.row2}>
        {bets.map((pick, index) => (
        <BetPropCard 
          key={`${bets.id}-${index}`}  // Unique key for each pick
          name={pick.name}
          lineAndProp={pick.lineAndProp}
          header={pick.header}
          odds={pick.odds}
        />
      ))}
      </View>
      {/*  Row 3  */}
        <View style={styles.row3}>
            <View style={styles.logoContainer}>
                {/* Add money image here */}
                <Image
                        source={require('@/assets/images/groupIcon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />                
            </View>
            <View style={styles.payoutContainer}>
                <Text style={styles.payoutText}>Risk: {risk}</Text>
                <Text style={styles.payoutText}>Payout: {payout}</Text>
            </View>
            <View style={styles.pickIdContainer}>
            <Text ellipsizeMode='clip' numberOfLines={1} style={styles.idText}>Pick ID: {pickId}</Text>
            <Text ellipsizeMode='clip' numberOfLines={1} style={styles.idText}>User ID: {userId}</Text>
            </View>
        </View>
    </View>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 10,
    borderColor: Colors.border,
    flexDirection: 'column',
    flex: 1,
    padding: 8,
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
  },
  parlayLegContainer: {

    justifyContent: 'center',
    alignItems: 'center',
  },
  parlayLegText: {

    color: Colors.textColor,
    fontSize: 16,
    fontWeight: 800,
  },
  parlayOddsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',


  },
  parlayOddsText: {
    color: Colors.textColor,
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 'bold',

  },
  parlayRow: {

    flexDirection: 'row',
    width: '100%',
    backgroundColor: '',
    height: 25,
    marginBottom: 5,
    flex: 1,
    marginLeft: 3,
    marginTop: 3,
  },
  row1: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '',
    height: 25,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: 'gray',
    marginBottom: 10,
   
  },
  row2: {
    flex: 1,
  },
  row3: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '',
    paddingTop: 5,
    borderTopWidth: 1,
    marginTop: 10,
    borderColor: 'gray',

   
  },
  dateContainer: {
    flex: 1,
    backgroundColor: '',
    color: Colors.textColor,
    justifyContent: 'center',

  },
  statusContainer: {

    flex: 1,
    backgroundColor: '',
    color: Colors.textColor,
    justifyContent: 'center',
  },
  watermarkContainer: {

    flex: 1,
    backgroundColor: '',
    color: 'gray',
    fontSize: 20,
    justifyContent: 'center',

  },
  dateText: {
    color: Colors.textColor,
    textAlign: 'left',
    fontSize: 11,

  },
  statusText: {
    color: Colors.textColor,
    textAlign: 'right',
    fontSize: 15,
    textTransform: 'uppercase',

  },
  watermarkText: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 20,
  },
  logoContainer: {
    backgroundColor: '',
    width: 50,
    height: 45,
    alignItems: 'center',
    padding: 5,
    justifyContent: 'center',
  },
  payoutContainer: {

    flex: 1,
    padding: 5,
    backgroundColor: '',

  },
  payoutText: {

    color: Colors.textColor,
    fontWeight: 600,

  },
  pickIdContainer: {

    flex: 1,
    padding: 5,
    backgroundColor: '',
    alignItems: 'flex-end',
    justifyContent: 'center',

  },
  idText: {

    color: Colors.textColor,
    fontSize: 11,
    
  },
  logo: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    tintColor: Colors.textColor,
  },
  bet: {
    height: 80,
    backgroundColor: '',
    padding: 10,
    paddingVertical: 5,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  propAndOddsContainer: {

    flexDirection: 'row',
    flex: 1,
    marginBottom: 2,
  },
  groupNameText: {
    flex: 1,
    marginTop: 5,
    color: Colors.textColor,
  },
  lineText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: 500,
  },
  oddsText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 500,
    color: Colors.textColor,
  },
  propText: {
    flex: 1,
    marginBottom: 2,
    color: Colors.textColor,
  },
  headerText: {
    flex: 1,
    marginBottom: 0,
    color: Colors.textColor,
  },
});
