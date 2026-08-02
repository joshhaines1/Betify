import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  fetchSignInMethodsForEmail,
  getAdditionalUserInfo,
} from "firebase/auth";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuthRequest } from "expo-auth-session/providers/google";
import Login, { getAuthErrorMessage } from "../login";

const mockSetIsLoggedIn = jest.fn();

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ setIsLoggedIn: mockSetIsLoggedIn }),
}));

describe("getAuthErrorMessage", () => {
  it.each([
    ["auth/invalid-credential", "Invalid username or password."],
    ["auth/wrong-password", "Invalid username or password."],
    ["auth/user-not-found", "Invalid username or password."],
    ["auth/invalid-email", "Please enter a valid email address."],
    ["auth/email-already-in-use", "An account with that email already exists."],
    ["auth/weak-password", "Your password should be at least 6 characters."],
    ["auth/user-disabled", "This account has been disabled."],
    ["auth/too-many-requests", "Too many attempts. Please try again later."],
    ["auth/network-request-failed", "Network error. Please check your connection and try again."],
    ["auth/requires-recent-login", "Please sign in again to continue."],
  ])("maps %s to a friendly message", (code, expected) => {
    expect(getAuthErrorMessage({ code })).toBe(expected);
  });

  it("falls back to a generic message for unrecognized codes", () => {
    expect(getAuthErrorMessage({ code: "auth/some-new-error" })).toBe(
      "Something went wrong. Please try again."
    );
  });

  it("falls back to a generic message when there is no code at all", () => {
    expect(getAuthErrorMessage({})).toBe("Something went wrong. Please try again.");
    expect(getAuthErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});

describe("Login screen", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockSetIsLoggedIn.mockReset();
    (router.replace as jest.Mock).mockReset();
    (signInWithEmailAndPassword as jest.Mock).mockReset();
    (createUserWithEmailAndPassword as jest.Mock).mockReset();
    (updateProfile as jest.Mock).mockReset();
    (signInWithCredential as jest.Mock).mockReset();
    (fetchSignInMethodsForEmail as jest.Mock).mockReset().mockResolvedValue([]);
    (getAdditionalUserInfo as jest.Mock).mockReset().mockReturnValue({ isNewUser: false });
    (AppleAuthentication.signInAsync as jest.Mock).mockReset();
    (useAuthRequest as jest.Mock).mockReset().mockReturnValue([null, null, jest.fn()]);
  });

  it("shows the sign-in options screen by default", () => {
    const { getByText } = render(<Login />);
    expect(getByText("Continue with Google")).toBeTruthy();
    expect(getByText("Continue with Email")).toBeTruthy();
  });

  it("switches to the email login form", () => {
    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));

    expect(getByPlaceholderText("EMAIL")).toBeTruthy();
    expect(getByPlaceholderText("PASSWORD")).toBeTruthy();
    expect(getByText("LOGIN")).toBeTruthy();
  });

  it("blocks submission and alerts when email/password are empty", async () => {
    const { getByText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));
    fireEvent.press(getByText("LOGIN"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Missing fields",
        "Please enter your email and password."
      );
    });
    expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("signs an existing user in and navigates to the tabs on success", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: "user-1" },
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));
    fireEvent.changeText(getByPlaceholderText("EMAIL"), "josh@example.com");
    fireEvent.changeText(getByPlaceholderText("PASSWORD"), "password123");
    fireEvent.press(getByText("LOGIN"));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "josh@example.com",
        "password123"
      );
    });
    expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("shows a friendly alert when Firebase rejects the login", async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: "auth/wrong-password",
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));
    fireEvent.changeText(getByPlaceholderText("EMAIL"), "josh@example.com");
    fireEvent.changeText(getByPlaceholderText("PASSWORD"), "wrongpass");
    fireEvent.press(getByText("LOGIN"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Authentication Error",
        "Invalid username or password."
      );
    });
    expect(mockSetIsLoggedIn).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("blocks signup when the username is missing", async () => {
    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));
    fireEvent.press(getByText("Don't have an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("EMAIL"), "josh@example.com");
    fireEvent.changeText(getByPlaceholderText("PASSWORD"), "password123");
    fireEvent.press(getByText("SIGN UP"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Missing Username",
        "Please enter a username."
      );
    });
    expect(createUserWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("creates a new account with a trimmed username and navigates on success", async () => {
    const mockGetIdToken = jest.fn(() => Promise.resolve("token"));
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { uid: "user-2", getIdToken: mockGetIdToken },
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Email"));
    fireEvent.press(getByText("Don't have an account? Sign up"));
    fireEvent.changeText(getByPlaceholderText("USERNAME"), "  joshh  ");
    fireEvent.changeText(getByPlaceholderText("EMAIL"), "josh@example.com");
    fireEvent.changeText(getByPlaceholderText("PASSWORD"), "password123");
    fireEvent.press(getByText("SIGN UP"));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "josh@example.com",
        "password123"
      );
    });
    expect(updateProfile).toHaveBeenCalledWith(
      { uid: "user-2", getIdToken: mockGetIdToken },
      { displayName: "joshh" }
    );
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });
});

