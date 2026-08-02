import React from "react";
import { render, act } from "@testing-library/react-native";
import { router } from "expo-router";
import Index from "../index";

let mockIsLoggedIn = false;

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isLoggedIn: mockIsLoggedIn }),
}));

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  mockIsLoggedIn = false;
});

describe("app/index navigation guard", () => {
  it("does not redirect before the initial load delay completes", () => {
    render(<Index />);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("redirects to the tabs once loaded when the user is logged in", async () => {
    mockIsLoggedIn = true;
    render(<Index />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(router.replace).toHaveBeenCalledWith("/(tabs)");
  });

  it("redirects to login once loaded when the user is logged out", async () => {
    mockIsLoggedIn = false;
    render(<Index />);

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(router.replace).toHaveBeenCalledWith("/login");
  });
});
