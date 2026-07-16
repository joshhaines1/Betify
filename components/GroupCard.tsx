import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import Colors from '@/assets/styles/colors';

const groupCard = require('@/assets/images/groupIcon.png');
export function GroupCard({ name, members, adminName, admins, visibility, password, startingCurrency, groupId, fetchGroups, joined}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  const handlePress = () => {
    if(joined){
      router.navigate({
        pathname: "/group",
        params: { 
          name, 
          groupId, 
          admins, 
        },
      });
    } else {
      setJoinModalVisible(true);
    }
    
  };

  const handleLongPress = () => {

    
  }

  return (
    <>
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress} onPress={handlePress}>
      <Image
        source={groupCard}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.groupInfoContainer}>
        <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
        <Text style={styles.visibilityText} numberOfLines={1} ellipsizeMode="tail">{visibility} Group</Text>
        <Text style={styles.adminName} numberOfLines={1} ellipsizeMode="tail">
          Created by: {adminName}
        </Text>
      </View>
      <View style={styles.memberCountContainer}>
        <Text style={styles.memberCountText}>
          {members.length < 1000 ? members.length : (members.length < 1000000 ? (members.length / 1000).toFixed(1) + 'K' : (members.length / 1000000).toFixed(1) + 'M')}
        </Text>
      </View>
    </TouchableOpacity>

    <Modal animationType="fade" transparent={true} visible={joinModalVisible}>
      <JoinGroupView fetchGroups={fetchGroups} setModalVisible={setJoinModalVisible} name={name} visibility={visibility} correctPassword={password} members={members} startingCurrency={startingCurrency} groupId={groupId} ></JoinGroupView>
    </Modal>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    width: '100%',
    height: 90,
    borderWidth: 2,
    borderRadius: 20,
    borderColor: Colors.border,
    flexDirection: 'row',
    padding: 8,
    marginBottom: 8,
    backgroundColor: Colors.cardBackground,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.textColor,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  border: {
    borderWidth: 5,
    borderColor: 'black',
  },
  logo: {
    width: '20%',
    height: '70%',
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    margin: 8,
    marginLeft: 0,
    tintColor: Colors.textColor,
  },
  visibilityText: {
    fontSize: 13,
    marginTop: 3,
    marginLeft: 3,
    color: Colors.textColor,
  },
  adminName: {
    fontSize: 13,
    color: 'gray',
    marginTop: 3,
    marginLeft: 3,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  memberCountText: {
    fontWeight: 'bold',
    color: "white",
    fontSize: 25,
    textAlign: 'center',
  },
  groupInfoContainer: {
  flex: 1,  // takes remaining space after logo
  marginTop: 3,
  alignItems: 'flex-start',
},
groupName: {
  fontSize: 20,
  color: Colors.textColor,
  fontWeight: '500',
  // remove the fixed width: 225
},
memberCountContainer: {
  padding: 8,
  alignItems: 'flex-end',
  justifyContent: 'center',
  // remove flex: 1 so it only takes as much space as it needs
},
});
