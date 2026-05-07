import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import Colors from '@/assets/styles/colors';


export function BetPropCard({lineAndProp, odds, header, name}) {
  
  return (
   
        <View style={styles.bet}>
          <Text style={styles.nameText}>{name}</Text>
          <View style={styles.propAndOddsContainer}>
            <Text style={styles.lineText}>{lineAndProp}</Text>
            <Text style={styles.oddsText}>{odds}</Text>
          </View>
          <Text style={styles.headerText}>{header}</Text>
        </View>
      
  );
}



const styles = StyleSheet.create({
  bet: {
    height: 80,
    backgroundColor: '',
    padding: 10,
    marginVertical: 1,
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
    flex: 5,
    textAlign: 'left',
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: 600,
  },
  oddsText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 16,
    fontWeight: 600,
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
  nameText: {
    flex: 1,
    textAlign: 'left',
    fontSize: 16,
    color: Colors.textColor,
    fontWeight: 400,

  }
});
