import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { useAuth } from '../AuthContext';
import * as Haptics from 'expo-haptics';


export default function TabLayout() {
  const { user } = useAuth();
  

  useEffect(() => {
    //Runs on the first render
    //And any time any dependency value changes
  }, [user?.displayName]);

  return (
    <>
    <SafeAreaView edges={['top']} style={styles.headerContainer}>

    <View style={styles.titleContainer}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.headerTitle}>BETIFY</Text>
    </View>

    <View style={styles.usernameContainer}>
      <Text numberOfLines={1} ellipsizeMode='tail' style={styles.userName}>{user?.displayName}</Text>
    </View>

    </SafeAreaView>
    
    

    <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ff496b',
          headerStyle: {
          backgroundColor: '#ffffff',  
          },
          headerShadowVisible: false,
          headerShown: false,
          headerTintColor: '#fff',
          tabBarStyle: {
          backgroundColor: '#ffffff',
              }, 
        }}
        screenListeners={{
          tabPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          }
  
        }}
        >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Groups',
          
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
          
        }}
      />
      

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} color={color} size={24}/>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24}/>
          ),
        }}
      />
    </Tabs>

    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#ff496b', 
  },

  headerContainer: {
    backgroundColor: "white",
    alignItems: 'center',
    flexDirection: 'row',
    padding: 20, 
    paddingTop: 7,
    paddingBottom: 7,
  },

  titleContainer: {
    backgroundColor: "white",
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
    
    
  },

  usernameContainer: {
    backgroundColor: "white",
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1, 
    
  },

  userName: {
    
    fontSize: 20,
    color: 'black', 
    textTransform: 'uppercase',
    fontWeight: 'bold',

  }
});