import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { GoogleAuthProvider, OAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { FIREBASE_AUTH } from "@/.FirebaseConfig";
import { useAuth } from "../context/AuthContext";
import Colors from "@/assets/styles/colors";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

WebBrowser.maybeCompleteAuthSession();

// ─── Replace these with your actual client IDs from Google Cloud Console ──────
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function Login() {
  const { setIsLoggedIn } = useAuth();
  const [mode, setMode] = useState<"options" | "emailLogin" | "emailSignup">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Google Auth ──────────────────────────────────────────────────────────────
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      setLoading(true);
      signInWithCredential(FIREBASE_AUTH, credential)
        .then(() => {
          setIsLoggedIn(true);
          router.replace("/(tabs)");
        })
        .catch((err) => Alert.alert("Google Sign-In Error", err.message))
        .finally(() => setLoading(false));
    }
  }, [response]);

  // ── Apple Auth ───────────────────────────────────────────────────────────────
  const handleAppleSignIn = async () => {
    try {
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36).substring(2)
      );
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,
      });
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
        rawNonce: nonce,
      });
      setLoading(true);
      await signInWithCredential(FIREBASE_AUTH, credential);
      setIsLoggedIn(true);
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Sign-In Error", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Email Auth ───────────────────────────────────────────────────────────────
  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "emailSignup") {
        if (!userName.trim()) {
          Alert.alert("Missing fields", "Please enter a username.");
          return;
        }
        const res = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
        await updateProfile(res.user, { displayName: userName });
      } else {
        await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      }
      setIsLoggedIn(true);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — Options screen
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === "options") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>BETIFY</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Google */}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple — iOS only */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[styles.socialButton, styles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              <Text style={[styles.socialIcon, styles.appleIcon]}></Text>
              <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.emailButton}
            onPress={() => setMode("emailLogin")}
          >
            <Text style={styles.emailButtonText}>Continue with Email</Text>
          </TouchableOpacity>
          {(mode as string) === "emailLogin" ? (
            <TouchableOpacity onPress={() => setMode("emailSignup")}>
              <Text style={styles.toggleText}>Don't have an account? Sign up</Text>
            </TouchableOpacity>
          ) : null}
          {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />}

          <Text style={styles.credit}>CREATED BY JOSH HAINES</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER — Email login / signup
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={{ width: "100%" }}>
        <View style={styles.inner}>
          <Text style={styles.title}>BETIFY</Text>
          <Text style={styles.subtitle}>
            {mode === "emailSignup" ? "Create an account" : "Welcome back"}
          </Text>

          {mode === "emailSignup" && (
            <TextInput
              style={styles.input}
              placeholder="USERNAME"
              placeholderTextColor="gray"
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#ff3d9e"
              onChangeText={setUserName}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="EMAIL"
            placeholderTextColor="gray"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            selectionColor="#ff3d9e"
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor="gray"
            secureTextEntry
            autoCapitalize="none"
            selectionColor="#ff3d9e"
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleEmailAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === "emailSignup" ? "SIGN UP" : "LOGIN"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(mode === "emailSignup" ? "emailLogin" : "emailSignup")}>
            <Text style={styles.toggleText}>
              {mode === "emailSignup"
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode("options")} style={{ marginTop: 8 }}>
            <Text style={styles.backText}>← Back to sign-in options</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  inner: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 70,
    fontWeight: "bold",
    color: "#ff496b",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#7A8499",
    marginBottom: 32,
    letterSpacing: 0.3,
  },
  // ── Social buttons ─────────────────────────────────────────────────────────
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  socialIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    width: 28,
  },
  socialButtonText: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textColor,
    letterSpacing: 0.3,
  },
  appleButton: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  appleIcon: {
    color: "#000",
  },
  appleButtonText: {
    color: "#000",
  },
  // ── Divider ────────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#252B38",
  },
  dividerText: {
    color: "#7A8499",
    fontSize: 13,
    marginHorizontal: 10,
  },
  // ── Email button (options screen) ──────────────────────────────────────────
  emailButton: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emailButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textColor,
    letterSpacing: 0.3,
  },
  // ── Email form ─────────────────────────────────────────────────────────────
  input: {
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    padding: 8,
    margin: 5,
    borderRadius: 10,
    width: "100%",
    height: 50,
    color: Colors.textColor,
    fontSize: 15,
    paddingHorizontal: 14,
  },
  button: {
    width: "100%",
    height: 50,
    marginTop: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#ff496b",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 1,
  },
  // ── Text links ─────────────────────────────────────────────────────────────
  toggleText: {
    marginTop: 12,
    color: Colors.textColor,
    textDecorationLine: "underline",
    fontSize: 14,
  },
  backText: {
    color: "#7A8499",
    fontSize: 14,
  },
  credit: {
    position: "absolute",
    bottom: -120,
    color: "#7A8499",
    fontSize: 11,
    letterSpacing: 1,
  },
});