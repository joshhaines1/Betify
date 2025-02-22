import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { View, Text } from 'react-native';

const Index = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Mark component as mounted once the component is ready to render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return; // Prevent navigation before mount
    if (isLoggedIn) {
      console.log("Logged in");
      router.replace('/(tabs)'); // Navigate to tabs if logged in
    } else {
      console.log("Not logged in");
      router.replace('/login'); // Navigate to login if not logged in
    }
  }, [isLoggedIn, isMounted]); // Triggered only after `isMounted` is true

  return (
    <View>
      
    </View>
  );
};

export default Index;
