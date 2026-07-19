import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View, StyleSheet, TouchableOpacity, Image } from "react-native";
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth } from "firebase/auth";
import { useAuth } from '../../context/AuthContext';
import * as Haptics from 'expo-haptics';
import Colors from '@/assets/styles/colors';


export default function TabLayout() {
  const { user } = useAuth();
    const [username, setUsername] = useState("");
  

  useEffect(() => {
    //Runs on the first render
    //And any time any dependency value changes
    setUsername(user && user?.displayName != "" ? user?.displayName ?? "" : username);
  }, [user?.displayName]);

  useEffect(() => {
    setUsername(user?.displayName ?? "")
  }, []);

  return (
    <>
    <SafeAreaView edges={['top']} style={styles.headerContainer}>

    <View style={styles.titleContainer}>
     <Image source={require('@/assets/images/BetifyHeaderLogo.png')} style={{ width: 220, height: 60, marginLeft: -5 }}
    resizeMode="contain" />
    </View>

    <View style={styles.usernameContainer}>
      <Text numberOfLines={1} ellipsizeMode='tail' style={styles.userName}>{username}</Text>
    </View>

    </SafeAreaView>
    
    

    <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#ffffff',
          headerStyle: {
            backgroundColor: '#ffffff', 
            elevation: 0, 
          },
          headerShadowVisible: false,
          headerShown: false,
          headerTintColor: '#fff',
          tabBarStyle: {
            backgroundColor: Colors.background,
            paddingTop: 5,
            borderTopWidth: 0,
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
          title: 'Home',
          lazy: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home-sharp' : 'home-outline'} color={color} size={24} />
          ),
          
        }}
      />
      

      <Tabs.Screen
        name="bets"
        options={{
          title: 'My Bets',
          lazy: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'albums' : 'albums-outline'} color={color} size={24}/>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          lazy: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24}/>
          ),
        }}
      />

      
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          lazy: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} color={color} size={24}/>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          lazy: true,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'menu' : 'menu-outline'} color={color} size={24}/>
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
    backgroundColor: Colors.background,
    alignItems: 'center',
    flexDirection: 'row',
    padding: 20, 
    paddingTop: 7,
    paddingBottom: 7,
  },

  titleContainer: {
    backgroundColor: "",
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
    
    
  },

  usernameContainer: {
    backgroundColor: "",
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
    flex: 1, 
    
  },

  userName: {
    
    fontSize: 20,
    color: Colors.textColor, 
    textTransform: 'uppercase',
    fontWeight: 'bold',

  }
});