import React, { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { FIREBASE_AUTH } from '@/.FirebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useAuth } from './AuthContext';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const Login = () => {
  const { isLoggedIn, uid, setIsLoggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const auth = FIREBASE_AUTH;

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isSigningUp) {
        const response = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(response.user, { displayName: userName });
        console.log("Account created & username set:", userName);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully.");
      }
      setIsLoggedIn(true);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        <View style={styles.loginContainer}>
          <Text style={styles.title}>BETIFY</Text>

          {isSigningUp && (
            <TextInput
              selectionColor={"#ff3d9e"}
              spellCheck={false}
              autoCorrect={false}
              placeholder="USERNAME"
              placeholderTextColor={'gray'}
              autoCapitalize="none"
              style={styles.input}
              onChangeText={setUserName}
            />
          )}

          <TextInput
            selectionColor={"#ff3d9e"}
            spellCheck={false}
            autoCorrect={false}
            placeholder="EMAIL"
            placeholderTextColor={'gray'}
            autoCapitalize="none"
            style={styles.input}
            onChangeText={setEmail}
          />

          <TextInput
            selectionColor={"#ff3d9e"}
            spellCheck={false}
            autoCorrect={false}
            placeholder="PASSWORD"
            placeholderTextColor={'gray'}
            secureTextEntry
            autoCapitalize="none"
            style={styles.input}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
            <Text style={styles.buttonText}>{isSigningUp ? "SIGN UP" : "LOGIN"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsSigningUp(!isSigningUp)}>
            <Text style={styles.toggleText}>
              {isSigningUp ? "Already have an account? Log in!" : "Don't have an account? Sign up!"}
            </Text>
          </TouchableOpacity>

          <Text style={{ margin: 2 }}>CREATED BY JOSH HAINES</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", backgroundColor: 'white'},

  title: { fontSize: 70, fontWeight: 'bold', margin: 8, color: '#ff496b' },

  input: {
    borderWidth: 2,
    padding: 8,
    margin: 5,
    borderRadius: 10,
    width: '80%',
    height: 45,
    borderColor: '#bababa',
  },

  loginContainer: { justifyContent: 'center', alignItems: 'center', width: '100%' },

  button: {
    width: '50%',
    height: 45,
    margin: 5,
    marginTop: 10,
    alignContent: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: "#ff496b",
  },

  buttonText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 18,
    color: "#fff",
  },

  toggleText: {
    marginTop: 10,
    marginBottom: 10,
    color: "gray",
    textDecorationLine: "underline",
  },
});
