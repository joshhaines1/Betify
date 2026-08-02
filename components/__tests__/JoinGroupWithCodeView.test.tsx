import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import * as groups_service from "@/clients/groups-client";
import { JoinGroupWithCodeView } from "../JoinGroupWithCodeView";

jest.mock("@/clients/groups-client");

function loadWithLoggedInUser() {
  const { FIREBASE_AUTH } = require("@/FirebaseConfig");
  FIREBASE_AUTH.currentUser = { uid: "user-1" };
}

beforeEach(() => {
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  loadWithLoggedInUser();
});

afterEach(() => {
  jest.restoreAllMocks();
  (groups_service.getGroupByInviteCode as jest.Mock).mockReset();
  (groups_service.joinGroup as jest.Mock).mockReset();
});

describe("JoinGroupWithCodeView", () => {
  it("rejects a code that isn't exactly 6 characters", async () => {
    const { getByText, getByPlaceholderText } = render(
      <JoinGroupWithCodeView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("ABC123"), "ABC12");
    fireEvent.press(getByText("NEXT"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Invalid Code",
        "Invite code must be exactly 6 characters."
      );
    });
    expect(groups_service.getGroupByInviteCode).not.toHaveBeenCalled();
  });

  it("shows an alert when the code does not resolve to a group", async () => {
    (groups_service.getGroupByInviteCode as jest.Mock).mockResolvedValueOnce(null);
    const { getByText, getByPlaceholderText } = render(
      <JoinGroupWithCodeView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("ABC123"), "ABCDEF");
    fireEvent.press(getByText("NEXT"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Not Found",
        "No group found with that invite code."
      );
    });
  });

  it("auto-joins immediately when the resolved group is public", async () => {
    (groups_service.getGroupByInviteCode as jest.Mock).mockResolvedValueOnce({
      id: "g1",
      visibility: "Public",
    });
    (groups_service.joinGroup as jest.Mock).mockResolvedValueOnce({ joined: true });
    const fetchGroups = jest.fn();
    const setModalVisible = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <JoinGroupWithCodeView setModalVisible={setModalVisible} fetchGroups={fetchGroups} />
    );

    fireEvent.changeText(getByPlaceholderText("ABC123"), "ABCDEF");
    fireEvent.press(getByText("NEXT"));

    await waitFor(() => expect(groups_service.joinGroup).toHaveBeenCalledWith("g1"));
    expect(fetchGroups).toHaveBeenCalledWith(true, "all");
    expect(setModalVisible).toHaveBeenCalledWith(false);
  });

  it("shows a password field for a private group instead of auto-joining", async () => {
    (groups_service.getGroupByInviteCode as jest.Mock).mockResolvedValueOnce({
      id: "g2",
      visibility: "Private",
      password: "secret",
    });

    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(
      <JoinGroupWithCodeView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("ABC123"), "ABCDEF");
    fireEvent.press(getByText("NEXT"));

    await waitFor(() => {
      expect(queryByPlaceholderText("Enter the group password")).toBeTruthy();
    });
    expect(groups_service.joinGroup).not.toHaveBeenCalled();
    expect(getByText("JOIN")).toBeTruthy();
  });

  it("blocks joining a private group with the wrong password", async () => {
    (groups_service.getGroupByInviteCode as jest.Mock).mockResolvedValueOnce({
      id: "g2",
      visibility: "Private",
      password: "secret",
    });

    const { getByText, getByPlaceholderText } = render(
      <JoinGroupWithCodeView setModalVisible={jest.fn()} fetchGroups={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("ABC123"), "ABCDEF");
    fireEvent.press(getByText("NEXT"));
    await waitFor(() => getByPlaceholderText("Enter the group password"));

    fireEvent.changeText(getByPlaceholderText("Enter the group password"), "wrong");
    fireEvent.press(getByText("JOIN"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Error", "Incorrect password!");
    });
    expect(groups_service.joinGroup).not.toHaveBeenCalled();
  });
});
