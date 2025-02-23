import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';


export function GroupCard({ name, members, adminName, visibility, password, startingCurrency, fetchGroups}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);

  const handlePress = () => {
    setJoinModalVisible(true);
  };

  return (
    <>
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Image
        source={{
          uri: 'https://static.vecteezy.com/system/resources/previews/000/550/535/non_2x/user-icon-vector.jpg',
        }}
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
            <JoinGroupView fetchGroups={fetchGroups} setModalVisible={setJoinModalVisible} name={name} visibility={visibility} correctPassword={password} members={members} startingCurrency={startingCurrency} ></JoinGroupView>
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
    borderColor: '#e8e8e8',
    flexDirection: 'row',
    padding: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
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
    height: '80%',
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'flex-start',
    margin: 8,
    marginLeft: 0,
  },
  visibilityText: {
    fontSize: 15,
    marginTop: 3,
    marginLeft: 3,
    color: 'black',
  },
  groupName: {
    fontSize: 25,
    color: '#ff496b', // Colors.light.tint is undefined, replaced with 'blue'
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
    color: 'black',
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
