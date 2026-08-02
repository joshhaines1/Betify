import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import * as groups_client from "@/clients/groups-client";
import * as wagers_client from "@/clients/wagers-client";
import Purchases from "react-native-purchases/dist/purchases";
import Profile from "../profile";

jest.mock("@/clients/groups-client");
jest.mock("@/clients/wagers-client");

const mockLogout = jest.fn(() => Promise.resolve());
let mockUser: any = { displayName: "joshh", email: "josh@example.com", providerData: [] };

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout }),
}));

afterEach(() => {
  jest.clearAllMocks();
  mockUser = { displayName: "joshh", email: "josh@example.com", providerData: [] };
});

describe("Profile screen display", () => {
  it("shows the username and email for an email/password account", () => {
    const { getAllByText, getByText } = render(<Profile />);
    // "joshh" appears twice: once under the avatar, once in the Username card.
    expect(getAllByText("joshh").length).toBe(2);
    expect(getByText("josh@example.com")).toBeTruthy();
  });

  it("falls back to 'Signed in with Apple' when there is no email but an Apple provider", () => {
    mockUser = { displayName: "", email: null, providerData: [{ providerId: "apple.com" }] };
    const { getByText } = render(<Profile />);
    expect(getByText("Signed in with Apple")).toBeTruthy();
  });

  it("falls back to 'Signed in with Google' when there is no email but a Google provider", () => {
    mockUser = { displayName: "", email: null, providerData: [{ providerId: "google.com" }] };
    const { getByText } = render(<Profile />);
    expect(getByText("Signed in with Google")).toBeTruthy();
  });

  it("shows initials derived from the display name", () => {
    mockUser = { displayName: "Josh Haines", email: "josh@example.com", providerData: [] };
    const { getByText } = render(<Profile />);
    expect(getByText("JH")).toBeTruthy();
  });
});

describe("Profile sign-out flow", () => {
  it("logs out, clears caches, logs out of RevenueCat, and navigates to login", async () => {
    const { getByText } = render(<Profile />);

    fireEvent.press(getByText("SIGN OUT"));

    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    expect(groups_client.clearGroupsCache).toHaveBeenCalled();
    expect(wagers_client.clearWagersCache).toHaveBeenCalled();
    expect(Purchases.logOut).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith("/login");
  });
});
