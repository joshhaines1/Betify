import React, { useState } from 'react';
import { StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { JoinGroupView } from './JoinGroupView';
import Colors from '@/assets/styles/colors';

const groupCard = require('@/assets/images/groupIcon.png');

const formatMemberCount = (count: number) => {
  if (count < 1000) return `${count}`;
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

export function GroupCard({ name, members, adminName, admins, visibility, password, startingCurrency, groupId, fetchGroups, joined}) {
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const isPrivate = visibility === 'Private';

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
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.75}>
      <View style={styles.avatarContainer}>
        <Image
          source={groupCard}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={[styles.visibilityBadge, isPrivate && styles.visibilityBadgePrivate]}>
            <Text style={[styles.visibilityBadgeText, isPrivate && styles.visibilityBadgeTextPrivate]}>
              {visibility?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.adminName} numberOfLines={1} ellipsizeMode="tail">
            by {adminName?.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.statBlock}>
        <Text style={styles.memberCountText}>
          {formatMemberCount(members.length)}
        </Text>
        <Text style={styles.memberCountLabel}>
          {members.length === 1 ? 'MEMBER' : 'MEMBERS'}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>

    <Modal animationType="fade" transparent={true} visible={joinModalVisible}>
      <JoinGroupView fetchGroups={fetchGroups} setModalVisible={setJoinModalVisible} name={name} visibility={visibility} correctPassword={password} members={members} startingCurrency={startingCurrency} groupId={groupId} ></JoinGroupView>
    </Modal>
    </>
  );
}



const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 18,
    borderColor: '#252B38',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#121112',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 15, 15, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logo: {
    width: 40,
    height: 40,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 18,
    color: Colors.textColor,
    fontWeight: '800',
    flexShrink: 1,
    paddingLeft: 2,
  },
  joinBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8,
  },
  joinBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },
  visibilityBadge: {
    backgroundColor: '#ff496b1f',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 8,
  },
  visibilityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.primary,
  },
  visibilityBadgePrivate: {
    backgroundColor: '#1d1a1c',
    borderWidth: 1,
    borderColor: '#252B38',
  },
  visibilityBadgeTextPrivate: {
    color: '#7A8499',
  },
  adminName: {
    fontSize: 12,
    color: '#7A8499',
    fontWeight: '600',
    flexShrink: 1,
  },
  statBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    marginRight: 6,
  },
  memberCountText: {
    fontWeight: '800',
    color: Colors.textColor,
    fontSize: 18,
  },
  memberCountLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#7A8499',
    marginTop: 1,
  },
  chevron: {
    fontSize: 22,
    color: '#ff496b',
    fontWeight: '300',
  },
});
