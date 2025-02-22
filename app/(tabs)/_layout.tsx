import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { useAuth } from '../AuthContext';

export default function TabLayout() {
  const { user } = useAuth();
  

  useEffect(() => {
    //Runs on the first render
    //And any time any dependency value changes
  }, [user?.displayName]);

  return (
    <>
    <SafeAreaView style={styles.headerContainer}>

    <View style={styles.titleContainer}>
      <Text style={styles.headerTitle}>BETIFY</Text>
    </View>

    <View style={styles.usernameContainer}>
      <Text style={styles.userName}>{user ? user.displayName : "LOGIN" }</Text>
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
        name="entries"
        options={{
          title: 'Entries',
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
    marginLeft: 25,
    marginTop: 10,
  },

  headerContainer: {
    backgroundColor: "white",
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: -45,
    
  },

  titleContainer: {
    backgroundColor: "white",
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    
  },

  usernameContainer: {
    backgroundColor: "white",
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    marginRight: 30,
    flex: 1, 
    
  },

  userName: {
    
    fontSize: 20,
    color: 'black', 
    marginLeft: 20,
    marginTop: 10,
    textTransform: 'uppercase',
    fontWeight: 'bold',

  }
});