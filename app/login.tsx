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
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
} from "firebase/auth";

import { FIREBASE_AUTH } from "@/FirebaseConfig";
import { useAuth } from "../context/AuthContext";
import Colors from "@/assets/styles/colors";

WebBrowser.maybeCompleteAuthSession();

// Maps common Firebase Auth error codes to user-friendly messages instead of
// exposing raw strings like "Firebase: Error (auth/invalid-credential)."
export const getAuthErrorMessage = (err: any): string => {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid username or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/weak-password":
      return "Your password should be at least 6 characters.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    case "auth/requires-recent-login":
      return "Please sign in again to continue.";
    default:
      return "Something went wrong. Please try again.";
  }
};

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export default function Login() {
  const { setIsLoggedIn } = useAuth();

  // Single screen now (email/password + social all together, matching the
  // reference layout) instead of an "options" screen that branched into a
  // separate email screen.
  const [mode, setMode] = useState<"login" | "signup">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

  // Android can't use the expo-auth-session browser-redirect flow — Google
  // rejects custom-scheme redirects for both Android- and Web-type OAuth
  // clients, so Android signs in via the native Google Sign-In SDK instead.
  useEffect(() => {
    if (Platform.OS === "android") {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    }
  }, []);

  const handleAndroidGoogleSignIn = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) return;

      const { idToken } = response.data;
      if (!idToken) throw new Error("No ID token returned from Google.");

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(FIREBASE_AUTH, credential);

      if (getAdditionalUserInfo(result)?.isNewUser) {
        await updateProfile(result.user, { displayName: "" });
      }

      await completeOAuthSignIn(result.user);
    } catch (err: any) {
      console.error("Android Google Sign-In error:", err?.code, err?.message, err);
      if (!isErrorWithCode(err) || err.code !== statusCodes.IN_PROGRESS) {
        Alert.alert("Google Sign-In Error", getAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
  try {
    if (response?.type !== "success") return;
    setLoading(true);

    const { id_token } = response.params;
    const credential = GoogleAuthProvider.credential(id_token);
    const result = await signInWithCredential(FIREBASE_AUTH, credential);

    // New Google user — wipe their Google display name so they must pick a username
    if (getAdditionalUserInfo(result)?.isNewUser) {
      await updateProfile(result.user, { displayName: "" });
    }

    await completeOAuthSignIn(result.user);
  } catch (err: any) {
    Alert.alert("Google Sign-In Error", getAuthErrorMessage(err));
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
      console.log("User display name:", user.displayName),
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
        getAuthErrorMessage(err)
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
        getAuthErrorMessage(err)
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

      if (mode === "signup") {
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
        getAuthErrorMessage(err)
      );
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────────────────────

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email required",
        "Enter your email above first, then tap \"Forgot password?\" again to get a reset link."
      );
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(FIREBASE_AUTH, email.trim());
      Alert.alert(
        "Check your email",
        `We sent a password reset link to ${email.trim()}.`
      );
    } catch (err: any) {
      Alert.alert("Error", getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  const isSignup = mode === "signup";

  return (
    <View style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Brand header */}
            <View style={styles.header}>
              <Image
                source={require("@/assets/icons/BetifyAppLogoDark.png")}
                style={styles.appIcon}
                resizeMode="contain"
              />

              <Image
                source={require("@/assets/images/BetifyHeaderLogo.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />

              <Text style={styles.tagline}>
                Build your{" "}
                <Text style={styles.taglineAccent}>custom sportsbook.</Text>
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.heading}>
                {isSignup ? "Create an account" : "Welcome back"}
              </Text>

              <Text style={styles.subheading}>
                {isSignup ? "Sign up to get started" : "Log in to continue"}
              </Text>

              {isSignup && (
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#7A8499"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.inputField}
                    placeholder="Username"
                    placeholderTextColor="#7A8499"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={userName}
                    onChangeText={setUserName}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#7A8499"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Email"
                  placeholderTextColor="#7A8499"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#7A8499"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputField}
                  placeholder="Password"
                  placeholderTextColor="#7A8499"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#7A8499"
                  />
                </TouchableOpacity>
              </View>

              {!isSignup && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotWrap}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleEmailAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignup ? "Sign Up" : "Log In"}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google */}
              <TouchableOpacity
                style={styles.socialButton}
                onPress={
                  Platform.OS === "android"
                    ? handleAndroidGoogleSignIn
                    : () => promptAsync()
                }
                disabled={
                  loading ||
                  (Platform.OS !== "android" && !request)
                }
              >
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.socialButtonText}>
                  Continue with Google
                </Text>
              </TouchableOpacity>

              {/* Apple */}
              {Platform.OS === "ios" && (
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleAppleSignIn}
                  disabled={loading}
                >
                  <Ionicons name="logo-apple" size={20} color="#fff" />
                  <Text style={styles.socialButtonText}>
                    Continue with Apple
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setMode(isSignup ? "login" : "signup")}
                style={styles.toggleWrap}
              >
                <Text style={styles.toggleText}>
                  {isSignup
                    ? "Already have an account? "
                    : "Don't have an account? "}
                  <Text style={styles.toggleAccent}>
                    {isSignup ? "Log in" : "Sign up"}
                  </Text>
                </Text>
              </TouchableOpacity>

              <Text style={styles.credit}>CREATED BY JOSH HAINES</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Username Modal */}
      <Modal
        visible={usernameModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose a Username</Text>

            <Text style={styles.modalSubtitle}>
              Create your Betify username.
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#7A8499"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="Username"
                placeholderTextColor="#7A8499"
                autoCapitalize="none"
                autoCorrect={false}
                value={pendingUsername}
                onChangeText={setPendingUsername}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={saveUsername}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "black",
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: 36,
  },

  appIcon: {
    width: 84,
    height: 84,
    borderRadius: 20,
    marginBottom: 12,
  },

  headerLogo: {
    width: 220,
    height: 64,
    marginBottom: 10,
  },

  tagline: {
    fontSize: 14,
    color: "#B9C0CE",
    textAlign: "center",
  },

  taglineAccent: {
    color: Colors.primary,
    fontWeight: "700",
  },

  form: {
    width: "100%",
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textColor,
    marginBottom: 4,
  },

  subheading: {
    fontSize: 15,
    color: "#B9C0CE",
    marginBottom: 24,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(10,8,9,0.55)",
    paddingHorizontal: 14,
    marginBottom: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  inputField: {
    flex: 1,
    height: "100%",
    color: Colors.textColor,
    fontSize: 15,
  },

  forgotWrap: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },

  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },

  primaryButton: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: Colors.primary,
    marginBottom: 8,
  },

  primaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#fff",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  dividerText: {
    color: "#7A8499",
    marginHorizontal: 10,
    fontSize: 12,
    letterSpacing: 1,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
    gap: 10,
  },

  socialButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textColor,
  },

  toggleWrap: {
    alignItems: "center",
    marginTop: 8,
  },

  toggleText: {
    color: "#B9C0CE",
    fontSize: 14,
  },

  toggleAccent: {
    color: Colors.primary,
    fontWeight: "700",
  },

  credit: {
    alignSelf: "center",
    marginTop: 28,
    color: "#7A8499",
    fontSize: 11,
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
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
