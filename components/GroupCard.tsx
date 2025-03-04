import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal, Alert } from 'react-native';
import { Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import Colors from '@/assets/styles/colors';


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

  return (
    <>
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image
        source={require('@/assets/images/groupIcon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.groupInfoContainer}>
        <Text style={styles.groupName}>{name}</Text>
        <Text style={styles.visibilityText}>{visibility} Group</Text>
        <Text style={styles.adminName}>Created by: {adminName}</Text>
      </View>
      <View style={styles.memberCountContainer}>
        <Text style={styles.memberCountText}>
          {members.length}
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
    height: 100,
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
    fontSize: 15,
    marginTop: 3,
    marginLeft: 3,
    color: Colors.textColor,
  },
  groupName: {
    fontSize: 25,
    color: Colors.textColor, // Colors.light.tint is undefined, replaced with 'blue'
    fontWeight: '500',
  },
  adminName: {
    fontSize: 15,
    color: 'gray',
    marginTop: 3,
    marginLeft: 3,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  memberCountText: {
    fontWeight: 'bold',
    color: Colors.primary,
    fontSize: 25,
    textAlign: 'center',
  },
  memberCountContainer: {
    padding: 8,
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  groupInfoContainer: {
    width: '52.5%',
    marginTop: 5,
    alignItems: 'flex-start',
  },
});
