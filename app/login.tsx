import React, { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
  fetchSignInMethodsForEmail,
} from "firebase/auth";

import { FIREBASE_AUTH } from "@/.FirebaseConfig";
import { useAuth } from "../context/AuthContext";
import Colors from "@/assets/styles/colors";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function Login() {
  const { setIsLoggedIn } = useAuth();

  const [mode, setMode] = useState<
    "options" | "emailLogin" | "emailSignup"
  >("options");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");

  const [loading, setLoading] = useState(false);

  // Username modal states
  const [usernameModalVisible, setUsernameModalVisible] =
    useState(false);

  const [pendingUser, setPendingUser] =
    useState<User | null>(null);

  const [pendingUsername, setPendingUsername] =
    useState("");

  // ─────────────────────────────────────────────────────────────
  // Google Auth
  // ─────────────────────────────────────────────────────────────

  const [request, response, promptAsync] =
    Google.useAuthRequest({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    });

  useEffect(() => {
    if (response?.type === "success") {
      handleGoogleSignIn();
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    try {
      if (response?.type !== "success") return;

      setLoading(true);

      const { id_token } = response.params;

      const credential =
        GoogleAuthProvider.credential(id_token);

      const result = await signInWithCredential(
        FIREBASE_AUTH,
        credential
      );

      await completeOAuthSignIn(result.user);
    } catch (err: any) {
      Alert.alert(
        "Google Sign-In Error",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Shared OAuth Flow
  // ─────────────────────────────────────────────────────────────

  const completeOAuthSignIn = async (
    user: User
  ) => {
    // Existing user with username
    if (
      user.displayName &&
      user.displayName.trim().length > 0
    ) {
      await user.getIdToken(true);
      setIsLoggedIn(true);
      router.replace("/(tabs)");
      return;
    }

    // New user needs username
    setPendingUser(user);
    setUsernameModalVisible(true);
  };

  // ─────────────────────────────────────────────────────────────
  // Apple Sign In
  // ─────────────────────────────────────────────────────────────

const handleAppleSignIn = async () => {
  try {
    setLoading(true);

    // Generate nonce
    const rawNonce = Crypto.randomUUID();

    const hashedNonce =
      await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );

    // Apple sign in
    const appleCredential =
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication
            .AppleAuthenticationScope
            .FULL_NAME,

          AppleAuthentication
            .AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

    if (!appleCredential.identityToken) {
      throw new Error(
        "No identity token returned."
      );
    }

    // IMPORTANT:
    // Get Apple email BEFORE Firebase sign in
    const appleEmail =
      appleCredential.email;

    // If Apple returns email
    // check existing providers
    if (appleEmail) {
      const existingMethods =
        await fetchSignInMethodsForEmail(
          FIREBASE_AUTH,
          appleEmail
        );

      // Email already exists
      // but NOT with Apple
      if (
        existingMethods.length > 0 &&
        !existingMethods.includes(
          "apple.com"
        )
      ) {
        Alert.alert(
          "Account Already Exists",
          "An account with this email already exists. Please sign in using your original login method."
        );

        return;
      }
    }

    // Firebase credential
    const provider =
      new OAuthProvider("apple.com");

    const credential =
      provider.credential({
        idToken:
          appleCredential.identityToken,
        rawNonce: rawNonce,
      });

    const result =
      await signInWithCredential(
        FIREBASE_AUTH,
        credential
      );

    await completeOAuthSignIn(
      result.user
    );
  } catch (err: any) {
    if (
      err.code !==
      "ERR_REQUEST_CANCELED"
    ) {
      Alert.alert(
        "Apple Sign-In Error",
        err.message
      );
    }
  } finally {
    setLoading(false);
  }
};


  // ─────────────────────────────────────────────────────────────
  // Save Username for OAuth Users
  // ─────────────────────────────────────────────────────────────

  const saveUsername = async () => {
    if (!pendingUser) return;

    if (!pendingUsername.trim()) {
      Alert.alert(
        "Missing Username",
        "Please enter a username."
      );
      return;
    }

    try {
      setLoading(true);

      await updateProfile(pendingUser, {
        displayName:
          pendingUsername.trim(),
      });

      setUsernameModalVisible(false);

      setPendingUsername("");
      setPendingUser(null);
      await pendingUser.getIdToken(true);
      setIsLoggedIn(true);
      
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Email Auth
  // ─────────────────────────────────────────────────────────────

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert(
        "Missing fields",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      if (mode === "emailSignup") {
        if (!userName.trim()) {
          Alert.alert(
            "Missing Username",
            "Please enter a username."
          );
          return;
        }

        const result =
          await createUserWithEmailAndPassword(
            FIREBASE_AUTH,
            email,
            password
          );

        await updateProfile(result.user, {
          displayName:
            userName.trim(),
        });
        await result.user.getIdToken(true);
      } else {
        await signInWithEmailAndPassword(
          FIREBASE_AUTH,
          email,
          password
        );
      }

      setIsLoggedIn(true);

      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert(
        "Authentication Error",
        err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Options Screen
  // ─────────────────────────────────────────────────────────────

  if (mode === "options") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.inner}>
          <Text style={styles.title}>
            BETIFY
          </Text>

          <Text style={styles.subtitle}>
            Sign in to continue
          </Text>

          {/* Google */}
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() =>
              promptAsync()
            }
            disabled={
              !request || loading
            }
          >
            <Text style={styles.socialIcon}>
              G
            </Text>

            <Text
              style={
                styles.socialButtonText
              }
            >
              Continue with Google
            </Text>
          </TouchableOpacity>

          {/* Apple */}
          {Platform.OS === "ios" && (
            <TouchableOpacity
              style={[
                styles.socialButton,
                styles.appleButton,
              ]}
              onPress={
                handleAppleSignIn
              }
              disabled={loading}
            >
              <Text
                style={[
                  styles.socialButtonText,
                  styles.appleButtonText,
                ]}
              >
                Continue with Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View
            style={styles.dividerRow}
          >
            <View
              style={
                styles.dividerLine
              }
            />

            <Text
              style={
                styles.dividerText
              }
            >
              or
            </Text>

            <View
              style={
                styles.dividerLine
              }
            />
          </View>

          {/* Email */}
          <TouchableOpacity
            style={styles.emailButton}
            onPress={() =>
              setMode(
                "emailLogin"
              )
            }
          >
            <Text
              style={
                styles.emailButtonText
              }
            >
              Continue with Email
            </Text>
          </TouchableOpacity>

          {loading && (
            <ActivityIndicator
              color={Colors.primary}
              style={{
                marginTop: 20,
              }}
            />
          )}

          <Text style={styles.credit}>
            CREATED BY JOSH HAINES
          </Text>
        </View>

        {/* Username Modal */}
        <Modal
          visible={
            usernameModalVisible
          }
          transparent
          animationType="fade"
        >
          <View
            style={
              styles.modalOverlay
            }
          >
            <View
              style={
                styles.modalContainer
              }
            >
              <Text
                style={
                  styles.modalTitle
                }
              >
                Choose a Username
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }
              >
                Create your Betify
                username.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="USERNAME"
                placeholderTextColor="gray"
                autoCapitalize="none"
                autoCorrect={false}
                value={
                  pendingUsername
                }
                onChangeText={
                  setPendingUsername
                }
              />

              <TouchableOpacity
                style={
                  styles.button
                }
                onPress={
                  saveUsername
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  CONTINUE
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Email Login / Signup Screen
  // ─────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ width: "100%" }}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>
            BETIFY
          </Text>

          <Text style={styles.subtitle}>
            {mode ===
            "emailSignup"
              ? "Create an account"
              : "Welcome back"}
          </Text>

          {mode ===
            "emailSignup" && (
            <TextInput
              style={styles.input}
              placeholder="USERNAME"
              placeholderTextColor="gray"
              autoCapitalize="none"
              autoCorrect={false}
              value={userName}
              onChangeText={
                setUserName
              }
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="EMAIL"
            placeholderTextColor="gray"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="PASSWORD"
            placeholderTextColor="gray"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={
              setPassword
            }
          />

          <TouchableOpacity
            style={styles.button}
            onPress={
              handleEmailAuth
            }
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={
                  styles.buttonText
                }
              >
                {mode ===
                "emailSignup"
                  ? "SIGN UP"
                  : "LOGIN"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setMode(
                mode ===
                  "emailSignup"
                  ? "emailLogin"
                  : "emailSignup"
              )
            }
          >
            <Text
              style={
                styles.toggleText
              }
            >
              {mode ===
              "emailSignup"
                ? "Already have an account? Log in"
                : "Don't have an account? Sign up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setMode("options")
            }
            style={{
              marginTop: 8,
            }}
          >
            <Text
              style={
                styles.backText
              }
            >
              ← Back to sign-in
              options
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      Colors.background,
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
  },

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
    justifyContent: "center",
  },

  socialIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    width: 28,
  },

  socialButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textColor,
  },

  appleButton: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },

  appleButtonText: {
    color: "#000",
  },

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
    marginHorizontal: 10,
  },

  emailButton: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252B38",
    backgroundColor: "#1d1a1c",
    justifyContent: "center",
    alignItems: "center",
  },

  emailButtonText: {
    color: Colors.textColor,
    fontWeight: "700",
    fontSize: 15,
  },

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
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#ff496b",
  },

  buttonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
  },

  toggleText: {
    marginTop: 12,
    color: Colors.textColor,
    textDecorationLine: "underline",
  },

  backText: {
    color: "#7A8499",
  },

  credit: {
    position: "absolute",
    bottom: -120,
    color: "#7A8499",
    fontSize: 11,
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalContainer: {
    width: "100%",
    backgroundColor: "#1d1a1c",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },

  modalSubtitle: {
    color: "#7A8499",
    marginBottom: 16,
  },
});
