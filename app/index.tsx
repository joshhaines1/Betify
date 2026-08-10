import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// By the time this screen mounts, RootLayout's AppNavigator has already
// waited for fonts + the initial Firebase auth check and hidden the native
// splash screen, so `isLoggedIn` below is already resolved — this just
// picks the right destination with no extra loading UI of its own.
const Index = () => {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)'); // Navigate to tabs if logged in
    } else {
      router.replace('/login'); // Navigate to login if not logged in
    }
  }, [isLoggedIn]);

  return null;
};

export default Index;