describe("Apple sign-in", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (AppleAuthentication.signInAsync as jest.Mock).mockResolvedValue({
      identityToken: "apple-identity-token",
      email: "josh@icloud.com",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockSetIsLoggedIn.mockReset();
    (router.replace as jest.Mock).mockReset();
    (signInWithCredential as jest.Mock).mockReset();
    (fetchSignInMethodsForEmail as jest.Mock).mockReset().mockResolvedValue([]);
    (getAdditionalUserInfo as jest.Mock).mockReset().mockReturnValue({ isNewUser: false });
  });

  it("signs an existing Apple user straight in", async () => {
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: {
        displayName: "joshh",
        uid: "user-3",
        getIdToken: jest.fn(() => Promise.resolve("token")),
      },
    });

    const { getByText } = render(<Login />);
    fireEvent.press(getByText("Continue with Apple"));

    await waitFor(() => expect(signInWithCredential).toHaveBeenCalled());
    expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true);
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("shows the username modal for a brand-new Apple user with no display name", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: true });
    const mockGetIdToken = jest.fn(() => Promise.resolve("token"));
    (signInWithCredential as jest.Mock).mockResolvedValueOnce({
      user: { displayName: "", uid: "user-4", getIdToken: mockGetIdToken },
    });

    const { getByText, getByPlaceholderText } = render(<Login />);
    fireEvent.press(getByText("Continue with Apple"));

    await waitFor(() => expect(getByText("Choose a Username")).toBeTruthy());
    expect(mockSetIsLoggedIn).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText("USERNAME"), "joshh");
    fireEvent.press(getByText("CONTINUE"));

    await waitFor(() => expect(mockSetIsLoggedIn).toHaveBeenCalledWith(true));
    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("blocks sign-in when the email is already used by a different provider", async () => {
    (fetchSignInMethodsForEmail as jest.Mock).mockResolvedValueOnce(["password"]);

    const { getByText } = render(<Login />);
    fireEvent.press(getByText("Continue with Apple"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Account Already Exists",
        "An account with this email already exists. Please sign in using your original login method."
      );
    });
    expect(signInWithCredential).not.toHaveBeenCalled();
    expect(mockSetIsLoggedIn).not.toHaveBeenCalled();
  });
});

describe("Google sign-in (non-Android)", () => {
  afterEach(() => {
    (useAuthRequest as jest.Mock).mockReset().mockReturnValue([null, null, jest.fn()]);
  });

  it("prompts the Google auth session when pressed", () => {
    const promptAsync = jest.fn();
    (useAuthRequest as jest.Mock).mockReturnValue([{}, null, promptAsync]);

    const { getByText } = render(<Login />);
    fireEvent.press(getByText("Continue with Google"));

    expect(promptAsync).toHaveBeenCalled();
  });
});
